import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import {
  criarCandidatura,
  getCandidaturasByFreelancer,
  getProblemas
} from "./candidaturaService.js";
import { renderProblema } from "./uiFreelancer.js";
import { clearElement, setButtonLoading, showToast } from "./utils.js";

const lista = document.getElementById("lista");
const loading = document.getElementById("loadingProblemas");
const estadoVazio = document.getElementById("estadoVazio");
const resumoProblemas = document.getElementById("resumoProblemas");

const buscaProblemas = document.getElementById("buscaProblemas");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroNivel = document.getElementById("filtroNivel");
const ordenacaoProblemas = document.getElementById("ordenacaoProblemas");

const state = {
  problemas: [],
  candidaturasMap: new Map(),
  user: null,
  profile: null
};

function renderSkeletonCards(total = 6) {
  clearElement(lista);

  for (let index = 0; index < total; index += 1) {
    const card = document.createElement("li");
    card.className = "freelancer-card freelancer-skeleton";
    card.innerHTML = `
      <div class="freelancer-skeleton-line freelancer-skeleton-title"></div>
      <div class="freelancer-skeleton-line"></div>
      <div class="freelancer-skeleton-line"></div>
      <div class="freelancer-skeleton-line freelancer-skeleton-short"></div>
      <div class="freelancer-skeleton-line freelancer-skeleton-btn"></div>
    `;
    lista.appendChild(card);
  }
}

function abrirChat(chatId) {
  window.location.href = `chat.html?chatId=${chatId}`;
}

function normalizarNivel(nivel) {
  const value = String(nivel || "intermediario").toLowerCase();
  return value.startsWith("inic") ? "iniciante" : "intermediario";
}

function getDateValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function renderResumo(total) {
  if (!resumoProblemas) return;
  resumoProblemas.textContent = `${total} problema${total === 1 ? "" : "s"} disponível${
    total === 1 ? "" : "is"
  }`;
}

function preencherCategorias(problemas) {
  if (!filtroCategoria) return;

  const categorias = [...new Set(problemas.map((problema) => problema.tipo).filter(Boolean))].sort();
  const selecionada = filtroCategoria.value;

  filtroCategoria.innerHTML = "<option value=\"todos\">Todas as categorias</option>";

  categorias.forEach((categoria) => {
    const option = document.createElement("option");
    option.value = categoria;
    option.textContent = categoria;
    filtroCategoria.appendChild(option);
  });

  if (categorias.includes(selecionada)) {
    filtroCategoria.value = selecionada;
  }
}

function filtrarProblemas(problemas) {
  const termoBusca = (buscaProblemas?.value || "").trim().toLowerCase();
  const categoriaSelecionada = filtroCategoria?.value || "todos";
  const nivelSelecionado = filtroNivel?.value || "todos";

  return problemas.filter((problema) => {
    const matchesBusca =
      !termoBusca ||
      problema.titulo?.toLowerCase().includes(termoBusca) ||
      problema.descricao?.toLowerCase().includes(termoBusca) ||
      problema.tipo?.toLowerCase().includes(termoBusca);

    const matchesCategoria =
      categoriaSelecionada === "todos" || problema.tipo === categoriaSelecionada;

    const matchesNivel =
      nivelSelecionado === "todos" || normalizarNivel(problema.nivel) === nivelSelecionado;

    return matchesBusca && matchesCategoria && matchesNivel;
  });
}

function ordenarProblemas(problemas) {
  const tipoOrdenacao = ordenacaoProblemas?.value || "recentes";

  return [...problemas].sort((a, b) => {
    if (tipoOrdenacao === "antigos") {
      return getDateValue(a.criadoEm) - getDateValue(b.criadoEm);
    }

    if (tipoOrdenacao === "candidaturas") {
      return (b.totalCandidaturas || 0) - (a.totalCandidaturas || 0);
    }

    if (tipoOrdenacao === "prazo") {
      return getDateValue(a.prazo) - getDateValue(b.prazo);
    }

    return getDateValue(b.criadoEm) - getDateValue(a.criadoEm);
  });
}

function onVerDetalhes(problema) {
  showToast(`${problema.titulo}: ${problema.descricao || "Sem descrição"}`, "info");
}

function renderLista() {
  clearElement(lista);

  const problemasFiltrados = filtrarProblemas(state.problemas);
  const problemasOrdenados = ordenarProblemas(problemasFiltrados);

  renderResumo(problemasOrdenados.length);

  problemasOrdenados.forEach((problema) => {
    const candidatura = state.candidaturasMap.get(problema.id);

    renderProblema({
      container: lista,
      problema,
      candidatura,
      onAbrirChat: abrirChat,
      onVerDetalhes,
      onCandidatar: async (button) => {
        try {
          setButtonLoading(button, true, "Enviando...");
          await criarCandidatura({
            problemaId: problema.id,
            empresaId: problema.empresaId,
            freelancerId: state.user.uid,
            freelancerNome: state.profile.nome
          });

          state.candidaturasMap.set(problema.id, {
            problemaId: problema.id,
            status: "pendente"
          });

          renderLista();
          showToast("Candidatura enviada com sucesso", "success");
        } catch (error) {
          showToast("Não foi possível enviar candidatura", "error");
          console.error(error);
          setButtonLoading(button, false);
        }
      }
    });
  });

  estadoVazio?.classList.toggle("hidden", problemasOrdenados.length > 0);
}

function bindFiltros() {
  [buscaProblemas, filtroCategoria, filtroNivel, ordenacaoProblemas].forEach((element) => {
    element?.addEventListener("input", renderLista);
    element?.addEventListener("change", renderLista);
  });
}

async function carregarDashboardFreelancer(user) {
  if (loading) loading.hidden = false;
  renderSkeletonCards();

  try {
    const [profile, problemas, candidaturas] = await Promise.all([
      getUserProfile(user.uid),
      getProblemas(),
      getCandidaturasByFreelancer(user.uid)
    ]);

    if (!profile) {
      showToast("Dados do usuário não encontrados", "error");
      return;
    }

    state.user = user;
    state.profile = profile;
    state.problemas = problemas;
    state.candidaturasMap = new Map(
      candidaturas.map((candidatura) => [candidatura.problemaId, candidatura])
    );

    preencherCategorias(problemas);
    renderLista();
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar problemas", "error");
  } finally {
    if (loading) loading.hidden = true;
  }
}

bindFiltros();

observeAuthenticatedUser(carregarDashboardFreelancer, () => {
  showToast("Faça login para continuar", "error");
  window.location.href = "index.html";
});
