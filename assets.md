import { db } from "../services/firebase.js";
import { observeAuthenticatedUser, getUserProfile } from "../services/authService.js";
import { clearElement, createElement, setButtonLoading, showToast } from "../scripts/utils.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const listaPlanosEmpresa = document.getElementById("listaPlanosEmpresa");
const planoAtualResumo = document.getElementById("planoAtualResumo");
const historicoPlanosEmpresa = document.getElementById("historicoPlanosEmpresa");

const PLANOS_EMPRESA = [
  {
    id: "simples",
    tipo: "Empresas simples",
    servicos: "Publicação limitada, suporte básico",
    preco: 0,
    detalhes:
      "Ideal para microempreendedores e negócios em fase inicial. Permite criar perfil da empresa e publicar vagas ou demandas de forma limitada. Inclui acesso às funcionalidades básicas da plataforma, visualização de candidatos/interessados e suporte padrão via canais digitais. Indicado para quem está começando e precisa testar a plataforma sem investimento inicial."
  },
  {
    id: "pequeno_porte",
    tipo: "Empresas de pequeno porte",
    servicos: "Publicação de demandas pontuais, suporte básico",
    preco: 59,
    detalhes:
      "Voltado para empresas em crescimento que precisam publicar demandas com mais frequência. Permite publicação de demandas pontuais sem limite rígido mensal, maior visibilidade dentro da plataforma e acesso prioritário ao suporte básico. Indicado para negócios que já possuem fluxo recorrente de contratações ou projetos."
  },
  {
    id: "medio_porte",
    tipo: "Empresas de médio porte",
    servicos: "Publicação ilimitada, relatórios e suporte",
    preco: 99,
    detalhes:
      "Plano estruturado para empresas com maior volume de operações. Inclui publicação ilimitada, relatórios básicos de desempenho (visualizações, candidaturas, engajamento), melhor posicionamento nas buscas internas e suporte aprimorado. Ideal para organizações que precisam acompanhar métricas e otimizar seus resultados."
  },
  {
    id: "grande_porte",
    tipo: "Empresas de grande porte",
    servicos: "Recursos premium, integração e suporte avançado",
    preco: 199,
    detalhes:
      "Plano premium com recursos avançados. Inclui publicações ilimitadas, relatórios completos e detalhados, integração com sistemas externos (quando aplicável), prioridade máxima no suporte e recursos estratégicos exclusivos da plataforma. Indicado para empresas com alto volume de demandas e necessidade de controle e performance mais sofisticados."
  }
];

const state = {
  user: null,
  profile: null,
  planoAtualId: "simples",
  historicoPlanos: []
};

function getDateValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value) {
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value || 0);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Data não informada";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function getPlanoById(planoId) {
  return PLANOS_EMPRESA.find((plano) => plano.id === planoId) || PLANOS_EMPRESA[0];
}

function renderHistoricoPlanos() {
  clearElement(historicoPlanosEmpresa);

  const historico = [...(state.historicoPlanos || [])].sort(
    (a, b) => getDateValue(b.alteradoEm) - getDateValue(a.alteradoEm)
  );

  if (!historico.length) {
    historicoPlanosEmpresa.appendChild(
      createElement("li", { className: "empresa-empty", text: "Nenhuma alteração de plano registrada." })
    );
    return;
  }

  historico.forEach((registro) => {
    const item = createElement("li", { className: "empresa-candidatura-card" });
    item.appendChild(createElement("h3", { className: "empresa-card-title", text: registro.tipo || "Plano" }));
    item.appendChild(createElement("p", { className: "empresa-card-line", text: `Preço: ${formatCurrency(registro.preco)}` }));
    item.appendChild(
      createElement("p", {
        className: "empresa-card-line",
        text: `Alterado em: ${formatDate(registro.alteradoEm)}`
      })
    );
    historicoPlanosEmpresa.appendChild(item);
  });
}

async function selecionarPlano(plano, botao) {
  if (!state.user) return;

  try {
    setButtonLoading(botao, true, "Salvando...");

    const userRef = doc(db, "usuarios", state.user.uid);
    const userSnap = await getDoc(userRef);
    const dados = userSnap.exists() ? userSnap.data() : {};
    const historicoAtual = Array.isArray(dados.historicoPlanos) ? dados.historicoPlanos : [];

    const novoHistorico = [
      ...historicoAtual,
      {
        id: plano.id,
        tipo: plano.tipo,
        preco: plano.preco,
        alteradoEm: new Date().toISOString()
      }
    ];

    await setDoc(
      userRef,
      {
        planoAtualId: plano.id,
        planoAtual: {
          id: plano.id,
          tipo: plano.tipo,
          servicos: plano.servicos,
          preco: plano.preco,
          atualizadoEm: serverTimestamp()
        },
        historicoPlanos: novoHistorico,
        atualizadoEm: serverTimestamp()
      },
      { merge: true }
    );

    state.planoAtualId = plano.id;
    state.historicoPlanos = novoHistorico;

    renderPlanosEmpresa();
    renderHistoricoPlanos();
    showToast("Plano atualizado com sucesso", "success");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível atualizar o plano", "error");
  } finally {
    setButtonLoading(botao, false);
  }
}

function renderPlanosEmpresa() {
  clearElement(listaPlanosEmpresa);

  PLANOS_EMPRESA.forEach((plano) => {
    const ativo = plano.id === state.planoAtualId;

    const item = createElement("li", { className: `empresa-candidatura-card${ativo ? " plano-ativo" : ""}` });
    item.appendChild(createElement("h3", { className: "empresa-card-title", text: plano.tipo }));
    item.appendChild(createElement("p", { className: "empresa-card-line", text: `Serviços: ${plano.servicos}` }));
    item.appendChild(createElement("p", { className: "empresa-card-line", text: `Preço: ${formatCurrency(plano.preco)}` }));

    if (ativo) {
      item.appendChild(createElement("span", { className: "empresa-tag", text: "Plano atual" }));
    }

    const detalhesTexto = createElement("p", {
      className: "empresa-card-line plano-detalhes-text hidden",
      text: plano.detalhes || "Sem detalhes adicionais para este plano."
    });

    const btnDetalhes = createElement("button", {
      className: "empresa-secondary-btn",
      text: "Mais detalhes"
    });

    btnDetalhes.addEventListener("click", () => {
      const expanded = !detalhesTexto.classList.contains("hidden");
      detalhesTexto.classList.toggle("hidden", expanded);
      btnDetalhes.textContent = expanded ? "Mais detalhes" : "Ocultar detalhes";
    });

    const btnPlano = createElement("button", {
      className: ativo ? "empresa-status-btn" : "btn-primary",
      text: ativo ? "Plano atual" : "Assinar / Alterar plano"
    });

    if (!ativo) {
      btnPlano.addEventListener("click", () => selecionarPlano(plano, btnPlano));
    }

    item.appendChild(btnDetalhes);
    item.appendChild(detalhesTexto);
    item.appendChild(btnPlano);
    listaPlanosEmpresa.appendChild(item);
  });

  const planoAtual = getPlanoById(state.planoAtualId);
  planoAtualResumo.textContent = `Plano ativo: ${planoAtual.tipo} (${formatCurrency(planoAtual.preco)}/mês)`;
}

async function carregarPlanos(user) {
  try {
    const profile = await getUserProfile(user.uid);

    state.user = user;
    state.profile = profile;
    state.planoAtualId = profile?.planoAtualId || "simples";
    state.historicoPlanos = Array.isArray(profile?.historicoPlanos) ? profile.historicoPlanos : [];

    if (!state.historicoPlanos.length) {
      const planoInicial = getPlanoById(state.planoAtualId);
      state.historicoPlanos = [
        {
          id: planoInicial.id,
          tipo: planoInicial.tipo,
          preco: planoInicial.preco,
          alteradoEm: profile?.criadoEm || new Date().toISOString()
        }
      ];
    }

    renderPlanosEmpresa();
    renderHistoricoPlanos();
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar seus planos", "error");
  }
}

observeAuthenticatedUser(carregarPlanos, () => {
  showToast("Faça login para acessar seus planos", "error");
  window.location.href = "index.html";
});
