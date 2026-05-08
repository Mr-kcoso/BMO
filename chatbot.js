/**
 * Widget Chatbot BMO
 * Gerencia UI, eventos e interações do chatbot flutuante
 */

class ChatbotWidget {
  constructor() {
    this.isOpen = false;
    this.isSending = false;
    this.unreadCount = 0;
    this.elements = {};
    this.firstMessageShown = false;
    this.init();
  }

  /**
   * Inicializa o widget - cria HTML e configura eventos
   */
  async init() {
    // Aguarda DOM estar pronto
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
    // Cria container principal
    const container = document.createElement('div');
    container.id = 'bmo-chatbot-container';
    container.innerHTML = `
      <!-- Widget Minimizado -->
      <div id="bmo-chatbot-toggle" class="bmo-chatbot-toggle">
        <div class="bmo-chatbot-avatar">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Cabeça -->
            <circle cx="50" cy="35" r="25" fill="#4F46E5"/>
            <!-- Olhos -->
            <circle cx="42" cy="28" r="4" fill="white"/>
            <circle cx="58" cy="28" r="4" fill="white"/>
            <!-- Pupilas -->
            <circle cx="42" cy="28" r="2" fill="#2D3748"/>
            <circle cx="58" cy="28" r="2" fill="#2D3748"/>
            <!-- Sorriso -->
            <path d="M 42 40 Q 50 45 58 40" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
            <!-- Corpo/Balão -->
            <path d="M 30 55 Q 30 65 40 70 L 45 80 L 50 70 Q 70 70 70 55 Q 70 50 50 50 Q 30 50 30 55" fill="#4F46E5"/>
            <!-- Brilho -->
            <circle cx="60" cy="60" r="6" fill="white" opacity="0.3"/>
          </svg>
        </div>
        <div class="bmo-unread-badge" id="bmo-unread-badge" style="display: none;">
          <span id="bmo-unread-count">0</span>
        </div>
      </div>

      <!-- Chat Window -->
      <div id="bmo-chatbot-window" class="bmo-chatbot-window" style="display: none;">
        <!-- Header -->
        <div class="bmo-chatbot-header">
          <div class="bmo-header-content">
            <div class="bmo-header-avatar">
              <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="15" r="12" fill="#4F46E5"/>
                <circle cx="20" cy="12" r="2" fill="white"/>
                <circle cx="30" cy="12" r="2" fill="white"/>
                <path d="M 20 20 Q 25 22 30 20" stroke="white" stroke-width="1" fill="none" stroke-linecap="round"/>
                <path d="M 15 28 Q 25 35 35 28" fill="#4F46E5"/>
              </svg>
            </div>
            <div class="bmo-header-text">
              <h3>Assistente BMO</h3>
              <p>Online</p>
            </div>
          </div>
          <button id="bmo-close-btn" class="bmo-close-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Messages Container -->
        <div id="bmo-messages-container" class="bmo-messages-container">
          <div id="bmo-loading" class="bmo-message bmo-message-bot" style="display: none;">
            <div class="bmo-loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="bmo-input-area">
          <form id="bmo-form" onsubmit="return false;">
            <input 
              type="text" 
              id="bmo-input" 
              class="bmo-input-field"
              placeholder="Digite sua mensagem..."
              autocomplete="off"
            />
            <button type="submit" id="bmo-send-btn" class="bmo-send-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>

        <!-- Quick Actions -->
        <div class="bmo-quick-actions" id="bmo-quick-actions">
          <button class="bmo-quick-btn" data-action="desafios">Desafios</button>
          <button class="bmo-quick-btn" data-action="perfil">Perfil</button>
          <button class="bmo-quick-btn" data-action="suporte">Suporte</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.cacheElements();
    this.attachEventListeners();
    
    // Carrega perfil do usuário
    await chatbotService.loadUserProfile();
    
    // Mostra mensagem de boas-vindas após 1 segundo
    setTimeout(() => this.showWelcomeMessage(), 1000);
  }

  /**
   * Cacheia referências dos elementos DOM
   */
  cacheElements() {
    this.elements = {
      container: document.getElementById('bmo-chatbot-container'),
      toggle: document.getElementById('bmo-chatbot-toggle'),
      window: document.getElementById('bmo-chatbot-window'),
      messagesContainer: document.getElementById('bmo-messages-container'),
      input: document.getElementById('bmo-input'),
      form: document.getElementById('bmo-form'),
      sendBtn: document.getElementById('bmo-send-btn'),
      closeBtn: document.getElementById('bmo-close-btn'),
      unreadBadge: document.getElementById('bmo-unread-badge'),
      unreadCount: document.getElementById('bmo-unread-count'),
      loadingIndicator: document.getElementById('bmo-loading'),
      quickActions: document.getElementById('bmo-quick-actions')
    };
  }

  /**
   * Configura event listeners
   */
  attachEventListeners() {
    // Toggle chat
    this.elements.toggle.addEventListener('click', () => this.toggleChat());

    // Fechar chat
    this.elements.closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleChat();
    });

    // Enviar mensagem
    this.elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Enviar com Enter
    this.elements.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Quick actions
    this.elements.quickActions.addEventListener('click', (e) => {
      if (e.target.classList.contains('bmo-quick-btn')) {
        const action = e.target.dataset.action;
        this.handleQuickAction(action);
      }
    });
  }

  /**
   * Toggle abrir/fechar chat
   */
  toggleChat() {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.elements.window.style.display = 'flex';
      this.elements.toggle.classList.add('active');
      this.elements.input.focus();
      this.unreadCount = 0;
      this.updateUnreadBadge();
    } else {
      this.elements.window.style.display = 'none';
      this.elements.toggle.classList.remove('active');
    }
  }

  /**
   * Mostra mensagem de boas-vindas
   */
  async showWelcomeMessage() {
    if (this.firstMessageShown) return;
    
    const welcome = chatbotService.generateWelcomeMessage();
    this.displayMessage(welcome, 'bot');
    this.firstMessageShown = true;

    // Sugestões iniciais
    setTimeout(() => {
      this.displayQuickSuggestions();
    }, 1500);
  }

  /**
   * Envia mensagem do usuário
   */
  async sendMessage() {
    const message = this.elements.input.value.trim();
    
    if (!message || this.isSending) return;

    this.isSending = true;
    this.elements.input.value = '';
    this.elements.input.disabled = true;

    // Mostra mensagem do usuário
    this.displayMessage(message, 'user');

    // Mostra indicador de digitação
    this.showLoadingIndicator();

    try {
      // Processa mensagem através do serviço
      const response = await chatbotService.processMessage(message);
      
      this.hideLoadingIndicator();
      this.displayMessage(response, 'bot');

      // Gamificação: mostrar selo após 3 mensagens
      if (chatbotService.messageCount === 3) {
        this.displayBadge('🎖️ Primeira conversa!', 'Você iniciou sua jornada com o assistente BMO');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      this.hideLoadingIndicator();
      this.displayMessage('Desculpe, ocorreu um erro. Tente novamente.', 'bot');
    } finally {
      this.isSending = false;
      this.elements.input.disabled = false;
      this.elements.input.focus();
    }
  }

  /**
   * Exibe mensagem no chat
   */
  displayMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `bmo-message bmo-message-${sender}`;
    messageDiv.innerHTML = this.formatMessage(text);

    this.elements.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();

    // Animação de entrada
    setTimeout(() => messageDiv.classList.add('show'), 10);
  }

  /**
   * Formata mensagem com markdown simples
   */
  formatMessage(text) {
    let html = text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return `<div class="bmo-message-text">${html}</div>`;
  }

  /**
   * Mostra sugestões rápidas
   */
  displayQuickSuggestions() {
    const suggestions = [
      '🎯 Encontrar desafios para mim',
      '📱 Entendo como a plataforma funciona',
      '👤 Ver meu perfil',
      '💬 Falar com suporte'
    ];

    const container = document.createElement('div');
    container.className = 'bmo-suggestions';

    suggestions.forEach((suggestion, index) => {
      setTimeout(() => {
        const btn = document.createElement('button');
        btn.className = 'bmo-suggestion-btn';
        btn.textContent = suggestion;
        btn.addEventListener('click', () => {
          this.elements.input.value = suggestion.substring(3);
          this.sendMessage();
        });
        container.appendChild(btn);
      }, index * 200);
    });

    this.elements.messagesContainer.appendChild(container);
    this.scrollToBottom();
  }

  /**
   * Exibe badge de conquista
   */
  displayBadge(title, description) {
    const badge = document.createElement('div');
    badge.className = 'bmo-badge';
    badge.innerHTML = `
      <div class="bmo-badge-content">
        <h4>${title}</h4>
        <p>${description}</p>
      </div>
    `;

    this.elements.messagesContainer.appendChild(badge);
    this.scrollToBottom();

    setTimeout(() => badge.classList.add('show'), 10);
  }

  /**
   * Mostra indicador de carregamento
   */
  showLoadingIndicator() {
    this.elements.loadingIndicator.style.display = 'flex';
    this.scrollToBottom();
  }

  /**
   * Esconde indicador de carregamento
   */
  hideLoadingIndicator() {
    this.elements.loadingIndicator.style.display = 'none';
  }

  /**
   * Rolagem automática para mensagens novas
   */
  scrollToBottom() {
    setTimeout(() => {
      this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }, 0);
  }

  /**
   * Trata ações rápidas
   */
  handleQuickAction(action) {
    const actions = {
      desafios: '🎯 Quero ver desafios recomendados para mim',
      perfil: '👤 Como edito meu perfil?',
      suporte: '💬 Preciso falar com o suporte humano'
    };

    this.elements.input.value = actions[action];
    this.sendMessage();
  }

  /**
   * Atualiza badge de mensagens não lidas
   */
  updateUnreadBadge() {
    if (this.unreadCount > 0 && !this.isOpen) {
      this.elements.unreadBadge.style.display = 'flex';
      this.elements.unreadCount.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
    } else {
      this.elements.unreadBadge.style.display = 'none';
    }
  }

  /**
   * Incrementa mensagens não lidas
   */
  incrementUnread() {
    if (!this.isOpen) {
      this.unreadCount++;
      this.updateUnreadBadge();
    }
  }
}

// Instancia o widget quando a página carrega
let chatbotWidget;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    chatbotWidget = new ChatbotWidget();
  });
} else {
  chatbotWidget = new ChatbotWidget();
}
