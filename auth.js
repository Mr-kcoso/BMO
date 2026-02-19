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

const loginForm = document.getElementById("loginForm");
const cadastroForm = document.getElementById("cadastroForm");
const tabLogin = document.getElementById("tabLogin");
const tabCadastro = document.getElementById("tabCadastro");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const cadastroEmail = document.getElementById("cadastroEmail");
const cadastroPassword = document.getElementById("cadastroPassword");
const tipo = document.getElementById("tipo");
const nome = document.getElementById("nome");
const msg = document.getElementById("msg");

function alternarAba(modo) {
  const loginAtivo = modo === "login";

  loginForm.classList.toggle("hidden", !loginAtivo);
  cadastroForm.classList.toggle("hidden", loginAtivo);

  tabLogin.classList.toggle("active", loginAtivo);
  tabCadastro.classList.toggle("active", !loginAtivo);

  tabLogin.setAttribute("aria-selected", String(loginAtivo));
  tabCadastro.setAttribute("aria-selected", String(!loginAtivo));

  msg.innerText = "";
}

tabLogin.addEventListener("click", () => alternarAba("login"));
tabCadastro.addEventListener("click", () => alternarAba("cadastro"));

cadastroForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!tipo.value) {
    msg.innerText = "Escolha o tipo de usuário";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      cadastroEmail.value,
      cadastroPassword.value
    );

    await setDoc(doc(db, "usuarios", cred.user.uid), {
      nome: nome.value,
      email: cadastroEmail.value,
      tipo: tipo.value,
      criadoEm: new Date()
    });

    msg.innerText = "Cadastro completo";
    alternarAba("login");
    loginEmail.value = cadastroEmail.value;
    cadastroForm.reset();
  } catch (error) {
    msg.innerText = error.message;
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      loginEmail.value,
      loginPassword.value
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
