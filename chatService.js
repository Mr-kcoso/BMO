import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  limit,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function getChatCollection(tipoChat = "projeto") {
  if (tipoChat === "amizade") return "chatsAmizade";
  if (tipoChat === "equipe") return "chatsEquipe";
  return "chats";
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

  if (tipoChat === "equipe") {
    const autorizado = Array.isArray(chat.participants) && chat.participants.includes(userId);

    if (!autorizado) {
      return { autorizado: false, motivo: "Você não faz parte desta equipe" };
    }

    return { autorizado: true, chat };
  }

  const autorizado = userId === chat.empresaId || userId === chat.freelancerId;

  if (!autorizado) {
    return { autorizado: false, motivo: "Você não faz parte deste chat" };
  }

  return { autorizado: true, chat };
}

export function escutarMensagens(chatId, callback, tipoChat = "projeto", limite = 100) {
  const chatCollection = getChatCollection(tipoChat);
  const mensagensRef = collection(db, chatCollection, chatId, "mensagens");
  const mensagensQuery = query(mensagensRef, orderBy("criadoEm"), limit(limite));

  return onSnapshot(mensagensQuery, (snapshot) => {
    const alteracoes = snapshot.docChanges().map((change) => ({
      tipo: change.type,
      mensagem: { id: change.doc.id, ...change.doc.data() }
    }));
    callback(alteracoes, snapshot.metadata);
  });
}

export function escutarMetadataChat(chatId, callback, tipoChat = "projeto") {
  const chatCollection = getChatCollection(tipoChat);
  const chatRef = doc(db, chatCollection, chatId);

  return onSnapshot(chatRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }

    callback({ id: snap.id, ...snap.data() });
  });
}

export async function enviarMensagem(chatId, autorId, texto, tipoChat = "projeto") {
  const chatCollection = getChatCollection(tipoChat);
  const mensagensRef = collection(db, chatCollection, chatId, "mensagens");

  await addDoc(mensagensRef, {
    texto,
    autorId,
    criadoEm: serverTimestamp(),
    lida: false
  });

  const chatRef = doc(db, chatCollection, chatId);
  await updateDoc(chatRef, {
    ultimaMensagem: texto,
    ultimaMensagemAutorId: autorId,
    ultimaMensagemEm: serverTimestamp(),
    [`ultimoAcessoPor.${autorId}`]: serverTimestamp()
  });
}

export async function marcarChatComoLido(chatId, userId, tipoChat = "projeto") {
  const chatCollection = getChatCollection(tipoChat);
  const chatRef = doc(db, chatCollection, chatId);

  await updateDoc(chatRef, {
    [`ultimoAcessoPor.${userId}`]: serverTimestamp()
  });
}

export async function garantirChatEquipe({ equipeId, equipeNome, participantes = [] }) {
  if (!equipeId) throw new Error("Equipe inválida para criação do chat");

  const chatRef = doc(db, "chatsEquipe", equipeId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    const dados = chatSnap.data();
    const participantesAtuais = Array.isArray(dados.participants) ? dados.participants : [];
    const participantesNormalizados = [...new Set([...participantesAtuais, ...participantes])];

    await updateDoc(chatRef, {
      equipeNome: equipeNome || dados.equipeNome || "Equipe",
      participants: participantesNormalizados
    });

    return { id: chatRef.id, ...dados, participants: participantesNormalizados };
  }

  await setDoc(chatRef, {
    equipeId,
    equipeNome: equipeNome || "Equipe",
    tipo: "equipe",
    participants: [...new Set(participantes)],
    criadoEm: serverTimestamp(),
    ultimaMensagem: "",
    ultimaMensagemAutorId: "",
    ultimaMensagemEm: null,
    ultimoAcessoPor: {}
  });

  return { id: chatRef.id, equipeId, equipeNome: equipeNome || "Equipe", participants };
}
