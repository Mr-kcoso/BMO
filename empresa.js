import { auth, db } from "./firebase.js";
import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import { STATUS } from "./candidaturaService.js";
import { clearElement, createElement, formatStatus, setButtonLoading, showToast } from "./utils.js";
import {
  addDoc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  serverTimestamp,
  doc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const titulo = document.getElementById("titulo");
const descricao = document.getElementById("descricao");
const detalhamentoProblema = document.getElementById("detalhamentoProblema");
const tipoProblema = document.getElementById("tipoProblema");
const nivelProblema = document.getElementById("nivelProblema");
const prazoProblema = document.getElementById("prazoProblema");
const remotoProblema = document.getElementById("remotoProblema");
const urgenteProblema = document.getElementById("urgenteProblema");

const msg = document.getElementById("msg");
const lista = document.getElementById("candidaturas");
const loading = document.getElementById("loadingCandidaturas");
const btnPublicar = document.getElementById("btnPublicar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const estadoVazio = document.getElementById("estadoVazioCandidaturas");
const resumoCandidaturas = document.getElementById("resumoCandidaturas");

const listaProblemas = document.getElementById("problemasPublicados");
const loadingProblemas = document.getElementById("loadingProblemas");
const estadoVazioProblemas = document.getElementById("estadoVazioProblemas");

const buscaCandidaturas = document.getElementById("buscaCandidaturas");
const filtroStatus = document.getElementById("filtroStatus");
const ordenacaoCandidaturas = document.getElementById("ordenacaoCandidaturas");

const listaPlanosEmpresa = document.getElementById("listaPlanosEmpresa");
const planoAtualResumo = document.getElementById("planoAtualResumo");
const historicoPlanosEmpresa = document.getElementById("historicoPlanosEmpresa");

const PLANOS_EMPRESA = [
  {
    id: "simples",
    tipo: "Empresas simples",
    servicos: "Publicação limitada, suporte básico",
    preco: 0
  },
  {
    id: "pequeno_porte",
    tipo: "Empresas de pequeno porte",
    servicos: "Publicação de demandas pontuais, suporte básico",
    preco: 59
  },
  {
    id: "medio_porte",
    tipo: "Empresas de médio porte",
    servicos: "Publicação ilimitada, relatórios e suporte",
    preco: 99
  },
  {
    id: "grande_porte",
    tipo: "Empresas de grande porte",
    servicos: "Recursos premium, integração e suporte avançado",
    preco: 199
  }
];

const state = {
  user: null,
  profile: null,
  candidaturas: [],
  problemas: [],
  problemaEditandoId: null,
  planoAtualId: "simples",
  historicoPlanos: []
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

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function getPlanoById(planoId) {
  return PLANOS_EMPRESA.find((plano) => plano.id === planoId) || PLANOS_EMPRESA[0];
}

function renderHistoricoPlanos() {
  if (!historicoPlanosEmpresa) return;

  clearElement(historicoPlanosEmpresa);

  const historico = [...(state.historicoPlanos || [])].sort(
    (a, b) => getDateValue(b.alteradoEm) - getDateValue(a.alteradoEm)
  );

  if (!historico.length) {
    historicoPlanosEmpresa.appendChild(
      createElement("li", { className: "empresa-empty", text: "Nenhuma alteração de plano registrada." })
    );
    return;
  }

  historico.forEach((registro) => {
    const item = createElement("li", { className: "empresa-candidatura-card" });
    item.appendChild(createElement("h4", { className: "empresa-card-title", text: registro.tipo || "Plano" }));
    item.appendChild(createElement("p", { className: "empresa-card-line", text: `Preço: ${formatCurrency(registro.preco)}` }));
    item.appendChild(
      createElement("p", {
        className: "empresa-card-line",
        text: `Alterado em: ${formatDate(registro.alteradoEm)}`
      })
    );
    historicoPlanosEmpresa.appendChild(item);
  });
}

async function selecionarPlano(plano, botao) {
  if (!state.user) return;

  try {
    setButtonLoading(botao, true, "Salvando...");

    const userRef = doc(db, "usuarios", state.user.uid);
    const userSnap = await getDoc(userRef);
    const dados = userSnap.exists() ? userSnap.data() : {};
    const historicoAtual = Array.isArray(dados.historicoPlanos) ? dados.historicoPlanos : [];

    const novoHistorico = [
      ...historicoAtual,
      {
        id: plano.id,
        tipo: plano.tipo,
        preco: plano.preco,
        alteradoEm: new Date().toISOString()
      }
    ];

    await setDoc(
      userRef,
      {
        planoAtualId: plano.id,
        planoAtual: {
          id: plano.id,
          tipo: plano.tipo,
          servicos: plano.servicos,
          preco: plano.preco,
          atualizadoEm: serverTimestamp()
        },
        historicoPlanos: novoHistorico,
        atualizadoEm: serverTimestamp()
      },
      { merge: true }
    );

    state.planoAtualId = plano.id;
    state.historicoPlanos = novoHistorico;

    renderPlanosEmpresa();
    renderHistoricoPlanos();
    showToast("Plano atualizado com sucesso", "success");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível atualizar o plano", "error");
  } finally {
    setButtonLoading(botao, false);
  }
}

function renderPlanosEmpresa() {
  if (!listaPlanosEmpresa) return;

  clearElement(listaPlanosEmpresa);

  PLANOS_EMPRESA.forEach((plano) => {
    const ativo = plano.id === state.planoAtualId;

    const item = createElement("li", { className: `empresa-candidatura-card${ativo ? " plano-ativo" : ""}` });
    item.appendChild(createElement("h3", { className: "empresa-card-title", text: plano.tipo }));
    item.appendChild(createElement("p", { className: "empresa-card-line", text: `Serviços: ${plano.servicos}` }));
    item.appendChild(createElement("p", { className: "empresa-card-line", text: `Preço: ${formatCurrency(plano.preco)}` }));

    if (ativo) {
      item.appendChild(createElement("span", { className: "empresa-tag", text: "Plano atual" }));
    }

    const btnPlano = createElement("button", {
      className: ativo ? "empresa-status-btn" : "btn-primary",
      text: ativo ? "Plano atual" : "Assinar / Alterar plano"
    });

    if (!ativo) {
      btnPlano.addEventListener("click", () => selecionarPlano(plano, btnPlano));
    }

    item.appendChild(btnPlano);
    listaPlanosEmpresa.appendChild(item);
  });

  if (planoAtualResumo) {
    const planoAtual = getPlanoById(state.planoAtualId);
    planoAtualResumo.textContent = `Plano ativo: ${planoAtual.tipo} (${formatCurrency(planoAtual.preco)}/mês)`;
  }
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


function limparFormularioProblema() {
  titulo.value = "";
  descricao.value = "";
  if (detalhamentoProblema) detalhamentoProblema.value = "";
  prazoProblema.value = "";
  urgenteProblema.checked = false;
  remotoProblema.checked = true;
  tipoProblema.value = "software";
  nivelProblema.value = "intermediario";
}

function atualizarEstadoEdicao() {
  const emEdicao = Boolean(state.problemaEditandoId);
  btnPublicar.textContent = emEdicao ? "Salvar alterações" : "Publicar problema";
  btnCancelarEdicao.hidden = !emEdicao;
}

function iniciarEdicaoProblema(problema) {
  state.problemaEditandoId = problema.id;
  titulo.value = problema.titulo || "";
  descricao.value = problema.descricao || "";
  if (detalhamentoProblema) detalhamentoProblema.value = problema.detalhamento || "";
  tipoProblema.value = problema.tipo || "software";
  nivelProblema.value = problema.nivel || "intermediario";
  prazoProblema.value = problema.prazo?.toDate
    ? problema.prazo.toDate().toISOString().slice(0, 10)
    : "";
  remotoProblema.checked = Boolean(problema.remoto);
  urgenteProblema.checked = Boolean(problema.urgente);
  atualizarEstadoEdicao();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelarEdicaoProblema() {
  state.problemaEditandoId = null;
  limparFormularioProblema();
  atualizarEstadoEdicao();
}

function renderProblemasPublicados() {
  clearElement(listaProblemas);

  state.problemas.forEach((problema) => {
    const card = createElement("li", { className: "empresa-candidatura-card" });
    card.appendChild(createElement("h3", { className: "empresa-card-title", text: problema.titulo || "Sem título" }));
    card.appendChild(createElement("p", { className: "empresa-card-line", text: problema.descricao || "Sem descrição" }));

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
    const btnEditar = createElement("button", { className: "empresa-secondary-btn", text: "Editar problema" });

    if (problema.possuiServicoAceito) {
      card.appendChild(
        createElement("p", {
          className: "empresa-card-line",
          text: "Edição bloqueada: serviço já aceito para este problema."
        })
      );
      btnEditar.disabled = true;
      btnEditar.title = "Edição bloqueada após aceitar um serviço para este problema";
    } else {
      btnEditar.addEventListener("click", () => iniciarEdicaoProblema(problema));
    }

    actions.appendChild(btnEditar);
    card.appendChild(actions);
    listaProblemas.appendChild(card);
  });

  estadoVazioProblemas?.classList.toggle("hidden", state.problemas.length > 0);
}

function renderCandidaturas() {
  clearElement(lista);

  const filtradas = filtrarCandidaturas(state.candidaturas);
  const ordenadas = ordenarCandidaturas(filtradas);

  renderResumo(ordenadas.length);

  ordenadas.forEach((item) => {
    const { problema, candidatura, nomeFreelancer, freelancerId } = item;

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

    const btnPerfilFreelancer = createElement("button", {
      className: "empresa-secondary-btn",
      text: "Ver perfil"
    });
    btnPerfilFreelancer.addEventListener("click", () => {
      window.location.href = `perfil-publico.html?userId=${freelancerId}`;
    });
    actions.appendChild(btnPerfilFreelancer);

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
    setButtonLoading(btnPublicar, true, state.problemaEditandoId ? "Salvando..." : "Publicando...");

    const prazo = prazoProblema.value
      ? Timestamp.fromDate(new Date(`${prazoProblema.value}T23:59:59`))
      : null;

    const dadosProblema = {
      titulo: titulo.value.trim(),
      descricao: descricao.value.trim(),
      detalhamento: detalhamentoProblema?.value?.trim() || "",
      tipo: tipoProblema.value,
      nivel: nivelProblema.value,
      remoto: remotoProblema.checked,
      urgente: urgenteProblema.checked,
      prazo
    };

    if (state.problemaEditandoId) {
      await updateDoc(doc(db, "problemas", state.problemaEditandoId), dadosProblema);
      const indexProblema = state.problemas.findIndex((item) => item.id === state.problemaEditandoId);
      if (indexProblema >= 0) {
        state.problemas[indexProblema] = { ...state.problemas[indexProblema], ...dadosProblema };
      }
      state.candidaturas = state.candidaturas.map((item) =>
        item.problema.id === state.problemaEditandoId
          ? { ...item, problema: { ...item.problema, ...dadosProblema } }
          : item
      );
      msg.textContent = "Problema atualizado com sucesso.";
      showToast("Problema atualizado", "success");
      cancelarEdicaoProblema();
      renderProblemasPublicados();
      renderCandidaturas();
      return;
    }

    const problemaRef = await addDoc(collection(db, "problemas"), {
      ...dadosProblema,
      empresaId: user.uid,
      empresaNome: state.profile?.nome || "Empresa parceira",
      criadoEm: serverTimestamp()
    });

    state.problemas.unshift({
      id: problemaRef.id,
      ...dadosProblema,
      empresaId: user.uid,
      empresaNome: state.profile?.nome || "Empresa parceira",
      criadoEm: new Date(),
      possuiServicoAceito: false
    });

    msg.textContent = "Problema publicado com sucesso.";
    limparFormularioProblema();

    renderProblemasPublicados();
    showToast("Problema publicado", "success");
  } catch (error) {
    console.error(error);
    showToast(state.problemaEditandoId ? "Falha ao atualizar problema" : "Falha ao publicar problema", "error");
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

  const problemaIndex = state.problemas.findIndex((item) => item.id === problemaId);
  if (problemaIndex >= 0) {
    state.problemas[problemaIndex].possuiServicoAceito = true;
  }

  renderProblemasPublicados();
  renderCandidaturas();
  showToast("Candidatura aceita", "success");
}

async function carregarCandidaturasEmpresa(user) {
  if (loading) loading.hidden = false;
  if (loadingProblemas) loadingProblemas.hidden = false;
  renderSkeletonCandidaturas();

  try {
    const [profile, problemasSnap] = await Promise.all([
      getUserProfile(user.uid),
      getDocs(query(collection(db, "problemas"), where("empresaId", "==", user.uid)))
    ]);

    state.user = user;
    state.profile = profile;
    state.planoAtualId = profile?.planoAtualId || "simples";
    state.historicoPlanos = Array.isArray(profile?.historicoPlanos) ? profile.historicoPlanos : [];
    if (!state.historicoPlanos.length) {
      const planoInicial = getPlanoById(state.planoAtualId);
      state.historicoPlanos = [
        {
          id: planoInicial.id,
          tipo: planoInicial.tipo,
          preco: planoInicial.preco,
          alteradoEm: profile?.criadoEm || new Date().toISOString()
        }
      ];
    }

    renderPlanosEmpresa();
    renderHistoricoPlanos();

    const candidaturasList = [];
    const problemasList = [];

    for (const problemaDoc of problemasSnap.docs) {
      const problema = { id: problemaDoc.id, ...problemaDoc.data() };

      const candidaturasSnap = await getDocs(
        query(collection(db, "candidaturas"), where("problemaId", "==", problema.id))
      );

      let possuiServicoAceito = false;

      for (const candidaturaDoc of candidaturasSnap.docs) {
        const candidatura = { id: candidaturaDoc.id, ...candidaturaDoc.data() };
        if (candidatura.status === STATUS.ACEITO) {
          possuiServicoAceito = true;
        }
        const perfilFreelancer = await getUserProfile(candidatura.freelancerId);
        candidaturasList.push({
          problema,
          candidatura,
          nomeFreelancer: perfilFreelancer?.nome || "Usuário desconhecido",
          freelancerId: candidatura.freelancerId
        });
      }

      problemasList.push({ ...problema, possuiServicoAceito });
    }

    state.candidaturas = candidaturasList;
    state.problemas = problemasList.sort((a, b) => getDateValue(b.criadoEm) - getDateValue(a.criadoEm));
    renderProblemasPublicados();
    renderCandidaturas();
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar candidaturas", "error");
  } finally {
    if (loading) loading.hidden = true;
    if (loadingProblemas) loadingProblemas.hidden = true;
  }
}

function bindFiltros() {
  [buscaCandidaturas, filtroStatus, ordenacaoCandidaturas].forEach((element) => {
    element?.addEventListener("input", renderCandidaturas);
    element?.addEventListener("change", renderCandidaturas);
  });
}

btnPublicar?.addEventListener("click", publicarProblema);
btnCancelarEdicao?.addEventListener("click", cancelarEdicaoProblema);
bindFiltros();
atualizarEstadoEdicao();

observeAuthenticatedUser(
  (user) => carregarCandidaturasEmpresa(user),
  () => {
    showToast("Faça login para acessar o dashboard", "error");
    window.location.href = "index.html";
  }
);
