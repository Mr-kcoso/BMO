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

const freelancerProfileName = document.getElementById("freelancerProfileName");
const freelancerProfileType = document.getElementById("freelancerProfileType");
const freelancerPanelName = document.getElementById("freelancerPanelName");
const freelancerAvatar = document.getElementById("freelancerAvatar");
const recommendedCount = document.getElementById("recommendedCount");
const categoryList = document.getElementById("categoryList");

const modalDetalhes = document.getElementById("modalDetalhes");
const fecharModalDetalhes = document.getElementById("fecharModalDetalhes");
const modalDetalhesTitulo = document.getElementById("modalDetalhesTitulo");
const modalDetalhesSubtitulo = document.getElementById("modalDetalhesSubtitulo");
const modalDetalhesDescricao = document.getElementById("modalDetalhesDescricao");
const modalDetalhesTexto = document.getElementById("modalDetalhesTexto");

const state = {
  problemas: [],
  candidaturasMap: new Map(),
  user: null,
  profile: null
};

function renderSkeletonCards(total = 4) {
  clearElement(lista);

  for (let index = 0; index < total; index += 1) {
    const card = document.createElement("li");
    card.className = "freelancer-card freelancer-post freelancer-skeleton";
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

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function getDateValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getProfileInitial(profile) {
  return (profile?.nome || profile?.email || "B").trim().charAt(0).toUpperCase() || "B";
}

function renderResumo(total) {
  if (!resumoProblemas) return;
  resumoProblemas.textContent = `${total} problema${total === 1 ? "" : "s"} disponivel${
    total === 1 ? "" : "is"
  } no feed`;
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

function atualizarPerfilResumo(profile) {
  const nome = profile?.nome || "Freelancer BMO";
  const tipo = profile?.tipo ? `${profile.tipo} verificado` : "Profissional verificado";
  const inicial = getProfileInitial(profile);

  if (freelancerProfileName) freelancerProfileName.textContent = nome;
  if (freelancerProfileType) freelancerProfileType.textContent = tipo;
  if (freelancerPanelName) freelancerPanelName.textContent = nome;
  if (freelancerAvatar) freelancerAvatar.textContent = inicial;

  document.querySelectorAll(".freelancer-panel-avatar").forEach((avatar) => {
    avatar.textContent = inicial;
  });
}

function atualizarPainelSocial(problemas) {
  if (recommendedCount) {
    recommendedCount.textContent = `${problemas.length} ativo${problemas.length === 1 ? "" : "s"}`;
  }

  if (!categoryList) return;

  const categorias = [...new Set(problemas.map((problema) => problema.tipo).filter(Boolean))].slice(0, 8);
  if (!categorias.length) return;

  clearElement(categoryList);
  categorias.forEach((categoria) => {
    const chip = document.createElement("span");
    chip.textContent = categoria;
    categoryList.appendChild(chip);
  });
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

function fecharDetalhes() {
  modalDetalhes?.classList.add("hidden");
  document.body.style.overflow = "";
}

function onVerDetalhes(problema) {
  if (!modalDetalhes) {
    showToast(`${problema.titulo}: ${problema.descricao || "Sem descricao"}`, "info");
    return;
  }

  if (modalDetalhesTitulo) modalDetalhesTitulo.textContent = problema.titulo || "Detalhes do problema";
  if (modalDetalhesSubtitulo) {
    const empresaLabel = `Empresa: ${problema.empresaNome || "Empresa parceira"}`;
    const valorLabel =
      typeof problema.valorSimulado === "number"
        ? ` • Valor estimado: ${formatCurrency(problema.valorSimulado)}`
        : "";
    modalDetalhesSubtitulo.textContent = `${empresaLabel}${valorLabel}`;
  }
  if (modalDetalhesDescricao) {
    modalDetalhesDescricao.textContent = problema.descricao || "Sem descricao";
  }

  const detalhamento = problema.detalhamento || problema.descricao || "Sem detalhamento adicional.";
  if (modalDetalhesTexto) modalDetalhesTexto.textContent = detalhamento;

  modalDetalhes.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function onVerPerfilEmpresa(problema) {
  if (!problema?.empresaId) {
    showToast("Perfil da empresa nao disponivel", "info");
    return;
  }

  window.location.href = `perfil-publico.html?userId=${problema.empresaId}`;
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
      onVerPerfilEmpresa,
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
          showToast("Nao foi possivel enviar candidatura", "error");
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
      showToast("Dados do usuario nao encontrados", "error");
      return;
    }

    state.user = user;
    state.profile = profile;
    state.problemas = problemas;
    state.candidaturasMap = new Map(
      candidaturas.map((candidatura) => [candidatura.problemaId, candidatura])
    );

    preencherCategorias(problemas);
    atualizarPerfilResumo(profile);
    atualizarPainelSocial(problemas);
    renderLista();
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar problemas", "error");
  } finally {
    if (loading) loading.hidden = true;
  }
}

bindFiltros();

fecharModalDetalhes?.addEventListener("click", fecharDetalhes);

modalDetalhes?.addEventListener("click", (event) => {
  if (event.target === modalDetalhes) {
    fecharDetalhes();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modalDetalhes && !modalDetalhes.classList.contains("hidden")) {
    fecharDetalhes();
  }
});

observeAuthenticatedUser(carregarDashboardFreelancer, () => {
  showToast("Faca login para continuar", "error");
  window.location.href = "index.html";
});
