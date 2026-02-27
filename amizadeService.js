import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function buildAmizadeId(userIdA, userIdB) {
  return [userIdA, userIdB].sort().join("_");
}

export async function getAmizade(userIdA, userIdB) {
  const amizadeId = buildAmizadeId(userIdA, userIdB);
  const amizadeRef = doc(db, "amizades", amizadeId);
  const amizadeSnap = await getDoc(amizadeRef);

  if (!amizadeSnap.exists()) {
    return null;
  }

  return {
    id: amizadeSnap.id,
    ...amizadeSnap.data()
  };
}

export async function enviarPedidoAmizade(remetenteId, destinatarioId) {
  if (!remetenteId || !destinatarioId || remetenteId === destinatarioId) {
    throw new Error("Usuário inválido para amizade");
  }

  const amizadeId = buildAmizadeId(remetenteId, destinatarioId);
  const amizadeRef = doc(db, "amizades", amizadeId);
  const amizadeSnap = await getDoc(amizadeRef);

  if (amizadeSnap.exists()) {
    return {
      id: amizadeId,
      ...amizadeSnap.data(),
      alreadyExists: true
    };
  }

  await setDoc(amizadeRef, {
    userA: remetenteId,
    userB: destinatarioId,
    status: "pendente",
    createdAt: serverTimestamp()
  });

  return {
    id: amizadeId,
    userA: remetenteId,
    userB: destinatarioId,
    status: "pendente",
    alreadyExists: false
  };
}

export async function aceitarPedidoAmizade(amizadeId) {
  const amizadeRef = doc(db, "amizades", amizadeId);
  await updateDoc(amizadeRef, { status: "aceita" });
}

export async function listarAmigos(userId) {
  const amizadeRef = collection(db, "amizades");
  const amizadeQueryUserA = query(
    amizadeRef,
    where("status", "==", "aceita"),
    where("userA", "==", userId)
  );
  const amizadeQueryUserB = query(
    amizadeRef,
    where("status", "==", "aceita"),
    where("userB", "==", userId)
  );

  const [amizadeSnapUserA, amizadeSnapUserB] = await Promise.all([
    getDocs(amizadeQueryUserA),
    getDocs(amizadeQueryUserB)
  ]);

  const mapAmizades = new Map();

  amizadeSnapUserA.docs.forEach((docSnap) => {
    mapAmizades.set(docSnap.id, {
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  amizadeSnapUserB.docs.forEach((docSnap) => {
    mapAmizades.set(docSnap.id, {
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  return Array.from(mapAmizades.values());
}

export async function listarSolicitacoesPendentes(userId) {
  const amizadeRef = collection(db, "amizades");
  const pendentesQuery = query(amizadeRef, where("status", "==", "pendente"), where("userB", "==", userId));
  const pendentesSnap = await getDocs(pendentesQuery);

  return pendentesSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}
