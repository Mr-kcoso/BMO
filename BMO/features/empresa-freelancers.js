import { observeAuthenticatedUser, buscarPerfis, getUserProfile } from "../services/authService.js";
import { convidarFreelancerParaProjeto, listarFreelancersSalvos, listarProjetosDaEmpresa, removerFreelancerSalvo, salvarFreelancer } from "../services/freelancerEmpresaService.js";
import { clearElement, createElement, showToast } from "../scripts/utils.js";

const pageMode = document.body.dataset.page;
const state = { user: null, perfis: [], salvos: new Set(), projetos: [], freelancerSelecionado: null };
const lista = document.getElementById("listaFreelancers");
const vazio = document.getElementById("estadoVazio");
const resumo = document.getElementById("resumoFreelancers");
const busca = document.getElementById("buscaFreelancers");
const tecnologia = document.getElementById("filtroTecnologia");
const localizacao = document.getElementById("filtroLocalizacao");
const experiencia = document.getElementById("filtroExperiencia");
const disponibilidade = document.getElementById("filtroDisponibilidade");
const dialog = document.getElementById("modalConvite");
const projetosSelect = document.getElementById("projetoConvite");
const nomeConvite = document.getElementById("nomeFreelancerConvite");

function normalizar(value) { return String(value || "").trim().toLowerCase(); }
function tagsDoPerfil(perfil) { return Array.isArray(perfil.habilidades) ? perfil.habilidades : []; }
function atendeFiltro(perfil) {
  const termo = normalizar(busca?.value);
  const tech = normalizar(tecnologia?.value);
  const lugar = normalizar(localizacao?.value);
  const nivel = normalizar(experiencia?.value);
  const agenda = normalizar(disponibilidade?.value);
  const campos = [perfil.nome, perfil.areaAtuacao, perfil.bio, perfil.localizacao, perfil.experiencia, perfil.disponibilidade, ...tagsDoPerfil(perfil)].map(normalizar).join(" ");
  return (!termo || campos.includes(termo)) && (!tech || tagsDoPerfil(perfil).some((tag) => normalizar(tag).includes(tech)) || normalizar(perfil.areaAtuacao).includes(tech)) && (!lugar || normalizar(perfil.localizacao).includes(lugar)) && (!nivel || normalizar(perfil.experiencia).includes(nivel)) && (!agenda || normalizar(perfil.disponibilidade).includes(agenda));
}
function atualizarResumo(total) { if (resumo) resumo.textContent = `${total} freelancer${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`; }
function verPerfil(id) { window.location.href = `../perfil-publico.html?userId=${id}`; }

function abrirConvite(perfil) {
  if (!state.projetos.length) { showToast("Publique um projeto antes de enviar um convite", "info"); return; }
  state.freelancerSelecionado = perfil;
  nomeConvite.textContent = perfil.nome || "este freelancer";
  clearElement(projetosSelect);
  state.projetos.forEach((projeto) => projetosSelect.appendChild(createElement("option", { text: projeto.titulo || "Projeto sem título", value: projeto.id })));
  dialog.showModal();
}

function criarCard(perfil) {
  const card = createElement("li", { className: "empresa-candidatura-card" });
  const foto = createElement("img", { className: "empresa-candidatura-avatar" });
  foto.src = perfil.fotoURL || "../assets/fotos/larva.jpeg"; foto.alt = perfil.nome || "Freelancer";
  const content = createElement("div", { className: "empresa-candidatura-content" });
  content.appendChild(createElement("h3", { text: perfil.nome || "Freelancer" }));
  content.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: perfil.areaAtuacao || "Área não informada" }));
  content.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: [perfil.localizacao, perfil.experiencia, perfil.disponibilidade].filter(Boolean).join(" · ") || "Informações profissionais não informadas" }));
  const tags = createElement("div", { className: "empresa-freelancer-tags" });
  tagsDoPerfil(perfil).slice(0, 4).forEach((tag) => tags.appendChild(createElement("span", { text: tag })));
  if (tags.children.length) content.appendChild(tags);
  const actions = createElement("div", { className: "button-row" });
  const perfilBtn = createElement("button", { className: "empresa-secondary-btn", text: "Ver perfil" }); perfilBtn.addEventListener("click", () => verPerfil(perfil.id)); actions.appendChild(perfilBtn);
  const conviteBtn = createElement("button", { className: "btn-primary", text: "Convidar" }); conviteBtn.addEventListener("click", () => abrirConvite(perfil)); actions.appendChild(conviteBtn);
  const salvo = state.salvos.has(perfil.id);
  const salvoBtn = createElement("button", { className: "empresa-secondary-btn", text: salvo ? "Remover dos salvos" : "Salvar freelancer" });
  salvoBtn.addEventListener("click", async () => {
    try { if (salvo) { await removerFreelancerSalvo(state.user.uid, perfil.id); state.salvos.delete(perfil.id); } else { await salvarFreelancer(state.user.uid, perfil); state.salvos.add(perfil.id); } showToast(salvo ? "Freelancer removido dos salvos" : "Freelancer salvo", "success"); render(); } catch (error) { console.error(error); showToast("Não foi possível atualizar os salvos", "error"); }
  }); actions.appendChild(salvoBtn); content.appendChild(actions); card.append(foto, content); return card;
}
function render() {
  clearElement(lista);
  const perfis = state.perfis.filter(atendeFiltro);
  atualizarResumo(perfis.length);
  perfis.forEach((perfil) => lista.appendChild(criarCard(perfil)));
  vazio.classList.toggle("hidden", perfis.length > 0);
}
async function carregar() {
  const [perfis, salvos, projetos, empresa] = await Promise.all([buscarPerfis({ tipo: "freelancer", excluirUserId: state.user.uid }), listarFreelancersSalvos(state.user.uid), listarProjetosDaEmpresa(state.user.uid), getUserProfile(state.user.uid)]);
  state.salvos = new Set(salvos.map((item) => item.freelancerId || item.id));
  state.projetos = projetos;
  state.perfis = pageMode === "salvos" ? perfis.filter((perfil) => state.salvos.has(perfil.id)) : perfis;
  const nome = empresa?.nome || "Empresa BMO"; document.querySelectorAll("[data-empresa-nome]").forEach((el) => { el.textContent = nome; }); document.querySelectorAll("[data-empresa-inicial]").forEach((el) => { el.textContent = nome.charAt(0).toUpperCase(); });
  render();
}
[busca, tecnologia, localizacao, experiencia, disponibilidade].forEach((campo) => { campo?.addEventListener("input", render); campo?.addEventListener("change", render); });
document.getElementById("cancelarConvite")?.addEventListener("click", () => dialog.close());
document.getElementById("confirmarConvite")?.addEventListener("click", async () => { try { const projeto = state.projetos.find((item) => item.id === projetosSelect.value); await convidarFreelancerParaProjeto({ empresaId: state.user.uid, freelancerId: state.freelancerSelecionado.id, projeto }); dialog.close(); showToast("Convite enviado", "success"); } catch (error) { console.error(error); showToast("Não foi possível enviar o convite", "error"); } });
observeAuthenticatedUser(async (user) => { state.user = user; try { await carregar(); } catch (error) { console.error(error); showToast("Não foi possível carregar freelancers", "error"); } }, () => { window.location.href = "../../../index.html"; });
