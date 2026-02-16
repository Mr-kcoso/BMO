import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import { validarAcessoAoChat, escutarMensagens, enviarMensagem } from "./chatService.js";
import { clearElement, createElement, setButtonLoading, showToast } from "./utils.js";

const params = new URLSearchParams(window.location.search);
const chatId = params.get("chatId");

const mensagensDiv = document.getElementById("mensagens");
const texto = document.getElementById("texto");
const btnEnviar = document.getElementById("btnEnviar");
const btnVoltar = document.getElementById("btnVoltar");

if (btnVoltar) {
  btnVoltar.addEventListener("click", () => {
    window.history.back();
  });
}

async function renderMensagens(mensagens, currentUserId) {
  clearElement(mensagensDiv);

  for (const mensagem of mensagens) {
    const autor = await getUserProfile(mensagem.autorId);
    const nomeAutor = autor?.nome || "Usuário";
    const item = createElement("div", {
      className:
        mensagem.autorId === currentUserId ? "mensagem mensagem-propria" : "mensagem mensagem-outro"
    });

    const header = createElement("strong", { text: nomeAutor });
    const conteudo = createElement("p", { text: mensagem.texto || "" });

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

    escutarMensagens(chatId, (mensagens) => {
      renderMensagens(mensagens, user.uid);
    });

    btnEnviar.addEventListener("click", async () => {
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
