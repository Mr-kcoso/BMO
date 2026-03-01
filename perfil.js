import { observeAuthenticatedUser } from "./authService.js";
import { salvarPerfil, getPerfil, uploadImagemCloudinary } from "./perfilService.js";
import { setButtonLoading, showToast } from "./utils.js";

const tipoPagina = document.body?.dataset?.perfilTipo || null;

const fotoPerfilInput = document.getElementById("fotoPerfil");
const previewFoto = document.getElementById("previewFoto");
const nomeInput = document.getElementById("nomePerfil");
const emailInput = document.getElementById("emailPerfil");
const uidInput = document.getElementById("uidPerfil");
const bioInput = document.getElementById("bioPerfil");
const bioCount = document.getElementById("bioCount");
const habilidadesInput = document.getElementById("habilidadesPerfil");
const areaInput = document.getElementById("areaAtuacaoPerfil");
const disponibilidadeInput = document.getElementById("disponibilidadePerfil");
const freelancerCampos = document.getElementById("freelancerCampos");
const empresaCampos = document.getElementById("empresaCampos");
const logoEmpresaInput = document.getElementById("logoEmpresa");
const descricaoInstitucionalInput = document.getElementById("descricaoInstitucional");
const localizacaoInput = document.getElementById("localizacaoEmpresa");
const siteInput = document.getElementById("siteEmpresa");
const linkedinInput = document.getElementById("linkedinPerfil");
const githubInput = document.getElementById("githubPerfil");
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
  if (uidInput) uidInput.value = authUser.uid || "";

  if (bioInput) bioInput.value = perfil?.bio || "";
  if (habilidadesInput) {
    habilidadesInput.value = Array.isArray(perfil?.habilidades) ? perfil.habilidades.join(", ") : "";
  }
  if (areaInput) areaInput.value = perfil?.areaAtuacao || "";
  if (disponibilidadeInput) disponibilidadeInput.value = perfil?.disponibilidade || "disponivel";

  if (descricaoInstitucionalInput) descricaoInstitucionalInput.value = perfil?.descricaoInstitucional || "";
  if (localizacaoInput) localizacaoInput.value = perfil?.localizacao || "";
  if (siteInput) siteInput.value = perfil?.site || "";
  if (linkedinInput) linkedinInput.value = perfil?.linkedin || "";
  if (githubInput) githubInput.value = perfil?.github || "";

  if (previewFoto) {
    previewFoto.src = perfil?.fotoURL || "larva.jpeg";
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
  const uploads = [fotoPerfilInput?.files?.[0], logoEmpresaInput?.files?.[0]].filter(Boolean);

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
      fotoURL = await uploadImagemCloudinary(fotoPerfilInput.files[0]);
    }

    let logoURL = currentPerfil?.logoURL || "";
    if (logoEmpresaInput?.files?.[0]) {
      logoURL = await uploadImagemCloudinary(logoEmpresaInput.files[0]);
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
      fotoURL,
      linkedin: linkedinInput?.value?.trim() || "",
      github: githubInput?.value?.trim() || ""
    };

    if (tipo === "freelancer") {
      dadosPerfil.bio = bioInput?.value?.trim() || "";
      dadosPerfil.habilidades = habilidades;
      dadosPerfil.areaAtuacao = areaInput?.value?.trim() || "";
      dadosPerfil.disponibilidade = disponibilidadeInput?.value || "disponivel";
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
    const mensagem = error?.code === "cloudinary/upload-error"
      ? `Falha no upload da imagem para Cloudinary: ${error?.message || "erro desconhecido"}`
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
