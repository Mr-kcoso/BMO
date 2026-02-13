import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaChats");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Descobrir se é empresa ou freelancer
  const userSnap = await getDoc(doc(db, "usuarios", user.uid));
  const tipo = userSnap.data().tipo;

  const campo = tipo === "empresa" ? "empresaId" : "freelancerId";

  const q = query(
    collection(db, "chats"),
    where(campo, "==", user.uid)
  );

  const chatsSnap = await getDocs(q);

  lista.innerHTML = "";

  for (const chat of chatsSnap.docs) {
    const dados = chat.data();

    // Buscar problema
    const probSnap = await getDoc(doc(db, "problemas", dados.problemaId));
    const titulo = probSnap.exists()
      ? probSnap.data().titulo
      : "Problema removido";

    // Buscar nome do outro usuário
    const outroId = tipo === "empresa"
      ? dados.freelancerId
      : dados.empresaId;

    const outroSnap = await getDoc(doc(db, "usuarios", outroId));
    const outroNome = outroSnap.exists()
      ? outroSnap.data().nome
      : "Usuário";

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${titulo}</strong><br>
      Com: ${outroNome}<br>
      <button>Abrir chat</button>
      <hr>
    `;

    li.querySelector("button").addEventListener("click", () => {
      window.location.href = `chat.html?chatId=${chat.id}`;
    });

    lista.appendChild(li);
  }
});
