import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  addDoc,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const titulo = document.getElementById("titulo");
const descricao = document.getElementById("descricao");
const tipoProblema = document.getElementById("tipoProblema");
const msg = document.getElementById("msg");
const lista = document.getElementById("candidaturas");

/* PUBLICAR PROBLEMA */
document.getElementById("btnPublicar").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    msg.innerText = "Usuário não autenticado";
    return;
  }

  await addDoc(collection(db, "problemas"), {
    titulo: titulo.value,
    descricao: descricao.value,
    tipo: tipoProblema.value,
    empresaId: user.uid,
    criadoEm: serverTimestamp()
  });

  msg.innerText = "Problema publicado";
  titulo.value = "";
  descricao.value = "";
});

/* LISTAR CANDIDATURAS */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  lista.innerHTML = "";

  const q = query(
    collection(db, "problemas"),
    where("empresaId", "==", user.uid)
  );

  const problemasSnap = await getDocs(q);

  for (const prob of problemasSnap.docs) {
    const q2 = query(
      collection(db, "candidaturas"),
      where("problemaId", "==", prob.id)
    );

    const candsSnap = await getDocs(q2);

    for (const c of candsSnap.docs) {
      const dados = c.data();

      // buscar nome do freelancer
      const userRef = doc(db, "usuarios", dados.freelancerId);
      const userSnap = await getDoc(userRef);

      const nomeFreelancer = userSnap.exists()
        ? userSnap.data().nome
        : "Usuário desconhecido";

      const li = document.createElement("li");

      li.innerHTML = `
        <strong>${prob.data().titulo}</strong><br>
        Freelancer: ${nomeFreelancer}<br>
        Status: ${dados.status || "pendente"}<br>
        ${
          dados.status === "aceito"
            ? `<button class="chat">Abrir Chat</button>`
            : `
              <button class="aceitar">Aceitar</button>
              <button class="recusar">Recusar</button>
            `
        }
        <hr>
      `;

      /* ACEITAR */
      if (dados.status !== "aceito") {
        li.querySelector(".aceitar").addEventListener("click", async () => {
          // criar chat
          const chatRef = await addDoc(collection(db, "chats"), {
            problemaId: prob.id,
            empresaId: user.uid,
            freelancerId: dados.freelancerId,
            criadoEm: serverTimestamp()
          });

          // atualizar candidatura
          await updateDoc(doc(db, "candidaturas", c.id), {
            status: "aceito",
            chatId: chatRef.id
          });

          window.location.href = `chat.html?chatId=${chatRef.id}`;
        });

        /* RECUSAR */
        li.querySelector(".recusar").addEventListener("click", async () => {
          await updateDoc(doc(db, "candidaturas", c.id), {
            status: "recusado"
          });

          alert("Candidatura recusada");
        });
      } else {
        li.querySelector(".chat").addEventListener("click", () => {
          window.location.href = `chat.html?chatId=${dados.chatId}`;
        });
      }

      lista.appendChild(li);
    }
  }
});
