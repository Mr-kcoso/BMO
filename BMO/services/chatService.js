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
  runTransaction,
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

export async function listarPropostas(chatId) {
  const propostasRef = collection(db, "chats", chatId, "propostas");
  const propostasQuery = query(propostasRef, orderBy("criadoEm", "desc"));
  const snapshot = await getDocs(propostasQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function enviarProposta({ chatId, autorId, valor, prazo, observacao = "" }) {
  const chatRef = doc(db, "chats", chatId);
  const propostaRef = doc(collection(db, "chats", chatId, "propostas"));
  const valorNumerico = Number(valor);
  const observacaoLimpa = observacao.trim();
  const prazoLimpo = prazo || "";

  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
    throw new Error("Informe um valor válido.");
  }

  await runTransaction(db, async (transaction) => {
    const chatSnap = await transaction.get(chatRef);

    if (!chatSnap.exists()) {
      throw new Error("Chat não encontrado.");
    }

    const chat = chatSnap.data();

    if (chat.acordo?.status === "aceito") {
      throw new Error("A negociação já foi encerrada.");
    }

    const propostaAtual = chat.propostaAtual || null;
    let propostaAnteriorRef = null;
    let propostaAnteriorSnap = null;

    if (propostaAtual?.id && propostaAtual?.status === "pendente") {
      if (propostaAtual.autorId === autorId) {
        throw new Error("Aguarde a resposta da outra pessoa antes de enviar outra proposta.");
      }

      propostaAnteriorRef = doc(db, "chats", chatId, "propostas", propostaAtual.id);
      propostaAnteriorSnap = await transaction.get(propostaAnteriorRef);

      if (!propostaAnteriorSnap.exists() || propostaAnteriorSnap.data().status !== "pendente") {
        throw new Error("A proposta atual não está mais disponível.");
      }
    }

    const proposta = {
      autorId,
      valor: valorNumerico,
      prazo: prazoLimpo,
      observacao: observacaoLimpa,
      status: "pendente",
      criadoEm: serverTimestamp()
    };

    if (propostaAnteriorRef) {
      transaction.update(propostaAnteriorRef, {
        status: "substituida",
        substituidaEm: serverTimestamp(),
        substituidaPor: autorId
      });
    }

    transaction.set(propostaRef, proposta);
    transaction.update(chatRef, {
      propostaAtual: {
        id: propostaRef.id,
        autorId,
        valor: valorNumerico,
        prazo: prazoLimpo,
        observacao: observacaoLimpa,
        status: "pendente",
        criadoEm: serverTimestamp()
      },
      ultimaMensagem: `Nova proposta: R$ ${valorNumerico.toFixed(2).replace(".", ",")}`,
      ultimaMensagemAutorId: autorId,
      ultimaMensagemEm: serverTimestamp()
    });
  });

  return {
    id: propostaRef.id,
    autorId,
    valor: valorNumerico,
    prazo: prazoLimpo,
    observacao: observacaoLimpa,
    status: "pendente"
  };
}

export async function aceitarProposta({ chatId, propostaId, aceitoPor }) {
  const chatRef = doc(db, "chats", chatId);
  const propostaRef = doc(db, "chats", chatId, "propostas", propostaId);

  await runTransaction(db, async (transaction) => {
    const chatSnap = await transaction.get(chatRef);
    const propostaSnap = await transaction.get(propostaRef);

    if (!chatSnap.exists() || !propostaSnap.exists()) {
      throw new Error("Proposta ou chat não encontrado.");
    }

    const chat = chatSnap.data();
    const proposta = propostaSnap.data();

    if (chat.propostaAtual?.id !== propostaId) {
      throw new Error("Esta proposta não está mais disponível.");
    }

    if (proposta.status !== "pendente") {
      throw new Error("Esta proposta já foi respondida.");
    }

    if (proposta.autorId === aceitoPor) {
      throw new Error("Você não pode aceitar sua própria proposta.");
    }

    transaction.update(propostaRef, {
      status: "aceita",
      aceitaEm: serverTimestamp(),
      aceitaPor: aceitoPor
    });

    transaction.update(chatRef, {
      acordo: {
        propostaId,
        valorFinal: Number(proposta.valor),
        prazoFinal: proposta.prazo || "",
        status: "aceito",
        aceitoPor,
        aceitoEm: serverTimestamp()
      },
      propostaAtual: null,
      statusProjeto: "em_execucao",
      ultimaMensagem: "Proposta aceita. Acordo formalizado.",
      ultimaMensagemAutorId: aceitoPor,
      ultimaMensagemEm: serverTimestamp()
    });
  });
}

export async function recusarProposta({ chatId, propostaId, recusadoPor }) {
  const chatRef = doc(db, "chats", chatId);
  const propostaRef = doc(db, "chats", chatId, "propostas", propostaId);

  await runTransaction(db, async (transaction) => {
    const chatSnap = await transaction.get(chatRef);
    const propostaSnap = await transaction.get(propostaRef);

    if (!chatSnap.exists() || !propostaSnap.exists()) {
      throw new Error("Proposta ou chat não encontrado.");
    }

    const chat = chatSnap.data();
    const proposta = propostaSnap.data();

    if (chat.propostaAtual?.id !== propostaId) {
      throw new Error("Esta proposta não está mais disponível.");
    }

    if (proposta.status !== "pendente") {
      throw new Error("Esta proposta já foi respondida.");
    }

    if (proposta.autorId === recusadoPor) {
      throw new Error("Você não pode recusar sua própria proposta.");
    }

    transaction.update(propostaRef, {
      status: "recusada",
      recusadaEm: serverTimestamp(),
      recusadaPor: recusadoPor
    });

    transaction.update(chatRef, {
      propostaAtual: null,
      ultimaMensagem: "A proposta foi recusada. A negociação continua aberta.",
      ultimaMensagemAutorId: recusadoPor,
      ultimaMensagemEm: serverTimestamp()
    });
  });
}

export async function salvarGithubProjeto({ chatId, repositorioUrl, pullRequestUrl, autorId }) {
  await updateDoc(doc(db, "chats", chatId), {
    github: {
      repositorioUrl: repositorioUrl.trim(),
      pullRequestUrl: pullRequestUrl.trim(),
      atualizadoPor: autorId,
      atualizadoEm: serverTimestamp()
    }
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
