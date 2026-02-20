import { auth, db } from "./firebase.js";
import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import { STATUS } from "./candidaturaService.js";
import { clearElement, createElement, formatStatus, setButtonLoading, showToast } from "./utils.js";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  doc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const titulo = document.getElementById("titulo");
const descricao = document.getElementById("descricao");
const tipoProblema = document.getElementById("tipoProblema");
const nivelProblema = document.getElementById("nivelProblema");
const prazoProblema = document.getElementById("prazoProblema");
const remotoProblema = document.getElementById("remotoProblema");
const urgenteProblema = document.getElementById("urgenteProblema");

const msg = document.getElementById("msg");
const lista = document.getElementById("candidaturas");
const loading = document.getElementById("loadingCandidaturas");
const btnPublicar = document.getElementById("btnPublicar");
const estadoVazio = document.getElementById("estadoVazioCandidaturas");
const resumoCandidaturas = document.getElementById("resumoCandidaturas");

const buscaCandidaturas = document.getElementById("buscaCandidaturas");
const filtroStatus = document.getElementById("filtroStatus");
const ordenacaoCandidaturas = document.getElementById("ordenacaoCandidaturas");

const state = {
  user: null,
  profile: null,
  candidaturas: []
};

function getDateValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value) {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value || 0);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Data não informada";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function renderResumo(total) {
  if (!resumoCandidaturas) return;
  resumoCandidaturas.textContent = `${total} candidatura${total === 1 ? "" : "s"} recebida${
    total === 1 ? "" : "s"
  }`;
}

function renderSkeletonCandidaturas(total = 4) {
  clearElement(lista);

  for (let index = 0; index < total; index += 1) {
    const card = document.createElement("li");
    card.className = "empresa-candidatura-card empresa-skeleton";
    card.innerHTML = `
      <div class="empresa-skeleton-line empresa-skeleton-title"></div>
      <div class="empresa-skeleton-line"></div>
      <div class="empresa-skeleton-line empresa-skeleton-short"></div>
      <div class="empresa-skeleton-line empresa-skeleton-btn"></div>
    `;
    lista.appendChild(card);
  }
}

function filtrarCandidaturas(candidaturas) {
  const termoBusca = (buscaCandidaturas?.value || "").toLowerCase().trim();
  const status = filtroStatus?.value || "todos";

  return candidaturas.filter((item) => {
    const matchBusca =
      !termoBusca ||
      item.problema.titulo?.toLowerCase().includes(termoBusca) ||
      item.nomeFreelancer.toLowerCase().includes(termoBusca) ||
      item.problema.tipo?.toLowerCase().includes(termoBusca);

    const matchStatus = status === "todos" || item.candidatura.status === status;

    return matchBusca && matchStatus;
  });
}

function ordenarCandidaturas(candidaturas) {
  const ordenacao = ordenacaoCandidaturas?.value || "recentes";

  return [...candidaturas].sort((a, b) => {
    if (ordenacao === "antigos") {
      return getDateValue(a.candidatura.criadoEm) - getDateValue(b.candidatura.criadoEm);
    }

    if (ordenacao === "titulo") {
      return (a.problema.titulo || "").localeCompare(b.problema.titulo || "", "pt-BR");
    }

    return getDateValue(b.candidatura.criadoEm) - getDateValue(a.candidatura.criadoEm);
  });
}

function renderCandidaturas() {
  clearElement(lista);

  const filtradas = filtrarCandidaturas(state.candidaturas);
  const ordenadas = ordenarCandidaturas(filtradas);

  renderResumo(ordenadas.length);

  ordenadas.forEach((item) => {
    const { problema, candidatura, nomeFreelancer } = item;

    const card = createElement("li", { className: "empresa-candidatura-card" });
    card.appendChild(createElement("h3", { className: "empresa-card-title", text: problema.titulo }));
    card.appendChild(createElement("p", { className: "empresa-card-line", text: `Freelancer: ${nomeFreelancer}` }));
    card.appendChild(
      createElement("p", {
        className: "empresa-card-line",
        text: `Status: ${formatStatus(candidatura.status || STATUS.PENDENTE)}`
      })
    );

    const tags = createElement("div", { className: "empresa-tags" });
    tags.appendChild(createElement("span", { className: "empresa-tag", text: problema.tipo || "Geral" }));
    tags.appendChild(
      createElement("span", {
        className: "empresa-tag",
        text: problema.nivel === "iniciante" ? "Iniciante" : "Intermediário"
      })
    );
    if (problema.urgente) {
      tags.appendChild(createElement("span", { className: "empresa-tag", text: "Urgente" }));
    }
    card.appendChild(tags);

    const meta = createElement("div", { className: "empresa-meta" });
    meta.appendChild(createElement("span", { text: `Publicado em: ${formatDate(problema.criadoEm)}` }));
    meta.appendChild(createElement("span", { text: `Prazo: ${formatDate(problema.prazo)}` }));
    card.appendChild(meta);

    const actions = createElement("div", { className: "button-row" });

    if (candidatura.status === STATUS.ACEITO && candidatura.chatId) {
      const btnChat = createElement("button", { className: "btn-primary", text: "Abrir chat" });
      btnChat.addEventListener("click", () => {
        window.location.href = `chat.html?chatId=${candidatura.chatId}`;
      });
      actions.appendChild(btnChat);
    } else if (candidatura.status === STATUS.RECUSADO) {
      const recusada = createElement("button", {
        className: "empresa-status-btn",
        text: "Candidatura recusada"
      });
      recusada.disabled = true;
      actions.appendChild(recusada);
    } else {
      const btnAceitar = createElement("button", { className: "btn-primary", text: "Aceitar" });
      const btnRecusar = createElement("button", {
        className: "empresa-secondary-btn",
        text: "Recusar"
      });

      btnAceitar.addEventListener("click", async () => {
        try {
          setButtonLoading(btnAceitar, true, "Aceitando...");
          btnRecusar.disabled = true;
          await aceitarCandidatura(candidatura, problema.id, state.user.uid);
        } catch (error) {
          console.error(error);
          showToast("Falha ao aceitar candidatura", "error");
          setButtonLoading(btnAceitar, false);
          btnRecusar.disabled = false;
        }
      });

      btnRecusar.addEventListener("click", async () => {
        try {
          setButtonLoading(btnRecusar, true, "Recusando...");
          btnAceitar.disabled = true;
          await atualizarStatusCandidatura(candidatura.id, STATUS.RECUSADO);
          showToast("Candidatura recusada", "info");
          candidatura.status = STATUS.RECUSADO;
          renderCandidaturas();
        } catch (error) {
          console.error(error);
          showToast("Falha ao recusar candidatura", "error");
          setButtonLoading(btnRecusar, false);
          btnAceitar.disabled = false;
        }
      });

      actions.appendChild(btnAceitar);
      actions.appendChild(btnRecusar);
    }

    card.appendChild(actions);
    lista.appendChild(card);
  });

  estadoVazio?.classList.toggle("hidden", ordenadas.length > 0);
}

async function publicarProblema() {
  const user = auth.currentUser;

  if (!user) {
    showToast("Usuário não autenticado", "error");
    return;
  }

  if (!titulo.value.trim() || !descricao.value.trim()) {
    showToast("Preencha título e descrição", "error");
    return;
  }

  try {
    setButtonLoading(btnPublicar, true, "Publicando...");

    const prazo = prazoProblema.value
      ? Timestamp.fromDate(new Date(`${prazoProblema.value}T23:59:59`))
      : null;

    await addDoc(collection(db, "problemas"), {
      titulo: titulo.value.trim(),
      descricao: descricao.value.trim(),
      tipo: tipoProblema.value,
      nivel: nivelProblema.value,
      remoto: remotoProblema.checked,
      urgente: urgenteProblema.checked,
      prazo,
      empresaId: user.uid,
      empresaNome: state.profile?.nome || "Empresa parceira",
      criadoEm: serverTimestamp()
    });

    msg.textContent = "Problema publicado com sucesso.";
    titulo.value = "";
    descricao.value = "";
    prazoProblema.value = "";
    urgenteProblema.checked = false;
    remotoProblema.checked = true;

    showToast("Problema publicado", "success");
  } catch (error) {
    console.error(error);
    showToast("Falha ao publicar problema", "error");
  } finally {
    setButtonLoading(btnPublicar, false);
  }
}

async function atualizarStatusCandidatura(candidaturaId, status) {
  await updateDoc(doc(db, "candidaturas", candidaturaId), { status });
}

async function aceitarCandidatura(candidatura, problemaId, empresaId) {
  const chatRef = await addDoc(collection(db, "chats"), {
    problemaId,
    empresaId,
    freelancerId: candidatura.freelancerId,
    criadoEm: serverTimestamp()
  });

  await updateDoc(doc(db, "candidaturas", candidatura.id), {
    status: STATUS.ACEITO,
    chatId: chatRef.id
  });

  candidatura.status = STATUS.ACEITO;
  candidatura.chatId = chatRef.id;
  renderCandidaturas();
  showToast("Candidatura aceita", "success");
}

async function carregarCandidaturasEmpresa(user) {
  if (loading) loading.hidden = false;
  renderSkeletonCandidaturas();

  try {
    const [profile, problemasSnap] = await Promise.all([
      getUserProfile(user.uid),
      getDocs(query(collection(db, "problemas"), where("empresaId", "==", user.uid)))
    ]);

    state.user = user;
    state.profile = profile;

    const candidaturasList = [];

    for (const problemaDoc of problemasSnap.docs) {
      const problema = { id: problemaDoc.id, ...problemaDoc.data() };

      const candidaturasSnap = await getDocs(
        query(collection(db, "candidaturas"), where("problemaId", "==", problema.id))
      );

      for (const candidaturaDoc of candidaturasSnap.docs) {
        const candidatura = { id: candidaturaDoc.id, ...candidaturaDoc.data() };
        const perfilFreelancer = await getUserProfile(candidatura.freelancerId);
        candidaturasList.push({
          problema,
          candidatura,
          nomeFreelancer: perfilFreelancer?.nome || "Usuário desconhecido"
        });
      }
    }

    state.candidaturas = candidaturasList;
    renderCandidaturas();
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar candidaturas", "error");
  } finally {
    if (loading) loading.hidden = true;
  }
}

function bindFiltros() {
  [buscaCandidaturas, filtroStatus, ordenacaoCandidaturas].forEach((element) => {
    element?.addEventListener("input", renderCandidaturas);
    element?.addEventListener("change", renderCandidaturas);
  });
}

btnPublicar?.addEventListener("click", publicarProblema);
bindFiltros();

observeAuthenticatedUser(
  (user) => carregarCandidaturasEmpresa(user),
  () => {
    showToast("Faça login para acessar o dashboard", "error");
    window.location.href = "index.html";
  }
);
