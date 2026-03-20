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

const authSection = document.getElementById("authSection");
const abrirLoginTopo = document.getElementById("abrirLoginTopo");
const abrirCadastroHero = document.getElementById("abrirCadastroHero");
const abrirCadastroFinal = document.getElementById("abrirCadastroFinal");

function mostrarAutenticacao(modo = "login") {
  if (authSection) {
    authSection.hidden = false;
    authSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  alternarAba(modo);
}

function redirectByTipo(tipoUsuario) {
  if (tipoUsuario === "freelancer") {
    window.location.href = "dashboard-freelancer.html";
    return;
  }

  if (tipoUsuario === "empresa") {
    window.location.href = "dashboard-empresa.html";
    return;
  }

  msg.innerText = "Conta criada, mas o tipo de usuário está inválido.";
}

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
abrirLoginTopo?.addEventListener("click", () => mostrarAutenticacao("login"));
abrirCadastroHero?.addEventListener("click", () => mostrarAutenticacao("cadastro"));
abrirCadastroFinal?.addEventListener("click", () => mostrarAutenticacao("cadastro"));

cadastroForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!tipo.value) {
    msg.innerText = "Escolha o tipo de usuário";
    return;
  }

  try {
    const tipoSelecionado = tipo.value;
    const cred = await createUserWithEmailAndPassword(
      auth,
      cadastroEmail.value,
      cadastroPassword.value
    );

    const uidUsuario = `BMO-${cred.user.uid.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    await setDoc(doc(db, "usuarios", cred.user.uid), {
      nome: nome.value,
      email: cadastroEmail.value,
      tipo: tipoSelecionado,
      uidUsuario,
      criadoEm: new Date()
    });

    msg.innerText = "Cadastro completo";
    cadastroForm.reset();
    redirectByTipo(tipoSelecionado);
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

    if (!snap.exists()) {
      msg.innerText = "Seu perfil não foi encontrado no banco de dados.";
      return;
    }

    const tipoUsuario = snap.data().tipo;
    redirectByTipo(tipoUsuario);
  } catch (error) {
    msg.innerText = error.message;
  }
});
