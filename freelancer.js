import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("lista");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Faça login");
    window.location.href = "index.html";
    return;
  }

  // Dados do freelancer
  const userRef = doc(db, "usuarios", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    alert("Dados do usuário não encontrados");
    return;
  }

  const freelancerNome = userSnap.data().nome;

  // Listar problemas
  const problemasSnap = await getDocs(collection(db, "problemas"));

  lista.innerHTML = "";

  for (const prob of problemasSnap.docs) {
    const dados = prob.data();

    // Verifica se já existe candidatura
    const qCand = query(
      collection(db, "candidaturas"),
      where("problemaId", "==", prob.id),
      where("freelancerId", "==", user.uid)
    );

    const candSnap = await getDocs(qCand);
    const li = document.createElement("li");

    // JÁ CANDIDATOU
    if (!candSnap.empty) {
      const candidatura = candSnap.docs[0].data();

      li.innerHTML = `
        <strong>${dados.titulo}</strong><br>
        ${dados.descricao}<br>
        Status: <strong>${candidatura.status}</strong><br>
        ${
          candidatura.status === "aceito"
            ? `<button class="chat">Abrir Chat</button>`
            : candidatura.status === "recusado"
              ? `<em>Candidatura recusada</em>`
              : `<em>Aguardando resposta</em>`
        }
        <hr>
      `;

      if (candidatura.status === "aceito") {
        li.querySelector(".chat").addEventListener("click", () => {
          window.location.href = `chat.html?chatId=${candidatura.chatId}`;
        });
      }

    }
    // AINDA NÃO CANDIDATOU
    else {
      li.innerHTML = `
        <strong>${dados.titulo}</strong><br>
        ${dados.descricao}<br>
        <button class="candidatar">Candidatar-se</button>
        <hr>
      `;

      li.querySelector(".candidatar").addEventListener("click", async () => {
        await addDoc(collection(db, "candidaturas"), {
          problemaId: prob.id,
          empresaId: dados.empresaId,
          freelancerId: user.uid,
          freelancerNome: freelancerNome,
          status: "pendente",
          criadoEm: new Date()
        });

        alert("Candidatura enviada");
        window.location.reload();
      });
    }

    lista.appendChild(li);
  }
});
