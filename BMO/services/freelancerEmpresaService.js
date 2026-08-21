import { db } from "./firebase.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function favoritosRef(empresaId) {
  return collection(db, "empresas", empresaId, "freelancersSalvos");
}

export async function listarFreelancersSalvos(empresaId) {
  const snapshot = await getDocs(favoritosRef(empresaId));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function salvarFreelancer(empresaId, freelancer) {
  if (!empresaId || !freelancer?.id) throw new Error("Freelancer não informado");

  await setDoc(doc(db, "empresas", empresaId, "freelancersSalvos", freelancer.id), {
    freelancerId: freelancer.id,
    salvoEm: serverTimestamp()
  });
}

export async function removerFreelancerSalvo(empresaId, freelancerId) {
  await deleteDoc(doc(db, "empresas", empresaId, "freelancersSalvos", freelancerId));
}

export async function listarProjetosDaEmpresa(empresaId) {
  const snapshot = await getDocs(query(collection(db, "problemas"), where("empresaId", "==", empresaId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function convidarFreelancerParaProjeto({ empresaId, freelancerId, projeto }) {
  if (!empresaId || !freelancerId || !projeto?.id) throw new Error("Dados do convite incompletos");

  await setDoc(doc(db, "convitesProjeto", `${projeto.id}_${freelancerId}`), {
    empresaId,
    freelancerId,
    projetoId: projeto.id,
    projetoTitulo: projeto.titulo || "Projeto BMO",
    status: "pendente",
    criadoEm: serverTimestamp()
  });
}
