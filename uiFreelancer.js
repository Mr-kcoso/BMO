import { formatStatus, createElement } from "./utils.js";
import { STATUS } from "./candidaturaService.js";

function formatDate(criadoEm) {
  if (!criadoEm) return "agora";

  const value = typeof criadoEm.toDate === "function" ? criadoEm.toDate() : new Date(criadoEm);
  if (Number.isNaN(value.getTime())) return "agora";

  const diffMs = Date.now() - value.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `ha ${diffMinutes}min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `ha ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 8) return `ha ${diffDays}d`;

  return value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function getNivel(problema) {
  const nivel = (problema.nivel || "intermediario").toLowerCase();
  if (nivel === "iniciante") return "Iniciante";
  return "Intermediario";
}

function getTags(problema) {
  const tags = [];
  if (problema.tipo) tags.push(problema.tipo);
  tags.push(getNivel(problema));
  if (problema.urgente) tags.push("Urgente");
  if (problema.remoto !== false) tags.push("Remoto");
  return tags;
}

function getCompanyInitial(problema) {
  return (problema.empresaNome || "BMO").trim().charAt(0).toUpperCase() || "B";
}

function createActionButton(label, className = "freelancer-post-action") {
  const button = createElement("button", {
    className,
    text: label
  });
  button.type = "button";
  return button;
}

function getShareUrl(problema) {
  const url = new URL(window.location.href);
  url.hash = `problema-${problema.id}`;
  return url.toString();
}

export function renderProblema({
  container,
  problema,
  candidatura,
  onCandidatar,
  onAbrirChat,
  onVerDetalhes,
  onVerPerfilEmpresa
}) {
  const li = createElement("li", { className: "freelancer-card freelancer-post" });
  li.id = `problema-${problema.id}`;

  const header = createElement("div", { className: "freelancer-post-header" });
  const avatar = createElement("button", {
    className: "freelancer-company-avatar",
    text: getCompanyInitial(problema)
  });
  avatar.type = "button";
  avatar.setAttribute("aria-label", "Ver perfil da empresa");
  avatar.addEventListener("click", () => onVerPerfilEmpresa(problema));

  const headerText = createElement("div", { className: "freelancer-post-company" });
  const companyButton = createElement("button", {
    className: "freelancer-company-name",
    text: problema.empresaNome || "Empresa parceira"
  });
  companyButton.type = "button";
  companyButton.addEventListener("click", () => onVerPerfilEmpresa(problema));
  headerText.appendChild(companyButton);
  headerText.appendChild(
    createElement("span", {
      text: `${problema.tipo || "Projeto profissional"} • ${formatDate(problema.criadoEm)}`
    })
  );

  const moreButton = createActionButton("Ver perfil", "freelancer-post-profile-btn");
  moreButton.addEventListener("click", () => onVerPerfilEmpresa(problema));

  header.appendChild(avatar);
  header.appendChild(headerText);
  header.appendChild(moreButton);

  const body = createElement("div", { className: "freelancer-post-body" });
  const titleRow = createElement("div", { className: "freelancer-post-title-row" });
  titleRow.appendChild(createElement("h3", { className: "freelancer-card-title", text: problema.titulo }));

  if (typeof problema.valorSimulado === "number") {
    titleRow.appendChild(
      createElement("strong", {
        className: "freelancer-post-value",
        text: formatCurrency(problema.valorSimulado)
      })
    );
  }

  const descricao = createElement("p", {
    className: "freelancer-card-description",
    text: problema.descricao || "Sem descricao"
  });

  const readMore = createActionButton("Ver mais", "freelancer-read-more");
  readMore.addEventListener("click", () => onVerDetalhes(problema));

  const tagsWrapper = createElement("div", { className: "freelancer-tags" });
  getTags(problema).forEach((tag) => {
    tagsWrapper.appendChild(createElement("span", { className: "freelancer-tag", text: tag }));
  });

  body.appendChild(titleRow);
  body.appendChild(descricao);
  body.appendChild(readMore);
  body.appendChild(tagsWrapper);

  const socialActions = createElement("div", { className: "freelancer-post-social-actions" });
  const saveButton = createActionButton("Salvar");
  saveButton.addEventListener("click", () => {
    const saved = saveButton.classList.toggle("is-saved");
    saveButton.textContent = saved ? "Salvo" : "Salvar";
  });

  const shareButton = createActionButton("Compartilhar");
  shareButton.addEventListener("click", async () => {
    const shareUrl = getShareUrl(problema);
    if (navigator.share) {
      await navigator.share({ title: problema.titulo, text: problema.descricao || "Problema BMO", url: shareUrl });
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      shareButton.textContent = "Link copiado";
      window.setTimeout(() => {
        shareButton.textContent = "Compartilhar";
      }, 1800);
    }
  });

  const commentsButton = createActionButton("Comentarios");
  commentsButton.addEventListener("click", () => onVerDetalhes(problema));

  socialActions.appendChild(saveButton);
  socialActions.appendChild(shareButton);
  socialActions.appendChild(commentsButton);

  const detailButton = createActionButton("Ver detalhes");
  detailButton.addEventListener("click", () => onVerDetalhes(problema));
  socialActions.appendChild(detailButton);

  const footer = createElement("div", { className: "freelancer-post-footer" });
  const meta = createElement("div", { className: "freelancer-meta" });
  meta.appendChild(createElement("span", { text: `${problema.totalCandidaturas || 0} candidatura(s)` }));
  meta.appendChild(createElement("span", { text: problema.remoto === false ? "Presencial" : "Remoto" }));

  const actions = createElement("div", { className: "button-row freelancer-card-actions" });

  if (candidatura) {
    const status = createElement("p", {
      className: "freelancer-status",
      text: `Status: ${formatStatus(candidatura.status)}`
    });
    meta.appendChild(status);

    if (candidatura.status === STATUS.ACEITO && candidatura.chatId) {
      const chatButton = createElement("button", {
        className: "btn-primary freelancer-cta-btn",
        text: "Abrir chat"
      });
      chatButton.addEventListener("click", () => onAbrirChat(candidatura.chatId));
      actions.appendChild(chatButton);
    } else {
      const aguardando = createElement("button", {
        className: "freelancer-applied-btn freelancer-cta-btn",
        text: candidatura.status === STATUS.RECUSADO ? "Candidatura recusada" : "Candidatado"
      });
      aguardando.disabled = true;
      actions.appendChild(aguardando);
    }
  } else {
    const candidatarButton = createElement("button", {
      className: "btn-primary freelancer-cta-btn",
      text: "Candidatar-se"
    });
    candidatarButton.addEventListener("click", () => onCandidatar(candidatarButton));
    actions.appendChild(candidatarButton);
  }

  footer.appendChild(meta);
  footer.appendChild(actions);

  li.appendChild(header);
  li.appendChild(body);
  li.appendChild(socialActions);
  li.appendChild(footer);
  container.appendChild(li);
}
