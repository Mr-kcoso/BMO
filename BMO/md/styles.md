# Documentação de Estilos (CSS) - BMO

Esta pasta contém as folhas de estilo (CSS) que definem a identidade visual, o design system, as animações e a responsividade da plataforma BMO (Building My Opportunity). 

A interface utiliza uma estética moderna com temas escuros (dark mode), elementos translúcidos (glassmorphism), gradientes de cor vibrantes (laranja e ciano) e micro-animações interativas.

---

## 1. Estrutura dos Arquivos de Estilos

Os arquivos de estilos estão organizados na pasta `styles/`:

- [design.css](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/styles/design.css): O arquivo principal que define o design system, variáveis globais, resets e componentes comuns.
- [auth-modern.css](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/styles/auth-modern.css): Estilos modernos dedicados à página de autenticação (Login e Cadastro).
- [chat-modern.css](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/styles/chat-modern.css): Estilos para a interface de chats (mensagens, balões, lista de conversas).
- [freelancer-sidebar.css](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/styles/freelancer-sidebar.css): Estilização da barra lateral de navegação no painel do freelancer.
- [freelancer-social.css](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/styles/freelancer-social.css): Estilos para a rede social e feed de vagas/projetos do freelancer.

---

## 2. Detalhes de Cada Arquivo

### 2.1. [design.css](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/styles/design.css)
É o núcleo visual do projeto. Define:
- **Variáveis Globais**: Cores principais do tema BMO (`--bmo-laranja`, `--bmo-preto`, `--bmo-azul`, `--gradient`, etc.).
- **Estilos de Componentes Base**: Botões padrão (como `.btn-primary` e `.btn-submit`), inputs, textareas, e select boxes com bordas arredondadas e transições suaves.
- **Layouts Globais**: Estrutura de cards (`.card`), Abas (`.tabs` / `.tab-button`), menus hamburger com painel lateral (`.dashboard-menu-panel`), e overlays.
- **Feedback de Interface**: Configurações de Toasts de notificação (`.toast-container` com classes para erro, sucesso e informação) e animações de skeleton loaders (`pulseSkeleton`, `freelancerSkeleton`).

### 2.2. [auth-modern.css](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/styles/auth-modern.css)
Responsável pelo visual moderno das páginas de Login/Cadastro (`auth.html` ou `register.html`):
- **Efeitos de Vidro (Glassmorphism)**: Cartões flutuantes (`.auth-glass-card`) com filtros de desfoque (`backdrop-filter`) e sombras profundas.
- **Gradientes Mesh**: Fundo escuro misturado com gradientes radiais em pontos estratégicos (ciano e laranja).
- **Animações 3D**:
  - `authCubeSpin`: Um cubo 3D giratório no espaço usando perspectiva CSS (`auth-cube` / `cube-face`).
  - `authFloat`: Efeito de flutuação vertical contínua para os elementos decorativos.

### 2.3. [chat-modern.css](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/styles/chat-modern.css)
Personaliza a página de mensagens (`chat.html` e `meus-chats.html`):
- **Balões de Mensagens**: Diferenciação clara entre mensagens enviadas (`.mensagem-propria` em gradiente laranja) e recebidas (`.mensagem-outro` em tom cinza translúcido).
- **Scrollbar Personalizado**: Barra de rolagem estilizada em tom laranja com opacidade.
- **Estrutura de Mensagens**: Layout flexível para a lista de contatos e área de mensagens (`.mensagens-container`).

### 2.4. [freelancer-sidebar.css](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/styles/freelancer-sidebar.css) & [freelancer-social.css](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/styles/freelancer-social.css)
Cria o ambiente social para freelancers:
- **Barra Lateral Adaptativa**: Barra lateral de navegação fixa que se contrai para exibir apenas ícones em tablets e se esconde completamente em dispositivos móveis (substituída por navegação inferior `.freelancer-bottom-nav`).
- **Feed Social**: Layouts elegantes para posts e publicações de vagas (`.freelancer-post`), com botões de curtir/salvar (`data-icon`), tags de habilidades, e seções laterais de recomendações de conexões e tópicos em alta.
