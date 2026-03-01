import { db } from "./firebase.js";
import {
  collection,
  collectionGroup,
  doc,
  documentId,
  getDocs,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch
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
  const membroCriadorRef = doc(db, "equipes", equipeRef.id, "membros", criadorId);

  const batch = writeBatch(db);

  batch.set(equipeRef, {
    nome,
    descricao,
    criadorId,
    fotoEquipe,
    createdAt: serverTimestamp()
  });

  batch.set(membroCriadorRef, {
    role: "admin",
    joinedAt: serverTimestamp()
  });

  await batch.commit();

  return equipeRef.id;
}

export async function listarEquipesDoUsuario(userId) {
  try {
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
  } catch (error) {
    try {
      const equipesCriadasQuery = query(collection(db, "equipes"), where("criadorId", "==", userId));
      const equipesCriadasSnap = await getDocs(equipesCriadasQuery);

      return equipesCriadasSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        role: "admin"
      }));
    } catch (fallbackError) {
      console.error("Falha ao listar equipes no principal e fallback", error, fallbackError);
      return [];
    }
  }
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

export async function convidarMembroEquipe(equipeId, convidadoId, convidadoPorId) {
  if (!equipeId || !convidadoId || !convidadoPorId) {
    throw new Error("Dados obrigatórios do convite não informados");
  }

  if (convidadoId === convidadoPorId) {
    throw new Error("Você já faz parte dessa equipe");
  }

  const membroRef = doc(db, "equipes", equipeId, "membros", convidadoId);
  const membroSnap = await getDoc(membroRef);
  if (membroSnap.exists()) {
    throw new Error("Usuário já participa da equipe");
  }

  const usuarioRef = doc(db, "usuarios", convidadoId);
  const usuarioSnap = await getDoc(usuarioRef);
  if (!usuarioSnap.exists()) {
    throw new Error("Usuário convidado não encontrado");
  }

  const equipe = await getEquipe(equipeId);

  const conviteRef = doc(db, "convitesEquipe", `${equipeId}_${convidadoId}`);
  await setDoc(
    conviteRef,
    {
      equipeId,
      equipeNome: equipe?.nome || "Equipe",
      convidadoId,
      convidadoPorId,
      status: "pendente",
      createdAt: serverTimestamp(),
      respondedAt: null
    },
    { merge: true }
  );
}

export async function listarConvitesRecebidos(userId) {
  const convitesRef = collection(db, "convitesEquipe");
  const convitesQuery = query(convitesRef, where("convidadoId", "==", userId), orderBy("createdAt", "desc"));
  const convitesSnap = await getDocs(convitesQuery);

  return convitesSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function responderConviteEquipe(conviteId, resposta, userId) {
  if (!conviteId || !resposta || !userId) {
    throw new Error("Dados obrigatórios da resposta não informados");
  }

  if (!["aceito", "recusado"].includes(resposta)) {
    throw new Error("Resposta de convite inválida");
  }

  const conviteRef = doc(db, "convitesEquipe", conviteId);
  const conviteSnap = await getDoc(conviteRef);

  if (!conviteSnap.exists()) {
    throw new Error("Convite não encontrado");
  }

  const convite = conviteSnap.data();
  if (convite.convidadoId !== userId) {
    throw new Error("Você não pode responder este convite");
  }

  if (convite.status !== "pendente") {
    throw new Error("Este convite já foi respondido");
  }

  const batch = writeBatch(db);

  batch.update(conviteRef, {
    status: resposta,
    respondedAt: serverTimestamp()
  });

  if (resposta === "aceito") {
    const membroRef = doc(db, "equipes", convite.equipeId, "membros", userId);
    batch.set(
      membroRef,
      {
        role: "membro",
        joinedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  await batch.commit();
}

export async function getRoleMembroEquipe(equipeId, userId) {
  const membroRef = doc(db, "equipes", equipeId, "membros", userId);
  const membroSnap = await getDoc(membroRef);

  if (!membroSnap.exists()) {
    return null;
  }

  return membroSnap.data().role || null;
}
