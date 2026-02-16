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

export async function validarAcessoAoChat(chatId, userId) {
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    return { autorizado: false, motivo: "Chat não encontrado" };
  }

  const chat = chatSnap.data();
  const autorizado = userId === chat.empresaId || userId === chat.freelancerId;

  if (!autorizado) {
    return { autorizado: false, motivo: "Você não faz parte deste chat" };
  }

  return { autorizado: true, chat };
}

export function escutarMensagens(chatId, callback) {
  const mensagensRef = collection(db, "chats", chatId, "mensagens");
  const mensagensQuery = query(mensagensRef, orderBy("criadoEm"));

  return onSnapshot(mensagensQuery, (snapshot) => {
    const mensagens = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(mensagens);
  });
}

export async function enviarMensagem(chatId, autorId, texto) {
  const mensagensRef = collection(db, "chats", chatId, "mensagens");

  return addDoc(mensagensRef, {
    texto,
    autorId,
    criadoEm: serverTimestamp(),
    lida: false
  });
}
