import { observeAuthenticatedUser, getUserProfile } from "../services/authService.js";
import {
  buscarMensagensRecentes,
  buscarMensagensHistoricas,
  escutarNovasMensagens,
  escutarMetadataChat,
  listarPropostas,
  enviarProposta,
  aceitarProposta,
  recusarProposta,
  salvarGithubProjeto,
  enviarMensagem,
  marcarChatComoLido,
  validarAcessoAoChat
} from "../services/chatService.js";
import { clearElement, createElement, setButtonLoading, showToast } from "../scripts/utils.js";
import { analisarUrlRepositorioGithub, carregarAtividadeRepositorioPublico } from "../services/githubPublicService.js";

const params = new URLSearchParams(window.location.search);
const chatId = params.get("chatId");
const tipoChatParam = params.get("tipo");
const tipoChat = ["amizade", "equipe"].includes(tipoChatParam) ? tipoChatParam : "projeto";

const mensagensDiv = document.getElementById("mensagens");
const texto = document.getElementById("texto");
const btnEnviar = document.getElementById("btnEnviar");
const btnVoltar = document.getElementById("btnVoltar");
const btnVerPerfil = document.getElementById("btnVerPerfil");
const chatTitulo = document.getElementById("chatTitulo");
const chatSubtitulo = document.getElementById("chatSubtitulo");
const painelProjeto = document.getElementById("painelProjeto");
const statusAcordo = document.getElementById("statusAcordo");
const propostaAtual = document.getElementById("propostaAtual");
const historicoPropostas = document.getElementById("historicoPropostas");
const formProposta = document.getElementById("formProposta");
const valorProposta = document.getElementById("valorProposta");
const prazoProposta = document.getElementById("prazoProposta");
const observacaoProposta = document.getElementById("observacaoProposta");
const btnEnviarProposta = document.getElementById("btnEnviarProposta");
const formGithub = document.getElementById("formGithub");
const githubRepositorio = document.getElementById("githubRepositorio");
const githubPullRequest = document.getElementById("githubPullRequest");
const githubLinks = document.getElementById("githubLinks");
const btnAtualizarGithub = document.getElementById("btnAtualizarGithub");
const btnSalvarGithub = document.getElementById("btnSalvarGithub");
const githubStatus = document.getElementById("githubStatus");
const githubResumo = document.getElementById("githubResumo");
const githubCommits = document.getElementById("githubCommits");
const githubPullRequestsLista = document.getElementById("githubPullRequests");
const githubIssues = document.getElementById("githubIssues");

const profileCache = new Map();
const mensagensRenderizadas = new Set();

let mensagensLocais = [];
let oldestVisibleDoc = null;
let newestVisibleDoc = null;
let unsubscribeMensagens = null;
let carregarMaisClicado = false;
let temMaisMensagens = true;
let chatAtual = null;
let usuarioAtual = null;
let chaveHistoricoPropostas = null;
let githubDashboardUrl = null;
let githubRequestSequence = 0;

function getDateValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function precarregarPerfis(mensagens) {
  const autorIdsUnicos = [...new Set(mensagens.map((m) => m.autorId))];
  const idsParaBuscar = autorIdsUnicos.filter((id) => id && !profileCache.has(id));

  if (idsParaBuscar.length > 0) {
    const perfis = await Promise.all(idsParaBuscar.map((id) => getUserProfile(id)));
    perfis.forEach((perfil, index) => {
      const id = idsParaBuscar[index];
      const nome = perfil?.nome || "Usuário";
      profileCache.set(id, nome);
    });
  }
}


function formatDate(value) {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value || 0);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Agora";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function renderGithubLinks(github) {
  if (!githubLinks) return;
  clearElement(githubLinks);
  const links = [
    [github?.repositorioUrl, "Abrir repositório", "fa-code-branch"],
    [github?.pullRequestUrl, "Abrir Pull Request", "fa-code-pull-request"]
  ].filter(([url]) => url);

  if (!links.length) return;

  links.forEach(([url, label, icon]) => {
    const link = createElement("a", { className: "chat-github-link", text: label });
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const iconElement = createElement("i", { className: `fa-solid ${icon}` });
    iconElement.setAttribute("aria-hidden", "true");
    link.prepend(iconElement);
    githubLinks.appendChild(link);
  });
}

function setGithubStatus(message, status = "") {
  if (!githubStatus) return;
  githubStatus.textContent = message;
  githubStatus.className = `chat-github-status${status ? ` is-${status}` : ""}`;
}

function criarLinkGithub(url, label, className = "chat-github-item-link") {
  const link = document.createElement("a");
  link.className = className;
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

function formatGithubDate(value) {
  if (!value) return "Data não disponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não disponível";
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderGithubResumo(data) {
  if (!githubResumo) return;
  clearElement(githubResumo);

  const repo = data.repositorio;
  const top = document.createElement("div");
  top.className = "chat-github-summary-top";
  const title = criarLinkGithub(repo.html_url, repo.full_name, "chat-github-repo-name");
  title.setAttribute("aria-label", `Abrir repositório ${repo.full_name} no GitHub`);
  top.appendChild(title);
  top.appendChild(createElement("span", { className: "chat-github-visibility", text: "Público" }));
  githubResumo.appendChild(top);

  githubResumo.appendChild(createElement("p", {
    className: "chat-github-description",
    text: repo.description || "Este repositório não possui descrição."
  }));

  const metrics = document.createElement("div");
  metrics.className = "chat-github-metrics";
  const metricValues = [
    ["Linguagem", repo.language || "Não informada"],
    ["Estrelas", Number(repo.stargazers_count || 0).toLocaleString("pt-BR")],
    ["Issues + PRs abertas", Number(repo.open_issues_count || 0).toLocaleString("pt-BR")],
    ["Branch padrão", repo.default_branch || "Não informada"]
  ];
  for (const [label, value] of metricValues) {
    const metric = document.createElement("div");
    metric.className = "chat-github-metric";
    metric.appendChild(createElement("span", { text: label }));
    metric.appendChild(createElement("strong", { text: String(value) }));
    metrics.appendChild(metric);
  }
  githubResumo.appendChild(metrics);
  githubResumo.appendChild(createElement("p", {
    className: "chat-github-updated",
    text: `Última atualização no GitHub: ${formatGithubDate(repo.updated_at)}`
  }));
}

function renderGithubActivityList(container, items, tipo) {
  if (!container) return;
  clearElement(container);

  if (!items.length) {
    const mensagens = {
      commit: "Nenhum commit encontrado.",
      pull: "Nenhum pull request encontrado.",
      issue: "Nenhuma issue aberta encontrada."
    };
    container.appendChild(createElement("p", { className: "chat-github-empty", text: mensagens[tipo] }));
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "chat-github-activity-item";

    let title = "";
    let meta = "";
    let badge = "";

    if (tipo === "commit") {
      title = String(item.commit?.message || "Commit sem mensagem").split(/\r?\n/)[0];
      meta = `${item.commit?.author?.name || item.author?.login || "Autor desconhecido"} · ${formatGithubDate(item.commit?.author?.date || item.commit?.committer?.date)}`;
      badge = (item.sha || "").slice(0, 7);
    } else if (tipo === "pull") {
      title = item.title || "Pull request sem título";
      const estado = item.merged_at ? "Mesclado" : item.state === "open" ? "Aberto" : "Fechado";
      meta = `#${item.number} · ${estado} · atualizado em ${formatGithubDate(item.updated_at)}`;
      badge = item.draft ? "Rascunho" : estado;
    } else {
      title = item.title || "Issue sem título";
      meta = `#${item.number} · aberta · atualizada em ${formatGithubDate(item.updated_at)}`;
      badge = "Aberta";
    }

    const top = document.createElement("div");
    top.className = "chat-github-activity-top";
    top.appendChild(criarLinkGithub(item.html_url, title));
    if (badge) top.appendChild(createElement("span", { className: `chat-github-state${tipo === "pull" && item.merged_at ? " is-merged" : ""}`, text: badge }));
    card.appendChild(top);
    card.appendChild(createElement("p", { className: "chat-github-activity-meta", text: meta }));
    container.appendChild(card);
  }
}

function limparPainelGithub(mensagem = "Conecte um repositório público para carregar a atividade.") {
  if (githubResumo) clearElement(githubResumo);
  renderGithubActivityList(githubCommits, [], "commit");
  renderGithubActivityList(githubPullRequestsLista, [], "pull");
  renderGithubActivityList(githubIssues, [], "issue");
  setGithubStatus(mensagem);
  githubDashboardUrl = null;
}

async function carregarPainelGithub(repoUrl, { forcar = false } = {}) {
  const url = String(repoUrl || "").trim();
  if (!url) {
    limparPainelGithub();
    return;
  }

  if (!forcar && githubDashboardUrl === url) return;

  // Evita que respostas antigas sobrescrevam a solicitação mais recente.
  const requestId = ++githubRequestSequence;
  githubDashboardUrl = url;
  try {
    analisarUrlRepositorioGithub(url);
  } catch (error) {
    setGithubStatus(error.message || "URL de repositório inválida.", "error");
    throw error;
  }

  if (btnAtualizarGithub) btnAtualizarGithub.disabled = true;
  setGithubStatus("Carregando dados públicos do GitHub…", "loading");

  try {
    const dados = await carregarAtividadeRepositorioPublico(url);
    if (requestId !== githubRequestSequence) return;
    renderGithubResumo(dados);
    renderGithubActivityList(githubCommits, dados.commits, "commit");
    renderGithubActivityList(githubPullRequestsLista, dados.pullRequests, "pull");
    renderGithubActivityList(githubIssues, dados.issues, "issue");
    setGithubStatus(`Dados carregados de ${dados.repositorio.full_name}. Consulta realizada em ${formatGithubDate(new Date())}.`, "success");
  } catch (error) {
    if (requestId !== githubRequestSequence) return;
    console.error("Erro ao carregar atividade do GitHub:", error);
    if (githubResumo) clearElement(githubResumo);
    renderGithubActivityList(githubCommits, [], "commit");
    renderGithubActivityList(githubPullRequestsLista, [], "pull");
    renderGithubActivityList(githubIssues, [], "issue");
    setGithubStatus(error.message || "Não foi possível carregar a atividade do GitHub.", "error");
  } finally {
    if (requestId === githubRequestSequence && btnAtualizarGithub) btnAtualizarGithub.disabled = false;
  }
}

function resetFormularioProposta({ habilitado, textoBotao }) {
  [valorProposta, prazoProposta, observacaoProposta].forEach((campo) => {
    if (campo) campo.disabled = !habilitado;
  });

  if (btnEnviarProposta) {
    btnEnviarProposta.disabled = !habilitado;
    btnEnviarProposta.textContent = textoBotao;
    delete btnEnviarProposta.dataset.originalText;
  }
}

function getStatusPropostaLabel(status, proposta, currentUserId, propostaAtualId) {
  if (status === "pendente" && proposta.id === propostaAtualId) {
    return proposta.autorId === currentUserId ? "Aguardando resposta" : "Aguardando sua resposta";
  }

  const labels = {
    aceita: "Aceita",
    recusada: "Recusada",
    substituida: "Substituída",
    pendente: "Pendente"
  };

  return labels[status] || "Pendente";
}

function createStatusElement(label, status, isCurrent = false) {
  return createElement("span", {
    className: `chat-offer-status ${isCurrent ? "is-current" : ""} status-${status || "pendente"}`.trim(),
    text: label
  });
}

function formatProposalDate(value) {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value || 0);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Data não disponível";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function renderHistoricoPropostas(chatMetadata, currentUserId) {
  if (!historicoPropostas) return;

  const propostaAtualId = chatMetadata?.propostaAtual?.id || null;
  const chaveAtual = `${propostaAtualId || ""}|${chatMetadata?.acordo?.status || ""}`;

  if (chaveHistoricoPropostas === chaveAtual) return;
  chaveHistoricoPropostas = chaveAtual;

  clearElement(historicoPropostas);

  try {
    const propostas = await listarPropostas(chatId);

    if (!propostas.length) {
      historicoPropostas.appendChild(
        createElement("p", {
          className: "chat-panel-help",
          text: "Nenhuma proposta anterior. A primeira proposta iniciará a negociação."
        })
      );
      return;
    }

    propostas.reverse();

    for (const proposta of propostas) {
      const item = createElement("article", {
        className: `chat-offer-history-item${proposta.id === propostaAtualId ? " is-current" : ""}`
      });

      const top = createElement("div", { className: "chat-offer-history-top" });
      const autorNome = await getProfileName(proposta.autorId);
      const autorTexto = proposta.autorId === currentUserId ? "Você" : autorNome;

      top.appendChild(createElement("strong", {
        text: `${autorTexto} · ${formatCurrency(proposta.valor)}`
      }));

      top.appendChild(
        createStatusElement(
          getStatusPropostaLabel(proposta.status, proposta, currentUserId, propostaAtualId),
          proposta.status,
          proposta.id === propostaAtualId
        )
      );

      item.appendChild(top);

      const detalhes = [];
      if (proposta.prazo) detalhes.push(`Prazo: ${proposta.prazo}`);
      detalhes.push(formatProposalDate(proposta.criadoEm));

      item.appendChild(createElement("p", {
        className: "chat-offer-history-meta",
        text: detalhes.join(" · ")
      }));

      if (proposta.observacao) {
        item.appendChild(createElement("p", {
          className: "chat-offer-history-note",
          text: proposta.observacao
        }));
      }

      historicoPropostas.appendChild(item);
    }
  } catch (error) {
    console.error("Erro ao carregar histórico de propostas:", error);
    historicoPropostas.appendChild(
      createElement("p", {
        className: "chat-panel-help",
        text: "Não foi possível carregar o histórico de propostas."
      })
    );
  }
}

async function renderAcordo(chatMetadata, currentUserId) {
  if (!painelProjeto || tipoChat !== "projeto") return;
  chatAtual = chatMetadata;
  renderGithubLinks(chatMetadata?.github);
  const repositorioSalvo = chatMetadata?.github?.repositorioUrl || "";
  if (repositorioSalvo && repositorioSalvo !== githubDashboardUrl) {
    carregarPainelGithub(repositorioSalvo).catch((error) => console.error(error));
  } else if (!repositorioSalvo && githubDashboardUrl) {
    limparPainelGithub();
  }
  if (githubRepositorio && document.activeElement !== githubRepositorio) {
    githubRepositorio.value = chatMetadata?.github?.repositorioUrl || "";
  }
  if (githubPullRequest && document.activeElement !== githubPullRequest) {
    githubPullRequest.value = chatMetadata?.github?.pullRequestUrl || "";
  }

  if (chatMetadata?.acordo?.status === "aceito") {
    statusAcordo.textContent = "Acordo aceito";
    statusAcordo.className = "chat-status-pill is-accepted";
    clearElement(propostaAtual);
    propostaAtual.appendChild(createElement("strong", { text: `Valor final: ${formatCurrency(chatMetadata.acordo.valorFinal)}` }));
    propostaAtual.appendChild(createElement("p", { text: chatMetadata.acordo.prazoFinal ? `Prazo: ${chatMetadata.acordo.prazoFinal}` : "Prazo não definido" }));
    formProposta.hidden = true;
    await renderHistoricoPropostas(chatMetadata, currentUserId);
    return;
  }

  statusAcordo.textContent = "Em negociação";
  statusAcordo.className = "chat-status-pill";
  formProposta.hidden = false;
  clearElement(propostaAtual);

  const proposta = chatMetadata?.propostaAtual;
  if (!proposta) {
    resetFormularioProposta({ habilitado: true, textoBotao: "Enviar proposta" });

    if (chatMetadata?.valorReferencia) {
      propostaAtual.appendChild(createElement("strong", { text: `Valor publicado: ${formatCurrency(chatMetadata.valorReferencia)}` }));
      propostaAtual.appendChild(createElement("p", { text: "Este valor é apenas uma referência. Envie uma proposta para iniciar a negociação." }));
    } else {
      propostaAtual.appendChild(createElement("p", { text: "Nenhuma proposta enviada. Use o formulário para iniciar a negociação." }));
    }

    await renderHistoricoPropostas(chatMetadata, currentUserId);
    return;
  }

  const autorNome = await getProfileName(proposta.autorId);
  const souAutor = proposta.autorId === currentUserId;
  const estadoTexto = souAutor ? "Aguardando resposta da outra pessoa." : "Sua resposta é necessária.";

  propostaAtual.appendChild(createElement("div", { className: "chat-offer-current-top" }));
  const topoAtual = propostaAtual.lastElementChild;
  topoAtual.appendChild(createElement("strong", {
    text: souAutor ? `Você propôs ${formatCurrency(proposta.valor)}` : `${autorNome} propôs ${formatCurrency(proposta.valor)}`
  }));
  topoAtual.appendChild(createStatusElement(
    souAutor ? "Aguardando resposta" : "Aguardando sua resposta",
    proposta.status,
    true
  ));

  propostaAtual.appendChild(createElement("p", { text: proposta.prazo ? `Prazo: ${proposta.prazo}` : "Prazo não definido" }));
  if (proposta.observacao) propostaAtual.appendChild(createElement("p", { className: "chat-offer-note", text: proposta.observacao }));
  propostaAtual.appendChild(createElement("p", { className: "chat-offer-waiting", text: estadoTexto }));

  if (souAutor) {
    resetFormularioProposta({ habilitado: false, textoBotao: "Aguardando resposta" });
  } else {
    resetFormularioProposta({ habilitado: true, textoBotao: "Fazer contraproposta" });

    const actions = createElement("div", { className: "chat-offer-actions" });

    const btnAceitar = createElement("button", { className: "btn-primary chat-accept-offer", text: "Aceitar proposta" });
    btnAceitar.type = "button";
    btnAceitar.addEventListener("click", async () => {
      try {
        setButtonLoading(btnAceitar, true, "Confirmando...");
        await aceitarProposta({ chatId, propostaId: proposta.id, aceitoPor: currentUserId });
        showToast("Acordo formalizado", "success");
      } catch (error) {
        console.error(error);
        showToast(error.message || "Não foi possível aceitar a proposta", "error");
        setButtonLoading(btnAceitar, false);
      }
    });

    const btnRecusar = createElement("button", { className: "chat-offer-secondary", text: "Recusar proposta" });
    btnRecusar.type = "button";
    btnRecusar.addEventListener("click", async () => {
      try {
        setButtonLoading(btnRecusar, true, "Recusando...");
        await recusarProposta({ chatId, propostaId: proposta.id, recusadoPor: currentUserId });
        showToast("Proposta recusada", "success");
      } catch (error) {
        console.error(error);
        showToast(error.message || "Não foi possível recusar a proposta", "error");
        setButtonLoading(btnRecusar, false);
      }
    });

    actions.appendChild(btnAceitar);
    actions.appendChild(btnRecusar);
    propostaAtual.appendChild(actions);
  }

  await renderHistoricoPropostas(chatMetadata, currentUserId);
}

async function getProfileName(userId) {
  if (!userId) return "Usuário";
  if (profileCache.has(userId)) return profileCache.get(userId);

  const profile = await getUserProfile(userId);
  const nome = profile?.nome || "Usuário";
  profileCache.set(userId, nome);
  return nome;
}

if (btnVoltar) {
  btnVoltar.addEventListener("click", () => {
    window.history.back();
  });
}

function renderMensagens(mensagens, currentUserId) {
  const oldScrollHeight = mensagensDiv.scrollHeight;

  clearElement(mensagensDiv);

  if (temMaisMensagens && oldestVisibleDoc) {
    const btnCarregarMais = createElement("button", {
      className: "chats-nav-btn",
      id: "btnCarregarMais",
      text: "Carregar mensagens anteriores"
    });
    btnCarregarMais.style.display = "block";
    btnCarregarMais.style.margin = "12px auto";
    btnCarregarMais.addEventListener("click", () => {
      carregarMensagensAnteriores(currentUserId);
    });
    mensagensDiv.appendChild(btnCarregarMais);
  }

  for (const mensagem of mensagens) {
    const nomeAutor = profileCache.get(mensagem.autorId) || "Usuário";
    const isNovaMensagem = mensagem.id && !mensagensRenderizadas.has(mensagem.id);
    const item = createElement("div", {
      className:
        mensagem.autorId === currentUserId
          ? `mensagem mensagem-propria${isNovaMensagem ? " chat-bubble-enter" : ""}`
          : `mensagem mensagem-outro${isNovaMensagem ? " chat-bubble-enter" : ""}`
    });

    const bubble = createElement("div", { className: "chat-bubble" });

    const header = createElement("div", { className: "chat-bubble-header" });
    header.appendChild(createElement("strong", { text: nomeAutor }));
    header.appendChild(createElement("span", { className: "chat-time", text: formatDate(mensagem.criadoEm) }));

    const conteudo = createElement("p", { className: "chat-text", text: mensagem.texto || "" });

    bubble.appendChild(header);
    bubble.appendChild(conteudo);
    item.appendChild(bubble);
    mensagensDiv.appendChild(item);

    if (mensagem.id) {
      mensagensRenderizadas.add(mensagem.id);
    }
  }

  if (carregarMaisClicado) {
    mensagensDiv.scrollTop = mensagensDiv.scrollHeight - oldScrollHeight;
    carregarMaisClicado = false;
  } else {
    mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
  }
}

async function inicializarMensagens(chatId, currentUserId) {
  try {
    const snapRecentes = await buscarMensagensRecentes(chatId, 30, tipoChat);
    const docs = snapRecentes.docs;

    if (docs.length > 0) {
      newestVisibleDoc = docs[0];
      oldestVisibleDoc = docs[docs.length - 1];
      temMaisMensagens = docs.length === 30;

      const mensagensObj = docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
      mensagensLocais = mensagensObj;

      await precarregarPerfis(mensagensLocais);
      renderMensagens(mensagensLocais, currentUserId);
    } else {
      oldestVisibleDoc = null;
      newestVisibleDoc = null;
      temMaisMensagens = false;
      mensagensLocais = [];
      renderMensagens([], currentUserId);
    }

    const cursor = newestVisibleDoc || null;
    if (unsubscribeMensagens) {
      unsubscribeMensagens();
    }

    unsubscribeMensagens = escutarNovasMensagens(
      chatId,
      cursor,
      async (novasMensagens, novosDocs) => {
        if (novasMensagens.length === 0) return;

        const idsExistentes = new Set(mensagensLocais.map((m) => m.id));
        const mensagensFiltradas = novasMensagens.filter((m) => !idsExistentes.has(m.id));

        if (mensagensFiltradas.length > 0) {
          mensagensLocais = [...mensagensLocais, ...mensagensFiltradas];
          if (novosDocs && novosDocs.length > 0) {
            newestVisibleDoc = novosDocs[novosDocs.length - 1];
          }
          await precarregarPerfis(mensagensLocais);
          renderMensagens(mensagensLocais, currentUserId);
        }
      },
      tipoChat
    );
  } catch (error) {
    console.error("Erro ao inicializar mensagens:", error);
    showToast("Erro ao carregar mensagens", "error");
  }
}

async function carregarMensagensAnteriores(currentUserId) {
  if (!oldestVisibleDoc) return;

  try {
    carregarMaisClicado = true;
    const snapHistorico = await buscarMensagensHistoricas(chatId, oldestVisibleDoc, 30, tipoChat);
    const docs = snapHistorico.docs;

    if (docs.length > 0) {
      oldestVisibleDoc = docs[docs.length - 1];
      temMaisMensagens = docs.length === 30;

      const mensagensHistoricas = docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
      mensagensLocais = [...mensagensHistoricas, ...mensagensLocais];

      await precarregarPerfis(mensagensLocais);
      renderMensagens(mensagensLocais, currentUserId);
    } else {
      temMaisMensagens = false;
      carregarMaisClicado = false;
      const btn = document.getElementById("btnCarregarMais");
      if (btn) btn.remove();
    }
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    carregarMaisClicado = false;
  }
}

async function iniciarChat(user) {
  if (!chatId) {
    showToast("Acesso inválido ao chat", "error");
    window.location.href = "../../index.html";
    return;
  }

  try {
    const acesso = await validarAcessoAoChat(chatId, user.uid, tipoChat);

    if (!acesso.autorizado) {
      showToast(acesso.motivo, "error");
      window.location.href = "../../index.html";
      return;
    }

    usuarioAtual = user;
    if (painelProjeto) painelProjeto.hidden = tipoChat !== "projeto";

    let outroId = null;

    if (tipoChat === "amizade") {
      outroId = (acesso.chat.participants || []).find((participantId) => participantId !== user.uid);
    } else if (tipoChat === "projeto") {
      outroId = acesso.chat.empresaId === user.uid ? acesso.chat.freelancerId : acesso.chat.empresaId;
    }

    if (tipoChat === "equipe") {
      if (chatTitulo) chatTitulo.textContent = acesso.chat.equipeNome || "Chat da equipe";
      if (chatSubtitulo) chatSubtitulo.textContent = "Conversa em grupo da equipe";
      if (btnVerPerfil) btnVerPerfil.hidden = true;
    } else {
      const outroNome = await getProfileName(outroId);

      if (chatTitulo) chatTitulo.textContent = outroNome;
      if (chatSubtitulo) {
        chatSubtitulo.textContent = tipoChat === "amizade" ? "Conversa entre amigos" : "Conversa em tempo real";
      }
      if (btnVerPerfil) {
        btnVerPerfil.hidden = false;
        btnVerPerfil.addEventListener("click", () => {
          window.location.href = `perfil-publico.html?userId=${outroId}`;
        });
      }
    }

    await inicializarMensagens(chatId, user.uid);

    escutarMetadataChat(chatId, (chatMetadata) => {
      if (!chatMetadata) return;

      renderAcordo(chatMetadata, user.uid);

      const tUltima = getDateValue(chatMetadata.ultimaMensagemEm);
      const tAcesso = getDateValue(chatMetadata?.ultimoAcessoPor?.[user.uid]);

      if (tUltima > tAcesso) {
        marcarChatComoLido(chatId, user.uid, tipoChat);
      }
    }, tipoChat);

    formProposta?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const valor = Number(valorProposta.value);
      if (!Number.isFinite(valor) || valor <= 0) {
        showToast("Informe um valor válido", "error");
        return;
      }

      try {
        setButtonLoading(btnEnviarProposta, true, "Enviando...");
        await enviarProposta({
          chatId,
          autorId: user.uid,
          valor,
          prazo: prazoProposta.value,
          observacao: observacaoProposta.value
        });
        valorProposta.value = "";
        prazoProposta.value = "";
        observacaoProposta.value = "";
        showToast("Proposta enviada", "success");
      } catch (error) {
        console.error(error);
        showToast("Não foi possível enviar a proposta", "error");
      } finally {
        setButtonLoading(btnEnviarProposta, false);
      }
    });

    formGithub?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const repositorioUrl = githubRepositorio.value.trim();
      const pullRequestUrl = githubPullRequest.value.trim();
      if (!repositorioUrl && !pullRequestUrl) {
        showToast("Informe o link do repositório ou de um Pull Request", "error");
        return;
      }

      try {
        if (repositorioUrl) analisarUrlRepositorioGithub(repositorioUrl);
        setButtonLoading(btnSalvarGithub, true, "Salvando...");
        await salvarGithubProjeto({ chatId, repositorioUrl, pullRequestUrl, autorId: user.uid });
        showToast("Links do GitHub salvos", "success");
        if (repositorioUrl) {
          await carregarPainelGithub(repositorioUrl, { forcar: true });
        } else {
          limparPainelGithub("Link salvo. Informe também o repositório para acompanhar commits, pull requests e issues.");
        }
      } catch (error) {
        console.error(error);
        showToast(error.message || "Não foi possível salvar os links", "error");
      } finally {
        setButtonLoading(btnSalvarGithub, false);
      }
    });

    btnAtualizarGithub?.addEventListener("click", async () => {
      const repositorioUrl = githubRepositorio?.value.trim();
      if (!repositorioUrl) {
        showToast("Informe e salve a URL de um repositório público", "error");
        return;
      }
      try {
        await carregarPainelGithub(repositorioUrl, { forcar: true });
      } catch (error) {
        showToast(error.message || "URL de repositório inválida", "error");
      }
    });

    const enviar = async () => {
      const mensagem = texto.value.trim();
      if (!mensagem) return;

      try {
        setButtonLoading(btnEnviar, true, "Enviando...");
        await enviarMensagem(chatId, user.uid, mensagem, tipoChat);
        texto.value = "";
      } catch (error) {
        console.error(error);
        showToast("Não foi possível enviar mensagem", "error");
      } finally {
        setButtonLoading(btnEnviar, false);
      }
    };

    btnEnviar?.addEventListener("click", enviar);
    texto?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        enviar();
      }
    });
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar chat", "error");
  }
}

observeAuthenticatedUser(iniciarChat, () => {
  showToast("Faça login para acessar o chat", "error");
  window.location.href = "../../index.html";
});
