import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const STATUS = {
  PENDENTE: "pendente",
  ACEITO: "aceito",
  RECUSADO: "recusado",
  CONCLUIDO: "concluido",
  CANCELADO: "cancelado"
};

export async function getProblemas() {
  const snapshot = await getDocs(collection(db, "problemas"));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function getCandidaturasByFreelancer(freelancerId) {
  const candidaturasQuery = query(
    collection(db, "candidaturas"),
    where("freelancerId", "==", freelancerId)
  );

  const snapshot = await getDocs(candidaturasQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function criarCandidatura({ problemaId, empresaId, freelancerId, freelancerNome }) {
  return addDoc(collection(db, "candidaturas"), {
    problemaId,
    empresaId,
    freelancerId,
    freelancerNome,
    status: STATUS.PENDENTE,
    criadoEm: new Date()
  });
}

export async function getComentariosByProblema(problemaId) {
  const comentariosSnapshot = await getDocs(
    collection(db, "problemas", problemaId, "comentarios")
  );

  return comentariosSnapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => getDateValue(b.criadoEm) - getDateValue(a.criadoEm));
}

export async function criarComentario({ problemaId, autorId, autorNome, texto }) {
  return addDoc(collection(db, "problemas", problemaId, "comentarios"), {
    autorId,
    autorNome,
    texto: texto.trim(),
    criadoEm: serverTimestamp()
  });
}

function getDateValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}
