/**
 * Serviço de Chatbot BMO
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
    keywords: ['habilidaddes', 'skills', 'atualizar', 'competências', 'experiência'],
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
   * Carrega perfil do usuário do localStorage
   */
  async loadUserProfile() {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.userProfile = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  }

  /**
   * Busca resposta em FAQ antes de chamar API
   */
  findFAQResponse(userMessage) {
    const messageLower = userMessage.toLowerCase();
    
    for (const [key, faq] of Object.entries(FAQ_DATABASE)) {
      for (const keyword of faq.keywords) {
        if (messageLower.includes(keyword)) {
          return faq.response;
        }
      }
    }
    
    return null;
  }

  /**
   * Gera contexto personalizado baseado no perfil do usuário
   */
  generateSystemPrompt() {
    const userName = this.userProfile?.nome || 'Usuário';
    const userType = this.userProfile?.tipo || 'freelancer'; // 'freelancer' ou 'empresa'
    
    const basePrompt = `Você é um assistente amigável e motivador da plataforma BMO (Desafios & Freelancers).

Informações do usuário:
- Nome: ${userName}
- Tipo: ${userType}
- Data: ${new Date().toLocaleDateString('pt-BR')}

Diretrizes importantes:
1. SEMPRE seja amigável, motivador e profissional
2. Use tom conversacional com emojis apropriados
3. Evite textos longos - use listas e destaques
4. Ofereça sugestões de desafios relevantes para freelancers
5. Se a dúvida for sobre suporte humano, ofereça encaminhar
6. Nunca compartilhe dados sensíveis do usuário
7. Se não souber responder, siga para suporte humano

Funções que você pode ajudar:
- Encontrar desafios (recomendações personalizadas)
- Explicar como usar a plataforma
- Status de candidaturas
- Responder perguntas sobre termos, privacidade, contato
- Motivar o usuário com selos e conquistas

Responda em português brasileiro, de forma clara e concisa.`;

    return basePrompt;
  }

  /**
   * Envia mensagem para Gemini API
   */
  async sendToGemini(userMessage) {
    try {
      const systemPrompt = this.generateSystemPrompt();
      
      // Constrói conversa com histórico
      const messages = [
        ...this.conversationHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const payload = {
        contents: messages,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 256
        }
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.candidates[0].content.parts[0].text;

      // Atualiza histórico
      this.conversationHistory.push(
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: assistantMessage }] }
      );

      // Limita histórico para não exceder contexto
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return assistantMessage;
    } catch (error) {
      console.error('Erro ao chamar Gemini API:', error);
      return null;
    }
  }

  /**
   * Processa mensagem do usuário - tenta FAQ primeiro, depois API
   */
  async processMessage(userMessage) {
    await this.loadUserProfile();
    this.messageCount++;

    // 1. Tenta encontrar resposta em FAQ
    const faqResponse = this.findFAQResponse(userMessage);
    if (faqResponse) {
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: faqResponse }]
      });
      return faqResponse;
    }

    // 2. Se não houver FAQ, chama Gemini API
    const geminiResponse = await this.sendToGemini(userMessage);
    
    if (geminiResponse) {
      return geminiResponse;
    }

    // 3. Fallback se ambas falharem
    return `Desculpe, não consegui processar sua pergunta no momento. 😅\n\nMas nosso time de suporte está pronto para ajudar! 📞\n\nClique no botão "Contato" abaixo para falar com alguém. 💬`;
  }

  /**
   * Gera sugestões de desafios baseado em habilidades
   */
  async getChallengeSuggestions() {
    if (!this.userProfile || !this.userProfile.habilidades) {
      return [
        { title: 'Landing Page Moderna', category: 'Web Design', level: 'Iniciante' },
        { title: 'API REST em Node.js', category: 'Backend', level: 'Intermediário' },
        { title: 'App Mobile React Native', category: 'Mobile', level: 'Avançado' }
      ];
    }

    // Aqui você pode integrar com seu backend para buscar desafios
    // Por enquanto, retorna sugestões genéricas
    return [
      { title: 'Projeto que combina com você', category: 'Recomendado', level: 'Perfeito' }
    ];
  }

  /**
   * Gera mensagem de boas-vindas personalizada
   */
  generateWelcomeMessage() {
    const hour = new Date().getHours();
    let greeting = 'Olá';

    if (hour < 12) greeting = 'Bom dia';
    else if (hour < 18) greeting = 'Boa tarde';
    else greeting = 'Boa noite';

    const userName = this.userProfile?.nome?.split(' ')[0] || 'Marcos';

    return `${greeting}, ${userName}! 👋\n\nSou seu assistente BMO. Pronto para conectar seu talento a desafios reais?\n\nO que posso ajudar hoje?`,
  }

  /**
   * Retorna histórico formatado
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Limpa histórico de conversa
   */
  clearConversation() {
    this.conversationHistory = [];
    this.messageCount = 0;
  }
}

// Exportar para uso global
const chatbotService = new ChatbotService();
