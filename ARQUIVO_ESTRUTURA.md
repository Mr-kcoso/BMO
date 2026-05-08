# 📦 Estrutura Final de Arquivos - Chatbot BMO

## Arquivos do Sistema (Não mexer)

```
BMO-BMO-anima-o/
├── 📄 index.html                    # HomePage
├── 📄 register.html                 # Registro
├── 📄 sobre.html                    # Sobre
├── 📄 politica.html                 # Política de Privacidade
├── 📄 termosdeuso.html              # Termos de Uso
├── 📄 contato.html                  # Contato
├── 📄 README.md                     # Documentação do projeto
└── 📄 firestore.rules               # Regras do Firestore
```

## Arquivos de Autenticação e Backend

```
├── 🔑 firebase.js                   ✅ NOVO - Inicializa Firebase
├── 🔐 auth.js                       # Autenticação de usuários
├── 🔐 authService.js                # Serviço de autenticação
```

## Arquivos de Páginas de Dashboard

```
├── 📊 dashboard.html                # Dashboard genérico
├── 📊 dashboard-menu.js             # Menu do dashboard
├── 📊 dashboard-freelancer.html     ✅ NOVO - Dashboard Freelancer com chat
├── 📊 dashboard-empresa.html        ✅ NOVO - Dashboard Empresa com chat
```

## Arquivos de Perfil de Usuário

```
├── 👤 perfil.html                   # Perfil do usuário
├── 👤 perfil.js                     # Lógica do perfil
├── 👤 perfil-publico.html           # Perfil público
├── 👤 perfil-publico.js             # Lógica do perfil público
├── 👤 perfil-empresa.html           # Perfil da empresa
├── 👤 perfil-freelancer.html        # Perfil do freelancer
├── 👤 perfilService.js              # Serviço de perfil
```

## Arquivos de Chat/Mensagens

```
├── 💬 chat.html                     # Chat entre usuários
├── 💬 chat.js                       # Lógica do chat
├── 💬 chatService.js                # Serviço de chat
├── 💬 meus-chats.html               # Lista de chats
├── 💬 meus-chats.js                 # Lógica da lista de chats
```

## 🤖 ARQUIVOS DO CHATBOT BMO (NOVO SISTEMA)

### ✅ Arquivos Principais (SEM MÓDULOS)
```
├── chatbot-simple.js                ✅ NOVO - Widget do chatbot (SEM módulos)
├── chatbot-service-simple.js        ✅ NOVO - Serviço do chatbot (SEM módulos)
├── chatbot.css                      ✅ CORRIGIDO - Estilos do chatbot
├── design.css                       ✅ NOVO - Estilos globais da plataforma
```

### 🧪 Arquivos de Teste/Debug
```
├── test-chatbot-debug.html          ✅ NOVO - Console visual de debug
├── verificacao-completa.html        ✅ NOVO - Testes interativos completos
```

### 📖 Documentação de Integração
```
├── CHATBOT_CORRIGIDO_v2.md          # Guia v2 (anterior)
├── VERIFICACAO_FINAL.md             ✅ NOVO - Guia de verificação completa
├── ARQUIVO_ESTRUTURA.md             ✅ NOVO - Este arquivo
```

### ❌ Arquivos Antigos (Não usar mais)
```
├── chatbot.html                     ❌ Antigo
├── chatbot.js                       ❌ Antigo - NÃO USE (usa módulos)
├── chatbot-service.js               ❌ Antigo - NÃO USE (usa módulos)
```

## Arquivos de Funcionalidades

```
├── 🆔 empresa.js                    # Lógica de empresa
├── 👨‍💼 freelancer.js                  # Lógica de freelancer
├── 🤝 amizadeService.js             # Serviço de amizade
├── 🎓 equipe.html                   # Equipes
├── 🎓 equipe.js                     # Lógica de equipes
├── 🎓 equipeService.js              # Serviço de equipes
├── 📋 busca-perfis.html             # Busca de perfis
├── 📋 busca-perfis.js               # Lógica de busca
├── 👥 meus-amigos.html              # Lista de amigos
├── 👥 meus-amigos.js                # Lógica de amigos
├── 📊 meus-planos-empresa.html      # Planos da empresa
├── 📊 meus-planos-empresa.js        # Lógica de planos
├── 👫 minhas-equipes.html           # Equipes do usuário
├── 👫 minhas-equipes.js             # Lógica de equipes
```

## Arquivos de Candidatura

```
├── 📝 candidaturaService.js         # Serviço de candidaturas
```

## Arquivos de UI/UX

```
├── 🎨 design.css                    ✅ NOVO - Estilos globais
├── 🕰️ animation.js                  # Sistema de animações
├── 🔧 utils.js                      # Utilitários gerais
├── 🎨 uiFreelancer.js               # UI específica para freelancer
```

---

## 🚀 Como Usar o Chatbot em uma Página

### Mínimo Necessário
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="chatbot.css">
</head>
<body>
    <!-- Seu conteúdo aqui -->

    <!-- ORDEM IMPORTA! Firebase primeiro -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"></script>
    <script src="firebase.js"></script>

    <!-- Chatbot - SEM MÓDULOS -->
    <script src="chatbot-service-simple.js"></script>
    <script src="chatbot-simple.js"></script>
</body>
</html>
```

### Com Estilos Globais (Recomendado)
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="design.css">
    <link rel="stylesheet" href="chatbot.css">
</head>
<body>
    <!-- Seu conteúdo aqui -->

    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"></script>
    <script src="firebase.js"></script>
    <script src="chatbot-service-simple.js"></script>
    <script src="chatbot-simple.js"></script>
</body>
</html>
```

---

## ⚙️ Variáveis de Configuração

### firebase.js
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBx89cfWELGD7OY6M5uta30hz6aTCV2oo4",
    authDomain: "bmo-bmo.firebaseapp.com",
    projectId: "bmo-bmo",
    // ... outros valores
};
```

### chatbot-service-simple.js
```javascript
const GEMINI_API_KEY = 'AIzaSyBx89cfWELGD7OY6M5uta30hz6aTCV2oo4';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
const FAQ_DATABASE = { /* ... */ };
```

---

## 📊 Fluxo de Inicialização

```
1. HTML carrega
   ↓
2. Firebase Scripts (CDN)
   ↓
3. firebase.js → initializeApp() called
   ↓
4. CSS carrega
   ↓
5. chatbot-service-simple.js → ChatbotService class defined
   ↓
6. chatbot-simple.js → ChatbotWidget() instance created
   ↓
7. ChatbotWidget.waitForFirebaseAndAuth()
   ├─ Aguarda firebase estar disponível (50 tentativas × 100ms)
   ├─ Verifica firebase.auth().currentUser
   └─ Se autenticado → setupWidget()
   ↓
8. setupWidget() criado DOM
   ↓
9. 🎨 Widget renderizado no canto inferior direito
```

---

## 🔒 Variáveis Globais Criadas

```javascript
window.ChatbotService        // Classe do serviço
window.ChatbotWidget         // Classe do widget
window.chatbotWidget         // Instância ativa do widget
window.firebase              // Firebase global
```

---

## 🎯 Status dos Arquivos

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| firebase.js | ✅ NOVO | Configuração Do Firebase |
| chatbot-simple.js | ✅ CORRIGIDO | Widget sem módulos |
| chatbot-service-simple.js | ✅ OK | Serviço sem módulos |
| chatbot.css | ✅ CORRIGIDO | Estilos sincronizados |
| design.css | ✅ NOVO | Estilos globais |
| dashboard-freelancer.html | ✅ NOVO | Teste integración |
| dashboard-empresa.html | ✅ NOVO | Teste integración |
| test-chatbot-debug.html | ✅ OK | Debug console |
| verificacao-completa.html | ✅ NOVO | Testes interativos |
| VERIFICACAO_FINAL.md | ✅ NOVO | Guia de verificação |

---

## ✅ Checklist de Integração

- [ ] firebase.js existe e está correto
- [ ] Todos as pages carregam firebase.js
- [ ] Nenhuma página usa `type="module"` para chatbot
- [ ] design.css carregado (opcional mas recomendado)
- [ ] chatbot.css carregado
- [ ] chatbot-service-simple.js carregado
- [ ] chatbot-simple.js carregado (por último)
- [ ] Você está autenticado via Firebase Auth
- [ ] Botão roxo aparece no canto inferior direito
- [ ] Chat abre ao clicar
- [ ] Mensagens aparecem com animação

---

**Versão**: 3.0
**Data**: 13/04/2026
**Status**: Pronto para Uso ✅
