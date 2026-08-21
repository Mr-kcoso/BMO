import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
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

export function escutarMensagens(chatId, callback, tipoChat = "projeto") {
  const chatCollection = getChatCollection(tipoChat);
  const mensagensRef = collection(db, chatCollection, chatId, "mensagens");
  const mensagensQuery = query(mensagensRef, orderBy("criadoEm"));

  return onSnapshot(mensagensQuery, (snapshot) => {
    const mensagens = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(mensagens);
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

    const novoNome = equipeNome || dados.equipeNome || "Equipe";
    const nomeDiferente = dados.equipeNome !== novoNome;

    // Check if current participants match the normalized list
    const setAtuais = new Set(participantesAtuais);
    const setNovos = new Set(participantesNormalizados);

    let participantesMudaram = setAtuais.size !== setNovos.size;
    if (!participantesMudaram) {
      for (const p of setNovos) {
        if (!setAtuais.has(p)) {
          participantesMudaram = true;
          break;
        }
      }
    }

    if (nomeDiferente || participantesMudaram) {
      await updateDoc(chatRef, {
        equipeNome: novoNome,
        participants: participantesNormalizados
      });
    }

    return { id: chatRef.id, ...dados, equipeNome: novoNome, participants: participantesNormalizados };
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

  return { id: chatRef.id, equipeId, equipeNome: equipeNome || "Equipe", participants: [...new Set(participantes)] };
}

export async function buscarMensagensRecentes(chatId, limite = 30, tipoChat = "projeto") {
  const chatCollection = getChatCollection(tipoChat);
  const mensagensRef = collection(db, chatCollection, chatId, "mensagens");
  const mensagensQuery = query(mensagensRef, orderBy("criadoEm", "desc"), limit(limite));

  const snap = await getDocs(mensagensQuery);
  return snap;
}

export async function buscarMensagensHistoricas(chatId, cursorDoc, limite = 30, tipoChat = "projeto") {
  const chatCollection = getChatCollection(tipoChat);
  const mensagensRef = collection(db, chatCollection, chatId, "mensagens");
  const mensagensQuery = query(mensagensRef, orderBy("criadoEm", "desc"), startAfter(cursorDoc), limit(limite));

  const snap = await getDocs(mensagensQuery);
  return snap;
}

export function escutarNovasMensagens(chatId, cursorDoc, callback, tipoChat = "projeto") {
  const chatCollection = getChatCollection(tipoChat);
  const mensagensRef = collection(db, chatCollection, chatId, "mensagens");

  let mensagensQuery;
  if (cursorDoc) {
    mensagensQuery = query(mensagensRef, orderBy("criadoEm", "asc"), startAfter(cursorDoc));
  } else {
    mensagensQuery = query(mensagensRef, orderBy("criadoEm", "asc"));
  }

  return onSnapshot(mensagensQuery, (snapshot) => {
    const mensagens = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(mensagens, snapshot.docs);
  });
}
