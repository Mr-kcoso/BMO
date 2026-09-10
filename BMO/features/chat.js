import { observeAuthenticatedUser, getUserProfile } from "../services/authService.js";
import {
  buscarMensagensRecentes,
  buscarMensagensHistoricas,
  escutarNovasMensagens,
  escutarMetadataChat,
  enviarProposta,
  aceitarProposta,
  salvarGithubProjeto,
  enviarMensagem,
  marcarChatComoLido,
  validarAcessoAoChat
} from "../services/chatService.js";
import { clearElement, createElement, setButtonLoading, showToast } from "../scripts/utils.js";

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
const painelProjeto = document.getElementById("painelProjeto");
const statusAcordo = document.getElementById("statusAcordo");
const propostaAtual = document.getElementById("propostaAtual");
const formProposta = document.getElementById("formProposta");
const valorProposta = document.getElementById("valorProposta");
const prazoProposta = document.getElementById("prazoProposta");
const observacaoProposta = document.getElementById("observacaoProposta");
const btnEnviarProposta = document.getElementById("btnEnviarProposta");
const formGithub = document.getElementById("formGithub");
const githubRepositorio = document.getElementById("githubRepositorio");
const githubPullRequest = document.getElementById("githubPullRequest");
const githubLinks = document.getElementById("githubLinks");

const profileCache = new Map();
const mensagensRenderizadas = new Set();

let mensagensLocais = [];
let oldestVisibleDoc = null;
let newestVisibleDoc = null;
let unsubscribeMensagens = null;
let carregarMaisClicado = false;
let temMaisMensagens = true;
let chatAtual = null;
let usuarioAtual = null;

function getDateValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function precarregarPerfis(mensagens) {
  const autorIdsUnicos = [...new Set(mensagens.map((m) => m.autorId))];
  const idsParaBuscar = autorIdsUnicos.filter((id) => id && !profileCache.has(id));

  if (idsParaBuscar.length > 0) {
    const perfis = await Promise.all(idsParaBuscar.map((id) => getUserProfile(id)));
    perfis.forEach((perfil, index) => {
      const id = idsParaBuscar[index];
      const nome = perfil?.nome || "Usuário";
      profileCache.set(id, nome);
    });
  }
}


function formatDate(value) {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value || 0);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Agora";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function renderGithubLinks(github) {
  if (!githubLinks) return;
  clearElement(githubLinks);
  const links = [
    [github?.repositorioUrl, "Abrir repositório", "fa-code-branch"],
    [github?.pullRequestUrl, "Abrir Pull Request", "fa-code-pull-request"]
  ].filter(([url]) => url);

  if (!links.length) {
    githubLinks.appendChild(createElement("p", { className: "chat-panel-help", text: "Nenhum link GitHub cadastrado ainda." }));
    return;
  }

  links.forEach(([url, label, icon]) => {
    const link = createElement("a", { className: "chat-github-link", text: label });
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const iconElement = createElement("i", { className: `fa-solid ${icon}` });
    iconElement.setAttribute("aria-hidden", "true");
    link.prepend(iconElement);
    githubLinks.appendChild(link);
  });
}

async function renderAcordo(chatMetadata, currentUserId) {
  if (!painelProjeto || tipoChat !== "projeto") return;
  chatAtual = chatMetadata;
  renderGithubLinks(chatMetadata?.github);
  if (githubRepositorio && document.activeElement !== githubRepositorio) {
    githubRepositorio.value = chatMetadata?.github?.repositorioUrl || "";
  }
  if (githubPullRequest && document.activeElement !== githubPullRequest) {
    githubPullRequest.value = chatMetadata?.github?.pullRequestUrl || "";
  }

  if (chatMetadata?.acordo?.status === "aceito") {
    statusAcordo.textContent = "Acordo aceito";
    statusAcordo.className = "chat-status-pill is-accepted";
    clearElement(propostaAtual);
    propostaAtual.appendChild(createElement("strong", { text: `Valor final: ${formatCurrency(chatMetadata.acordo.valorFinal)}` }));
    propostaAtual.appendChild(createElement("p", { text: chatMetadata.acordo.prazoFinal ? `Prazo: ${chatMetadata.acordo.prazoFinal}` : "Prazo não definido" }));
    formProposta.hidden = true;
    return;
  }

  statusAcordo.textContent = "Em negociação";
  statusAcordo.className = "chat-status-pill";
  formProposta.hidden = false;
  clearElement(propostaAtual);
  const proposta = chatMetadata?.propostaAtual;
  if (!proposta) {
    if (chatMetadata?.valorReferencia) {
      propostaAtual.appendChild(createElement("strong", { text: `Valor publicado: ${formatCurrency(chatMetadata.valorReferencia)}` }));
      propostaAtual.appendChild(createElement("p", { text: "Este valor é apenas uma referência. Envie uma proposta para iniciar a negociação." }));
    } else {
      propostaAtual.appendChild(createElement("p", { text: "Nenhuma proposta enviada. Use o formulário para iniciar a negociação." }));
    }
    return;
  }

  const autorNome = await getProfileName(proposta.autorId);
  propostaAtual.appendChild(createElement("strong", { text: `${autorNome} propôs ${formatCurrency(proposta.valor)}` }));
  propostaAtual.appendChild(createElement("p", { text: proposta.prazo ? `Prazo: ${proposta.prazo}` : "Prazo não definido" }));
  if (proposta.observacao) propostaAtual.appendChild(createElement("p", { className: "chat-offer-note", text: proposta.observacao }));

  if (proposta.autorId !== currentUserId) {
    const button = createElement("button", { className: "btn-primary chat-accept-offer", text: "Aceitar valor e prazo" });
    button.addEventListener("click", async () => {
      try {
        setButtonLoading(button, true, "Confirmando...");
        await aceitarProposta({ chatId, propostaId: proposta.id, valor: proposta.valor, prazo: proposta.prazo, aceitoPor: currentUserId });
        showToast("Acordo formalizado", "success");
      } catch (error) {
        console.error(error);
        showToast("Não foi possível aceitar a proposta", "error");
        setButtonLoading(button, false);
      }
    });
    propostaAtual.appendChild(button);
  }
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

function renderMensagens(mensagens, currentUserId) {
  const oldScrollHeight = mensagensDiv.scrollHeight;

  clearElement(mensagensDiv);

  if (temMaisMensagens && oldestVisibleDoc) {
    const btnCarregarMais = createElement("button", {
      className: "chats-nav-btn",
      id: "btnCarregarMais",
      text: "Carregar mensagens anteriores"
    });
    btnCarregarMais.style.display = "block";
    btnCarregarMais.style.margin = "12px auto";
    btnCarregarMais.addEventListener("click", () => {
      carregarMensagensAnteriores(currentUserId);
    });
    mensagensDiv.appendChild(btnCarregarMais);
  }

  for (const mensagem of mensagens) {
    const nomeAutor = profileCache.get(mensagem.autorId) || "Usuário";
    const isNovaMensagem = mensagem.id && !mensagensRenderizadas.has(mensagem.id);
    const item = createElement("div", {
      className:
        mensagem.autorId === currentUserId
          ? `mensagem mensagem-propria${isNovaMensagem ? " chat-bubble-enter" : ""}`
          : `mensagem mensagem-outro${isNovaMensagem ? " chat-bubble-enter" : ""}`
    });

    const bubble = createElement("div", { className: "chat-bubble" });

    const header = createElement("div", { className: "chat-bubble-header" });
    header.appendChild(createElement("strong", { text: nomeAutor }));
    header.appendChild(createElement("span", { className: "chat-time", text: formatDate(mensagem.criadoEm) }));

    const conteudo = createElement("p", { className: "chat-text", text: mensagem.texto || "" });

    bubble.appendChild(header);
    bubble.appendChild(conteudo);
    item.appendChild(bubble);
    mensagensDiv.appendChild(item);

    if (mensagem.id) {
      mensagensRenderizadas.add(mensagem.id);
    }
  }

  if (carregarMaisClicado) {
    mensagensDiv.scrollTop = mensagensDiv.scrollHeight - oldScrollHeight;
    carregarMaisClicado = false;
  } else {
    mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
  }
}

async function inicializarMensagens(chatId, currentUserId) {
  try {
    const snapRecentes = await buscarMensagensRecentes(chatId, 30, tipoChat);
    const docs = snapRecentes.docs;

    if (docs.length > 0) {
      newestVisibleDoc = docs[0];
      oldestVisibleDoc = docs[docs.length - 1];
      temMaisMensagens = docs.length === 30;

      const mensagensObj = docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
      mensagensLocais = mensagensObj;

      await precarregarPerfis(mensagensLocais);
      renderMensagens(mensagensLocais, currentUserId);
    } else {
      oldestVisibleDoc = null;
      newestVisibleDoc = null;
      temMaisMensagens = false;
      mensagensLocais = [];
      renderMensagens([], currentUserId);
    }

    const cursor = newestVisibleDoc || null;
    if (unsubscribeMensagens) {
      unsubscribeMensagens();
    }

    unsubscribeMensagens = escutarNovasMensagens(
      chatId,
      cursor,
      async (novasMensagens, novosDocs) => {
        if (novasMensagens.length === 0) return;

        const idsExistentes = new Set(mensagensLocais.map((m) => m.id));
        const mensagensFiltradas = novasMensagens.filter((m) => !idsExistentes.has(m.id));

        if (mensagensFiltradas.length > 0) {
          mensagensLocais = [...mensagensLocais, ...mensagensFiltradas];
          if (novosDocs && novosDocs.length > 0) {
            newestVisibleDoc = novosDocs[novosDocs.length - 1];
          }
          await precarregarPerfis(mensagensLocais);
          renderMensagens(mensagensLocais, currentUserId);
        }
      },
      tipoChat
    );
  } catch (error) {
    console.error("Erro ao inicializar mensagens:", error);
    showToast("Erro ao carregar mensagens", "error");
  }
}

async function carregarMensagensAnteriores(currentUserId) {
  if (!oldestVisibleDoc) return;

  try {
    carregarMaisClicado = true;
    const snapHistorico = await buscarMensagensHistoricas(chatId, oldestVisibleDoc, 30, tipoChat);
    const docs = snapHistorico.docs;

    if (docs.length > 0) {
      oldestVisibleDoc = docs[docs.length - 1];
      temMaisMensagens = docs.length === 30;

      const mensagensHistoricas = docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
      mensagensLocais = [...mensagensHistoricas, ...mensagensLocais];

      await precarregarPerfis(mensagensLocais);
      renderMensagens(mensagensLocais, currentUserId);
    } else {
      temMaisMensagens = false;
      carregarMaisClicado = false;
      const btn = document.getElementById("btnCarregarMais");
      if (btn) btn.remove();
    }
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    carregarMaisClicado = false;
  }
}

async function iniciarChat(user) {
  if (!chatId) {
    showToast("Acesso inválido ao chat", "error");
    window.location.href = "../../index.html";
    return;
  }

  try {
    const acesso = await validarAcessoAoChat(chatId, user.uid, tipoChat);

    if (!acesso.autorizado) {
      showToast(acesso.motivo, "error");
      window.location.href = "../../index.html";
      return;
    }

    usuarioAtual = user;
    if (painelProjeto) painelProjeto.hidden = tipoChat !== "projeto";

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

    await inicializarMensagens(chatId, user.uid);

    escutarMetadataChat(chatId, (chatMetadata) => {
      if (!chatMetadata) return;

      renderAcordo(chatMetadata, user.uid);

      const tUltima = getDateValue(chatMetadata.ultimaMensagemEm);
      const tAcesso = getDateValue(chatMetadata?.ultimoAcessoPor?.[user.uid]);

      if (tUltima > tAcesso) {
        marcarChatComoLido(chatId, user.uid, tipoChat);
      }
    }, tipoChat);

    formProposta?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const valor = Number(valorProposta.value);
      if (!Number.isFinite(valor) || valor <= 0) {
        showToast("Informe um valor válido", "error");
        return;
      }

      try {
        setButtonLoading(btnEnviarProposta, true, "Enviando...");
        await enviarProposta({
          chatId,
          autorId: user.uid,
          valor,
          prazo: prazoProposta.value,
          observacao: observacaoProposta.value
        });
        observacaoProposta.value = "";
        showToast("Proposta enviada", "success");
      } catch (error) {
        console.error(error);
        showToast("Não foi possível enviar a proposta", "error");
      } finally {
        setButtonLoading(btnEnviarProposta, false);
      }
    });

    formGithub?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const repositorioUrl = githubRepositorio.value.trim();
      const pullRequestUrl = githubPullRequest.value.trim();
      if (!repositorioUrl && !pullRequestUrl) {
        showToast("Informe pelo menos um link do GitHub", "error");
        return;
      }

      try {
        await salvarGithubProjeto({ chatId, repositorioUrl, pullRequestUrl, autorId: user.uid });
        showToast("Links do GitHub salvos", "success");
      } catch (error) {
        console.error(error);
        showToast("Não foi possível salvar os links", "error");
      }
    });

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
  window.location.href = "../../index.html";
});
