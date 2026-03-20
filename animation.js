const REVEAL_SELECTORS = [
  ".landing-hero",
  ".landing-beneficios",
  ".landing-beneficio-item",
  ".landing-parceiros",
  ".landing-parceiro-card",
  ".landing-final-cta",
  ".perfil-card",
  ".perfil-hero",
  ".perfil-section",
  ".freelancer-card",
  ".empresa-candidatura-card",
  ".chats-item-card",
  ".empresa-form-card",
  ".empresa-list-card",
  ".freelancer-filtros",
  ".empresa-filtros",
  ".chats-list-card",
  ".chat-card"
];

function markRevealElements(root = document) {
  REVEAL_SELECTORS.forEach((selector) => {
    root.querySelectorAll(selector).forEach((element, index) => {
      if (element.classList.contains("reveal-on-scroll")) return;
      element.classList.add("reveal-on-scroll");
      element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 280)}ms`);
    });
  });
}

function setupRevealObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal-on-scroll").forEach((element) => observer.observe(element));

  const containers = [
    document.getElementById("lista"),
    document.getElementById("problemasPublicados"),
    document.getElementById("candidaturas"),
    document.getElementById("listaChats")
  ].filter(Boolean);

  containers.forEach((container) => {
    const mutationObserver = new MutationObserver(() => {
      markRevealElements(container);
      container.querySelectorAll(".reveal-on-scroll:not(.is-visible)").forEach((element) => observer.observe(element));
    });

    mutationObserver.observe(container, { childList: true, subtree: true });
  });
}

function triggerMicroInteraction(element, className = "is-micro-active") {
  if (!element) return;
  element.classList.remove(className);
  requestAnimationFrame(() => {
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), 450);
  });
}

function setupMicroInteractions() {
  document.addEventListener("click", (event) => {
    const interactiveElement = event.target.closest(
      ".btn-primary, .empresa-secondary-btn, .freelancer-secondary-btn, .chat-nav-btn, .chats-nav-btn, .landing-cta, .menu-hamburger-btn, .landing-icon, .freelancer-tag, .empresa-tag, .perfil-tag"
    );

    if (interactiveElement) {
      triggerMicroInteraction(interactiveElement);
    }
  });
}

function initAnimations() {
  markRevealElements();
  setupRevealObserver();
  setupMicroInteractions();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnimations);
} else {
  initAnimations();
}
