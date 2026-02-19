import { observeAuthenticatedUser, getUserProfile } from "./authService.js";
import {
  criarCandidatura,
  getCandidaturasByFreelancer,
  getProblemas
} from "./candidaturaService.js";
import { renderProblema } from "./uiFreelancer.js";
import { clearElement, setButtonLoading, showToast } from "./utils.js";

const lista = document.getElementById("lista");
const loading = document.getElementById("loadingProblemas");

function abrirChat(chatId) {
  window.location.href = `chat.html?chatId=${chatId}`;
}

function renderLista(problemas, candidaturasMap, user, profile) {
  clearElement(lista);

  problemas.forEach((problema) => {
    const candidatura = candidaturasMap.get(problema.id);

    renderProblema({
      container: lista,
      problema,
      candidatura,
      onAbrirChat: abrirChat,
      onCandidatar: async (button) => {
        try {
          setButtonLoading(button, true, "Enviando...");
          await criarCandidatura({
            problemaId: problema.id,
            empresaId: problema.empresaId,
            freelancerId: user.uid,
            freelancerNome: profile.nome
          });

          candidaturasMap.set(problema.id, {
            problemaId: problema.id,
            status: "pendente"
          });

          renderLista(problemas, candidaturasMap, user, profile);
          showToast("Candidatura enviada com sucesso", "success");
        } catch (error) {
          showToast("Não foi possível enviar candidatura", "error");
          console.error(error);
          setButtonLoading(button, false);
        }
      }
    });
  });
}

async function carregarDashboardFreelancer(user) {
  if (loading) loading.hidden = false;

  try {
    const [profile, problemas, candidaturas] = await Promise.all([
      getUserProfile(user.uid),
      getProblemas(),
      getCandidaturasByFreelancer(user.uid)
    ]);

    if (!profile) {
      showToast("Dados do usuário não encontrados", "error");
      return;
    }

    const candidaturasMap = new Map(
      candidaturas.map((candidatura) => [candidatura.problemaId, candidatura])
    );

    renderLista(problemas, candidaturasMap, user, profile);
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar problemas", "error");
  } finally {
    if (loading) loading.hidden = true;
  }
}

observeAuthenticatedUser(carregarDashboardFreelancer, () => {
  showToast("Faça login para continuar", "error");
  window.location.href = "index.html";
});
