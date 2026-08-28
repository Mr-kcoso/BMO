import { observeAuthenticatedUser, getUserProfile } from "../services/authService.js";
import { escutarMetadataChat, garantirChatEquipe } from "../services/chatService.js";
import {
  convidarMembroEquipe,
  getEquipe,
  getRoleMembroEquipe,
  listarConvitesRecebidos,
  listarMembrosEquipe,
  alterarRoleMembroEquipe,
  removerMembroEquipe,
  sairDaEquipe,
  excluirEquipe
} from "../services/equipeService.js";
import { createElement, setButtonLoading, showToast } from "./utils.js";

const params = new URLSearchParams(window.location.search);
const equipeId = params.get("equipeId");

const equipeNome = document.getElementById("equipeNome");
const equipeDescricao = document.getElementById("equipeDescricao");
const equipeFoto = document.getElementById("equipeFoto");
const blocoAdmin = document.getElementById("blocoAdmin");
const inputNovoMembroId = document.getElementById("novoMembroId");
const btnAdicionarMembro = document.getElementById("btnAdicionarMembro");
const listaMembros = document.getElementById("listaMembros");
const btnAbrirChatEquipe = document.getElementById("btnAbrirChatEquipe");
const alertaChatEquipe = document.getElementById("alertaChatEquipe");
const blocoAcoesEquipe = document.getElementById("blocoAcoesEquipe");
const btnSairEquipe = document.getElementById("btnSairEquipe");
const btnExcluirEquipe = document.getElementById("btnExcluirEquipe");
const totalMembros = document.getElementById("totalMembros");
const totalAdmins = document.getElementById("totalAdmins");
const totalConvitesPendentes = document.getElementById("totalConvitesPendentes");
const buscaMembros = document.getElementById("buscaMembros");
const convitesAdminHint = document.getElementById("convitesAdminHint");

let currentUser = null;
let currentUserRole = null;
let currentEquipe = null;
let membrosAtuais = [];

function getDateValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function atualizarAlertaNovasMensagens(chatMetadata) {
  if (!alertaChatEquipe || !currentUser) return;

  if (!chatMetadata) {
    alertaChatEquipe.textContent = "";
    return;
  }

  const ultimaMensagemEm = getDateValue(chatMetadata.ultimaMensagemEm);
  const ultimoAcesso = getDateValue(chatMetadata?.ultimoAcessoPor?.[currentUser.uid]);

  alertaChatEquipe.textContent = ultimaMensagemEm > ultimoAcesso ? "🔔 Novas mensagens no chat da equipe" : "";
}

async function expulsarMembro(button, membroId) {
  if (!membroId || membroId === currentUser.uid) {
    showToast("Você não pode remover a si mesmo da equipe", "error");
    return;
  }

  const confirmar = window.confirm("Tem certeza que deseja expulsar este membro da equipe?");
  if (!confirmar) return;

  try {
    setButtonLoading(button, true, "Removendo...");
    await removerMembroEquipe(equipeId, membroId);
    showToast("Membro removido da equipe", "success");
    await renderMembros();
  } catch (error) {
    console.error(error);
    showToast(error?.message || "Não foi possível remover membro", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function alterarRoleMembro(button, membroId, role) {
  if (currentUserRole !== "admin") {
    showToast("Apenas administradores podem alterar papéis", "error");
    return;
  }

  if (membroId === currentEquipe?.criadorId) {
    showToast("O criador não pode ter o papel alterado", "error");
    return;
  }

  try {
    setButtonLoading(button, true, role === "admin" ? "Promovendo..." : "Rebaixando...");
    await alterarRoleMembroEquipe(equipeId, membroId, role);
    showToast(role === "admin" ? "Membro promovido a admin" : "Admin rebaixado a membro", "success");
    await renderMembros();
  } catch (error) {
    console.error(error);
    showToast(error?.message || "Não foi possível alterar o papel", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function sairEquipe() {
  const confirmar = window.confirm("Tem certeza que deseja sair desta equipe? Você perderá o acesso aos seus membros e ao chat da equipe.");
  if (!confirmar) return;

  try {
    setButtonLoading(btnSairEquipe, true, "Saindo...");
    await sairDaEquipe(equipeId, currentUser.uid);
    showToast("Você saiu da equipe", "success");
    window.location.href = "minhas-equipes.html";
  } catch (error) {
    console.error(error);
    showToast(error?.message || "Não foi possível sair da equipe", "error");
    setButtonLoading(btnSairEquipe, false);
  }
}

async function excluirEquipeAtual() {
  const confirmar = window.confirm("Tem certeza que deseja excluir esta equipe? Esta ação removerá a equipe, seus membros, convites e o histórico do chat e não poderá ser desfeita.");
  if (!confirmar) return;

  try {
    setButtonLoading(btnExcluirEquipe, true, "Excluindo...");
    await excluirEquipe(equipeId);
    showToast("Equipe excluída com sucesso", "success");
    window.location.href = "minhas-equipes.html";
  } catch (error) {
    console.error(error);
    showToast(error?.message || "Não foi possível excluir a equipe", "error");
    setButtonLoading(btnExcluirEquipe, false);
  }
}

async function renderMembros() {
  const membros = await listarMembrosEquipe(equipeId);
  membrosAtuais = membros;
  atualizarEstatisticas(membros);
  const perfis = await Promise.all(membros.map((membro) => getUserProfile(membro.userId)));
  listaMembros.innerHTML = "";

  const termo = (buscaMembros?.value || "").trim().toLowerCase();
  const membrosVisiveis = membros
    .map((membro, index) => ({ membro, perfil: perfis[index] }))
    .filter(({ membro, perfil }) =>
      !termo || membro.userId.toLowerCase().includes(termo) || perfil?.nome?.toLowerCase().includes(termo)
    );

  if (!membrosVisiveis.length) {
    listaMembros.appendChild(createElement("li", { className: "empresa-empty", text: "Equipe sem membros." }));
    return [];
  }

  membrosVisiveis.forEach(({ membro, perfil }) => {

    const item = createElement("li", { className: "empresa-candidatura-card" });
    const avatar = createElement("img");
    avatar.src = perfil?.fotoURL || perfil?.logoURL || "../assets/fotos/larva.jpeg";
    avatar.alt = perfil?.nome || membro.userId;
    avatar.className = "empresa-candidatura-avatar";

    const content = createElement("div", { className: "empresa-candidatura-content" });
    item.classList.add(`equipe-role-${membro.role === "admin" ? "admin" : "membro"}`);
    content.appendChild(createElement("h3", { text: perfil?.nome || membro.userId }));
    content.appendChild(createElement("p", { className: "empresa-candidatura-meta", text: `UID: ${membro.userId}` }));
    const papel = membro.userId === currentEquipe?.criadorId ? "Criador" : membro.role === "admin" ? "Administrador" : "Membro";
    content.appendChild(createElement("span", { className: `equipe-role-badge equipe-role-badge-${membro.role}`, text: papel }));

    if (currentUserRole === "admin" && membro.userId !== currentUser.uid) {
      const podeAlterarRole = membro.userId !== currentEquipe?.criadorId;
      if (podeAlterarRole) {
        const novoRole = membro.role === "admin" ? "membro" : "admin";
        const btnRole = createElement("button", {
          className: "empresa-secondary-btn",
          text: novoRole === "admin" ? "Promover a admin" : "Rebaixar a membro"
        });
        btnRole.addEventListener("click", () => alterarRoleMembro(btnRole, membro.userId, novoRole));
        content.appendChild(btnRole);
      }

      if (membro.role !== "admin") {
        const btnExpulsar = createElement("button", { className: "empresa-secondary-btn", text: "Expulsar membro" });
        btnExpulsar.addEventListener("click", () => expulsarMembro(btnExpulsar, membro.userId));
        content.appendChild(btnExpulsar);
      }
    }

    item.appendChild(avatar);
    item.appendChild(content);
    listaMembros.appendChild(item);
  });

  return membros.map((membro) => membro.userId);
}

function atualizarEstatisticas(membros) {
  if (totalMembros) totalMembros.textContent = membros.length;
  if (totalAdmins) totalAdmins.textContent = membros.filter((membro) => membro.role === "admin").length;
}

async function atualizarConvitesPendentes() {
  const convites = await listarConvitesRecebidos(currentUser.uid);
  if (totalConvitesPendentes) {
    totalConvitesPendentes.textContent = convites.filter(
      (convite) => convite.equipeId === equipeId && convite.status === "pendente"
    ).length;
  }
}

async function configurarChatEquipe(participantes) {
  if (!currentEquipe) return;

  await garantirChatEquipe({
    equipeId,
    equipeNome: currentEquipe.nome || "Equipe",
    participantes
  });

  escutarMetadataChat(equipeId, atualizarAlertaNovasMensagens, "equipe");
}

async function carregarEquipe() {
  if (!equipeId) {
    showToast("Equipe não informada", "error");
    window.location.href = "minhas-equipes.html";
    return;
  }

  const equipe = await getEquipe(equipeId);

  if (!equipe) {
    showToast("Equipe não encontrada", "error");
    window.location.href = "minhas-equipes.html";
    return;
  }

  currentEquipe = equipe;
  equipeNome.textContent = equipe.nome || "Equipe";
  equipeDescricao.textContent = equipe.descricao || "Sem descrição";
  equipeFoto.src = equipe.fotoEquipe || "../assets/fotos/larva.jpeg";

  currentUserRole = await getRoleMembroEquipe(equipeId, currentUser.uid);

  if (!currentUserRole) {
    showToast("Você não faz parte desta equipe", "error");
    window.location.href = "minhas-equipes.html";
    return;
  }

  const usuarioAdmin = currentUserRole === "admin";
  blocoAdmin.classList.toggle("hidden", !usuarioAdmin);
  blocoAdmin.hidden = !usuarioAdmin;
  if (convitesAdminHint) convitesAdminHint.hidden = usuarioAdmin;
  blocoAcoesEquipe?.classList.remove("hidden");
  btnSairEquipe?.classList.toggle("hidden", currentUserRole === "admin");
  btnExcluirEquipe?.classList.toggle("hidden", currentUserRole !== "admin");

  const participantes = await renderMembros();
  await atualizarConvitesPendentes();

  try {
    await configurarChatEquipe(participantes);
  } catch (error) {
    console.error(error);
    if (alertaChatEquipe) {
      alertaChatEquipe.textContent = "Não foi possível inicializar o chat da equipe agora.";
    }
  }
}

btnAbrirChatEquipe?.addEventListener("click", () => {
  window.location.href = `chat.html?chatId=${equipeId}&tipo=equipe`;
});

buscaMembros?.addEventListener("input", () => renderMembros());

btnSairEquipe?.addEventListener("click", sairEquipe);
btnExcluirEquipe?.addEventListener("click", excluirEquipeAtual);

btnAdicionarMembro.addEventListener("click", async () => {
  if (currentUserRole !== "admin") {
    showToast("Apenas administradores podem convidar membros", "error");
    return;
  }

  const novoMembroId = inputNovoMembroId.value.trim();

  if (!novoMembroId) {
    showToast("Informe o UID do usuário", "error");
    return;
  }

  try {
    setButtonLoading(btnAdicionarMembro, true, "Enviando convite...");
    await convidarMembroEquipe(equipeId, novoMembroId, currentUser.uid);
    inputNovoMembroId.value = "";
    showToast("Convite enviado com sucesso", "success");
  } catch (error) {
    console.error(error);
    showToast(error?.message || "Não foi possível enviar convite", "error");
  } finally {
    setButtonLoading(btnAdicionarMembro, false);
  }
});

observeAuthenticatedUser(
  async (user) => {
    currentUser = user;

    try {
      await carregarEquipe();
    } catch (error) {
      console.error(error);
      showToast("Erro ao carregar equipe", "error");
    }
  },
  () => {
    showToast("Faça login para acessar equipes", "error");
    window.location.href = "../../index.html";
  }
);
