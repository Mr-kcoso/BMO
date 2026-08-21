# Documentação de Scripts JS (`scripts/`) - BMO

A pasta `scripts/` contém os scripts JavaScript que fornecem utilidades de suporte, animações, gerenciamento de estados visuais da interface (menus, barras laterais) e renderização dinâmica dos cartões de vagas no painel de controle do freelancer.

---

## 1. Mapeamento dos Arquivos

Os arquivos contidos na pasta de scripts e seus respectivos propósitos são:

- [utils.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/utils.js): Funções utilitárias comuns (manipulação do DOM, botões de carregamento, alertas visualmente ricos/toasts).
- [animation.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/animation.js): Responsável pelas micro-interações no clique e animações de revelação ao rolar a página (reveal-on-scroll).
- [dashboard-menu.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/dashboard-menu.js): Controla o comportamento do menu hambúrguer e painel de navegação lateral para os dashboards.
- [freelancer-sidebar.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/freelancer-sidebar.js): Mantém o estado (recolhido/expandido) da barra lateral do freelancer usando armazenamento persistente (`localStorage`).
- [uiFreelancer.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/uiFreelancer.js): Renderização dinâmica e manipulação visual do feed de oportunidades/problemas no painel do freelancer.
- [auth.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/auth.js): Gerenciamento da tela de login e registro (validação de abas e redirecionamento de usuário).
- [empresa.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/empresa.js) & [equipe.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/equipe.js): Scripts para controles específicos do fluxo institucional de empresas e formação de equipes.

---

## 2. Detalhamento das Principais Funcionalidades

### 2.1. [utils.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/utils.js)
Define métodos que automatizam tarefas repetitivas do DOM:
- `createElement(tag, options)`: Encapsula a criação de elementos HTML com classes e texto.
- `clearElement(element)`: Esvazia todos os nós filhos de um elemento.
- `setButtonLoading(button, isLoading, loadingText)`: Desabilita um botão e altera seu texto para um estado de "Carregando...", retornando ao texto original assim que o processo termina.
- `showToast(message, type)`: Gera notificações flutuantes (Toasts) temporárias na tela com suporte para tipos `info`, `success` e `error`.

### 2.2. [animation.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/animation.js)
Implementa melhorias na UX visual:
- **Reveal-on-Scroll**: Utiliza a API `IntersectionObserver` do navegador para aplicar um efeito de aparecimento suave (`is-visible`) em elementos selecionados (como cards de vagas e seções) conforme eles entram na tela.
- **Observador de Mutação**: Monitora alterações dinâmicas nas listas de vagas ou conversas do Firestore (`MutationObserver`) para aplicar os efeitos de revelação aos novos itens que forem inseridos de forma assíncrona.
- **Micro-interações**: Adiciona a classe `.is-micro-active` por 450ms ao clicar em elementos interativos para disparar leves animações em CSS.

### 2.3. [uiFreelancer.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/uiFreelancer.js)
Constrói dinamicamente os posts de problemas/oportunidades no feed dos freelancers com base nos dados do banco:
- `renderProblema(...)`: Cria a estrutura de cartões do feed (`.freelancer-post`), popula dados do projeto (título, descrição, remuneração em formato BRL, tags de nível como Iniciante/Intermediário, e data formatada de criação).
- Adiciona ouvintes de evento para os botões de ação social do card (Salvar no localStorage, Compartilhar via API Web Share ou cópia de link na área de transferência, Comentar e Ver Detalhes).
- Trata dinamicamente o botão de Call-To-Action (CTA): exibe se está "Pendente", "Recusado", "Candidatar-se" ou "Abrir chat" caso a empresa tenha aceitado a proposta do freelancer.

### 2.4. [dashboard-menu.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/scripts/dashboard-menu.js)
Controla os painéis laterais (slide panels) dos dashboards:
- Utiliza delegação de eventos para ouvir cliques em botões com atributos `data-menu-trigger` e `data-menu-close`.
- Adiciona suporte a fechar menus pressionando a tecla `Escape`.
- Gerencia o bloqueio de rolagem do documento (`overflow = "hidden"` no body) enquanto o menu lateral estiver aberto.
