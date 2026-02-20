import { observeAuthenticatedUser } from "./authService.js";
import { salvarPerfil, getPerfil, uploadPerfilArquivo } from "./perfilService.js";
import { setButtonLoading, showToast } from "./utils.js";

const tipoPagina = document.body?.dataset?.perfilTipo || null;

const fotoPerfilInput = document.getElementById("fotoPerfil");
const previewFoto = document.getElementById("previewFoto");
const nomeInput = document.getElementById("nomePerfil");
const emailInput = document.getElementById("emailPerfil");
const bioInput = document.getElementById("bioPerfil");
const bioCount = document.getElementById("bioCount");
const habilidadesInput = document.getElementById("habilidadesPerfil");
const areaInput = document.getElementById("areaAtuacaoPerfil");
const disponibilidadeInput = document.getElementById("disponibilidadePerfil");
const curriculoInput = document.getElementById("curriculoPerfil");
const linkCurriculo = document.getElementById("linkCurriculo");
const empresaCampos = document.getElementById("empresaCampos");
const freelancerCampos = document.getElementById("freelancerCampos");
const logoEmpresaInput = document.getElementById("logoEmpresa");
const descricaoInstitucionalInput = document.getElementById("descricaoInstitucional");
const localizacaoInput = document.getElementById("localizacaoEmpresa");
const siteInput = document.getElementById("siteEmpresa");
const btnSalvar = document.getElementById("btnSalvarPerfil");

let currentUser = null;
let currentPerfil = null;

function atualizarContadorBio() {
  if (!bioInput || !bioCount) return;
  bioCount.textContent = `${bioInput.value.length}/280`;
}

function setTipoFields(tipo) {
  const freelancer = tipo === "freelancer";

  if (freelancerCampos) {
    freelancerCampos.hidden = !freelancer;
  }

  if (empresaCampos) {
    empresaCampos.hidden = freelancer;
  }
}

function preencherFormulario(perfil, authUser) {
  if (nomeInput) nomeInput.value = perfil?.nome || "";
  if (emailInput) emailInput.value = perfil?.email || authUser.email || "";

  if (bioInput) bioInput.value = perfil?.bio || "";
  if (habilidadesInput) {
    habilidadesInput.value = Array.isArray(perfil?.habilidades) ? perfil.habilidades.join(", ") : "";
  }
  if (areaInput) areaInput.value = perfil?.areaAtuacao || "";
  if (disponibilidadeInput) disponibilidadeInput.value = perfil?.disponibilidade || "disponivel";

  if (descricaoInstitucionalInput) descricaoInstitucionalInput.value = perfil?.descricaoInstitucional || "";
  if (localizacaoInput) localizacaoInput.value = perfil?.localizacao || "";
  if (siteInput) siteInput.value = perfil?.site || "";

  if (previewFoto) {
    previewFoto.src = perfil?.fotoURL || "larva.jpeg";
  }

  if (linkCurriculo) {
    if (perfil?.curriculoURL) {
      linkCurriculo.href = perfil.curriculoURL;
      linkCurriculo.hidden = false;
    } else {
      linkCurriculo.hidden = true;
    }
  }

  atualizarContadorBio();
}

async function carregarPerfil(user) {
  currentUser = user;

  try {
    const perfil = await getPerfil(user.uid);
    const tipoPerfil = tipoPagina || perfil?.tipo || "freelancer";
    currentPerfil = { ...(perfil || {}), tipo: tipoPerfil };

    setTipoFields(tipoPerfil);
    preencherFormulario(currentPerfil, user);
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar perfil", "error");
  }
}

async function salvar() {
  if (!currentUser || !nomeInput) return;

  const nome = nomeInput.value.trim();
  if (!nome) {
    showToast("Nome é obrigatório", "error");
    return;
  }

  if (bioInput && bioInput.value.length > 280) {
    showToast("Bio excede 280 caracteres", "error");
    return;
  }

  const maxMb = 8;
  const maxBytes = maxMb * 1024 * 1024;
  const uploads = [fotoPerfilInput?.files?.[0], curriculoInput?.files?.[0], logoEmpresaInput?.files?.[0]].filter(Boolean);

  for (const arquivo of uploads) {
    if (arquivo.size > maxBytes) {
      showToast(`Arquivo ${arquivo.name} excede ${maxMb}MB`, "error");
      return;
    }
  }

  try {
    setButtonLoading(btnSalvar, true, "Salvando...");

    let fotoURL = currentPerfil?.fotoURL || "";
    if (fotoPerfilInput?.files?.[0]) {
      fotoURL = await uploadPerfilArquivo(currentUser.uid, fotoPerfilInput.files[0], "perfil/fotos");
    }

    let curriculoURL = currentPerfil?.curriculoURL || "";
    if (curriculoInput?.files?.[0]) {
      const arquivo = curriculoInput.files[0];
      const ehPdf = arquivo.type === "application/pdf" || arquivo.name.toLowerCase().endsWith(".pdf");
      if (!ehPdf) {
        showToast("Currículo deve ser PDF", "error");
        return;
      }

      curriculoURL = await uploadPerfilArquivo(currentUser.uid, arquivo, "perfil/curriculos");
    }

    let logoURL = currentPerfil?.logoURL || "";
    if (logoEmpresaInput?.files?.[0]) {
      logoURL = await uploadPerfilArquivo(currentUser.uid, logoEmpresaInput.files[0], "perfil/logos");
    }

    const habilidades = (habilidadesInput?.value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const tipo = tipoPagina || currentPerfil?.tipo || "freelancer";

    const dadosPerfil = {
      nome,
      email: emailInput?.value || currentUser.email || "",
      tipo,
      fotoURL
    };

    if (tipo === "freelancer") {
      dadosPerfil.bio = bioInput?.value?.trim() || "";
      dadosPerfil.habilidades = habilidades;
      dadosPerfil.areaAtuacao = areaInput?.value?.trim() || "";
      dadosPerfil.disponibilidade = disponibilidadeInput?.value || "disponivel";
      dadosPerfil.curriculoURL = curriculoURL;
    }

    if (tipo === "empresa") {
      dadosPerfil.logoURL = logoURL;
      dadosPerfil.descricaoInstitucional = descricaoInstitucionalInput?.value?.trim() || "";
      dadosPerfil.localizacao = localizacaoInput?.value?.trim() || "";
      dadosPerfil.site = siteInput?.value?.trim() || "";
    }

    await salvarPerfil(currentUser.uid, dadosPerfil);

    showToast("Perfil salvo com sucesso", "success");
    await carregarPerfil(currentUser);
  } catch (error) {
    console.error(error);
    const mensagem = error?.code === "storage/unauthorized"
      ? "Sem permissão para upload. Verifique as regras do Firebase Storage (allow write para usuário autenticado)."
      : error?.code === "storage/bucket-not-found"
        ? "Bucket do Firebase Storage não encontrado. Verifique se o Storage foi ativado no projeto Firebase."
        : error?.code === "storage/invalid-default-bucket"
          ? "Bucket padrão inválido. Confira storageBucket no firebase.js e o bucket real no console Firebase."
          : error?.code === "storage/canceled"
            ? "Upload cancelado."
            : `${error?.message || "Falha ao salvar perfil"}${error?.code ? ` (código: ${error.code})` : ""}`;

    if (error?.details?.length) {
      console.table(error.details);
    }
    showToast(mensagem, "error");
  } finally {
    setButtonLoading(btnSalvar, false);
  }
}

bioInput?.addEventListener("input", atualizarContadorBio);

fotoPerfilInput?.addEventListener("change", () => {
  const arquivo = fotoPerfilInput.files?.[0];
  if (!arquivo || !previewFoto) return;

  const url = URL.createObjectURL(arquivo);
  previewFoto.src = url;
});

btnSalvar?.addEventListener("click", salvar);

observeAuthenticatedUser(carregarPerfil, () => {
  showToast("Faça login para acessar seu perfil", "error");
  window.location.href = "index.html";
});
