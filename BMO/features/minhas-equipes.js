import { observeAuthenticatedUser } from "../services/authService.js";
import {
  criarEquipe,
  listarConvitesRecebidos,
  listarMembrosEquipe,
  listarEquipesDoUsuario,
  responderConviteEquipe,
  sairDaEquipe as sairDaEquipeService,
  uploadFotoEquipeCloudinary
} from "../services/equipeService.js";
import { createElement, setButtonLoading, showToast } from "../scripts/utils.js";

const inputNome = document.getElementById("equipeNome");
const inputDescricao = document.getElementById("equipeDescricao");
const inputFoto = document.getElementById("equipeFoto");
const btnCriarEquipe = document.getElementById("btnCriarEquipe");
const listaEquipes = document.getElementById("listaEquipes");
const listaConvites = document.getElementById("listaConvites");
const buscaEquipes = document.getElementById("buscaEquipes");
const totalEquipes = document.getElementById("totalEquipes");
const totalMembros = document.getElementById("totalMembros");
const totalConvites = document.getElementById("totalConvites");

let currentUser = null;
let equipesAtuais = [];

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
  equipesAtuais = await Promise.all(
    equipes.map(async (equipe) => ({ ...equipe, membros: await listarMembrosEquipe(equipe.id) }))
  );
  if (totalEquipes) totalEquipes.textContent = equipesAtuais.length;
  if (totalMembros) totalMembros.textContent = equipesAtuais.reduce((total, equipe) => total + equipe.membros.length, 0);
  listaEquipes.innerHTML = "";

  const termo = (buscaEquipes?.value || "").trim().toLowerCase();
  const equipesVisiveis = equipesAtuais.filter((equipe) =>
    !termo || equipe.nome?.toLowerCase().includes(termo) || equipe.id.toLowerCase().includes(termo)
  );

  if (!equipesVisiveis.length) {
    listaEquipes.appendChild(createElement("li", { className: "empresa-empty", text: "Você ainda não participa de equipes." }));
    return;
  }

  equipesVisiveis.forEach((equipe) => {
    const item = createElement("li", { className: "empresa-candidatura-card minhas-equipes-card" });
    const avatar = createElement("img", { className: "minhas-equipes-avatar" });
    avatar.src = equipe.fotoEquipe || "../assets/fotos/larva.jpeg";
    avatar.alt = equipe.nome || "Equipe";
    item.appendChild(avatar);
    const conteudo = createElement("div", { className: "empresa-candidatura-content" });

    conteudo.appendChild(createElement("h3", { text: equipe.nome || "Equipe sem nome" }));
    conteudo.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: equipe.descricao || "Sem descrição" }));
    conteudo.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: `UID: ${equipe.id}` }));
    const papel = equipe.role === "admin" && equipe.criadorId === currentUser.uid ? "Criador" : equipe.role === "admin" ? "Administrador" : "Membro";
    conteudo.appendChild(createElement("span", { className: `minhas-equipes-role minhas-equipes-role-${equipe.role}`, text: papel }));
    conteudo.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: `${equipe.membros.length} membro${equipe.membros.length === 1 ? "" : "s"}` }));

    const acoes = createElement("div", { className: "minhas-equipes-actions" });
    const linkEquipe = createElement("a", { className: "btn-primary", text: "Abrir equipe" });
    linkEquipe.href = `equipe.html?equipeId=${equipe.id}`;
    acoes.appendChild(linkEquipe);
    if (equipe.role !== "admin") {
      const btnSair = createElement("button", { className: "empresa-secondary-btn", text: "Sair da equipe" });
      btnSair.addEventListener("click", () => sairDaEquipe(btnSair, equipe));
      acoes.appendChild(btnSair);
    }
    conteudo.appendChild(acoes);

    item.appendChild(conteudo);
    listaEquipes.appendChild(item);
  });
}

async function sairDaEquipe(button, equipe) {
  if (!window.confirm(`Sair da equipe ${equipe.nome || "selecionada"}?`)) return;

  try {
    setButtonLoading(button, true, "Saindo...");
    await sairDaEquipeService(equipe.id, currentUser.uid);
    showToast("Você saiu da equipe", "success");
    await renderEquipes();
  } catch (error) {
    console.error(error);
    showToast(error?.message || "Não foi possível sair da equipe", "error");
  } finally {
    setButtonLoading(button, false);
  }
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
  const convitesVisiveis = convites.filter((convite) => convite.status !== "aceito");
  if (totalConvites) totalConvites.textContent = convites.filter((convite) => convite.status === "pendente").length;
  listaConvites.innerHTML = "";

  if (!convitesVisiveis.length) {
    listaConvites.appendChild(
      createElement("li", { className: "empresa-empty", text: "Você não possui solicitações de equipe." })
    );
    return;
  }

  convitesVisiveis.forEach((convite) => {
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
buscaEquipes?.addEventListener("input", () => renderEquipes());

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
    window.location.href = "../../index.html";
  }
);
