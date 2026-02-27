import { observeAuthenticatedUser } from "./authService.js";
import { criarEquipe, listarEquipesDoUsuario, uploadFotoEquipeCloudinary } from "./equipeService.js";
import { createElement, setButtonLoading, showToast } from "./utils.js";

const inputNome = document.getElementById("equipeNome");
const inputDescricao = document.getElementById("equipeDescricao");
const inputFoto = document.getElementById("equipeFoto");
const btnCriarEquipe = document.getElementById("btnCriarEquipe");
const listaEquipes = document.getElementById("listaEquipes");

let currentUser = null;

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
    await renderEquipes();
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
      showToast("Erro ao carregar equipes", "error");
    }
  },
  () => {
    showToast("Faça login para acessar suas equipes", "error");
    window.location.href = "index.html";
  }
);
