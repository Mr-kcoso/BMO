import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const chatId = params.get("chatId");

const mensagensDiv = document.getElementById("mensagens");
const texto = document.getElementById("texto");
const btnEnviar = document.getElementById("btnEnviar");

onAuthStateChanged(auth, async (user) => {
  if (!user || !chatId) {
    alert("Acesso inválido");
    window.location.href = "index.html";
    return;
  }

  // 🔒 validar acesso ao chat
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    alert("Chat não encontrado");
    return;
  }

  const chat = chatSnap.data();

  if (user.uid !== chat.empresaId && user.uid !== chat.freelancerId) {
    alert("Você não faz parte deste chat");
    window.location.href = "index.html";
    return;
  }

  const mensagensRef = collection(db, "chats", chatId, "mensagens");
  const q = query(mensagensRef, orderBy("criadoEm"));

  onSnapshot(q, async (snapshot) => {
    mensagensDiv.innerHTML = "";

    for (const docMsg of snapshot.docs) {
      const m = docMsg.data();

      // buscar nome do autor
      const userRef = doc(db, "usuarios", m.autorId);
      const userSnap = await getDoc(userRef);

      const nome = userSnap.exists()
        ? userSnap.data().nome
        : "Usuário";

      const p = document.createElement("p");
      p.innerHTML = `<strong>${nome}:</strong> ${m.texto}`;
      mensagensDiv.appendChild(p);
    }
  });

  btnEnviar.addEventListener("click", async () => {
    if (!texto.value.trim()) return;

    await addDoc(mensagensRef, {
      texto: texto.value,
      autorId: user.uid,
      criadoEm: serverTimestamp()
    });

    texto.value = "";
  });
});
