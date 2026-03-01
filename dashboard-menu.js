function abrirMenu(menuId) {
  const overlay = document.getElementById(menuId);
  if (!overlay) return;
  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function fecharMenu(menuId) {
  const overlay = document.getElementById(menuId);
  if (!overlay) return;
  overlay.classList.add("hidden");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-menu-trigger]").forEach((button) => {
  button.addEventListener("click", () => {
    abrirMenu(button.getAttribute("data-menu-trigger"));
  });
});

document.querySelectorAll("[data-menu-close]").forEach((button) => {
  button.addEventListener("click", () => {
    fecharMenu(button.getAttribute("data-menu-close"));
  });
});

document.querySelectorAll(".dashboard-menu-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      fecharMenu(overlay.id);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll(".dashboard-menu-overlay").forEach((overlay) => {
    if (!overlay.classList.contains("hidden")) {
      fecharMenu(overlay.id);
    }
  });
});
