import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  getDocs,
  query,
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
