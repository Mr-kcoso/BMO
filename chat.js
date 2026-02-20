import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import { validarAcessoAoChat, escutarMensagens, enviarMensagem } from "./chatService.js";
import { clearElement, createElement, setButtonLoading, showToast } from "./utils.js";

const params = new URLSearchParams(window.location.search);
const chatId = params.get("chatId");

const mensagensDiv = document.getElementById("mensagens");
const texto = document.getElementById("texto");
const btnEnviar = document.getElementById("btnEnviar");
const btnVoltar = document.getElementById("btnVoltar");
const chatTitulo = document.getElementById("chatTitulo");
const chatSubtitulo = document.getElementById("chatSubtitulo");

const profileCache = new Map();

function formatDate(value) {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value || 0);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Agora";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

async function getProfileName(userId) {
  if (!userId) return "Usuário";
  if (profileCache.has(userId)) return profileCache.get(userId);

  const profile = await getUserProfile(userId);
  const nome = profile?.nome || "Usuário";
  profileCache.set(userId, nome);
  return nome;
}

if (btnVoltar) {
  btnVoltar.addEventListener("click", () => {
    window.history.back();
  });
}

async function renderMensagens(mensagens, currentUserId) {
  clearElement(mensagensDiv);

  for (const mensagem of mensagens) {
    const nomeAutor = await getProfileName(mensagem.autorId);
    const item = createElement("div", {
      className:
        mensagem.autorId === currentUserId
          ? "mensagem mensagem-propria chat-bubble"
          : "mensagem mensagem-outro chat-bubble"
    });

    const header = createElement("div", { className: "chat-bubble-header" });
    header.appendChild(createElement("strong", { text: nomeAutor }));
    header.appendChild(createElement("span", { className: "chat-time", text: formatDate(mensagem.criadoEm) }));

    const conteudo = createElement("p", { className: "chat-text", text: mensagem.texto || "" });

    item.appendChild(header);
    item.appendChild(conteudo);
    mensagensDiv.appendChild(item);
  }

  mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
}

async function iniciarChat(user) {
  if (!chatId) {
    showToast("Acesso inválido ao chat", "error");
    window.location.href = "index.html";
    return;
  }

  try {
    const acesso = await validarAcessoAoChat(chatId, user.uid);

    if (!acesso.autorizado) {
      showToast(acesso.motivo, "error");
      window.location.href = "index.html";
      return;
    }

    const outroId = acesso.chat.empresaId === user.uid ? acesso.chat.freelancerId : acesso.chat.empresaId;
    const outroNome = await getProfileName(outroId);

    if (chatTitulo) chatTitulo.textContent = outroNome;
    if (chatSubtitulo) chatSubtitulo.textContent = "Conversa em tempo real";

    escutarMensagens(chatId, (mensagens) => {
      renderMensagens(mensagens, user.uid);
    });

    const enviar = async () => {
      const mensagem = texto.value.trim();
      if (!mensagem) return;

      try {
        setButtonLoading(btnEnviar, true, "Enviando...");
        await enviarMensagem(chatId, user.uid, mensagem);
        texto.value = "";
      } catch (error) {
        console.error(error);
        showToast("Falha ao enviar mensagem", "error");
      } finally {
        setButtonLoading(btnEnviar, false);
      }
    };

    btnEnviar.addEventListener("click", enviar);
    texto.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        enviar();
      }
    });
  } catch (error) {
    console.error(error);
    showToast("Erro ao iniciar chat", "error");
  }
}

observeAuthenticatedUser(iniciarChat, () => {
  showToast("Faça login para acessar o chat", "error");
  window.location.href = "index.html";
});
