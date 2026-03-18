import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

function withCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
}

async function callGemini(message, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "Você é o assistente virtual da BMO. Responda em português-BR de forma objetiva, útil e amigável. " +
                  "Pode ajudar com dúvidas da plataforma, reescrita de propostas/textos e coleta de feedback. " +
                  `Pergunta do usuário: ${message}`
              }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return reply || "Não consegui gerar uma resposta agora. Tente novamente em instantes.";
}

export const chatBot = onRequest({ secrets: [GEMINI_API_KEY] }, async (req, res) => {
  withCors(res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const userMessage = String(req.body?.message || "").trim();
    if (!userMessage) return res.status(400).json({ error: "Mensagem obrigatória" });

    const userId = req.body?.userId || null;
    const sessionId = req.body?.sessionId || null;

    const botResponse = await callGemini(userMessage, GEMINI_API_KEY.value());

    const chatRef = await db.collection("chat").add({
      userMessage,
      botResponse,
      timestamp: FieldValue.serverTimestamp(),
      feedback: null,
      userId,
      sessionId
    });

    return res.json({ reply: botResponse, chatId: chatRef.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao processar mensagem" });
  }
});

export const chatBotFeedback = onRequest(async (req, res) => {
  withCors(res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const chatId = String(req.body?.chatId || "").trim();
    const feedback = Number(req.body?.feedback);

    if (!chatId || Number.isNaN(feedback)) {
      return res.status(400).json({ error: "chatId e feedback são obrigatórios" });
    }

    await db.collection("chat").doc(chatId).set(
      {
        feedback,
        feedbackAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao registrar feedback" });
  }
});
