import { observeAuthenticatedUser, getUserProfile } from "../services/authService.js";
import { listarProjetosDaEmpresa } from "../services/freelancerEmpresaService.js";
import { clearElement, createElement, showToast } from "../scripts/utils.js";

const lista = document.getElementById("listaProjetosEmpresa");
const loading = document.getElementById("loadingProjetos");
const vazio = document.getElementById("estadoVazioProjetos");
const resumo = document.getElementById("resumoProjetos");

function dataProjeto(value) {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value || 0);
  return Number.isNaN(date.getTime()) || date.getTime() === 0 ? "Data não informada" : date.toLocaleDateString("pt-BR");
}

function valorProjeto(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function renderProjetos(projetos) {
  clearElement(lista);
  projetos.forEach((projeto) => {
    const card = createElement("li", { className: "empresa-candidatura-card" });
    card.appendChild(createElement("h3", { className: "empresa-card-title", text: projeto.titulo || "Sem título" }));
    card.appendChild(createElement("p", { className: "empresa-card-line", text: projeto.descricao || "Sem descrição" }));

    const tags = createElement("div", { className: "empresa-tags" });
    [projeto.tipo || "Geral", projeto.nivel === "iniciante" ? "Iniciante" : "Intermediário", valorProjeto(projeto.valorSimulado)].forEach((tag) => tags.appendChild(createElement("span", { className: "empresa-tag", text: tag })));
    if (projeto.remoto) tags.appendChild(createElement("span", { className: "empresa-tag", text: "Remoto" }));
    if (projeto.urgente) tags.appendChild(createElement("span", { className: "empresa-tag", text: "Urgente" }));
    card.appendChild(tags);

    const meta = createElement("div", { className: "empresa-meta" });
    meta.appendChild(createElement("span", { text: `Publicado em: ${dataProjeto(projeto.criadoEm)}` }));
    meta.appendChild(createElement("span", { text: `Prazo: ${dataProjeto(projeto.prazo)}` }));
    card.appendChild(meta);
    lista.appendChild(card);
  });
  vazio.classList.toggle("hidden", projetos.length > 0);
}

async function carregarProjetos(user) {
  try {
    const [perfil, projetos] = await Promise.all([getUserProfile(user.uid), listarProjetosDaEmpresa(user.uid)]);
    const nome = perfil?.nome || "Empresa BMO";
    document.querySelectorAll("[data-empresa-nome]").forEach((item) => { item.textContent = nome; });
    document.querySelectorAll("[data-empresa-inicial]").forEach((item) => { item.textContent = nome.trim().charAt(0).toUpperCase() || "E"; });
    projetos.sort((a, b) => (b.criadoEm?.toDate?.() || new Date(0)) - (a.criadoEm?.toDate?.() || new Date(0)));
    resumo.textContent = `${projetos.length} projeto${projetos.length === 1 ? "" : "s"} publicado${projetos.length === 1 ? "" : "s"}`;
    renderProjetos(projetos);
  } catch (error) {
    console.error(error);
    showToast("Não foi possível carregar os projetos", "error");
  } finally {
    loading.hidden = true;
  }
}

observeAuthenticatedUser(carregarProjetos, () => { window.location.href = "../../index.html"; });
