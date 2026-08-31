import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "../services/firebase.js";
import { observeAuthenticatedUser, getUserProfile } from "../services/authService.js";
import { showToast } from "./utils.js";

const tipoPagina = document.body.dataset.tipoConta || "freelancer";
const nomeConta = document.getElementById("nomeConta");
const emailConta = document.getElementById("emailConta");
const tipoConta = document.getElementById("tipoConta");
const avatarConta = document.getElementById("avatarConta");
const statusPreferencias = document.getElementById("statusPreferencias");
const formulario = document.getElementById("formPreferencias");
const btnSair = document.getElementById("btnSair");
const tituloPagina = document.getElementById("tituloPagina");
const descricaoPagina = document.getElementById("descricaoPagina");

function lerPreferencias() {
  try {
    const userId = auth.currentUser?.uid;
    return JSON.parse(localStorage.getItem(`bmo_preferencias_${tipoPagina}_${userId}`) || "{}") || {};
  } catch (error) {
    console.error("Erro ao ler preferências", error);
    return {};
  }
}

function preencherPreferencias() {
  const preferencias = lerPreferencias();
  ["notificacoes", "novosProjetos", "mensagens", "perfilPublico"].forEach((campo) => {
    const elemento = document.getElementById(campo);
    if (elemento && preferencias[campo] !== undefined) elemento.checked = preferencias[campo];
  });
  const tema = document.getElementById("tema");
  if (tema && preferencias.tema) tema.value = preferencias.tema;
}

function salvarPreferencias(event) {
  event.preventDefault();
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  const dados = {};
  formulario.querySelectorAll("input[type=checkbox]").forEach((campo) => { dados[campo.id] = campo.checked; });
  dados.tema = document.getElementById("tema")?.value || "escuro";
  localStorage.setItem(`bmo_preferencias_${tipoPagina}_${userId}`, JSON.stringify(dados));
  statusPreferencias.textContent = "Preferências salvas agora";
  showToast("Preferências salvas", "success");
}

async function carregarConta(user) {
  const perfil = await getUserProfile(user.uid);
  const nome = perfil?.nome || user.email || "Usuário BMO";
  nomeConta.textContent = nome;
  emailConta.textContent = user.email || "E-mail não informado";
  tipoConta.textContent = tipoPagina === "empresa" ? "Conta empresarial" : "Conta freelancer";
  avatarConta.textContent = nome.trim().charAt(0).toUpperCase() || "B";
  document.title = `Configurações ${tipoPagina === "empresa" ? "da empresa" : "do freelancer"} - BMO`;
  tituloPagina.textContent = tipoPagina === "empresa" ? "Configurações da empresa" : "Configurações do freelancer";
  descricaoPagina.textContent = tipoPagina === "empresa"
    ? "Organize as preferências da sua operação no BMO."
    : "Ajuste sua experiência e mantenha sua conta sob controle.";
  preencherPreferencias();
}

formulario?.addEventListener("submit", salvarPreferencias);
btnSair?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "../../index.html";
  } catch (error) {
    console.error(error);
    showToast("Não foi possível sair da conta", "error");
  }
});

observeAuthenticatedUser(carregarConta, () => {
  showToast("Faça login para acessar as configurações", "error");
  window.location.href = "../../index.html";
});
