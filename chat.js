import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import {
  escutarMensagens,
  escutarMetadataChat,
  enviarMensagem,
  marcarChatComoLido,
  validarAcessoAoChat
} from "./chatService.js";
import { clearElement, createElement, setButtonLoading, showToast } from "./utils.js";

const params = new URLSearchParams(window.location.search);
const chatId = params.get("chatId");
const tipoChatParam = params.get("tipo");
const tipoChat = ["amizade", "equipe"].includes(tipoChatParam) ? tipoChatParam : "projeto";

const mensagensDiv = document.getElementById("mensagens");
const texto = document.getElementById("texto");
const btnEnviar = document.getElementById("btnEnviar");
const btnVoltar = document.getElementById("btnVoltar");
const btnVerPerfil = document.getElementById("btnVerPerfil");
const chatTitulo = document.getElementById("chatTitulo");
const chatSubtitulo = document.getElementById("chatSubtitulo");

const profileCache = new Map();
const mensagensRenderizadas = new Set();
const CACHE_PREFIX = "bmo_profile_cache";
const CACHE_EXPIRY_MS = 1000 * 60 * 60;

function formatDate(value) {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value || 0);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Agora";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getCachedProfileName(userId) {
  const raw = window.localStorage.getItem(`${CACHE_PREFIX}:${userId}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.nome || !parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > CACHE_EXPIRY_MS) return null;
    return parsed.nome;
  } catch {
    return null;
  }
}

function saveCachedProfileName(userId, nome) {
  window.localStorage.setItem(
    `${CACHE_PREFIX}:${userId}`,
    JSON.stringify({ nome, timestamp: Date.now() })
  );
}

async function getProfileName(userId) {
  if (!userId) return "Usuário";
  if (profileCache.has(userId)) return profileCache.get(userId);

  const cachedName = getCachedProfileName(userId);
  if (cachedName) {
    profileCache.set(userId, cachedName);
    return cachedName;
  }

  const profile = await getUserProfile(userId);
  const nome = profile?.nome || "Usuário";
  profileCache.set(userId, nome);
  saveCachedProfileName(userId, nome);
  return nome;
}

if (btnVoltar) {
  btnVoltar.addEventListener("click", () => {
    window.history.back();
  });
}

async function renderMensagem(mensagem, currentUserId) {
  const nomeAutor = await getProfileName(mensagem.autorId);
  const isNovaMensagem = mensagem.id && !mensagensRenderizadas.has(mensagem.id);
  const item = createElement("div", {
    className:
      mensagem.autorId === currentUserId
        ? `mensagem mensagem-propria chat-bubble${isNovaMensagem ? " chat-bubble-enter" : ""}`
        : `mensagem mensagem-outro chat-bubble${isNovaMensagem ? " chat-bubble-enter" : ""}`
  });

  const header = createElement("div", { className: "chat-bubble-header" });
  header.appendChild(createElement("strong", { text: nomeAutor }));
  header.appendChild(createElement("span", { className: "chat-time", text: formatDate(mensagem.criadoEm) }));

  const conteudo = createElement("p", { className: "chat-text", text: mensagem.texto || "" });

  item.appendChild(header);
  item.appendChild(conteudo);
  mensagensDiv.appendChild(item);

  if (mensagem.id) mensagensRenderizadas.add(mensagem.id);
}

async function renderMensagensIncremental(mensagens, currentUserId) {
  if (mensagensRenderizadas.size === 0) {
    clearElement(mensagensDiv);
    for (const mensagem of mensagens) {
      await renderMensagem(mensagem, currentUserId);
    }
    mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
    return;
  }

  const novasMensagens = mensagens.filter((mensagem) => mensagem.id && !mensagensRenderizadas.has(mensagem.id));

  for (const mensagem of novasMensagens) {
    await renderMensagem(mensagem, currentUserId);
  }

  if (novasMensagens.length > 0) {
    mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
  }
}

async function iniciarChat(user) {
  if (!chatId) {
    showToast("Acesso inválido ao chat", "error");
    window.location.href = "index.html";
    return;
  }

  try {
    const acesso = await validarAcessoAoChat(chatId, user.uid, tipoChat);

    if (!acesso.autorizado) {
      showToast(acesso.motivo, "error");
      window.location.href = "index.html";
      return;
    }

    let outroId = null;

    if (tipoChat === "amizade") {
      outroId = (acesso.chat.participants || []).find((participantId) => participantId !== user.uid);
    } else if (tipoChat === "projeto") {
      outroId = acesso.chat.empresaId === user.uid ? acesso.chat.freelancerId : acesso.chat.empresaId;
    }

    if (tipoChat === "equipe") {
      if (chatTitulo) chatTitulo.textContent = acesso.chat.equipeNome || "Chat da equipe";
      if (chatSubtitulo) chatSubtitulo.textContent = "Conversa em grupo da equipe";
      if (btnVerPerfil) btnVerPerfil.hidden = true;
    } else {
      const outroNome = await getProfileName(outroId);

      if (chatTitulo) chatTitulo.textContent = outroNome;
      if (chatSubtitulo) {
        chatSubtitulo.textContent = tipoChat === "amizade" ? "Conversa entre amigos" : "Conversa em tempo real";
      }
      if (btnVerPerfil) {
        btnVerPerfil.hidden = false;
        btnVerPerfil.addEventListener("click", () => {
          window.location.href = `perfil-publico.html?userId=${outroId}`;
        });
      }
    }

    escutarMensagens(
      chatId,
      async (mensagens) => {
        await renderMensagensIncremental(mensagens, user.uid);
        await marcarChatComoLido(chatId, user.uid, tipoChat);
      },
      tipoChat
    );

    escutarMetadataChat(chatId, () => {
      marcarChatComoLido(chatId, user.uid, tipoChat);
    }, tipoChat);

    const enviar = async () => {
      const mensagem = texto.value.trim();
      if (!mensagem) return;

      try {
        setButtonLoading(btnEnviar, true, "Enviando...");
        await enviarMensagem(chatId, user.uid, mensagem, tipoChat);
        texto.value = "";
      } catch (error) {
        console.error(error);
        showToast("Não foi possível enviar mensagem", "error");
      } finally {
        setButtonLoading(btnEnviar, false);
      }
    };

    btnEnviar?.addEventListener("click", enviar);
    texto?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        enviar();
      }
    });
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar chat", "error");
  }
}

observeAuthenticatedUser(iniciarChat, () => {
  showToast("Faça login para acessar o chat", "error");
  window.location.href = "index.html";
});
