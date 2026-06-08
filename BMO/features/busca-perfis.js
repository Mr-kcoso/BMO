import { observeAuthenticatedUser, buscarPerfis } from "../services/authService.js";
import { enviarPedidoAmizade, getAmizade } from "../services/amizadeService.js";
import { clearElement, createElement, showToast } from "../scripts/utils.js";

const buscaPerfis = document.getElementById("buscaPerfis");
const filtroTipoPerfil = document.getElementById("filtroTipoPerfil");
const listaPerfisBusca = document.getElementById("listaPerfisBusca");
const estadoVazioBusca = document.getElementById("estadoVazioBusca");
const resumoBuscaPerfis = document.getElementById("resumoBuscaPerfis");

const state = {
  user: null,
  perfis: []
};

function renderResumo(total) {
  if (!resumoBuscaPerfis) return;
  resumoBuscaPerfis.textContent = `${total} perfil${total === 1 ? "" : "is"} encontrado${total === 1 ? "" : "s"}`;
}

function renderTipo(tipo) {
  return tipo === "empresa" ? "Empresa" : "Freelancer";
}

function renderAcoesPerfil(perfil, amizade) {
  const actions = createElement("div", { className: "button-row" });

  const btnPerfil = createElement("button", { className: "empresa-secondary-btn", text: "Ver perfil" });
  btnPerfil.addEventListener("click", () => {
    window.location.href = `perfil-publico.html?userId=${perfil.id}`;
  });
  actions.appendChild(btnPerfil);

  if (!amizade) {
    const btnAdicionar = createElement("button", { className: "btn-primary", text: "Adicionar amigo" });
    btnAdicionar.addEventListener("click", async () => {
      try {
        await enviarPedidoAmizade(state.user.uid, perfil.id);
        showToast("Pedido de amizade enviado", "success");
        await carregarPerfis();
      } catch (error) {
        console.error(error);
        showToast("Erro ao enviar pedido de amizade", "error");
      }
    });
    actions.appendChild(btnAdicionar);
    return actions;
  }

  const status = amizade.status === "aceita" ? "Amigos" : "Solicitação pendente";
  const statusBtn = createElement("button", {
    className: "empresa-status-btn",
    text: status
  });
  statusBtn.disabled = true;
  actions.appendChild(statusBtn);

  return actions;
}

async function renderPerfis() {
  clearElement(listaPerfisBusca);

  const perfis = state.perfis;
  renderResumo(perfis.length);

  if (!perfis.length) {
    estadoVazioBusca?.classList.remove("hidden");
    return;
  }

  estadoVazioBusca?.classList.add("hidden");

  for (const perfil of perfis) {
    const amizade = await getAmizade(state.user.uid, perfil.id);

    const card = createElement("li", { className: "empresa-candidatura-card" });
    const foto = createElement("img", { className: "empresa-candidatura-avatar" });
    foto.src = perfil.fotoURL || perfil.logoURL || "../assets/fotos/larva.jpeg";
    foto.alt = perfil.nome || "Perfil";

    const content = createElement("div", { className: "empresa-candidatura-content" });
    content.appendChild(createElement("h3", { text: perfil.nome || "Usuário" }));
    content.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: renderTipo(perfil.tipo) }));

    const detalhe =
      perfil.tipo === "empresa"
        ? perfil.descricaoInstitucional || "Empresa sem descrição."
        : perfil.areaAtuacao || perfil.bio || "Freelancer sem descrição.";

    content.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: detalhe }));
    content.appendChild(renderAcoesPerfil(perfil, amizade));

    card.appendChild(foto);
    card.appendChild(content);
    listaPerfisBusca.appendChild(card);
  }
}

async function carregarPerfis() {
  try {
    const perfis = await buscarPerfis({
      termo: buscaPerfis?.value || "",
      tipo: filtroTipoPerfil?.value || "todos",
      excluirUserId: state.user.uid
    });

    state.perfis = perfis;
    await renderPerfis();
  } catch (error) {
    console.error(error);
    showToast("Erro ao buscar perfis", "error");
  }
}

function bindFiltros() {
  [buscaPerfis, filtroTipoPerfil].forEach((element) => {
    element?.addEventListener("input", carregarPerfis);
    element?.addEventListener("change", carregarPerfis);
  });
}

bindFiltros();

observeAuthenticatedUser(
  async (user) => {
    state.user = user;
    await carregarPerfis();
  },
  () => {
    showToast("Faça login para buscar perfis", "error");
    window.location.href = "index.html";
  }
);
