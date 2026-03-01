import { db } from "./firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = "dom598ut1";
const CLOUDINARY_UPLOAD_PRESET = "bmo_unsigned_upload";

function gerarUidUsuario(userId) {
  const prefixo = String(userId || "").slice(0, 6).toUpperCase();
  const aleatorio = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BMO-${prefixo}-${aleatorio}`;
}

export async function getPerfil(userId) {
  const refDoc = doc(db, "usuarios", userId);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function garantirUidUsuario(userId) {
  const refDoc = doc(db, "usuarios", userId);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) return null;

  const dados = snap.data();
  if (dados.uidUsuario) {
    return dados.uidUsuario;
  }

  const uidGerado = gerarUidUsuario(userId);
  await setDoc(
    refDoc,
    {
      uidUsuario: uidGerado,
      atualizadoEm: serverTimestamp()
    },
    { merge: true }
  );

  return uidGerado;
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
