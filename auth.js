import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const tipo = document.getElementById("tipo");
const msg = document.getElementById("msg");
const nome = document.getElementById("nome");

/* CADASTRO */
document.getElementById("btnCadastrar").addEventListener("click", async () => {
  if (!tipo.value) {
    msg.innerText = "Escolha o tipo de usuário";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    await setDoc(doc(db, "usuarios", cred.user.uid), {
      nome: nome.value,
      email: email.value,
      tipo: tipo.value,
      criadoEm: new Date()
    });

    msg.innerText = "Cadastro completo";
  } catch (error) {
    msg.innerText = error.message;
  }
});

/* LOGIN + REDIRECIONAMENTO */
document.getElementById("btnLogin").addEventListener("click", async () => {
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    const ref = doc(db, "usuarios", cred.user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const tipoUsuario = snap.data().tipo;

      if (tipoUsuario === "freelancer") {
        window.location.href = "dashboard-freelancer.html";
      } else if (tipoUsuario === "empresa") {
        window.location.href = "dashboard-empresa.html";
      }
    }

  } catch (error) {
    msg.innerText = error.message;
  }
});
