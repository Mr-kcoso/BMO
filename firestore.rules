import { db } from "../services/firebase.js";
import { observeAuthenticatedUser, getUserProfile } from "../services/authService.js";
import { clearElement, createElement, showToast } from "../scripts/utils.js";
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

function renderResumo(total, totalComNovas = 0) {
  if (!resumoChats) return;
  resumoChats.textContent = `${total} conversa${total === 1 ? "" : "s"} disponível${total === 1 ? "" : "is"
    }${totalComNovas ? ` • ${totalComNovas} com novas mensagens` : ""}`;
}

function renderSkeletonChats(total = 6) {
  clearElement(lista);

  for (let index = 0; index < total; index += 1) {
    const card = document.createElement("li");
    card.className = "chats-item-card chats-skeleton";
    card.innerHTML = `
      <div class="chat-card-header">
        <div class="chat-avatar-badge chats-skeleton-line" style="background: none;"></div>
        <div class="chat-info-block" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="chats-skeleton-line chats-skeleton-title"></div>
          <div class="chats-skeleton-line chats-skeleton-short" style="width: 40%;"></div>
        </div>
      </div>
      <div class="chat-card-body" style="margin-top: 8px;">
        <div class="chats-skeleton-line" style="width: 80px; height: 18px; border-radius: 999px;"></div>
        <div class="chats-skeleton-line" style="width: 100px; height: 14px;"></div>
      </div>
      <div class="chat-card-actions" style="margin-top: auto;">
        <div class="chats-skeleton-line chats-skeleton-btn" style="flex: 1;"></div>
        <div class="chats-skeleton-line chats-skeleton-btn" style="flex: 1;"></div>
      </div>
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
      chat.outroNome?.toLowerCase().includes(termoBusca) ||
      chat.tipoLabel?.toLowerCase().includes(termoBusca)
    );
  });
}

function ordenar(chats) {
  const tipo = ordenacaoChats?.value || "recentes";

  return [...chats].sort((a, b) => {
    if (tipo === "antigos") {
      return getDateValue(a.ultimaMensagemEm || a.criadoEm) - getDateValue(b.ultimaMensagemEm || b.criadoEm);
    }

    if (tipo === "titulo") {
      return (a.titulo || "").localeCompare(b.titulo || "", "pt-BR");
    }

    return getDateValue(b.ultimaMensagemEm || b.criadoEm) - getDateValue(a.ultimaMensagemEm || a.criadoEm);
  });
}

function renderChats() {
  clearElement(lista);

  const filtrados = filtrarChats(state.chats);
  const ordenados = ordenar(filtrados);
  const totalComNovas = ordenados.filter((chat) => chat.temNovasMensagens).length;

  renderResumo(ordenados.length, totalComNovas);

  ordenados.forEach((chat) => {
    const item = createElement("li", { className: "chats-item-card" });


    const initials = (chat.outroNome || chat.titulo || "?").substring(0, 2).toUpperCase();


    item.innerHTML = `
      <div class="chat-card-header">
        <div class="chat-avatar-badge">${initials}</div>
        <div class="chat-info-block">
          <h3 class="chats-item-title">${chat.titulo}</h3>
          <p class="chats-item-contact">${chat.outroNome}</p>
        </div>
      </div>
      <div class="chat-card-body">
        <span class="chat-tag ${chat.tipoChat}">${chat.tipoLabel}</span>
        <p class="chats-item-activity">
          ${formatDate(chat.ultimaMensagemEm || chat.criadoEm)}
        </p>
      </div>
    `;


    if (chat.temNovasMensagens) {
      const badgeContainer = item.querySelector(".chat-card-body");
      const unreadBadge = createElement("span", { className: "unread-badge", text: "Novas mensagens" });
      badgeContainer.appendChild(unreadBadge);
    }

    const actions = createElement("div", { className: "chat-card-actions" });

    const btnAbrir = createElement("button", { className: "btn-primary", text: "Abrir chat" });
    btnAbrir.addEventListener("click", () => {
      window.location.href = `chat.html?chatId=${chat.id}&tipo=${chat.tipoChat}`;
    });

    actions.appendChild(btnAbrir);

    if (chat.tipoChat !== "equipe") {
      const btnPerfil = createElement("button", { className: "chats-nav-btn", text: "Ver perfil" });
      btnPerfil.addEventListener("click", () => {
        window.location.href = `perfil-publico.html?userId=${chat.outroId}`;
      });
      actions.appendChild(btnPerfil);
    }

    item.appendChild(actions);
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

function getTemNovasMensagens(chat, userId) {
  const ultimoAcesso = chat?.ultimoAcessoPor?.[userId];
  const ultimaMensagemEm = chat?.ultimaMensagemEm;
  return getDateValue(ultimaMensagemEm) > getDateValue(ultimoAcesso);
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
    const chatsProjetoQuery = query(collection(db, "chats"), where(campo, "==", user.uid));
    const chatsEquipeQuery = query(collection(db, "chatsEquipe"), where("participants", "array-contains", user.uid));

    const [chatsProjetoSnap, chatsEquipeSnap] = await Promise.all([
      getDocs(chatsProjetoQuery),
      getDocs(chatsEquipeQuery)
    ]);

    const chats = [];

    for (const chatDoc of chatsProjetoSnap.docs) {
      const chat = { id: chatDoc.id, ...chatDoc.data() };

      const [problemaSnap, outroPerfil] = await Promise.all([
        getDoc(doc(db, "problemas", chat.problemaId)),
        getUserProfile(tipo === "empresa" ? chat.freelancerId : chat.empresaId)
      ]);

      chats.push({
        ...chat,
        tipoChat: "projeto",
        tipoLabel: "Chat de projeto",
        titulo: problemaSnap.exists() ? problemaSnap.data().titulo : "Problema removido",
        outroNome: outroPerfil?.nome || "Usuário",
        outroId: tipo === "empresa" ? chat.freelancerId : chat.empresaId,
        temNovasMensagens: getTemNovasMensagens(chat, user.uid)
      });
    }

    for (const chatDoc of chatsEquipeSnap.docs) {
      const chat = { id: chatDoc.id, ...chatDoc.data() };
      chats.push({
        ...chat,
        tipoChat: "equipe",
        tipoLabel: "Chat da equipe",
        titulo: chat.equipeNome || "Equipe",
        outroNome: "Membros da equipe",
        outroId: "",
        temNovasMensagens: getTemNovasMensagens(chat, user.uid)
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
