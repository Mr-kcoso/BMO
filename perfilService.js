import { app, db, STORAGE_BUCKET_CANDIDATES } from "./firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const CLOUDINARY_CLOUD_NAME = "dom598ut1";
const CLOUDINARY_UPLOAD_PRESET = "bmo_unsigned_upload";

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

async function executarUploadResumable(storageInstance, caminho, file, metadata) {
  const storageRef = ref(storageInstance, caminho);
  const task = uploadBytesResumable(storageRef, file, metadata);

  await new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      null,
      (error) => reject(error),
      () => resolve()
    );
  });

  return getDownloadURL(task.snapshot.ref);
}

async function executarUploadDireto(storageInstance, caminho, file, metadata) {
  const storageRef = ref(storageInstance, caminho);
  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
}

export async function uploadArquivoPerfil(userId, file, folder) {
  const caminho = `${folder}/${userId}/${Date.now()}-${file.name}`;
  const metadata = {
    contentType: inferirContentType(file),
    customMetadata: { ownerId: userId }
  };

  const erros = [];

  for (const bucketUrl of STORAGE_BUCKET_CANDIDATES) {
    const storageInstance = getStorage(app, bucketUrl);

    try {
      const url = await executarUploadResumable(storageInstance, caminho, file, metadata);
      return url;
    } catch (errorResumable) {
      erros.push({
        bucketUrl,
        strategy: "resumable",
        code: errorResumable?.code || "sem-codigo",
        message: errorResumable?.message || "Falha no upload resumable"
      });

      try {
        const url = await executarUploadDireto(storageInstance, caminho, file, metadata);
        return url;
      } catch (errorDireto) {
        erros.push({
          bucketUrl,
          strategy: "direct",
          code: errorDireto?.code || "sem-codigo",
          message: errorDireto?.message || "Falha no upload direto"
        });
      }
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

export async function uploadImagemCloudinary(file) {
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
    const erro = new Error(data.error?.message || "Erro no upload da imagem");
    erro.code = "cloudinary/upload-error";
    erro.details = data;
    throw erro;
  }

  return data.secure_url;
}
