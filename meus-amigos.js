import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import { aceitarPedidoAmizade, listarAmigos, listarSolicitacoesPendentes } from "./amizadeService.js";
import { createElement, showToast } from "./utils.js";

const listaSolicitacoes = document.getElementById("listaSolicitacoes");
const listaAmigos = document.getElementById("listaAmigos");

function criarItemUsuario(perfil, extraTexto = "") {
  const li = createElement("li", { className: "empresa-candidatura-card" });

  const foto = createElement("img");
  foto.src = perfil?.fotoURL || perfil?.logoURL || "larva.jpeg";
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

async function carregarSolicitacoes(user) {
  const solicitacoes = await listarSolicitacoesPendentes(user.uid);
  listaSolicitacoes.innerHTML = "";

  if (!solicitacoes.length) {
    const vazio = createElement("li", { className: "empresa-empty", text: "Nenhuma solicitação pendente." });
    listaSolicitacoes.appendChild(vazio);
    return;
  }

  for (const solicitacao of solicitacoes) {
    const perfilRemetente = await getUserProfile(solicitacao.userA);
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
  const amizades = await listarAmigos(user.uid);
  listaAmigos.innerHTML = "";

  if (!amizades.length) {
    const vazio = createElement("li", { className: "empresa-empty", text: "Você ainda não possui amigos." });
    listaAmigos.appendChild(vazio);
    return;
  }

  for (const amizade of amizades) {
    const amigoId = amizade.userA === user.uid ? amizade.userB : amizade.userA;
    const perfilAmigo = await getUserProfile(amigoId);
    const { li, conteudo } = criarItemUsuario(perfilAmigo);

    const verPerfil = createElement("a", { className: "empresa-secondary-btn", text: "Ver perfil" });
    verPerfil.href = `perfil-publico.html?userId=${amigoId}`;
    conteudo.appendChild(verPerfil);

    listaAmigos.appendChild(li);
  }
}

async function carregarListas(user) {
  await Promise.all([carregarSolicitacoes(user), carregarAmigos(user)]);
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
