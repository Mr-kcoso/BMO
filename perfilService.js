import { app, db, STORAGE_BUCKET_CANDIDATES } from "./firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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

function inferirContentType(file) {
  if (file.type) return file.type;

  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function executarUpload(storageInstance, caminho, file, metadata) {
  const storageRef = ref(storageInstance, caminho);
  const task = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      null,
      (error) => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

export async function uploadPerfilArquivo(userId, file, folder) {
  const caminho = `${folder}/${userId}/${Date.now()}-${file.name}`;
  const metadata = {
    contentType: inferirContentType(file),
    customMetadata: { ownerId: userId }
  };

  const erros = [];

  for (const bucketUrl of STORAGE_BUCKET_CANDIDATES) {
    try {
      const storageInstance = getStorage(app, bucketUrl);
      const url = await executarUpload(storageInstance, caminho, file, metadata);
      return url;
    } catch (error) {
      erros.push({
        bucketUrl,
        code: error?.code || "sem-codigo",
        message: error?.message || "Falha no upload"
      });
    }
  }

  const erro = new Error(
    `Falha no upload em todos os buckets. Detalhes: ${erros
      .map((e) => `[${e.bucketUrl}] ${e.code}`)
      .join(" | ")}`
  );

  erro.code = erros[0]?.code;
  erro.details = erros;

  throw erro;
}
