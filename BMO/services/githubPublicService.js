const GITHUB_API_BASE = "https://api.github.com";

/**
 * Valida e normaliza a URL de um repositório público do GitHub.
 * Aceita https://github.com/owner/repo e URLs terminadas em .git.
 */
export function analisarUrlRepositorioGithub(valor) {
  const texto = String(valor || "").trim();
  if (!texto) throw new Error("Informe a URL de um repositório do GitHub.");

  let url;
  try {
    url = new URL(texto);
  } catch {
    throw new Error("A URL do repositório não é válida.");
  }

  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || !["github.com", "www.github.com"].includes(host)) {
    throw new Error("Use uma URL HTTPS de github.com.");
  }

  const partes = url.pathname.split("/").filter(Boolean);
  if (partes.length < 2) {
    throw new Error("Use o formato https://github.com/usuario/repositorio.");
  }

  const owner = partes[0];
  const repo = partes[1].replace(/\.git$/i, "");
  const nomeValido = /^[A-Za-z0-9_.-]+$/;

  if (!nomeValido.test(owner) || !nomeValido.test(repo) || !repo || owner === "." || owner === ".." || repo === "." || repo === "..") {
    throw new Error("Não consegui identificar o proprietário e o nome do repositório.");
  }

  return {
    owner,
    repo,
    url: `https://github.com/${owner}/${repo}`,
    apiBase: `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  };
}

async function buscarJsonGithub(url, { permitirRepositorioVazio = false } = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
  } catch (error) {
    throw new Error("Não foi possível conectar ao GitHub. Verifique sua conexão e tente novamente.");
  }

  if (!response.ok) {
    // Repositórios recém-criados podem ainda não possuir commits (GitHub responde 409).
    if (response.status === 409 && permitirRepositorioVazio) return [];
    if (response.status === 404) {
      throw new Error("Repositório não encontrado ou privado. Esta versão consulta somente repositórios públicos.");
    }
    if (response.status === 403 || response.status === 429) {
      const restante = response.headers.get("x-ratelimit-remaining");
      if (restante === "0") {
        throw new Error("O limite temporário de consultas públicas do GitHub foi atingido. Aguarde um pouco e tente atualizar novamente.");
      }
      throw new Error("O GitHub recusou a consulta. Tente novamente daqui a pouco.");
    }
    throw new Error(`O GitHub respondeu com erro (${response.status}). Tente novamente.`);
  }

  return response.json();
}

/** Busca resumo, commits recentes, pull requests e issues abertas de um repo público. */
export async function carregarAtividadeRepositorioPublico(repoUrl) {
  const repoInfo = analisarUrlRepositorioGithub(repoUrl);
  const base = repoInfo.apiBase;

  const [repositorio, commits, pullRequests, issues] = await Promise.all([
    buscarJsonGithub(base),
    buscarJsonGithub(`${base}/commits?per_page=5`, { permitirRepositorioVazio: true }),
    buscarJsonGithub(`${base}/pulls?state=all&sort=updated&direction=desc&per_page=5`),
    buscarJsonGithub(`${base}/issues?state=open&sort=updated&direction=desc&per_page=10`)
  ]);

  if (repositorio.private) {
    throw new Error("Este repositório é privado. Por enquanto, o B.M.O. consulta somente repositórios públicos.");
  }

  return {
    repoInfo,
    repositorio,
    commits: Array.isArray(commits) ? commits : [],
    pullRequests: Array.isArray(pullRequests) ? pullRequests : [],
    issues: (Array.isArray(issues) ? issues : []).filter((issue) => !issue.pull_request).slice(0, 5)
  };
}
