export function createElement(tag, { className, text } = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function setButtonLoading(button, isLoading, loadingText = "Carregando...") {
  if (!button) return;

  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent || "";
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : button.dataset.originalText;
}

export function showToast(message, type = "info") {
  let container = document.getElementById("toastContainer");

  if (!container) {
    container = createElement("div", { className: "toast-container" });
    container.id = "toastContainer";
    document.body.appendChild(container);
  }

  const toast = createElement("div", {
    className: `toast toast-${type}`,
    text: message
  });

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

export function formatStatus(status) {
  const labels = {
    pendente: "Pendente",
    aceito: "Aceito",
    recusado: "Recusado",
    concluido: "Concluído",
    cancelado: "Cancelado"
  };

  return labels[status] || status;
}
