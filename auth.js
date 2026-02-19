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

const tabLogin = document.getElementById("tabLogin");
const tabCadastro = document.getElementById("tabCadastro");
const formLogin = document.getElementById("formLogin");
const formCadastro = document.getElementById("formCadastro");
const msg = document.getElementById("msg");

const loginEmail = document.getElementById("loginEmail");
const loginSenha = document.getElementById("loginSenha");

const cadastroNome = document.getElementById("cadastroNome");
const cadastroEmail = document.getElementById("cadastroEmail");
const cadastroSenha = document.getElementById("cadastroSenha");
const tipo = document.getElementById("tipo");

function trocarAba(aba) {
  const loginAtivo = aba === "login";

  tabLogin.classList.toggle("active", loginAtivo);
  tabCadastro.classList.toggle("active", !loginAtivo);

  formLogin.hidden = !loginAtivo;
  formCadastro.hidden = loginAtivo;

  msg.textContent = "";
}

function mostrarErro(error) {
  msg.textContent = error?.message || "Ocorreu um erro inesperado.";
}

async function redirecionarPorTipo(uid) {
  const ref = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    msg.textContent = "Perfil de usuário não encontrado.";
    return;
  }

  const tipoUsuario = snap.data().tipo;

  if (tipoUsuario === "freelancer") {
    window.location.href = "dashboard-freelancer.html";
  } else if (tipoUsuario === "empresa") {
    window.location.href = "dashboard-empresa.html";
  } else {
    msg.textContent = "Tipo de usuário inválido.";
  }
}

formCadastro.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!tipo.value) {
    msg.textContent = "Escolha o tipo de conta.";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      cadastroEmail.value.trim(),
      cadastroSenha.value
    );

    await setDoc(doc(db, "usuarios", cred.user.uid), {
      nome: cadastroNome.value.trim(),
      email: cadastroEmail.value.trim(),
      tipo: tipo.value,
      criadoEm: new Date()
    });

    msg.textContent = "Cadastro realizado com sucesso!";
    trocarAba("login");
    loginEmail.value = cadastroEmail.value.trim();
    loginSenha.value = "";
  } catch (error) {
    mostrarErro(error);
  }
});

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      loginEmail.value.trim(),
      loginSenha.value
    );

    await redirecionarPorTipo(cred.user.uid);
  } catch (error) {
    mostrarErro(error);
  }
});

tabLogin.addEventListener("click", () => trocarAba("login"));
tabCadastro.addEventListener("click", () => trocarAba("cadastro"));
