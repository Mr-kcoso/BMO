import { auth } from "./firebase.js";

const ENDPOINT = window.BMO_AI_ASSISTANT_ENDPOINT || "https://us-central1-bmo-tcc.cloudfunctions.net/chatBot";
const FEEDBACK_ENDPOINT =
  window.BMO_AI_ASSISTANT_FEEDBACK_ENDPOINT ||
  "https://us-central1-bmo-tcc.cloudfunctions.net/chatBotFeedback";

const SESSION_KEY = "bmo_ai_assistant_session";
const sessionId = localStorage.getItem(SESSION_KEY) || crypto.randomUUID();
localStorage.setItem(SESSION_KEY, sessionId);

function createAssistantWidget() {
  const wrapper = document.createElement("div");
  wrapper.className = "ai-assistant";
  wrapper.innerHTML = `
    <button id="aiAssistantToggle" class="ai-assistant-toggle" type="button" aria-label="Abrir assistente virtual">
      🤖 Assistente
    </button>

    <section id="aiAssistantPanel" class="ai-assistant-panel hidden" aria-label="Assistente virtual">
      <header class="ai-assistant-header">
        <div>
          <h3>Assistente BMO</h3>
          <p>Posso tirar dúvidas, reescrever textos e coletar feedback.</p>
        </div>
        <button id="aiAssistantClose" type="button" class="ai-assistant-close" aria-label="Fechar">×</button>
      </header>

      <div id="aiAssistantMessages" class="ai-assistant-messages" aria-live="polite"></div>

      <form id="aiAssistantForm" class="ai-assistant-form">
        <input id="aiAssistantInput" type="text" maxlength="800" placeholder="Digite sua mensagem..." required />
        <button id="aiAssistantSend" class="btn-primary" type="submit">Enviar</button>
      </form>
    </section>
  `;

  document.body.appendChild(wrapper);

  const toggle = wrapper.querySelector("#aiAssistantToggle");
  const panel = wrapper.querySelector("#aiAssistantPanel");
  const close = wrapper.querySelector("#aiAssistantClose");
  const form = wrapper.querySelector("#aiAssistantForm");
  const input = wrapper.querySelector("#aiAssistantInput");
  const messages = wrapper.querySelector("#aiAssistantMessages");
  const sendButton = wrapper.querySelector("#aiAssistantSend");

  function addMessage(role, text, chatId = null) {
    const bubble = document.createElement("article");
    bubble.className = `ai-assistant-bubble ${role === "user" ? "user" : "bot"}`;
    bubble.textContent = text;

    if (role === "bot" && chatId) {
      const feedback = document.createElement("div");
      feedback.className = "ai-assistant-feedback";
      feedback.innerHTML = `
        <span>Essa resposta ajudou?</span>
        <button type="button" data-feedback="5">👍</button>
        <button type="button" data-feedback="1">👎</button>
      `;

      feedback.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;
        const value = Number(target.dataset.feedback || 0);
        try {
          await fetch(FEEDBACK_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, feedback: value })
          });
          feedback.innerHTML = "<span>Feedback registrado. Obrigado!</span>";
        } catch (error) {
          console.error(error);
          feedback.innerHTML = "<span>Não foi possível registrar o feedback.</span>";
        }
      });

      bubble.appendChild(feedback);
    }

    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function setSending(isSending) {
    sendButton.disabled = isSending;
    input.disabled = isSending;
    sendButton.textContent = isSending ? "Enviando..." : "Enviar";
  }

  toggle.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) input.focus();
  });

  close.addEventListener("click", () => panel.classList.add("hidden"));

  addMessage("bot", "Olá! Sou o assistente da BMO. Como posso ajudar hoje?");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = input.value.trim();
    if (!message) return;

    addMessage("user", message);
    input.value = "";
    setSending(true);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId,
          userId: auth.currentUser?.uid || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao consultar assistente");
      }

      addMessage("bot", data.reply || "Sem resposta no momento.", data.chatId || null);
    } catch (error) {
      console.error(error);
      addMessage("bot", "Não consegui responder agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
      input.focus();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createAssistantWidget);
} else {
  createAssistantWidget();
}
