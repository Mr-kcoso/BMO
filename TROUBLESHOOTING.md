# 🔧 Troubleshooting - Chatbot BMO não Aparece

## 📊 Diagnóstico Rápido

Se o teste mostrou:
```
ERRO: Firebase não carregado!
ERRO: Container #bmo-chatbot-container não encontrado!
```

Siga as etapas abaixo para corrigir.

---

## 🔍 PASSO 1: Testar Firebase Básico

### O que fazer:
1. Abra `teste-firebase-basico.html` em seu navegador
2. Clique em "▶️ Testar Firebase"
3. Procure pelos resultados

### Se mostrar:
- ✅ **firebase encontrado em window** - Firebase CDN carregou ✓
- ✅ **firebase.auth existe** - Auth module funcionando ✓
- ✅ **firebase.firestore existe** - Firestore module funcionando ✓
- ✅ **Firebase App inicializado** - firebase.js executou ✓

### Se mostrar ❌ ERRO em qualquer um:
**Problema**: Firewal/VPN/Proxy bloqueando CDN do Google
**Solução**: 
- Desabilite VPN/Proxy
- Verifique se está em rede blocada (escola, empresa)
- Tente outro navegador
- Tente com WiFi diferente

---

## 🔍 PASSO 2: Verificar Autenticação

Se Firebase carregou OK mas chat não aparece:

### 1. Necessário estar AUTENTICADO
O ChatBot **SÓ aparece para usuários autenticados**

Verificar se está autenticado:
1. Abra console do navegador (F12)
2. Digite: `firebase.auth().currentUser`
3. Se mostrar `null` → **Você NÃO está autenticado**
4. Se mostrar objeto com email → **Está autenticado** ✓

### 2. Fazer Login
1. Procure sua página de login/registro
2. Faça login com sua conta
3. Volte para a página do chatbot
4. Agora deveria aparecer

---

## 🔍 PASSO 3: Verificar Console (F12)

Abra Dev Tools (F12) e procure na aba "Console" por estas mensagens:

### ✅ Se aparecerem estes logs:
```
[Firebase] ✓ Inicializado
[Firebase] ✓ Usuário autenticado: email@example.com
[ChatbotWidget] Firebase check 1/50
[ChatbotWidget] ✓ Firebase disponível
[ChatbotWidget] ✓ Usuário autenticado: uid123
[ChatbotWidget] Configurando widget...
[ChatbotWidget] ✓ DOM estrutura criada
```
→ Tudo OK! Chat deveria aparecer 🎉

### ❌ Se aparecerem ERROS:
```
[Firebase] Erro na inicialização: [object Object]
[ChatbotWidget] Firebase não disponível após timeout
Uncaught ReferenceError: firebase is not defined
```
→ Há problema com Firebase

---

## 🔍 PASSO 4: Verificação de Rede (F12 → Network)

1. Abra F12 e vá para aba "Network"
2. Recarregue a página
3. Procure por estes arquivos:

### Arquivos que DEVEM carregar:
- [ ] `firebase-app.js` (Status 200) - CDN Google
- [ ] `firebase-auth.js` (Status 200) - CDN Google
- [ ] `firebase-firestore.js` (Status 200) - CDN Google
- [ ] `firebase.js` (Status 200) - Seu arquivo local
- [ ] `chatbot.css` (Status 200)
- [ ] `chatbot-service-simple.js` (Status 200)
- [ ] `chatbot-simple.js` (Status 200)

### Se algum mostrar ❌ ERRO ou Status 404:
**Problema**: Arquivo não existe ou URL errada
**Solução**: 
- Verifique o nome do arquivo
- Certifique-se que está no diretório correto
- Recarregue a página (Ctrl+F5)

---

## 🔍 PASSO 5: Ordem de Carregamento

Verifique que seu HTML tem os scripts **NESTA ORDEM EXATA**:

```html
<!-- ✅ CORRETO -->
<head>
    <link rel="stylesheet" href="chatbot.css">
</head>
<body>
    <!-- Seu conteúdo -->

    <!-- 1. PRIMEIRO: Firebase from CDN -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"></script>

    <!-- 2. SEGUNDO: Nosso firebase.js -->
    <script src="firebase.js"></script>

    <!-- 3. TERCEIRO: Serviço do chatbot -->
    <script src="chatbot-service-simple.js"></script>

    <!-- 4. QUARTO: Widget do chatbot -->
    <script src="chatbot-simple.js"></script>
</body>
```

### ❌ ERRADO (scripts sem ordem):
```html
<!-- ❌ ERRO: chatbot-simple.js antes de firebase.js -->
<script src="chatbot-simple.js"></script>
<script src="firebase.js"></script>
```

---

## 🔍 PASSO 6: Verificar Configuração Firebase

1. Abra `firebase.js` em editor
2. Procure por `const firebaseConfig`
3. Certifique-se que ProjectID é `"bmo-bmo"`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBx89cfWELGD7OY6M5uta30hz6aTCV2oo4",
    authDomain: "bmo-bmo.firebaseapp.com",
    projectId: "bmo-bmo",  // ← Deve ser "bmo-bmo"
    //... resto
};
```

Se estiver diferente, corrija!

---

## 📋 Checklist de Troubleshooting

```
Passo 1: Firebase Básico
☐ teste-firebase-basico.html mostra tudo verde ✓

Passo 2: Autenticação
☐ firebase.auth().currentUser não é null
☐ Você fez login

Passo 3: Console.log
☐ "✓ Firebase disponível" aparece
☐ "✓ DOM estrutura criada" aparece

Passo 4: Network (F12)
☐ Todos os scripts carregam com Status 200
☐ Nenhum arquivo com 404 ou error

Passo 5: Ordem de Scripts
☐ Firebase CDN carregado primeiro
☐ firebase.js carregado segundo
☐ chatbot scripts carregados por último

Passo 6: Configuração Firebase
☐ projectId é "bmo-bmo"
☐ firebaseConfig está correta
```

---

## 🆘 Ainda Não Funciona?

### Opção 1: Cache do Navegador
Limpe cache e recarregue:
1. Pressione `Ctrl + Shift + Delete`
2. Marque "Cookies e dados de site"
3. Clique "Limpar dados"
4. Recarregue página com `Ctrl + F5`

### Opção 2: Teste em Navegador Incógnito
1. Abra nova janela incógnita (Ctrl + Shift + N)
2. Abra sua página
3. Faça login
4. Verifique se chat aparece

### Opção 3: Console do Navegador - Comandos Manuais
Abra F12 → Console e execute:

```javascript
// Verificar Firebase
typeof firebase

// Verificar autenticação
firebase.auth().currentUser

// Verificar ChatbotWidget
window.chatbotWidget

// Verificar se container existe
document.getElementById('bmo-chatbot-container')
```

---

## 📞 Informações para Suporte

Se nada funcionar, note estas informações:

1. **Seu navegador**: (Chrome / Firefox / Safari / Edge)
2. **Sistema operacional**: (Windows / Mac / Linux)
3. **Erro exato no console**: (copie e cole a mensagem vermelha)
4. **Resultado de teste-firebase-basico.html**: (qual item falhou)
5. **Está autenticado**: (Sim / Não)

---

## 🎯 Resumo das Causas Mais Comuns

| Problema | Causa Provável | Solução |
|----------|---|---|
| "Firebase não carregado" | VPN/Proxy bloqueando CDN | Desabilite VPN |
| Container não encontrado | Usuário não autenticado | Faça login |
| Scripts não carregam (404) | Arquivos não existem | Verifique nomes/caminhos |
| Scripts errados ordem | Firebase.js carregado antes do CDN | Reordene scripts HTML |
| Erro de projeto | ProjectId errado no firebase.js | Atualize com projectId correto |

---

**Versão**: 3.0
**Data**: 13/04/2026
