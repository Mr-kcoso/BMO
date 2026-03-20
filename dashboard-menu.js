const MENU_CLOSE_DELAY_MS = 220;

function abrirMenu(menuId) {
  const overlay = document.getElementById(menuId);
  if (!overlay) return;
  overlay.classList.remove("hidden");
  requestAnimationFrame(() => overlay.classList.add("menu-open"));
  document.body.style.overflow = "hidden";
}

function fecharMenu(menuId) {
  const overlay = document.getElementById(menuId);
  if (!overlay) return;
  overlay.classList.remove("menu-open");
  window.setTimeout(() => {
    if (!overlay.classList.contains("menu-open")) {
      overlay.classList.add("hidden");
    }
  }, MENU_CLOSE_DELAY_MS);
  document.body.style.overflow = "";
}

window.__bmoOpenMenu = abrirMenu;
window.__bmoCloseMenu = fecharMenu;

// Estado inicial defensivo: qualquer overlay de dashboard começa fechado.
document.querySelectorAll(".dashboard-menu-overlay").forEach((overlay) => {
  overlay.classList.add("hidden");
  overlay.classList.remove("menu-open");
});
document.body.style.overflow = "";

// Delegação para garantir funcionamento mesmo se houver alterações no DOM.
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-menu-trigger]");
  if (trigger) {
    abrirMenu(trigger.getAttribute("data-menu-trigger"));
    return;
  }

  const close = event.target.closest("[data-menu-close]");
  if (close) {
    fecharMenu(close.getAttribute("data-menu-close"));
    return;
  }

  const overlay = event.target.classList?.contains("dashboard-menu-overlay") ? event.target : null;
  if (overlay) {
    fecharMenu(overlay.id);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll(".dashboard-menu-overlay").forEach((overlay) => {
    if (!overlay.classList.contains("hidden")) {
      fecharMenu(overlay.id);
    }
  });
});
