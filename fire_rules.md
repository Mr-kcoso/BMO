import { observeAuthenticatedUser, getUserProfile } from "../services/authService.js";
import { aceitarPedidoAmizade, enviarPedidoAmizade, getAmizade } from "../services/amizadeService.js";
import { createElement, showToast } from "../scripts/utils.js";

const params = new URLSearchParams(window.location.search);
const userId = params.get("userId");

const titulo = document.getElementById("perfilPublicoTitulo");
const subtitulo = document.getElementById("perfilPublicoSubtitulo");
const foto = document.getElementById("perfilPublicoFoto");
const tipo = document.getElementById("perfilPublicoTipo");
const nome = document.getElementById("perfilPublicoNome");
const uidPublico = document.getElementById("perfilPublicoUid");
const bio = document.getElementById("perfilPublicoBio");
const area = document.getElementById("perfilPublicoArea");
const disponibilidade = document.getElementById("perfilPublicoDisponibilidade");
const localizacao = document.getElementById("perfilPublicoLocalizacao");
const habilidades = document.getElementById("perfilPublicoHabilidades");
const links = document.getElementById("perfilPublicoLinks");
const amizadeAcao = document.getElementById("perfilPublicoAmizadeAcao");

function setText(element, text) {
  if (element) element.textContent = text;
}

function adicionarLink(label, href) {
  if (!links || !href) return;

  const link = createElement("a", {
    className: "chats-nav-btn perfil-publico-link",
    text: label
  });
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  links.appendChild(link);
}

function renderTextoAmizade(texto) {
  if (!amizadeAcao) return;
  amizadeAcao.innerHTML = "";
  amizadeAcao.appendChild(createElement("p", { className: "perfil-publico-text", text: texto }));
}

function renderBotaoAmizade(texto, onClick) {
  if (!amizadeAcao) return;
  amizadeAcao.innerHTML = "";

  const botao = createElement("button", { className: "chats-nav-btn", text: texto });
  botao.addEventListener("click", onClick);
  amizadeAcao.appendChild(botao);
}

async function carregarEstadoAmizade(usuarioLogadoId) {
  if (!usuarioLogadoId || !userId || usuarioLogadoId === userId) {
    renderTextoAmizade("");
    return;
  }

  const amizade = await getAmizade(usuarioLogadoId, userId);

  if (!amizade) {
    renderBotaoAmizade("Adicionar amigo", async () => {
      try {
        await enviarPedidoAmizade(usuarioLogadoId, userId);
        showToast("Pedido de amizade enviado", "success");
        await carregarEstadoAmizade(usuarioLogadoId);
      } catch (error) {
        console.error(error);
        showToast("Não foi possível enviar o pedido", "error");
      }
    });
    return;
  }

  if (amizade.status === "aceita") {
    renderTextoAmizade("Amigos");
    return;
  }

  if (amizade.status === "pendente" && amizade.userB === usuarioLogadoId) {
    renderBotaoAmizade("Aceitar", async () => {
      try {
        await aceitarPedidoAmizade(amizade.id);
        showToast("Amizade aceita", "success");
        await carregarEstadoAmizade(usuarioLogadoId);
      } catch (error) {
        console.error(error);
        showToast("Não foi possível aceitar o pedido", "error");
      }
    });
    return;
  }

  renderTextoAmizade("Solicitação pendente");
}

async function carregarPerfilPublico(usuarioLogado) {
  if (!userId) {
    showToast("Perfil não informado", "error");
    window.history.back();
    return;
  }

  const perfil = await getUserProfile(userId);

  if (!perfil) {
    showToast("Perfil não encontrado", "error");
    window.history.back();
    return;
  }

  const tipoPerfil = perfil.tipo === "empresa" ? "Empresa" : "Freelancer";

  setText(titulo, `Perfil de ${perfil.nome || "Usuário"}`);
  setText(subtitulo, "Use estes dados para validar experiência, disponibilidade e fit.");
  setText(tipo, tipoPerfil);
  setText(nome, perfil.nome || "Usuário");
  setText(uidPublico, `UID: ${perfil.uidUsuario || userId}`);

  if (foto) {
    foto.src = perfil.fotoURL || perfil.logoURL || "../assets/fotos/larva.jpeg";
  }

  if (perfil.tipo === "empresa") {
    setText(bio, perfil.descricaoInstitucional || "Empresa sem descrição institucional.");
    setText(area, perfil.site ? `Site: ${perfil.site}` : "Site não informado.");
    setText(disponibilidade, "");
    setText(localizacao, perfil.localizacao ? `Localização: ${perfil.localizacao}` : "Localização não informada.");
    setText(habilidades, "");
    adicionarLink("Site", perfil.site);
    adicionarLink("LinkedIn", perfil.linkedin);
  } else {
    setText(bio, perfil.bio || "Freelancer sem bio.");
    setText(area, perfil.areaAtuacao ? `Área de atuação: ${perfil.areaAtuacao}` : "Área de atuação não informada.");
    setText(
      disponibilidade,
      perfil.disponibilidade ? `Disponibilidade: ${perfil.disponibilidade}` : "Disponibilidade não informada."
    );
    setText(localizacao, "");
    setText(
      habilidades,
      Array.isArray(perfil.habilidades) && perfil.habilidades.length
        ? `Habilidades: ${perfil.habilidades.join(", ")}`
        : "Habilidades não informadas."
    );
    adicionarLink("LinkedIn", perfil.linkedin);
    adicionarLink("GitHub", perfil.github);
  }

  if (links && !links.children.length) {
    links.appendChild(createElement("p", { className: "perfil-publico-text", text: "Nenhum link informado." }));
  }

  await carregarEstadoAmizade(usuarioLogado.uid);
}

observeAuthenticatedUser(
  async (user) => {
    try {
      await carregarPerfilPublico(user);
    } catch (error) {
      console.error(error);
      showToast("Falha ao carregar perfil público", "error");
    }
  },
  () => {
    showToast("Faça login para visualizar o perfil", "error");
    window.location.href = "index.html";
  }
);
