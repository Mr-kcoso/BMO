const STORAGE_KEY = "bmo_freelancer_sidebar_collapsed";
const body = document.body;
const toggle = document.getElementById("sidebarToggle");

function setCollapsed(collapsed) {
  body.classList.toggle("sidebar-collapsed", collapsed);
  localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");

  if (!toggle) return;
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.setAttribute("aria-label", collapsed ? "Expandir menu" : "Recolher menu");
}

function initSidebar() {
  if (!toggle) return;

  setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  toggle.addEventListener("click", () => {
    setCollapsed(!body.classList.contains("sidebar-collapsed"));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSidebar);
} else {
  initSidebar();
}
