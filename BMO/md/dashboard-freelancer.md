# Dashboard Freelancer

## Objetivo

Documentar a estrutura atual do dashboard do freelancer, descrevendo a organização de layout, navegação, componentes visuais, padrões de interação e comportamento da interface.

## Visão geral

O dashboard do freelancer é uma página multipainel com uma navegação lateral persistente, conteúdo principal em formato de feed e um painel lateral de recomendações. O objetivo é oferecer acesso rápido a oportunidades, mensagens e rede profissional.

## Estrutura principal

- `aside.freelancer-sidebar`: barra lateral fixa do dashboard.
- `main.freelancer-social-shell`: área principal do feed de oportunidades.
- `aside.freelancer-right-panel`: painel complementar com recomendações, categorias e conexões sugeridas.
- `nav.freelancer-bottom-nav`: navegação mobile.

## Sidebar

### Seções

1. **Principal**
   - Início
   - Projetos
   - Mensagens
2. **Rede**
   - Meus Amigos
   - Buscar Perfis
   - Equipes
   - Configurações

### Comportamento

- O menu permite destacar o item ativo com `is-active`.
- Há um botão de recolher/expandir para compactar a sidebar em telas grandes.
- O rodapé inclui o mini-perfil do usuário e um CTA para buscar perfis.

## Conteúdo principal

### Cabeçalho do feed

- `freelancer-feed-header` exibe:
  - `freelancer-kicker`: pequeno texto introdutório.
  - `h1`: título da página (`Problemas disponiveis`).
  - `freelancer-subtitle`: resumo dinâmico com número de oportunidades.
  - avatar de acesso rápido ao perfil.

### Filtros e busca

- `freelancer-social-filters` combina:
  - campo de busca por texto.
  - seletor de categoria.
  - seletor de nível.
  - seletor de ordenação.

### Feed de oportunidades

- `ul.freelancer-social-feed`: lista de cards de oportunidades.
- Indicadores de carregamento e estado vazio aparecem dinamicamente.
- Cada card deve ser simples, compactável e legível.

## Painel direito

### Blocos de informações

- `freelancer-profile-card`: mini-resumo do perfil do usuário.
- `Projetos recomendados`: lista de sugestões com mini-thumbs.
- `Categorias populares`: chips de tendências.
- `Conexoes sugeridas`: lista de segmentos profissionais.

### Objetivo do painel

- Complementar o feed com insights rápidos.
- Oferecer ajuda na descoberta de oportunidades relevantes.
- Reforçar a sensação de rede profissional ativa.

## Navegação mobile

- `freelancer-bottom-nav` reproduz os itens principais:
  - Início
  - Projetos
  - Chats
  - Amigos

## Padrões visuais e comportamento

- Layout em três colunas no desktop, com o feed no centro e painéis laterais alinhados.
- Uso de cards com cantos arredondados, espaçamentos consistentes e tipografia clara.
- Paleta escura com destaques em laranja nos elementos interativos.
- Transições suaves de hover e estado ativo.
- O design reforça a sensação de pertença a um único sistema.

## Observações de idealidade

- O dashboard atual já apresenta uma boa hierarquia de conteúdo e navegação clara.
- Idealmente, o dashboard de freelancer deve ser a base de comparação para o dashboard da empresa.
- Recomenda-se manter o mesmo desenho de sidebar, a mesma distribuição de cards e a mesma densidade de informação.
- O principal diferencial deve vir do conteúdo das seções, não da estrutura.
