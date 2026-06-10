# BMO — Building My Opportunity

<div align="center">
  <h3>✨ Plataforma de Conexão e Colaboração para Freelancers e Empresas (TCC) ✨</h3>
  <p><i>Conectando talentos de software e hardware a desafios reais do mercado de trabalho.</i></p>
</div>

---

## 📖 Sobre o BMO

O **B.M.O (Building My Opportunity)** é um ecossistema digital desenvolvido como projeto de conclusão de curso (TCC) que simplifica e inova a intermediação de serviços de tecnologia. Ele atua em duas frentes complementares:
1. **Para Empresas**: Uma ferramenta ágil para publicar problemas técnicos, gerenciar propostas e encontrar talentos qualificados.
2. **Para Freelancers**: Um ambiente dinâmico para buscar desafios reais, construir portfólios, criar conexões profissionais com outros desenvolvedores e gerenciar equipes de trabalho cooperativo.

---

## 🌟 Recursos e Funcionalidades Principais

### 🔒 Autenticação e Roteamento Seguro
- Fluxo de login e registro de contas integrado com **Firebase Authentication**.
- Roteador dinâmico de perfil (`perfil.html`) que identifica se o usuário logado é **Freelancer** ou **Empresa** e o direciona automaticamente para seu respectivo painel de controle.

### 👤 Perfis Customizados
- **Freelancer**:
  - Upload de foto de perfil (via Cloudinary).
  - Upload de currículo em PDF (via Firebase Storage).
  - Listagem dinâmica de habilidades (tags) e áreas de atuação.
  - Indicador de disponibilidade (Disponível, Ocupado, Indisponível).
  - Limite de biografia a **280 caracteres** com contador em tempo real.
  - Links sociais diretos para o GitHub e LinkedIn.
- **Empresa**:
  - Cadastro institucional com segmento, logotipo (via Cloudinary) e localização física.
  - Links oficiais do site institucional e redes sociais.

### 💼 Feed de Problemas e Candidaturas
- Listagem dinâmica de projetos/desafios abertos publicados por empresas parceiras.
- Filtro em tempo real por termos chaves, tipo de projeto e nível de complexidade (Iniciante / Intermediário).
- Fluxo de candidatura instantâneo: o freelancer envia sua proposta e acompanha o status ("Pendente", "Recusado" ou "Aceito").
- Se a candidatura for **Aceita**, a plataforma habilita diretamente um canal de chat privado com a empresa parceira.

### 🤝 Rede Social e Conexões (Amizades)
- Busca global de perfis cadastrados no BMO.
- Envio de solicitações de conexão/amizade entre freelancers.
- Listagem de amigos conectados e solicitações pendentes.
- Criação dinâmica de chats individuais entre freelancers conectados para discussões técnicas ou compartilhamento de experiências.

### 👥 Formação de Equipes
- Permite que freelancers criem equipes de trabalho cooperativo (ex: para resolver grandes desafios que demandam múltiplos profissionais).
- Painel para convidar outros membros, gerenciar solicitações de entrada e listar as equipes ativas.
- Definição de níveis de permissão dentro do time (Administradores/Membros).

### 💬 Mensageria Instantânea em Tempo Real
Integração com **Cloud Firestore** usando listeners em tempo real (`onSnapshot`) dividida em três canais específicos:
1. **Chats de Projetos (B2B / B2C)**: Comunicação direta entre a empresa publicadora e o freelancer candidato aceito.
2. **Chats de Amizade (P2P)**: Comunicação privada entre dois freelancers conectados.
3. **Chats de Equipe (Grupo)**: Canal de conversação coletiva entre todos os membros de uma equipe de freelancers.
- Indicador visual de mensagens não lidas com base em timestamps de último acesso.
- Barra de rolagem dinâmica e efeitos de transição fluidos no envio e recebimento de mensagens.

---

## 📂 Arquitetura do Repositório

O projeto é estruturado segundo boas práticas de modularidade, separando a camada de visualização, lógica de comportamento, serviços de dados e recursos de estilo:

```text
Bmo
├── assets/             # Recursos estáticos de mídia
│   ├── Fotos/          # Logotipos, ícones de redes sociais e avatares padrão
│   └── videos/         # Vídeos decorativos em loop do mascote BMO
├── features/           # Controladores de lógica e comportamento dinâmico (JavaScript)
│   ├── busca-perfis.js # Controlador da página de busca de usuários
│   ├── chat.js         # Lógica da sala de chat ativa em tempo real
│   ├── freelancer.js   # Lógica do painel e feed de oportunidades do freelancer
│   ├── meus-amigos.js  # Gerenciamento de conexões e convites de amizade
│   ├── meus-chats.js   # Listagem e categorização de canais de chat
│   ├── minhas-equipes.js # Criação, convites e controle de membros de equipes
│   └── perfil.js       # Validação e salvamento de dados cadastrais
├── fire.rules/         # Arquivo de segurança e permissões de dados
│   └── firestore.rules # Regras de acesso NoSQL escritas em Common Expression Language
├── md/                 # Documentação técnica detalhada de cada módulo
│   ├── index.md        # Índice principal da documentação técnica
│   ├── styles.md       # Variáveis de estilo, CSS Grid/Flexbox e animações
│   ├── assets.md       # Inventário de recursos visuais
│   ├── fire_rules.md   # Mapeamento detalhado de segurança do banco
│   ├── scripts.md      # Lógica de manipulação de DOM e toasts
│   ├── services.md     # Camada de comunicação com APIs do Firebase e Cloudinary
│   └── features.md     # Detalhes de negócios de cada funcionalidade
├── pages/              # Páginas de visualização HTML
│   ├── index.html      # Landing page pública da plataforma BMO
│   ├── register.html   # Tela moderna de autenticação (Login / Cadastro)
│   ├── chat.html       # Sala de chat em tempo real
│   ├── perfil.html     # Roteador de perfis
│   └── ...             # Demais interfaces HTML de dashboards e termos legais
├── scripts/            # Scripts utilitários de suporte à interface
│   ├── utils.js        # Helpers do DOM, botões de loading e toasts de notificação
│   ├── animation.js    # IntersectionObserver (scroll reveal) e micro-interações
│   ├── dashboard-menu.js # Abertura/fechamento do menu hambúrguer com tecla Escape
│   ├── freelancer-sidebar.js # Barra lateral retrátil com estado salvo no localStorage
│   └── uiFreelancer.js # Renderizador dinâmico de cards do feed de vagas
└── services/           # Camada de Acesso a Dados (DAL - Data Access Layer)
    ├── firebase.js     # Inicialização e exportação de instâncias SDK v10
    ├── authService.js  # Funções de autenticação e busca estruturada de perfis
    ├── perfilService.js # Gestão de perfis e upload via API Cloudinary
    ├── chatService.js  # Escuta ativa e envio de mensagens no Firestore
    ├── amizadeService.js # Lógica de relacionamentos NoSQL de conexões
    └── equipeService.js # Criação e manipulação de grupos com Firestore Batches
```

---

## 🗄️ Modelagem de Dados (Cloud Firestore)

Abaixo estão descritas as principais coleções do banco NoSQL Cloud Firestore que suportam a plataforma:

### 1. Coleção `/usuarios/{userId}`
Armazena as informações cadastrais e de portfólio.
- **Campos Comuns**: `nome`, `email`, `tipo` ("freelancer" ou "empresa"), `uidUsuario` (Código de identificação, ex: `BMO-A7F2D8-G294JK`), `fotoURL` (link Cloudinary), `linkedin`, `github`, `criadoEm`, `atualizadoEm`.
- **Campos de Freelancer**: `bio` (máx 280 caracteres), `habilidades` (array de strings), `areaAtuacao`, `disponibilidade` ("disponivel", "ocupado", "indisponivel").
- **Campos de Empresa**: `logoURL` (link Cloudinary), `descricaoInstitucional`, `localizacao`, `site`.

### 2. Coleção `/amizades/{amizadeId}`
Controla conexões entre freelancers. O `amizadeId` é composto pela ordenação alfabética e junção dos IDs dos dois usuários envolvidos.
- **Campos**: `userA`, `userB`, `status` ("pendente" ou "aceita"), `createdAt`.

### 3. Coleção `/problemas/{problemaId}`
Armazena os projetos ou desafios abertos pelas empresas.
- **Campos**: `empresaId`, `empresaNome`, `titulo`, `descricao`, `tipo` (área de desenvolvimento), `nivel` ("iniciante" ou "intermediario"), `urgente` (boolean), `remoto` (boolean), `valorSimulado` (number), `criadoEm`.

### 4. Coleção `/candidaturas/{candidaturaId}`
Inscrições de freelancers nos projetos.
- **Campos**: `problemaId`, `empresaId`, `freelancerId`, `freelancerNome`, `status` ("pendente", "aceito", "recusado", "concluido", "cancelado"), `criadoEm`.

### 5. Coleção `/equipes/{equipeId}`
Representa os grupos cooperativos.
- **Campos**: `nome`, `descricao`, `criadorId`, `fotoEquipe`, `createdAt`.
- **Subcoleção `/equipes/{equipeId}/membros/{userId}`**:
  - `role` ("admin" ou "membro"), `joinedAt`.

---

## ⚙️ Instalação e Configuração

Para rodar o projeto localmente, siga os passos abaixo:

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/bmo.git
cd bmo/Bmo-feat
```

### 2. Configurar o Firebase
1. Crie um projeto no Console do Firebase.
2. Ative o serviço **Authentication** com o provedor de E-mail/Senha.
3. Crie um banco **Cloud Firestore** em modo de teste e configure as regras usando as regras contidas em `fire.rules/firestore.rules`.
4. Obtenha as credenciais do seu aplicativo web nas configurações do projeto e cole-as no arquivo [firebase.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/firebase.js) substituindo as variáveis de configuração:
   ```javascript
   export const firebaseConfig = {
     apiKey: "SUA_API_KEY",
     authDomain: "seu-projeto.firebaseapp.com",
     projectId: "seu-projeto",
     storageBucket: "seu-projeto.appspot.com",
     // ...
   };
   ```

### 3. Configurar a API do Cloudinary
Para habilitar o upload de fotos de perfil, logotipos e avatares de equipe:
1. Crie uma conta gratuita no **Cloudinary**.
2. Vá nas configurações do painel do Cloudinary e crie um **Unsigned Upload Preset** (ex: `bmo_unsigned_upload`).
3. Adicione o nome da sua nuvem e o nome do Preset no arquivo [perfilService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/perfilService.js) e no [equipeService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/equipeService.js):
   ```javascript
   const CLOUDINARY_CLOUD_NAME = "seu_cloud_name";
   const CLOUDINARY_UPLOAD_PRESET = "seu_upload_preset";
   ```

### 4. Executar Localmente
Por utilizar módulos Javascript ES6 nativos, as páginas HTML devem ser servidas por um servidor web local.
- Se você utiliza o VS Code, pode usar a extensão **Live Server**.
- Alternativamente, execute usando o Python:
  ```bash
  python -m http.server 8000
  ```
  E acesse `http://localhost:8000/pages/index.html` no seu navegador.

---

## 📚 Documentação Adicional
Para navegar na árvore técnica completa, consulte o **[Sumário Geral da Documentação Técnica (index.md)](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/md/index.md)**.
