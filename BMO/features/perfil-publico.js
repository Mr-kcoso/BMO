import { observeAuthenticatedUser, getUserProfile } from "../services/authService.js";
import { aceitarPedidoAmizade, enviarPedidoAmizade, getAmizade } from "../services/amizadeService.js";
import { salvarFreelancer, removerFreelancerSalvo, listarFreelancersSalvos, listarProjetosDaEmpresa, convidarFreelancerParaProjeto } from "../services/freelancerEmpresaService.js";
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

function renderDoisBotoes(texto1, onClick1, texto2, onClick2) {
  if (!amizadeAcao) return;
  amizadeAcao.innerHTML = "";

  const container = createElement("div", { className: "perfil-publico-acoes-container" });
  container.style.display = "flex";
  container.style.gap = "8px";
  container.style.flexWrap = "wrap";
  container.style.width = "100%";

  const botao1 = createElement("button", { className: "chats-nav-btn", text: texto1 });
  botao1.style.flex = "1";
  botao1.style.minWidth = "120px";
  botao1.addEventListener("click", onClick1);
  container.appendChild(botao1);

  const botao2 = createElement("button", { className: "chats-nav-btn", text: texto2 });
  botao2.style.flex = "1";
  botao2.style.minWidth = "120px";
  botao2.addEventListener("click", onClick2);
  container.appendChild(botao2);

  amizadeAcao.appendChild(container);
}

// ==================== LÓGICA PARA FREELANCERS ====================

async function carregarEstadoAmizadeFreelancer(usuarioLogadoId) {
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
        await carregarEstadoAmizadeFreelancer(usuarioLogadoId);
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
        await carregarEstadoAmizadeFreelancer(usuarioLogadoId);
      } catch (error) {
        console.error(error);
        showToast("Não foi possível aceitar o pedido", "error");
      }
    });
    return;
  }

  renderTextoAmizade("Solicitação pendente");
}

// ==================== LÓGICA PARA EMPRESAS ====================

async function carregarEstadoAcaoEmpresa(empresaId, freelancerId) {
  if (!empresaId || !freelancerId || empresaId === freelancerId) {
    renderTextoAmizade("");
    return;
  }

  try {
    // Verificar se freelancer já está salvo
    let jaSalvo = false;
    let projetos = [];
    
    try {
      const salvos = await listarFreelancersSalvos(empresaId);
      jaSalvo = salvos.some(f => f.freelancerId === freelancerId);
    } catch (error) {
      console.warn("Erro ao verificar salvos:", error);
    }

    // Obter projetos da empresa para o convite
    try {
      projetos = await listarProjetosDaEmpresa(empresaId);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    }

    const textoBotaoSalvar = jaSalvo ? "Perfil Salvo" : "Salvar Perfil";
    
    renderDoisBotoes(
      textoBotaoSalvar,
      async () => {
        try {
          if (jaSalvo) {
            await removerFreelancerSalvo(empresaId, freelancerId);
            showToast("Perfil removido dos salvos", "success");
          } else {
            const perfilFreelancer = await getUserProfile(freelancerId);
            if (!perfilFreelancer) {
              showToast("Perfil do freelancer não encontrado", "error");
              return;
            }
            // Garantir que o objeto tem a propriedade 'id' obrigatória
            const freelancerComId = {
              ...perfilFreelancer,
              id: freelancerId
            };
            await salvarFreelancer(empresaId, freelancerComId);
            showToast("Perfil salvo com sucesso!", "success");
          }
          await carregarEstadoAcaoEmpresa(empresaId, freelancerId);
        } catch (error) {
          console.error(error);
          showToast("Erro ao salvar perfil", "error");
        }
      },
      "Convidar para Projeto",
      async () => {
        if (!projetos || projetos.length === 0) {
          showToast("Você não tem projetos publicados", "warning");
          return;
        }

        // Se houver apenas um projeto, convidar direto
        if (projetos.length === 1) {
          try {
            await convidarFreelancerParaProjeto({
              empresaId,
              freelancerId,
              projeto: projetos[0]
            });
            showToast(`Convite enviado para "${projetos[0].titulo}"`, "success");
          } catch (error) {
            console.error(error);
            showToast("Erro ao enviar convite", "error");
          }
          return;
        }

        // Se houver múltiplos projetos, mostrar seleção
        const projetosList = projetos.map(p => `${p.titulo} (${p.tipo})`).join("\n");
        const projetoSelecionado = prompt(`Qual projeto deseja convidar?\n\n${projetosList}`);
        
        if (!projetoSelecionado) return;

        const projeto = projetos.find(p => p.titulo === projetoSelecionado.split(" (")[0]);
        if (!projeto) {
          showToast("Projeto não encontrado", "error");
          return;
        }

        try {
          await convidarFreelancerParaProjeto({
            empresaId,
            freelancerId,
            projeto
          });
          showToast(`Convite enviado para "${projeto.titulo}"`, "success");
        } catch (error) {
          console.error(error);
          showToast("Erro ao enviar convite", "error");
        }
      }
    );
  } catch (error) {
    console.error("Erro ao carregar estado de ação da empresa:", error);
    showToast("Erro ao carregar ações", "error");
  }
}

// ==================== FUNÇÃO GENÉRICA DE AÇÃO ====================

async function carregarEstadoAcao(usuarioLogadoId, usuarioLogadoTipo) {
  if (!usuarioLogadoId || !userId || usuarioLogadoId === userId) {
    renderTextoAmizade("");
    return;
  }

  if (usuarioLogadoTipo === "empresa") {
    // Usuário logado é empresa
    await carregarEstadoAcaoEmpresa(usuarioLogadoId, userId);
  } else {
    // Usuário logado é freelancer
    await carregarEstadoAmizadeFreelancer(usuarioLogadoId);
  }
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
  setText(uidPublico, `UID: ${userId}`);

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

  try {
    // Obter perfil do usuário logado para saber seu tipo
    const perfilUsuarioLogado = await getUserProfile(usuarioLogado.uid);
    const tipoUsuarioLogado = perfilUsuarioLogado?.tipo || "freelancer";
    
    // Carregar estado de ação (amizade para freelancer, salvar/convidar para empresa)
    await carregarEstadoAcao(usuarioLogado.uid, tipoUsuarioLogado);
  } catch (error) {
    console.warn("Estado da ação indisponível para este perfil:", error);
    renderTextoAmizade("");
  }
}

// ==================== RENDERIZAÇÃO DINÂMICA DE SIDEBAR ====================

/**
 * Renderiza a sidebar dinamicamente baseado no tipo de usuário logado
 * @param {Object} usuarioLogado - Objeto do usuário autenticado
 */
async function renderSidebar(usuarioLogado) {
  const sidebarContainer = document.getElementById("freelancerSidebar");
  if (!sidebarContainer) return;

  try {
    // Obter o perfil do usuário logado para saber o tipo
    const userProfile = await getUserProfile(usuarioLogado.uid);
    const tipoUsuario = userProfile?.tipo || "freelancer";

    // Limpar o container
    sidebarContainer.innerHTML = "";

    if (tipoUsuario === "empresa") {
      renderSidebarEmpresa(sidebarContainer, userProfile);
    } else {
      renderSidebarFreelancer(sidebarContainer, userProfile);
    }

    // Re-inicializar o script de toggle de sidebar
    initSidebarToggle();
  } catch (error) {
    console.warn("Erro ao renderizar sidebar:", error);
    // Se houver erro, renderiza sidebar padrão de freelancer
    renderSidebarFreelancer(sidebarContainer, {});
    initSidebarToggle();
  }
}

/**
 * Renderiza a sidebar para usuários freelancer
 */
function renderSidebarFreelancer(container, userProfile) {
  const nomeFreelancer = userProfile?.nome || "Freelancer BMO";
  const inicial = nomeFreelancer.trim().charAt(0).toUpperCase() || "B";

  container.innerHTML = `
    <div class="freelancer-sidebar-brand">
      <div>
        <a href="dashboard-freelancer.html" class="freelancer-brand-mark">BMO</a>
        <span>Building My Opportunity</span>
      </div>
      <button id="sidebarToggle" class="sidebar-toggle" type="button" aria-label="Recolher menu" aria-expanded="true">
        <span></span><span></span><span></span>
      </button>
    </div>

    <div class="freelancer-nav-section">
      <p>Principal</p>
      <nav class="freelancer-sidebar-nav" aria-label="Navegacao principal">
        <a href="dashboard-freelancer.html" title="Inicio"><i class="freelancer-nav-icon fa-solid fa-house" aria-hidden="true"></i><span>Inicio</span></a>
        <a href="projetos.html" title="Projetos"><i class="freelancer-nav-icon fa-solid fa-briefcase" aria-hidden="true"></i><span>Projetos</span></a>
        <a href="meus-chats.html" title="Mensagens"><i class="freelancer-nav-icon fa-solid fa-comments" aria-hidden="true"></i><span>Mensagens</span></a>
      </nav>
    </div>

    <div class="freelancer-nav-section">
      <p>Rede</p>
      <nav class="freelancer-sidebar-nav" aria-label="Rede profissional">
        <a href="meus-amigos.html" title="Meus Amigos"><i class="freelancer-nav-icon fa-solid fa-user-group" aria-hidden="true"></i><span>Meus Amigos</span></a>
        <a href="busca-perfis.html" title="Buscar Perfis"><i class="freelancer-nav-icon fa-solid fa-magnifying-glass" aria-hidden="true"></i><span>Buscar Perfis</span></a>
        <a href="minhas-equipes.html" title="Equipes"><i class="freelancer-nav-icon fa-solid fa-people-group" aria-hidden="true"></i><span>Equipes</span></a>
        <a href="Configuracao-freelancer.html" title="Configurações"><i class="freelancer-nav-icon fa-solid fa-gear" aria-hidden="true"></i><span>Configurações</span></a>
      </nav>
    </div>

    <div class="freelancer-sidebar-footer">
      <a class="freelancer-user-mini" href="perfil-freelancer.html" title="Meu perfil">
        <div class="freelancer-avatar" aria-hidden="true">${inicial}</div>
        <div>
          <strong>${nomeFreelancer}</strong>
          <span>Profissional verificado</span>
        </div>
      </a>
      <a class="freelancer-create-btn" href="busca-perfis.html">Buscar perfis</a>
    </div>
  `;
}

/**
 * Renderiza a sidebar para usuários empresa
 */
function renderSidebarEmpresa(container, userProfile) {
  const nomeEmpresa = userProfile?.nome || "Empresa BMO";
  const inicial = nomeEmpresa.trim().charAt(0).toUpperCase() || "E";

  container.innerHTML = `
    <div class="freelancer-sidebar-brand">
      <div>
        <a href="dashboard-empresa.html" class="freelancer-brand-mark">BMO</a>
        <span>Building My Opportunity</span>
      </div>
      <button id="sidebarToggle" class="sidebar-toggle" type="button" aria-label="Recolher menu" aria-expanded="true">
        <span></span><span></span><span></span>
      </button>
    </div>

    <div class="freelancer-nav-section">
      <p>Principal</p>
      <nav class="freelancer-sidebar-nav" aria-label="Navegação principal">
        <a href="dashboard-empresa.html" title="Início"><i class="freelancer-nav-icon fa-solid fa-house" aria-hidden="true"></i><span>Início</span></a>
        <a href="projetos-publicados-empresa.html" title="Projeto/Propostas"><i class="freelancer-nav-icon fa-solid fa-briefcase" aria-hidden="true"></i><span>Projeto/Propostas</span></a>
        <a href="meus-chats.html" title="Mensagens"><i class="freelancer-nav-icon fa-solid fa-comments" aria-hidden="true"></i><span>Mensagens</span></a>
      </nav>
    </div>

    <div class="freelancer-nav-section">
      <p>Rede</p>
      <nav class="freelancer-sidebar-nav" aria-label="Rede profissional">
        <a href="freelancers-salvos.html" title="Freelancers salvos"><i class="freelancer-nav-icon fa-solid fa-bookmark" aria-hidden="true"></i><span>Freelancers salvos</span></a>
        <a href="busca-perfil-Empresa.html" title="Buscar freelancers"><i class="freelancer-nav-icon fa-solid fa-magnifying-glass" aria-hidden="true"></i><span>Buscar freelancers</span></a>
        <a href="minhas-equipes.html" title="Equipes"><i class="freelancer-nav-icon fa-solid fa-people-group" aria-hidden="true"></i><span>Equipes</span></a>
        <a href="configuracao-empresa.html" title="Configurações"><i class="freelancer-nav-icon fa-solid fa-gear" aria-hidden="true"></i><span>Configurações</span></a>
      </nav>
    </div>

    <div class="freelancer-sidebar-footer">
      <a class="freelancer-user-mini" href="perfil-empresa.html" title="Perfil da empresa">
        <div class="freelancer-avatar" aria-hidden="true">${inicial}</div>
        <div>
          <strong>${nomeEmpresa}</strong>
          <span>Conta empresarial</span>
        </div>
      </a>
      <a class="freelancer-create-btn" href="#publicarProblema">Publicar projeto</a>
    </div>
  `;
}

/**
 * Inicializa o toggle de sidebar (ícone de hamburger)
 * Copiado de freelancer-sidebar.js
 */
function initSidebarToggle() {
  const toggleButton = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("freelancerSidebar");

  if (!toggleButton || !sidebar) return;

  toggleButton.addEventListener("click", () => {
    const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
    toggleButton.setAttribute("aria-expanded", String(!isExpanded));
    sidebar.classList.toggle("collapsed");
  });
}

observeAuthenticatedUser(
  async (user) => {
    try {
      // Renderizar a sidebar dinamicamente baseado no tipo do usuário
      await renderSidebar(user);
      // Depois carregar o perfil público
      await carregarPerfilPublico(user);
    } catch (error) {
      console.error(error);
      showToast("Falha ao carregar perfil público", "error");
    }
  },
  () => {
    showToast("Faça login para visualizar o perfil", "error");
    window.location.href = "../../index.html";
  }
);
