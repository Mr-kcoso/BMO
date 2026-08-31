const STORAGE_KEY = "bmo_freelancer_sidebar_collapsed";
const body = document.body;
const toggle = document.getElementById("sidebarToggle");

const navIcons = {
  "dashboard-freelancer.html": "fa-house",
  "dashboard-empresa.html": "fa-house",
  "projetos.html": "fa-briefcase",
  "projetos-publicados-empresa.html": "fa-briefcase",
  "meus-chats.html": "fa-comments",
  "meus-amigos.html": "fa-user-group",
  "busca-perfis.html": "fa-magnifying-glass",
  "busca-perfil-Empresa.html": "fa-magnifying-glass",
  "minhas-equipes.html": "fa-people-group",
  "freelancers-salvos.html": "fa-bookmark",
  "Configuracao-freelancer.html": "fa-gear",
  "configuracao-empresa.html": "fa-gear",
};

function addNavigationIcons() {
  document.querySelectorAll(".freelancer-sidebar-nav a").forEach((link) => {
    const page = link.getAttribute("href")?.split("#")[0]?.split("?")[0];
    const iconName = navIcons[page] || "fa-arrow-right";

    link.querySelector(".nav-icon")?.remove();
    if (link.querySelector(".freelancer-nav-icon")) return;

    const icon = document.createElement("i");
    icon.className = `freelancer-nav-icon fa-solid ${iconName}`;
    icon.setAttribute("aria-hidden", "true");
    link.prepend(icon);
  });
}

function setCollapsed(collapsed) {
  body.classList.toggle("sidebar-collapsed", collapsed);
  localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");

  if (!toggle) return;
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.setAttribute("aria-label", collapsed ? "Expandir menu" : "Recolher menu");
}

function initSidebar() {
  addNavigationIcons();

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
