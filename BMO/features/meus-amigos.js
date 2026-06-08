import { observeAuthenticatedUser, getUserProfile } from "../services/authService.js";
import { aceitarPedidoAmizade, garantirChatAmizade, listarAmigos, listarSolicitacoesPendentes } from "../services/amizadeService.js";
import { createElement, showToast } from "../scripts/utils.js";

const listaSolicitacoes = document.getElementById("listaSolicitacoes");
const listaAmigos = document.getElementById("listaAmigos");

function criarItemUsuario(perfil, extraTexto = "") {
  const li = createElement("li", { className: "empresa-candidatura-card" });

  const foto = createElement("img");
  foto.src = perfil?.fotoURL || perfil?.logoURL || "../assets/fotos/larva.jpeg";
  foto.alt = perfil?.nome || "Usuário";
  foto.className = "empresa-candidatura-avatar";

  const conteudo = createElement("div", { className: "empresa-candidatura-content" });
  const nome = createElement("h3", { text: perfil?.nome || "Usuário" });
  const info = createElement("p", { className: "empresa-candidatura-meta", text: extraTexto });

  conteudo.appendChild(nome);
  if (extraTexto) {
    conteudo.appendChild(info);
  }

  li.appendChild(foto);
  li.appendChild(conteudo);

  return { li, conteudo };
}

async function getUserProfileSafe(userId) {
  try {
    return await getUserProfile(userId);
  } catch (error) {
    console.error("Erro ao carregar perfil", userId, error);
    return null;
  }
}

async function carregarSolicitacoes(user) {
  listaSolicitacoes.innerHTML = "";

  let solicitacoes = [];

  try {
    solicitacoes = await listarSolicitacoesPendentes(user.uid);
  } catch (error) {
    console.error(error);
    listaSolicitacoes.appendChild(createElement("li", { className: "empresa-empty", text: "Erro ao carregar solicitações." }));
    return;
  }

  if (!solicitacoes.length) {
    const vazio = createElement("li", { className: "empresa-empty", text: "Nenhuma solicitação pendente." });
    listaSolicitacoes.appendChild(vazio);
    return;
  }

  for (const solicitacao of solicitacoes) {
    const perfilRemetente = await getUserProfileSafe(solicitacao.userA);
    const { li, conteudo } = criarItemUsuario(perfilRemetente, "Quer ser seu amigo");

    const botaoAceitar = createElement("button", { className: "btn-primary", text: "Aceitar" });
    botaoAceitar.addEventListener("click", async () => {
      try {
        await aceitarPedidoAmizade(solicitacao.id);
        showToast("Solicitação aceita", "success");
        await carregarListas(user);
      } catch (error) {
        console.error(error);
        showToast("Erro ao aceitar solicitação", "error");
      }
    });

    conteudo.appendChild(botaoAceitar);
    listaSolicitacoes.appendChild(li);
  }
}

async function carregarAmigos(user) {
  listaAmigos.innerHTML = "";

  let amizades = [];

  try {
    amizades = await listarAmigos(user.uid);
  } catch (error) {
    console.error(error);
    listaAmigos.appendChild(createElement("li", { className: "empresa-empty", text: "Erro ao carregar amigos." }));
    return;
  }

  if (!amizades.length) {
    const vazio = createElement("li", { className: "empresa-empty", text: "Você ainda não possui amigos." });
    listaAmigos.appendChild(vazio);
    return;
  }

  for (const amizade of amizades) {
    const amigoId = amizade.userA === user.uid ? amizade.userB : amizade.userA;
    const perfilAmigo = await getUserProfileSafe(amigoId);
    const { li, conteudo } = criarItemUsuario(perfilAmigo);

    const acoes = createElement("div", { className: "button-row" });

    const verPerfil = createElement("button", { className: "empresa-secondary-btn", text: "Ver perfil" });
    verPerfil.addEventListener("click", () => {
      window.location.href = `perfil-publico.html?userId=${amigoId}`;
    });

    const abrirChat = createElement("button", { className: "btn-primary", text: "Chat" });
    abrirChat.addEventListener("click", async () => {
      try {
        const chatId = await garantirChatAmizade(user.uid, amigoId);
        window.location.href = `chat.html?chatId=${chatId}&tipo=amizade`;
      } catch (error) {
        console.error(error);
        showToast("Não foi possível abrir chat", "error");
      }
    });

    acoes.appendChild(verPerfil);
    acoes.appendChild(abrirChat);
    conteudo.appendChild(acoes);

    listaAmigos.appendChild(li);
  }
}

async function carregarListas(user) {
  await carregarSolicitacoes(user);
  await carregarAmigos(user);
}

observeAuthenticatedUser(
  async (user) => {
    try {
      await carregarListas(user);
    } catch (error) {
      console.error(error);
      showToast("Não foi possível carregar seus amigos", "error");
    }
  },
  () => {
    showToast("Faça login para acessar seus amigos", "error");
    window.location.href = "index.html";
  }
);
