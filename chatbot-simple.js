/**
 * Widget Chatbot BMO (Versão Simples - SEM Módulos)
 * Gerencia UI, eventos e interações do chatbot flutuante
 */

class ChatbotWidget {
  constructor() {
    this.isOpen = false;
    this.isSending = false;
    this.unreadCount = 0;
    this.elements = {};
    this.firstMessageShown = false;
    this.authChecked = false;
    this.waitForFirebaseAndAuth();
  }

  /**
   * Aguarda Firebase estar disponível
   */
  async waitForFirebaseAndAuth() {
    let attempts = 0;
    const maxAttempts = 50;
    const checkInterval = 100; // ms

    const checkFirebase = () => {
      attempts++;
      console.log(`[ChatbotWidget] Firebase check ${attempts}/${maxAttempts} - typeof firebase: ${typeof firebase}, has auth: ${firebase ? !!firebase.auth : false}`);

      try {
        // Verifica se firebase existe e tem os métodos necessários
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
          console.log('[ChatbotWidget] ✓ Firebase disponível');
          this.authChecked = true;
          
          // Aguarda que o usuário esteja autenticado
          firebase.auth().onAuthStateChanged((user) => {
            if (user) {
              console.log('[ChatbotWidget] ✓ Usuário autenticado:', user.uid);
              this.initializeWidget();
            } else {
              console.log('[ChatbotWidget] Usuario não autenticado (esperando login)');
            }
          });

          return true;
        } else {
          console.log(`[ChatbotWidget] Firebase ainda não pronto: firebase=${typeof firebase}, auth=${firebase ? !!firebase.auth : 'N/A'}`);
        }
      } catch (error) {
        console.log(`[ChatbotWidget] Erro ao verificar Firebase: ${error.message}`);
      }

      if (attempts < maxAttempts) {
        setTimeout(checkFirebase, checkInterval);
      } else {
        console.error('[ChatbotWidget] ✗ Firebase não disponível após timeout (5s)');
      }

      return false;
    };

    checkFirebase();
  }

  /**
   * Inicializa o widget após confirmação de Auth
   */
  initializeWidget() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupWidget());
    } else {
      this.setupWidget();
    }
  }

  /**
   * Configura estrutura HTML do widget
   */
  setupWidget() {
    console.log('[ChatbotWidget] Configurando widget...');

    const container = document.createElement('div');
    container.id = 'bmo-chatbot-container';
    container.innerHTML = `
      <!-- Widget Minimizado -->
      <div id="bmo-chatbot-toggle" class="bmo-chatbot-toggle">
        <div class="bmo-chatbot-avatar">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="35" r="25" fill="#4F46E5"/>
            <circle cx="42" cy="28" r="4" fill="white"/>
            <circle cx="58" cy="28" r="4" fill="white"/>
            <circle cx="42" cy="28" r="2" fill="#2D3748"/>
            <circle cx="58" cy="28" r="2" fill="#2D3748"/>
            <path d="M 42 40 Q 50 45 58 40" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
            <rect x="30" y="50" width="40" height="35" rx="8" fill="#4F46E5"/>
            <circle cx="35" cy="60" r="2" fill="white"/>
            <circle cx="50" cy="60" r="2" fill="white"/>
            <circle cx="65" cy="60" r="2" fill="white"/>
          </svg>
          <span class="bmo-avatar-badge" id="bmo-unread-badge" style="display:none;">1</span>
        </div>
      </div>

      <!-- Widget Expandido -->
      <div id="bmo-chatbot-window" class="bmo-chatbot-window">
        <!-- Header -->
        <div class="bmo-chat-header">
          <div class="bmo-header-content">
            <h3>🤖 BMO</h3>
            <p>Seu assistente inteligente</p>
          </div>
          <button id="bmo-close-btn" class="bmo-close-btn">✕</button>
        </div>

        <!-- Messages -->
        <div id="bmo-messages" class="bmo-messages-container"></div>

        <!-- Input -->
        <div class="bmo-input-area">
          <input 
            id="bmo-input" 
            type="text" 
            placeholder="Escreva sua dúvida..."
            class="bmo-input"
          />
          <button id="bmo-send-btn" class="bmo-send-btn">Enviar</button>
        </div>
      </div>
    `;

    // Adiciona ao DOM
    document.body.appendChild(container);
    console.log('[ChatbotWidget] ✓ DOM estrutura criada');

    // Armazena referências dos elementos
    this.elements = {
      container: container,
      toggle: document.getElementById('bmo-chatbot-toggle'),
      window: document.getElementById('bmo-chatbot-window'),
      messagesDiv: document.getElementById('bmo-messages'),
      input: document.getElementById('bmo-input'),
      sendBtn: document.getElementById('bmo-send-btn'),
      closeBtn: document.getElementById('bmo-close-btn'),
      badge: document.getElementById('bmo-unread-badge')
    };

    // Configura eventos
    this.setupEvents();

    // Mostra mensagem de boas-vindas
    this.showWelcomeMessage();
  }

  /**
   * Configura event listeners
   */
  setupEvents() {
    this.elements.toggle.addEventListener('click', () => this.toggleChat());
    this.elements.closeBtn.addEventListener('click', () => this.toggleChat());
    this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
    this.elements.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  /**
   * Abre/Fecha o chat
   */
  toggleChat() {
    this.isOpen = !this.isOpen;
    this.elements.window.style.display = this.isOpen ? 'flex' : 'none';
    this.elements.toggle.style.display = this.isOpen ? 'none' : 'flex';
    
    if (this.isOpen && this.unreadCount > 0) {
      this.unreadCount = 0;
      this.elements.badge.style.display = 'none';
    }
  }

  /**
   * Envia mensagem
   */
  async sendMessage() {
    const message = this.elements.input.value.trim();
    if (!message || this.isSending) return;

    this.isSending = true;
    this.elements.input.value = '';
    this.elements.sendBtn.disabled = true;

    // Mostra mensagem do usuário
    this.addMessage(message, 'user');

    try {
      // Aguarda resposta do serviço
      const service = new ChatbotService();
      await service.loadUserProfile();
      const response = await service.processMessage(message);
      
      // Mostra resposta
      this.addMessage(response, 'bot');
    } catch (error) {
      console.error('[ChatbotWidget] Erro ao enviar:', error);
      this.addMessage('Desculpa, ocorreu um erro. Tente novamente.', 'bot');
    }

    this.isSending = false;
    this.elements.sendBtn.disabled = false;
    this.elements.input.focus();
  }

  /**
   * Adiciona mensagem ao chat
   */
  addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `bmo-message bmo-message-${sender}`;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'bmo-message-text';
    textDiv.innerHTML = this.formatMessage(text);
    
    messageDiv.appendChild(textDiv);
    this.elements.messagesDiv.appendChild(messageDiv);
    
    // Ativa animação
    setTimeout(() => messageDiv.classList.add('show'), 10);
    
    this.elements.messagesDiv.scrollTop = this.elements.messagesDiv.scrollHeight;
  }

  /**
   * Formata mensagem com markdown básico
   */
  formatMessage(text) {
    let formatted = text;

    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Links
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Quebras de linha
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  /**
   * Mostra mensagem de boas-vindas
   */
  showWelcomeMessage() {
    if (this.firstMessageShown) return;

    setTimeout(() => {
      const welcomeText = `👋 Olá! Sou BMO, seu assistente no mundo das oportunidades!\n\nEstou aqui para ajudar com dúvidas sobre a plataforma, desafios e muito mais.\n\nComo posso ajudar você hoje? 🚀`;
      this.addMessage(welcomeText, 'bot');
      this.firstMessageShown = true;
    }, 1000);
  }
}

// Inicializa quando script carrega
console.log('[ChatbotSimple] Script carregado, inicializando widget...');
window.chatbotWidget = new ChatbotWidget();
