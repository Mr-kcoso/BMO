import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import { adicionarMembroEquipe, getEquipe, getRoleMembroEquipe, listarMembrosEquipe } from "./equipeService.js";
import { createElement, setButtonLoading, showToast } from "./utils.js";

const params = new URLSearchParams(window.location.search);
const equipeId = params.get("equipeId");

const equipeNome = document.getElementById("equipeNome");
const equipeDescricao = document.getElementById("equipeDescricao");
const equipeFoto = document.getElementById("equipeFoto");
const blocoAdmin = document.getElementById("blocoAdmin");
const inputNovoMembroId = document.getElementById("novoMembroId");
const btnAdicionarMembro = document.getElementById("btnAdicionarMembro");
const listaMembros = document.getElementById("listaMembros");

let currentUser = null;

async function renderMembros() {
  const membros = await listarMembrosEquipe(equipeId);
  listaMembros.innerHTML = "";

  if (!membros.length) {
    listaMembros.appendChild(createElement("li", { className: "empresa-empty", text: "Equipe sem membros." }));
    return;
  }

  for (const membro of membros) {
    const perfil = await getUserProfile(membro.userId);

    const item = createElement("li", { className: "empresa-candidatura-card" });
    const avatar = createElement("img");
    avatar.src = perfil?.fotoURL || perfil?.logoURL || "larva.jpeg";
    avatar.alt = perfil?.nome || membro.userId;
    avatar.className = "empresa-candidatura-avatar";

    const content = createElement("div", { className: "empresa-candidatura-content" });
    content.appendChild(createElement("h3", { text: perfil?.nome || membro.userId }));
    content.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: `Role: ${membro.role}` }));

    item.appendChild(avatar);
    item.appendChild(content);
    listaMembros.appendChild(item);
  }
}

async function carregarEquipe() {
  if (!equipeId) {
    showToast("Equipe não informada", "error");
    window.location.href = "minhas-equipes.html";
    return;
  }

  const equipe = await getEquipe(equipeId);

  if (!equipe) {
    showToast("Equipe não encontrada", "error");
    window.location.href = "minhas-equipes.html";
    return;
  }

  equipeNome.textContent = equipe.nome || "Equipe";
  equipeDescricao.textContent = equipe.descricao || "Sem descrição";
  equipeFoto.src = equipe.fotoEquipe || "larva.jpeg";

  const role = await getRoleMembroEquipe(equipeId, currentUser.uid);
  blocoAdmin.classList.toggle("hidden", role !== "admin");

  await renderMembros();
}

btnAdicionarMembro.addEventListener("click", async () => {
  const novoMembroId = inputNovoMembroId.value.trim();

  if (!novoMembroId) {
    showToast("Informe o UID do usuário", "error");
    return;
  }

  try {
    setButtonLoading(btnAdicionarMembro, true, "Adicionando...");
    await adicionarMembroEquipe(equipeId, novoMembroId, "membro");
    inputNovoMembroId.value = "";
    showToast("Membro adicionado", "success");
    await renderMembros();
  } catch (error) {
    console.error(error);
    showToast("Não foi possível adicionar membro", "error");
  } finally {
    setButtonLoading(btnAdicionarMembro, false);
  }
});

observeAuthenticatedUser(
  async (user) => {
    currentUser = user;

    try {
      await carregarEquipe();
    } catch (error) {
      console.error(error);
      showToast("Erro ao carregar equipe", "error");
    }
  },
  () => {
    showToast("Faça login para acessar equipes", "error");
    window.location.href = "index.html";
  }
);
