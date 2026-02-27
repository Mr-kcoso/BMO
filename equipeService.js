import { db } from "./firebase.js";
import {
  collection,
  collectionGroup,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = "dom598ut1";
const CLOUDINARY_UPLOAD_PRESET = "bmo_unsigned_upload";

export async function uploadFotoEquipeCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(url, {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Erro ao enviar foto da equipe");
  }

  return data.secure_url;
}

export async function criarEquipe({ nome, descricao, criadorId, fotoEquipe = "" }) {
  const equipeRef = doc(collection(db, "equipes"));

  await setDoc(equipeRef, {
    nome,
    descricao,
    criadorId,
    fotoEquipe,
    createdAt: serverTimestamp()
  });

  const membroCriadorRef = doc(db, "equipes", equipeRef.id, "membros", criadorId);
  await setDoc(membroCriadorRef, {
    role: "admin",
    joinedAt: serverTimestamp()
  });

  return equipeRef.id;
}

export async function listarEquipesDoUsuario(userId) {
  const membrosQuery = query(collectionGroup(db, "membros"), where(documentId(), "==", userId));
  const membrosSnap = await getDocs(membrosQuery);

  const equipes = await Promise.all(
    membrosSnap.docs.map(async (membroDoc) => {
      const equipeRef = membroDoc.ref.parent.parent;
      if (!equipeRef) return null;
      const equipeSnap = await getDoc(equipeRef);
      if (!equipeSnap.exists()) return null;
      return {
        id: equipeSnap.id,
        ...equipeSnap.data(),
        role: membroDoc.data().role
      };
    })
  );

  return equipes.filter(Boolean);
}

export async function getEquipe(equipeId) {
  const equipeRef = doc(db, "equipes", equipeId);
  const equipeSnap = await getDoc(equipeRef);

  if (!equipeSnap.exists()) {
    return null;
  }

  return {
    id: equipeSnap.id,
    ...equipeSnap.data()
  };
}

export async function listarMembrosEquipe(equipeId) {
  const membrosRef = collection(db, "equipes", equipeId, "membros");
  const membrosSnap = await getDocs(membrosRef);

  return membrosSnap.docs.map((docSnap) => ({
    userId: docSnap.id,
    ...docSnap.data()
  }));
}

export async function adicionarMembroEquipe(equipeId, userId, role = "membro") {
  const membroRef = doc(db, "equipes", equipeId, "membros", userId);
  await setDoc(
    membroRef,
    {
      role,
      joinedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getRoleMembroEquipe(equipeId, userId) {
  const membroRef = doc(db, "equipes", equipeId, "membros", userId);
  const membroSnap = await getDoc(membroRef);

  if (!membroSnap.exists()) {
    return null;
  }

  return membroSnap.data().role || null;
}
