import { observeAuthenticatedUser } from "./authService.js";
import {
  criarEquipe,
  listarConvitesRecebidos,
  listarEquipesDoUsuario,
  responderConviteEquipe,
  uploadFotoEquipeCloudinary
} from "./equipeService.js";
import { createElement, setButtonLoading, showToast } from "./utils.js";

const inputNome = document.getElementById("equipeNome");
const inputDescricao = document.getElementById("equipeDescricao");
const inputFoto = document.getElementById("equipeFoto");
const btnCriarEquipe = document.getElementById("btnCriarEquipe");
const listaEquipes = document.getElementById("listaEquipes");
const listaConvites = document.getElementById("listaConvites");

let currentUser = null;

function getStatusConviteLabel(status) {
  const map = {
    pendente: "Pendente",
    aceito: "Aceito",
    recusado: "Recusado"
  };

  return map[status] || "Desconhecido";
}

async function renderEquipes() {
  const equipes = await listarEquipesDoUsuario(currentUser.uid);
  listaEquipes.innerHTML = "";

  if (!equipes.length) {
    listaEquipes.appendChild(createElement("li", { className: "empresa-empty", text: "Você ainda não participa de equipes." }));
    return;
  }

  equipes.forEach((equipe) => {
    const item = createElement("li", { className: "empresa-candidatura-card" });
    const conteudo = createElement("div", { className: "empresa-candidatura-content" });

    conteudo.appendChild(createElement("h3", { text: equipe.nome || "Equipe sem nome" }));
    conteudo.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: equipe.descricao || "Sem descrição" }));
    conteudo.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: `Seu papel: ${equipe.role}` }));

    const linkEquipe = createElement("a", { className: "empresa-secondary-btn", text: "Abrir equipe" });
    linkEquipe.href = `equipe.html?equipeId=${equipe.id}`;
    conteudo.appendChild(linkEquipe);

    item.appendChild(conteudo);
    listaEquipes.appendChild(item);
  });
}

async function responderConvite(button, convite, resposta) {
  try {
    setButtonLoading(button, true, resposta === "aceito" ? "Aceitando..." : "Recusando...");
    await responderConviteEquipe(convite.id, resposta, currentUser.uid);
    showToast(`Convite ${resposta} com sucesso`, "success");
    await renderConvites();
    await renderEquipes();
  } catch (error) {
    console.error(error);
    showToast(error?.message || "Não foi possível responder convite", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function renderConvites() {
  if (!listaConvites) return;

  const convites = await listarConvitesRecebidos(currentUser.uid);
  listaConvites.innerHTML = "";

  if (!convites.length) {
    listaConvites.appendChild(
      createElement("li", { className: "empresa-empty", text: "Você não possui solicitações de equipe." })
    );
    return;
  }

  convites.forEach((convite) => {
    const item = createElement("li", { className: "empresa-candidatura-card" });
    const conteudo = createElement("div", { className: "empresa-candidatura-content" });
    const acoes = createElement("div", { className: "button-row" });

    conteudo.appendChild(createElement("h3", { text: convite.equipeNome || "Equipe" }));
    conteudo.appendChild(
      createElement("p", {
        className: "empresa-candidatura-meta",
        text: `Status: ${getStatusConviteLabel(convite.status)}`
      })
    );

    if (convite.status === "pendente") {
      const btnAceitar = createElement("button", { className: "btn-primary", text: "Aceitar" });
      const btnRecusar = createElement("button", { className: "empresa-secondary-btn", text: "Recusar" });

      btnAceitar.addEventListener("click", () => responderConvite(btnAceitar, convite, "aceito"));
      btnRecusar.addEventListener("click", () => responderConvite(btnRecusar, convite, "recusado"));

      acoes.appendChild(btnAceitar);
      acoes.appendChild(btnRecusar);
      conteudo.appendChild(acoes);
    }

    item.appendChild(conteudo);
    listaConvites.appendChild(item);
  });
}

async function handleCriarEquipe() {
  const nome = inputNome.value.trim();
  const descricao = inputDescricao.value.trim();

  if (!nome) {
    showToast("Informe o nome da equipe", "error");
    return;
  }

  try {
    setButtonLoading(btnCriarEquipe, true, "Criando...");
    let fotoEquipe = "";

    if (inputFoto.files?.[0]) {
      fotoEquipe = await uploadFotoEquipeCloudinary(inputFoto.files[0]);
    }

    await criarEquipe({
      nome,
      descricao,
      criadorId: currentUser.uid,
      fotoEquipe
    });

    inputNome.value = "";
    inputDescricao.value = "";
    inputFoto.value = "";

    showToast("Equipe criada com sucesso", "success");

    try {
      await renderEquipes();
    } catch (error) {
      console.error(error);
      showToast("Equipe criada, mas não foi possível atualizar a lista agora", "error");
    }
  } catch (error) {
    console.error(error);
    showToast("Não foi possível criar a equipe", "error");
  } finally {
    setButtonLoading(btnCriarEquipe, false);
  }
}

btnCriarEquipe.addEventListener("click", handleCriarEquipe);

observeAuthenticatedUser(
  async (user) => {
    currentUser = user;

    try {
      await renderEquipes();
    } catch (error) {
      console.error(error);
      showToast("Erro ao carregar lista de equipes", "error");
    }

    try {
      await renderConvites();
    } catch (error) {
      console.error(error);
      showToast("Erro ao carregar convites da equipe", "error");
    }
  },
  () => {
    showToast("Faça login para acessar suas equipes", "error");
    window.location.href = "index.html";
  }
);
