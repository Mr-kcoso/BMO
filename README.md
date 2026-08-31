# BMO - Building My Opportunity

Plataforma web multipágina (MPA) para conectar freelancers e empresas, publicada como projeto de conclusão de curso. O BMO permite que empresas divulguem problemas e acompanhem candidaturas, enquanto freelancers encontram oportunidades, mantêm seu perfil, criam conexões e participam de equipes.

## Visão geral

O projeto é uma aplicação frontend estática composta por HTML, CSS e JavaScript com módulos ES nativos. Os dados e a autenticação são fornecidos pelo Firebase; imagens de perfis e equipes são enviadas ao Cloudinary.

### Funcionalidades

- Cadastro e login por e-mail e senha com Firebase Authentication.
- Redirecionamento para dashboards de freelancer ou empresa conforme o tipo de conta.
- Perfis de freelancer e empresa, com campos específicos, avatar/logotipo e links sociais.
- Upload de imagens de perfil, logotipo e equipe pelo Cloudinary.
- Feed de problemas publicados por empresas, com busca, categoria, nível, ordenação e detalhes.
- Candidaturas de freelancers com status pendente, aceito, recusado, concluído ou cancelado.
- Gestão empresarial de problemas, candidaturas recebidas, métricas e planos simulados.
- Busca de perfis de freelancers e empresas e visualização de perfil público.
- Solicitações de amizade entre freelancers, lista de amigos e chat individual.
- Criação de equipes, convites, membros, papéis de administrador/membro e saída ou exclusão.
- Chats de projeto, amizade e equipe em tempo real com Cloud Firestore `onSnapshot`.
- Histórico e carregamento de mensagens anteriores, indicador de novas mensagens e marcação como lida.
- Menus responsivos, barra lateral recolhível, skeleton loaders, toasts e animações de entrada.

## Como executar

O projeto não possui `package.json` nem um processo de build. Como os arquivos usam módulos ES, abra-o por um servidor HTTP local.

```bash
python -m http.server 8000
```

Depois acesse [http://localhost:8000/](http://localhost:8000/). A página inicial está na raiz e usa os arquivos da pasta `BMO/`.

Também é possível usar a extensão Live Server do VS Code.

## Firebase

O frontend inicializa o Firebase em [`BMO/services/firebase.js`](BMO/services/firebase.js) usando o projeto configurado no código. Para usar outro projeto:

1. Crie um aplicativo Web no Firebase.
2. Ative Authentication com o provedor E-mail/Senha.
3. Crie um banco Cloud Firestore.
4. Atualize `firebaseConfig` em `BMO/services/firebase.js`.
5. Publique ou teste as regras em [`BMO/fire.rules/firestore.rules`](BMO/fire.rules/firestore.rules).
6. Publique os índices de [`BMO/fire.rules/firestore.indexes.json`](BMO/fire.rules/firestore.indexes.json), quando necessário.

O arquivo [`BMO/firebase.json`](BMO/firebase.json) configura o Firestore e o emulador local:

```bash
firebase emulators:start --only firestore
```

O projeto usa o emulador do Firestore na porta `8080` e a interface do emulador na porta `4000`. A configuração atual não define Firebase Hosting.

> As credenciais de um app Firebase Web podem aparecer no frontend, mas regras do Firestore e configurações de upload continuam sendo responsabilidades de segurança. Revise as regras antes de disponibilizar o projeto publicamente.

## Cloudinary

Os uploads usam um unsigned upload preset configurado em:

- [`BMO/services/perfilService.js`](BMO/services/perfilService.js), para imagens de perfil e logotipos.
- [`BMO/services/equipeService.js`](BMO/services/equipeService.js), para fotos de equipes.

Para trocar a conta, ajuste o cloud name e o upload preset nesses serviços e configure o preset unsigned no Cloudinary. O upload de imagens de perfil e equipes é limitado a 8 MB no formulário de perfil; valide também limites e formatos no painel do Cloudinary.

## Estrutura do repositório

```text
.
├── index.html                 # Landing page e ponto de entrada
└── BMO/
    ├── assets/                # Fotos, logos e vídeos do projeto
    ├── features/              # Controladores ligados às páginas
    ├── fire.rules/            # Regras e índices do Firestore
    ├── md/                    # Documentação técnica complementar
    ├── pages/                 # Telas HTML da aplicação
    ├── scripts/               # Scripts compartilhados e de dashboards
    ├── services/              # Firebase, Cloudinary e regras de negócio
    ├── styles/                # Folhas de estilo por área da aplicação
    ├── firebase.json          # Configuração do Firebase Emulator Suite
    └── README.md              # Documentação específica do app
```

### Páginas

| Área | Páginas |
| --- | --- |
| Acesso e institucional | `sobre.html`, `register.html`, `contato.html`, `politica.html`, `termosdeuso.html` |
| Perfis | `perfil.html`, `perfil-freelancer.html`, `perfil-empresa.html`, `perfil-publico.html`, `configuracao-empresa.html`, `Configuracao-freelancer.html` |
| Freelancer | `dashboard-freelancer.html`, `projetos.html`, `problemas-freelancer.html`, `busca-perfis.html`, `busca-perfil-Empresa.html`, `meus-amigos.html`, `minhas-equipes.html`, `equipe.html`, `freelancers-salvos.html` |
| Empresa | `dashboard-empresa.html`, `dashboard.html`, `meus-planos-empresa.html` |
| Comunicação | `meus-chats.html`, `chat.html` |

Os links da landing page em [`index.html`](index.html) levam ao fluxo de cadastro, às informações institucionais e aos termos legais.

### JavaScript

- `features/`: `freelancer.js` renderiza o feed e candidaturas; `empresa-freelancers.js` e `meus-planos-empresa.js` atendem fluxos da empresa; `busca-perfis.js`, `perfil-publico.js`, `perfil.js`, `meus-amigos.js`, `minhas-equipes.js`, `meus-chats.js` e `chat.js` controlam os demais fluxos.
- `scripts/`: `auth.js` implementa cadastro/login; `empresa.js` controla o dashboard empresarial; `equipe.js` controla uma equipe; `uiFreelancer.js` renderiza cards do feed; `utils.js` concentra utilitários; `animation.js`, `dashboard-menu.js`, `freelancer-sidebar.js` e `sidebar.js` cuidam da interface compartilhada.
- `services/`: `firebase.js`, `authService.js`, `perfilService.js`, `candidaturaService.js`, `amizadeService.js`, `equipeService.js`, `chatService.js` e `freelancerEmpresaService.js` encapsulam acesso a dados e integrações.

### CSS e assets

Os estilos estão separados por contexto: `design.css` é a base; `auth-modern.css` atende autenticação; `dashboard-empresa.css`, `empresa-freelancers.css`, `equipe-hub.css`, `minhas-equipes.css`, `busca-perfis.css`, `perfil-modern.css` e `perfil-publico.css` atendem telas específicas; `chat-modern.css`, `freelancer-social.css` e `freelancer-sidebar.css` compõem as experiências de comunicação e freelancer.

Em `BMO/assets/` ficam `fotos/` (logo, imagens de demonstração e ícones) e `videos/` (`bmo_liga.mp4` e `bmo_idle.mp4`).

## Modelo de dados

As regras em [`BMO/fire.rules/firestore.rules`](BMO/fire.rules/firestore.rules) são a referência de autorização. As principais coleções são:

- `usuarios/{userId}`: dados comuns, tipo de conta, perfil profissional e, para empresas, plano atual e histórico de planos.
- `problemas/{problemaId}`: título, descrição, detalhamento, categoria, nível, prazo, valor simulado, flags de urgência/remoto e empresa responsável.
- `candidaturas/{candidaturaId}`: problema, empresa, freelancer, nome do candidato, status e data de criação.
- `amizades/{amizadeId}`: `userA`, `userB`, status pendente/aceita e data de criação. O ID é determinístico e ordenado.
- `equipes/{equipeId}`: nome, descrição, criador e foto; `membros/{userId}` guarda papel e data de entrada.
- `convitesEquipe/{conviteId}`: equipe, convidado, remetente, nome da equipe e status do convite.
- `chats/{chatId}`: conversas de projeto entre empresa e freelancer.
- `chatsAmizade/{chatId}`: conversas privadas entre freelancers conectados.
- `chatsEquipe/{equipeId}`: conversa coletiva da equipe.
- Cada chat possui a subcoleção `mensagens/{mensagemId}`. Metadados como última mensagem e último acesso ficam no documento da sala.

## Documentação técnica

Consulte o [índice da documentação](BMO/md/index.md) para detalhes de páginas, features, scripts, serviços, estilos, assets e regras do Firestore.

## Estado atual

Este é um frontend acadêmico/protótipo integrado a serviços externos. Não há testes automatizados ou pipeline de build definidos no repositório. Antes de um uso de produção, recomenda-se revisar regras de segurança, tratamento de credenciais e uploads, validação de dados, observabilidade e estratégia de hospedagem.
