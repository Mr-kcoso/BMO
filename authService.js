import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function observeAuthenticatedUser(onAuthenticated, onUnauthenticated) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onUnauthenticated?.();
      return;
    }

    onAuthenticated(user);
  });
}

export async function getUserProfile(userId) {
  const userRef = doc(db, "usuarios", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data();
}

export async function buscarPerfis({ termo = "", tipo = "todos", excluirUserId = "" } = {}) {
  const usuariosRef = collection(db, "usuarios");
  const usuariosQuery = tipo !== "todos" ? query(usuariosRef, where("tipo", "==", tipo)) : usuariosRef;
  const usuariosSnap = await getDocs(usuariosQuery);

  const termoNormalizado = termo.trim().toLowerCase();

  return usuariosSnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((perfil) => {
      if (perfil.id === excluirUserId) return false;
      if (!termoNormalizado) return true;

      const camposBusca = [perfil.nome, perfil.areaAtuacao, perfil.descricaoInstitucional]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return camposBusca.includes(termoNormalizado);
    })
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
}
