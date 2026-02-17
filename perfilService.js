import { db, storage } from "./firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const UPLOAD_TIMEOUT_MS = 25000;

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
  const task = uploadBytesResumable(storageRef, file);

  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      task.cancel();
      reject(new Error("Upload excedeu o tempo limite. Verifique sua conexão e tente novamente."));
    }, UPLOAD_TIMEOUT_MS);

    task.on(
      "state_changed",
      null,
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
      () => {
        clearTimeout(timeoutId);
        resolve();
      }
    );
  });

  return getDownloadURL(task.snapshot.ref);
}
