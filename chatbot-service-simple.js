/**
 * Serviço de Chatbot BMO (Versão Simples - SEM Módulos)
 * Integração com Gemini API para respostas inteligentes
 * Gerencia contexto de conversa e sugestões personalizadas
 */

const GEMINI_API_KEY = 'AIzaSyBx89cfWELGD7OY6M5uta30hz6aTCV2oo4';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

// FAQ Predefinidas para fallback
const FAQ_DATABASE = {
  cadastro: {
    keywords: ['cadastro', 'registrar', 'criar conta', 'inscrição'],
    response: `📋 **Como me cadastrar?**\n\nÉ super fácil!\n\n1️⃣ Clique em "Registrar" no menu principal\n2️⃣ Preencha seus dados e habilidades\n3️⃣ Pronto! Você já pode procurar desafios 🎯\n\nPrecisa de ajuda? Fale conosco pelo contato!`
  },
  termos: {
    keywords: ['termos', 'uso', 'acordo', 'contrato', 't&c'],
    response: `📜 **Termos de Uso**\n\nNossos termos garantem segurança e respeito entre freelancers e empresas.\n\n👉 Acesse os termos completos [aqui](/termosdeuso.html)\n\nDúvida? Nos contacte! 📧`
  },
  privacidade: {
    keywords: ['privacidade', 'dados', 'segurança', 'gdpr', 'proteção'],
    response: `🔒 **Política de Privacidade**\n\nSeus dados estão seguros conosco. Respeitamos sua privacidade.\n\n👉 Leia nossa política completa [aqui](/politica.html)\n\nTem dúvidas sobre seus dados? Nos contacte! 📧`
  },
  contato: {
    keywords: ['contato', 'suporte', 'ajuda', 'falar', 'equipe', 'atendimento'],
    response: `📞 **Como nos Contactar?**\n\nNosso time está aqui para ajudar!\n\n📧 Email: suporte@bmo.com.br\n💬 Chat com suporte real: Use o botão abaixo\n🕐 Horário: Seg-Sex, 9h-18h\n\nVamos conectar você como suporte agora!`
  },
  candidatura: {
    keywords: ['candidatura', 'candidatar', 'aplicar', 'desafio', 'projeto'],
    response: `🚀 **Como se Candidatar a um Desafio?**\n\n1️⃣ Explore desafios na página inicial\n2️⃣ Clique em "Saiba Mais" para verificar detalhes\n3️⃣ Clique em "Candidate-se" e confirme\n4️⃣ Aguarde feedback da empresa ⏳\n\nDúvida? Estou aqui! 😊`
  },
  progresso: {
    keywords: ['progresso', 'status', 'acompanhamento', 'candidaturas', 'onde'],
    response: `📊 **Acompanhe Seu Progresso**\n\nVocê pode ver tudo no seu perfil!\n\n✅ Desafios participando\n✅ Candidaturas em andamento\n✅ Desafios concluídos\n✅ Selos e conquistas\n\nAcesse seu dashboard agora! 🎯`
  },
  habilidades: {
    keywords: ['habilidades', 'skills', 'atualizar', 'competências', 'experiência'],
    response: `💡 **Como Atualizar Minhas Habilidades?**\n\n1️⃣ Vá ao seu perfil (canto superior direito)\n2️⃣ Clique em "Editar Perfil"\n3️⃣ Adicione suas habilidades e experiências\n4️⃣ Salve as mudanças\n\nMais habilidades = mais desafios recomendados! 🎯`
  }
};

class ChatbotService {
  constructor() {
    this.conversationHistory = [];
    this.userProfile = null;
    this.messageCount = 0;
  }

  /**
   * Carrega perfil do usuário do Firestore
   */
  async loadUserProfile() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return null;

      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        this.userProfile = userDoc.data();
        return this.userProfile;
      }
    } catch (error) {
      console.error('[ChatbotService] Erro ao carregar perfil:', error);
    }
    return null;
  }

  /**
   * Processa mensagem do usuário
   */
  async processMessage(userMessage) {
    this.messageCount++;

    // Tenta FAQ primeiro
    const faqResponse = this.checkFAQ(userMessage);
    if (faqResponse) {
      return faqResponse;
    }

    // Se falhar FAQ, usa Gemini
    try {
      return await this.generateResponse(userMessage);
    } catch (error) {
      console.error('[ChatbotService] Erro ao gerar resposta:', error);
      return '🤔 Desculpa, não consegui processar isso agora. Pode reformular?';
    }
  }

  /**
   * Verifica se há resposta de FAQ
   */
  checkFAQ(message) {
    const messageLower = message.toLowerCase();
    
    for (const [key, faq] of Object.entries(FAQ_DATABASE)) {
      if (faq.keywords.some(keyword => messageLower.includes(keyword))) {
        return faq.response;
      }
    }
    
    return null;
  }

  /**
   * Gera resposta usando Gemini API
   */
  async generateResponse(userMessage) {
    const systemPrompt = this.buildSystemPrompt();
    
    const requestBody = {
      contents: [{
        parts: [
          {
            text: systemPrompt
          },
          {
            text: `Histórico de conversa:\n${this.conversationHistory
              .slice(-10)
              .map(msg => `${msg.role}: ${msg.content}`)
              .join('\n')}\n\nUsuário: ${userMessage}`
          }
        ]
      }]
    };

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API erro: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.candidates[0].content.parts[0].text;

      // Inicia conversa
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantMessage }
      );

      // Mantém apenas últimas 20 mensagens
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return assistantMessage;
    } catch (error) {
      console.error('[ChatbotService] Erro Gemini:', error);
      throw error;
    }
  }

  /**
   * Constrói prompt do sistema com contexto do usuário
   */
  buildSystemPrompt() {
    let prompt = `Você é BMO, um assistente amigável e prestativo da plataforma de freelancing BMO.
Seu objetivo é ajudar usuários com dúvidas sobre a plataforma, desafios e candidaturas.
Seja sempre positivo, empático e use emojis para tornar a conversa mais agradável.
Respostas devem ser bem formatadas com markdown quando apropriado.`;

    if (this.userProfile) {
      const userType = this.userProfile.type || 'freelancer';
      if (userType === 'empresa') {
        prompt += `\n\nO usuário é uma EMPRESA. Foque em ajudar com publicação de desafios, gestão de candidaturas e dúvidas sobre planos.`;
      } else {
        prompt += `\n\nO usuário é um FREELANCER. Foque em ajudar com busca de desafios, candidaturas e dúvidas sobre habilidades.`;
      }
    }

    return prompt;
  }

  /**
   * Limpa histórico de conversa
   */
  clearHistory() {
    this.conversationHistory = [];
  }
}

// Exporta globalmente
window.ChatbotService = ChatbotService;
