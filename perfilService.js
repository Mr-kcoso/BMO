import { db, storage } from "./firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDownloadURL, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

export async function getPerfil(userId) {
  const refDoc = doc(db, "usuarios", userId);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function salvarPerfil(userId, dados) {
  const refDoc = doc(db, "usuarios", userId);
  await setDoc(
    refDoc,
    {
      ...dados,
      atualizadoEm: serverTimestamp()
    },
    { merge: true }
  );
}

export async function uploadPerfilArquivo(userId, file, folder) {
  const caminho = `${folder}/${userId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, caminho);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
