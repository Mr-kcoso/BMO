import { db } from "./firebase.js";
import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import { clearElement, createElement, showToast } from "./utils.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaChats");
const loading = document.getElementById("loadingChats");

async function carregarChats(user) {
  if (loading) loading.hidden = false;
  clearElement(lista);

  try {
    const perfil = await getUserProfile(user.uid);
    const tipo = perfil?.tipo;

    if (!tipo) {
      showToast("Perfil de usuário inválido", "error");
      return;
    }

    const campo = tipo === "empresa" ? "empresaId" : "freelancerId";
    const chatsQuery = query(collection(db, "chats"), where(campo, "==", user.uid));
    const chatsSnap = await getDocs(chatsQuery);

    for (const chatDoc of chatsSnap.docs) {
      const chat = { id: chatDoc.id, ...chatDoc.data() };

      const [problemaSnap, outroPerfil] = await Promise.all([
        getDoc(doc(db, "problemas", chat.problemaId)),
        getUserProfile(tipo === "empresa" ? chat.freelancerId : chat.empresaId)
      ]);

      const titulo = problemaSnap.exists() ? problemaSnap.data().titulo : "Problema removido";
      const outroNome = outroPerfil?.nome || "Usuário";

      const item = createElement("li", { className: "card card-list-item" });
      item.appendChild(createElement("strong", { text: titulo }));
      item.appendChild(createElement("p", { text: `Com: ${outroNome}` }));

      const btnAbrir = createElement("button", { text: "Abrir chat" });
      btnAbrir.addEventListener("click", () => {
        window.location.href = `chat.html?chatId=${chat.id}`;
      });

      item.appendChild(btnAbrir);
      lista.appendChild(item);
    }

    if (!lista.children.length) {
      lista.appendChild(createElement("p", { text: "Você ainda não possui chats." }));
    }
  } catch (error) {
    console.error(error);
    showToast("Falha ao carregar chats", "error");
  } finally {
    if (loading) loading.hidden = true;
  }
}

observeAuthenticatedUser(carregarChats, () => {
  window.location.href = "index.html";
});
