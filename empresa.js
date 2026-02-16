import { auth, db } from "./firebase.js";
import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import { STATUS } from "./candidaturaService.js";
import { clearElement, createElement, formatStatus, setButtonLoading, showToast } from "./utils.js";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const titulo = document.getElementById("titulo");
const descricao = document.getElementById("descricao");
const tipoProblema = document.getElementById("tipoProblema");
const msg = document.getElementById("msg");
const lista = document.getElementById("candidaturas");
const loading = document.getElementById("loadingCandidaturas");
const btnPublicar = document.getElementById("btnPublicar");

async function publicarProblema() {
  const user = auth.currentUser;

  if (!user) {
    showToast("Usuário não autenticado", "error");
    return;
  }

  if (!titulo.value.trim() || !descricao.value.trim()) {
    showToast("Preencha título e descrição", "error");
    return;
  }

  try {
    setButtonLoading(btnPublicar, true, "Publicando...");

    await addDoc(collection(db, "problemas"), {
      titulo: titulo.value.trim(),
      descricao: descricao.value.trim(),
      tipo: tipoProblema.value,
      empresaId: user.uid,
      criadoEm: serverTimestamp()
    });

    msg.textContent = "Problema publicado com sucesso.";
    titulo.value = "";
    descricao.value = "";
    showToast("Problema publicado", "success");
  } catch (error) {
    console.error(error);
    showToast("Falha ao publicar problema", "error");
  } finally {
    setButtonLoading(btnPublicar, false);
  }
}

async function atualizarStatusCandidatura(candidaturaId, status) {
  await updateDoc(doc(db, "candidaturas", candidaturaId), { status });
}

async function aceitarCandidatura(candidatura, problemaId, empresaId) {
  const chatRef = await addDoc(collection(db, "chats"), {
    problemaId,
    empresaId,
    freelancerId: candidatura.freelancerId,
    criadoEm: serverTimestamp()
  });

  await updateDoc(doc(db, "candidaturas", candidatura.id), {
    status: STATUS.ACEITO,
    chatId: chatRef.id
  });

  window.location.href = `chat.html?chatId=${chatRef.id}`;
}

async function carregarCandidaturasEmpresa(user) {
  if (loading) loading.hidden = false;
  clearElement(lista);

  try {
    const problemasQuery = query(collection(db, "problemas"), where("empresaId", "==", user.uid));
    const problemasSnap = await getDocs(problemasQuery);

    for (const problemaDoc of problemasSnap.docs) {
      const problema = { id: problemaDoc.id, ...problemaDoc.data() };

      const candidaturasQuery = query(
        collection(db, "candidaturas"),
        where("problemaId", "==", problema.id)
      );

      const candidaturasSnap = await getDocs(candidaturasQuery);

      for (const candidaturaDoc of candidaturasSnap.docs) {
        const candidatura = { id: candidaturaDoc.id, ...candidaturaDoc.data() };
        const perfilFreelancer = await getUserProfile(candidatura.freelancerId);
        const nomeFreelancer = perfilFreelancer?.nome || "Usuário desconhecido";

        const item = createElement("li");
        item.className = "card card-list-item";

        item.appendChild(createElement("strong", { text: problema.titulo }));
        item.appendChild(createElement("p", { text: `Freelancer: ${nomeFreelancer}` }));
        item.appendChild(
          createElement("p", { text: `Status: ${formatStatus(candidatura.status || STATUS.PENDENTE)}` })
        );

        if (candidatura.status === STATUS.ACEITO && candidatura.chatId) {
          const btnChat = createElement("button", { text: "Abrir Chat" });
          btnChat.addEventListener("click", () => {
            window.location.href = `chat.html?chatId=${candidatura.chatId}`;
          });
          item.appendChild(btnChat);
        } else {
          const actions = createElement("div", { className: "button-row" });
          const btnAceitar = createElement("button", { text: "Aceitar" });
          const btnRecusar = createElement("button", { text: "Recusar" });

          btnAceitar.addEventListener("click", async () => {
            try {
              setButtonLoading(btnAceitar, true, "Aceitando...");
              btnRecusar.disabled = true;
              await aceitarCandidatura(candidatura, problema.id, user.uid);
            } catch (error) {
              console.error(error);
              showToast("Falha ao aceitar candidatura", "error");
              setButtonLoading(btnAceitar, false);
              btnRecusar.disabled = false;
            }
          });

          btnRecusar.addEventListener("click", async () => {
            try {
              setButtonLoading(btnRecusar, true, "Recusando...");
              btnAceitar.disabled = true;
              await atualizarStatusCandidatura(candidatura.id, STATUS.RECUSADO);
              showToast("Candidatura recusada", "info");
              await carregarCandidaturasEmpresa(user);
            } catch (error) {
              console.error(error);
              showToast("Falha ao recusar candidatura", "error");
              setButtonLoading(btnRecusar, false);
              btnAceitar.disabled = false;
            }
          });

          actions.appendChild(btnAceitar);
          actions.appendChild(btnRecusar);
          item.appendChild(actions);
        }

        lista.appendChild(item);
      }
    }

    if (!lista.children.length) {
      lista.appendChild(createElement("p", { text: "Nenhuma candidatura encontrada." }));
    }
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar candidaturas", "error");
  } finally {
    if (loading) loading.hidden = true;
  }
}

btnPublicar?.addEventListener("click", publicarProblema);

observeAuthenticatedUser(
  (user) => carregarCandidaturasEmpresa(user),
  () => {
    showToast("Faça login para acessar o dashboard", "error");
    window.location.href = "index.html";
  }
);
