import { formatStatus, createElement } from "./utils.js";
import { STATUS } from "./candidaturaService.js";

function formatDate(criadoEm) {
  if (!criadoEm) return "Data não informada";

  const value = typeof criadoEm.toDate === "function" ? criadoEm.toDate() : new Date(criadoEm);
  if (Number.isNaN(value.getTime())) return "Data não informada";

  return value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function getNivel(problema) {
  const nivel = (problema.nivel || "intermediario").toLowerCase();
  if (nivel === "iniciante") return "Iniciante";
  return "Intermediário";
}

function getTags(problema) {
  const tags = [];
  if (problema.tipo) tags.push(problema.tipo);
  tags.push(getNivel(problema));
  if (problema.urgente) tags.push("Urgente");
  if (problema.remoto !== false) tags.push("Remoto");
  return tags;
}

export function renderProblema({
  container,
  problema,
  candidatura,
  onCandidatar,
  onAbrirChat,
  onVerDetalhes
}) {
  const li = createElement("li", { className: "freelancer-card" });
  const heading = createElement("h3", { className: "freelancer-card-title", text: problema.titulo });
  const descricao = createElement("p", {
    className: "freelancer-card-description",
    text: problema.descricao || "Sem descrição"
  });

  const tagsWrapper = createElement("div", { className: "freelancer-tags" });
  getTags(problema).forEach((tag) => {
    tagsWrapper.appendChild(createElement("span", { className: "freelancer-tag", text: tag }));
  });

  const metadata = createElement("div", { className: "freelancer-meta" });
  metadata.appendChild(createElement("span", { text: `Publicado em: ${formatDate(problema.criadoEm)}` }));
  metadata.appendChild(
    createElement("span", { text: `Empresa: ${problema.empresaNome || "Empresa parceira"}` })
  );

  const actions = createElement("div", { className: "button-row freelancer-card-actions" });

  const detalhesButton = createElement("button", {
    className: "freelancer-secondary-btn",
    text: "Ver detalhes"
  });
  detalhesButton.addEventListener("click", () => onVerDetalhes(problema));
  actions.appendChild(detalhesButton);

  if (candidatura) {
    const status = createElement("p", {
      className: "freelancer-status",
      text: `Status: ${formatStatus(candidatura.status)}`
    });
    li.appendChild(status);

    if (candidatura.status === STATUS.ACEITO && candidatura.chatId) {
      const chatButton = createElement("button", {
        className: "btn-primary",
        text: "Abrir chat"
      });
      chatButton.addEventListener("click", () => onAbrirChat(candidatura.chatId));
      actions.appendChild(chatButton);
    } else {
      const aguardando = createElement("button", {
        className: "freelancer-applied-btn",
        text: candidatura.status === STATUS.RECUSADO ? "Candidatura recusada" : "Candidatado"
      });
      aguardando.disabled = true;
      actions.appendChild(aguardando);
    }
  } else {
    const candidatarButton = createElement("button", {
      className: "btn-primary",
      text: "Candidatar-se"
    });
    candidatarButton.addEventListener("click", () => onCandidatar(candidatarButton));
    actions.appendChild(candidatarButton);
  }

  li.appendChild(heading);
  li.appendChild(descricao);
  li.appendChild(tagsWrapper);
  li.appendChild(metadata);
  li.appendChild(actions);
  container.appendChild(li);
}
