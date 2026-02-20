import { db } from "./firebase.js";
import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import { clearElement, createElement, showToast } from "./utils.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaChats");
const loading = document.getElementById("loadingChats");
const estadoVazio = document.getElementById("estadoVazioChats");
const resumoChats = document.getElementById("resumoChats");
const buscaChats = document.getElementById("buscaChats");
const ordenacaoChats = document.getElementById("ordenacaoChats");

const state = {
  chats: []
};

function getDateValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value) {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value || 0);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Sem atividade";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function renderResumo(total) {
  if (!resumoChats) return;
  resumoChats.textContent = `${total} conversa${total === 1 ? "" : "s"} disponível${
    total === 1 ? "" : "is"
  }`;
}

function renderSkeletonChats(total = 6) {
  clearElement(lista);

  for (let index = 0; index < total; index += 1) {
    const card = document.createElement("li");
    card.className = "chats-item-card chats-skeleton";
    card.innerHTML = `
      <div class="chats-skeleton-line chats-skeleton-title"></div>
      <div class="chats-skeleton-line"></div>
      <div class="chats-skeleton-line chats-skeleton-short"></div>
      <div class="chats-skeleton-line chats-skeleton-btn"></div>
    `;
    lista.appendChild(card);
  }
}

function filtrarChats(chats) {
  const termoBusca = (buscaChats?.value || "").trim().toLowerCase();

  return chats.filter((chat) => {
    if (!termoBusca) return true;

    return (
      chat.titulo?.toLowerCase().includes(termoBusca) ||
      chat.outroNome?.toLowerCase().includes(termoBusca)
    );
  });
}

function ordenar(chats) {
  const tipo = ordenacaoChats?.value || "recentes";

  return [...chats].sort((a, b) => {
    if (tipo === "antigos") {
      return getDateValue(a.criadoEm) - getDateValue(b.criadoEm);
    }

    if (tipo === "titulo") {
      return (a.titulo || "").localeCompare(b.titulo || "", "pt-BR");
    }

    return getDateValue(b.criadoEm) - getDateValue(a.criadoEm);
  });
}

function renderChats() {
  clearElement(lista);

  const filtrados = filtrarChats(state.chats);
  const ordenados = ordenar(filtrados);

  renderResumo(ordenados.length);

  ordenados.forEach((chat) => {
    const item = createElement("li", { className: "chats-item-card" });
    item.appendChild(createElement("h3", { className: "chats-item-title", text: chat.titulo }));
    item.appendChild(createElement("p", { className: "chats-item-line", text: `Com: ${chat.outroNome}` }));
    item.appendChild(
      createElement("p", { className: "chats-item-line", text: `Iniciado em: ${formatDate(chat.criadoEm)}` })
    );

    const btnAbrir = createElement("button", { className: "btn-primary", text: "Abrir chat" });
    btnAbrir.addEventListener("click", () => {
      window.location.href = `chat.html?chatId=${chat.id}`;
    });

    item.appendChild(btnAbrir);
    lista.appendChild(item);
  });

  estadoVazio?.classList.toggle("hidden", ordenados.length > 0);
}

function bindFiltros() {
  [buscaChats, ordenacaoChats].forEach((element) => {
    element?.addEventListener("input", renderChats);
    element?.addEventListener("change", renderChats);
  });
}

async function carregarChats(user) {
  if (loading) loading.hidden = false;
  renderSkeletonChats();

  try {
    const perfil = await getUserProfile(user.uid);
    const tipo = perfil?.tipo;

    if (!tipo) {
      showToast("Perfil de usuário inválido", "error");
      return;
    }

    const campo = tipo === "empresa" ? "empresaId" : "freelancerId";
    const chatsQuery = query(collection(db, "chats"), where(campo, "==", user.uid));
    const chatsSnap = await getDocs(chatsQuery);

    const chats = [];

    for (const chatDoc of chatsSnap.docs) {
      const chat = { id: chatDoc.id, ...chatDoc.data() };

      const [problemaSnap, outroPerfil] = await Promise.all([
        getDoc(doc(db, "problemas", chat.problemaId)),
        getUserProfile(tipo === "empresa" ? chat.freelancerId : chat.empresaId)
      ]);

      chats.push({
        ...chat,
        titulo: problemaSnap.exists() ? problemaSnap.data().titulo : "Problema removido",
        outroNome: outroPerfil?.nome || "Usuário"
      });
    }

    state.chats = chats;
    renderChats();
  } catch (error) {
    console.error(error);
    showToast("Falha ao carregar chats", "error");
  } finally {
    if (loading) loading.hidden = true;
  }
}

bindFiltros();

observeAuthenticatedUser(carregarChats, () => {
  window.location.href = "index.html";
});
