# Assistente virtual com IA (Gemini + Firebase)

## O que foi implementado
- Widget lateral de chat no front-end (`assistant-widget.js`) com:
  - botão flutuante;
  - painel de conversa;
  - input + envio;
  - feedback de resposta (👍/👎).
- Integração com Cloud Functions:
  - `chatBot`: recebe mensagem, chama Gemini e grava no Firestore (`chat`).
  - `chatBotFeedback`: grava feedback da resposta.
- Histórico no Firestore (coleção `chat`) no formato:

```json
{
  "userMessage": "Como publico um projeto?",
  "botResponse": "Você pode acessar o painel e clicar em 'Publicar problema'.",
  "timestamp": "serverTimestamp",
  "feedback": 5,
  "userId": "opcional",
  "sessionId": "opcional"
}
```

## Segurança da chave
A chave do Gemini **não foi hardcoded no front-end**.
Use secret no Firebase Functions:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

## Deploy sugerido
```bash
cd functions
npm install
cd ..
firebase deploy --only functions:chatBot,functions:chatBotFeedback
```

## Endpoint no front-end
Por padrão, o widget usa:
- `https://us-central1-bmo-tcc.cloudfunctions.net/chatBot`
- `https://us-central1-bmo-tcc.cloudfunctions.net/chatBotFeedback`

Se quiser sobrescrever em runtime:

```html
<script>
  window.BMO_AI_ASSISTANT_ENDPOINT = "https://.../chatBot";
  window.BMO_AI_ASSISTANT_FEEDBACK_ENDPOINT = "https://.../chatBotFeedback";
</script>
```
