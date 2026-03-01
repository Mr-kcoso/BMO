import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function getChatCollection(tipoChat = "projeto") {
  return tipoChat === "amizade" ? "chatsAmizade" : "chats";
}

export async function validarAcessoAoChat(chatId, userId, tipoChat = "projeto") {
  const chatCollection = getChatCollection(tipoChat);
  const chatRef = doc(db, chatCollection, chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    return { autorizado: false, motivo: "Chat não encontrado" };
  }

  const chat = chatSnap.data();

  if (tipoChat === "amizade") {
    const autorizado = Array.isArray(chat.participants) && chat.participants.includes(userId);

    if (!autorizado) {
      return { autorizado: false, motivo: "Você não faz parte deste chat" };
    }

    return { autorizado: true, chat };
  }

  const autorizado = userId === chat.empresaId || userId === chat.freelancerId;

  if (!autorizado) {
    return { autorizado: false, motivo: "Você não faz parte deste chat" };
  }

  return { autorizado: true, chat };
}

export function escutarMensagens(chatId, callback, tipoChat = "projeto") {
  const chatCollection = getChatCollection(tipoChat);
  const mensagensRef = collection(db, chatCollection, chatId, "mensagens");
  const mensagensQuery = query(mensagensRef, orderBy("criadoEm"));

  return onSnapshot(mensagensQuery, (snapshot) => {
    const mensagens = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(mensagens);
  });
}

export async function enviarMensagem(chatId, autorId, texto, tipoChat = "projeto") {
  const chatCollection = getChatCollection(tipoChat);
  const mensagensRef = collection(db, chatCollection, chatId, "mensagens");

  return addDoc(mensagensRef, {
    texto,
    autorId,
    criadoEm: serverTimestamp(),
    lida: false
  });
}
