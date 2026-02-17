import { observeAuthenticatedUser } from "./authService.js";
import { salvarPerfil, getPerfil, uploadPerfilArquivo } from "./perfilService.js";
import { setButtonLoading, showToast } from "./utils.js";

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
  bioCount.textContent = `${bioInput.value.length}/280`;
}

function setTipoFields(tipo) {
  const freelancer = tipo === "freelancer";
  freelancerCampos.hidden = !freelancer;
  empresaCampos.hidden = freelancer;
}

function preencherFormulario(perfil, authUser) {
  nomeInput.value = perfil?.nome || "";
  emailInput.value = perfil?.email || authUser.email || "";
  bioInput.value = perfil?.bio || "";
  habilidadesInput.value = Array.isArray(perfil?.habilidades) ? perfil.habilidades.join(", ") : "";
  areaInput.value = perfil?.areaAtuacao || "";
  disponibilidadeInput.value = perfil?.disponibilidade || "disponivel";

  descricaoInstitucionalInput.value = perfil?.descricaoInstitucional || "";
  localizacaoInput.value = perfil?.localizacao || "";
  siteInput.value = perfil?.site || "";

  if (perfil?.fotoURL) {
    previewFoto.src = perfil.fotoURL;
  } else {
    previewFoto.src = "larva.jpeg";
  }

  if (perfil?.curriculoURL) {
    linkCurriculo.href = perfil.curriculoURL;
    linkCurriculo.hidden = false;
  } else {
    linkCurriculo.hidden = true;
  }

  atualizarContadorBio();
}

async function carregarPerfil(user) {
  currentUser = user;

  try {
    const perfil = await getPerfil(user.uid);
    currentPerfil = perfil || { tipo: "freelancer" };
    setTipoFields(currentPerfil.tipo);
    preencherFormulario(currentPerfil, user);
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar perfil", "error");
  }
}

async function salvar() {
  if (!currentUser) return;

  const nome = nomeInput.value.trim();
  if (!nome) {
    showToast("Nome é obrigatório", "error");
    return;
  }

  if (bioInput.value.length > 280) {
    showToast("Bio excede 280 caracteres", "error");
    return;
  }

  const maxMb = 8;
  const maxBytes = maxMb * 1024 * 1024;
  const uploads = [fotoPerfilInput.files[0], curriculoInput?.files[0], logoEmpresaInput?.files[0]].filter(Boolean);

  for (const arquivo of uploads) {
    if (arquivo.size > maxBytes) {
      showToast(`Arquivo ${arquivo.name} excede ${maxMb}MB`, "error");
      return;
    }
  }

  try {
    setButtonLoading(btnSalvar, true, "Salvando...");

    let fotoURL = currentPerfil?.fotoURL || "";
    if (fotoPerfilInput.files[0]) {
      fotoURL = await uploadPerfilArquivo(currentUser.uid, fotoPerfilInput.files[0], "perfil/fotos");
    }

    let curriculoURL = currentPerfil?.curriculoURL || "";
    if (curriculoInput?.files[0]) {
      const arquivo = curriculoInput.files[0];
      const ehPdf = arquivo.type === "application/pdf" || arquivo.name.toLowerCase().endswith(".pdf");
      if (!ehPdf) {
        showToast("Currículo deve ser PDF", "error");
        return;
      }

      curriculoURL = await uploadPerfilArquivo(currentUser.uid, arquivo, "perfil/curriculos");
    }

    let logoURL = currentPerfil?.logoURL || "";
    if (logoEmpresaInput?.files[0]) {
      logoURL = await uploadPerfilArquivo(currentUser.uid, logoEmpresaInput.files[0], "perfil/logos");
    }

    const habilidades = habilidadesInput.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const tipo = currentPerfil?.tipo || "freelancer";

    const dadosBase = {
      nome,
      email: emailInput.value,
      tipo,
      fotoURL,
      bio: bioInput.value.trim(),
      habilidades,
      areaAtuacao: areaInput.value.trim(),
      disponibilidade: disponibilidadeInput.value
    };

    const dadosFreelancer = {
      curriculoURL
    };

    const dadosEmpresa = {
      logoURL,
      descricaoInstitucional: descricaoInstitucionalInput.value.trim(),
      localizacao: localizacaoInput.value.trim(),
      site: siteInput.value.trim()
    };

    await salvarPerfil(currentUser.uid, {
      ...dadosBase,
      ...(tipo === "freelancer" ? dadosFreelancer : dadosEmpresa)
    });

    showToast("Perfil salvo com sucesso", "success");
    await carregarPerfil(currentUser);
  } catch (error) {
    console.error(error);
    const mensagem = error?.code === "storage/unauthorized"
      ? "Sem permissão para upload. Verifique as regras do Firebase Storage."
      : error?.message || "Falha ao salvar perfil";
    showToast(mensagem, "error");
  } finally {
    setButtonLoading(btnSalvar, false);
  }
}

bioInput?.addEventListener("input", atualizarContadorBio);

fotoPerfilInput?.addEventListener("change", () => {
  const arquivo = fotoPerfilInput.files[0];
  if (!arquivo) return;

  const url = URL.createObjectURL(arquivo);
  previewFoto.src = url;
});

btnSalvar?.addEventListener("click", salvar);

observeAuthenticatedUser(carregarPerfil, () => {
  showToast("Faça login para acessar seu perfil", "error");
  window.location.href = "index.html";
});
