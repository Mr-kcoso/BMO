import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
  const usuariosSnap = await getDocs(usuariosRef);

  const termoNormalizado = termo.trim().toLowerCase();
  const tipoNormalizado = String(tipo || "todos").toLowerCase();

  const normalizarTipoPerfil = (tipoPerfil) =>
    String(tipoPerfil || "")
      .trim()
      .toLowerCase() === "empresa"
      ? "empresa"
      : "freelancer";

  return usuariosSnap.docs
    .map((docSnap) => {
      const perfil = { id: docSnap.id, ...docSnap.data() };
      return {
        ...perfil,
        tipo: normalizarTipoPerfil(perfil.tipo)
      };
    })
    .filter((perfil) => {
      if (perfil.id === excluirUserId) return false;
      if (tipoNormalizado !== "todos" && perfil.tipo !== tipoNormalizado) return false;
      if (!termoNormalizado) return true;

      const camposBusca = [
        perfil.nome,
        perfil.areaAtuacao,
        perfil.bio,
        perfil.descricaoInstitucional,
        ...(Array.isArray(perfil.habilidades) ? perfil.habilidades : [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return camposBusca.includes(termoNormalizado);
    })
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
}
