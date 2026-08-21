# Dashboard Empresa

## Objetivo

Propor a nova estrutura do dashboard da empresa com base no dashboard do freelancer, mantendo a mesma organização, hierarquia, experiência de uso e identidade visual sempre que possível.

## Visão geral

O dashboard da empresa deve se alinhar ao mesmo sistema visual e de navegação do dashboard do freelancer. A diferença principal está no conteúdo e nas responsabilidades: gestão de vagas/projetos, propostas recebidas, contratações e estatísticas empresariais.

## Estrutura principal

- `aside.sidebar`: barra lateral fixa do dashboard empresarial.
- `main.main-content`: área principal com resumo de perfil e métricas.
- `aside.right-panel`: painel complementar com recomendações e tendências.

## Sidebar

### Seções

1. **Principal**
   - Início
   - Meus problemas
   - Mensagens
2. **Rede**
   - Freelancers salvos
   - Buscar freelancers
   - Equipes
   - Configurações

### Diferenciais para empresa

- O item `Meus problemas` deve ser equivalente a `Projetos` do freelancer, mas focado em vagas/projetos publicados.
- O CTA da barra lateral deve ser `Publicar problema`, refletindo a responsabilidade de criar oportunidades.
- Mini-perfil deve apresentar `Empresa Exemplo` e status institucional.

## Conteúdo principal

### Cabeçalho da página

- `page-header` exibe:
  - badge `Painel da empresa` como contexto.
  - título `Dashboard empresa`.
  - subtítulo quantificando candidaturas recebidas.
  - avatar da empresa.

### Perfil resumido

- `section.profile-card` funciona como o card `freelancer-profile-card` do painel direito do freelancer.
- Contém:
  - ícone de empresa.
  - nome da empresa.
  - descrição breve do perfil da empresa.
  - botão `Editar perfil`.

### Métricas principais

- Deve replicar o bloco de métricas do painel do freelancer, incluindo:
  - Problemas abertos
  - Contratações ativas
  - Candidaturas pendentes
  - Taxa de resposta

### Formulário de publicação

- `section.form-card` segue a hierarquia visual de cards do dashboard do freelancer, mas com campos da empresa.
- Deve incluir:
  - título do problema/projeto.
  - resumo do problema.
  - detalhamento técnico.
  - tipo de vaga.
  - nível requerido.
  - modalidade de trabalho.
  - orçamento estimado.
  - tags/tecnologias.
  - ações `Salvar rascunho` e `Publicar problema`.

## Painel direito

### Blocos de informações

- `panel-profile`: mini-resumo da empresa, mantendo o padrão de `freelancer-profile-card`.
- `Candidatos recomendados`: lista de perfis de freelancers com fit técnico.
- `Categorias mais postadas`: chips de categorias, reforçando o mesmo comportamento visual de `Categorias populares` do freelancer.
- `Dicas para contratar`: bloco adicional de orientação.

### Objetivo do painel

- Fornecer contexto rápido para recrutamento e publicação de vagas.
- Reforçar a sensação de rede ativa e oportunidades relevantes.
- Apresentar recomendações que ajudem a empresa a tomar decisões mais rápidas.

## Padrões visuais e comportamento

- Utiliza a mesma paleta escura e ênfase em laranja do dashboard do freelancer.
- Adota a mesma tipografia, espaçamentos e uso de cards arredondados.
- Preserva a organização em colunas fixas: sidebar, conteúdo principal e painel direito.
- Mantém transições suaves e estados de hover consistentes.

## Elementos específicos da empresa

- Gerenciamento de vagas/projetos publicados (equivalente ao feed de oportunidades do freelancer).
- Lista de propostas recebidas e contratações em andamento.
- Projetos concluídos como uma evolução natural das métricas.
- Estatísticas da empresa com indicadores de performance de recrutamento.
- Perfil da empresa com acesso rápido à edição institucional.
- Configurações empresariais no fluxo de navegação secundário.

## Recomendações de alinhamento

- Reutilizar a mesma estrutura de navegação e o mesmo estilo de sidebar.
- Manter a densidade de informação igual à do dashboard do freelancer.
- Trocar apenas os rótulos e o conteúdo das seções que refletem as responsabilidades empresariais.
- Garantir que a experiência de uso seja coesa entre os dois perfis, para que o usuário reconheça imediatamente o sistema como um único produto.
- Use padrões que existem na e funcionam no perfil do freelancer.