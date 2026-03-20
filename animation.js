const REVEAL_SELECTORS = [
  ".landing-hero",
  ".landing-beneficios",
  ".landing-beneficio-item",
  ".landing-parceiros",
  ".landing-parceiro-card",
  ".landing-final-cta",
  ".freelancer-card",
  ".empresa-candidatura-card",
  ".chats-item-card",
  ".empresa-form-card",
  ".empresa-list-card",
  ".freelancer-filtros",
  ".chats-list-card"
];

function markRevealElements(root = document) {
  REVEAL_SELECTORS.forEach((selector) => {
    root.querySelectorAll(selector).forEach((element, index) => {
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

function initAnimations() {
  markRevealElements();
  setupRevealObserver();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnimations);
} else {
  initAnimations();
}
