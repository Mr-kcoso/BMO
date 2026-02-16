import { formatStatus, createElement } from "./utils.js";
import { STATUS } from "./candidaturaService.js";

export function renderProblema({
  container,
  problema,
  candidatura,
  onCandidatar,
  onAbrirChat
}) {
  const li = createElement("li");
  const titulo = createElement("strong", { text: problema.titulo });
  const descricao = createElement("p", { text: problema.descricao || "Sem descrição" });

  li.appendChild(titulo);
  li.appendChild(descricao);

  if (candidatura) {
    const status = createElement("p", { text: `Status: ${formatStatus(candidatura.status)}` });
    li.appendChild(status);

    if (candidatura.status === STATUS.ACEITO && candidatura.chatId) {
      const chatButton = createElement("button", { text: "Abrir Chat" });
      chatButton.addEventListener("click", () => onAbrirChat(candidatura.chatId));
      li.appendChild(chatButton);
    } else if (candidatura.status === STATUS.RECUSADO) {
      li.appendChild(createElement("em", { text: "Candidatura recusada" }));
    } else {
      li.appendChild(createElement("em", { text: "Aguardando resposta" }));
    }
  } else {
    const candidatarButton = createElement("button", { text: "Candidatar-se" });
    candidatarButton.addEventListener("click", () => onCandidatar(candidatarButton));
    li.appendChild(candidatarButton);
  }

  li.appendChild(createElement("hr"));
  container.appendChild(li);
}
