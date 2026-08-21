# Documentação de Módulos de Feature (`features/`) - BMO

A pasta `features/` agrupa a lógica de comportamento das telas do BMO. Cada arquivo representa o controlador ("Controller") ou cérebro por trás de uma página HTML específica, vinculando os dados vindos dos serviços à renderização de interface e regras de negócios.

---

## 1. Estrutura dos Arquivos de Features

As features estão distribuídas em:

- [perfil.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/perfil.js): Controle do formulário de preenchimento e salvamento do perfil do usuário (Freela ou Empresa).
- [perfil-publico.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/perfil-publico.js): Controlador da tela de visualização pública do perfil de outros freelancers.
- [freelancer.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/freelancer.js): Comportamento do feed de problemas/oportunidades no painel do freelancer.
- [busca-perfis.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/busca-perfis.js): Lógica de busca de usuários (filtro por freelancers, empresas ou termos chaves).
- [meus-amigos.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/meus-amigos.js): Lógica de gerenciamento de conexões (solicitações pendentes e lista de amigos).
- [minhas-equipes.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/minhas-equipes.js): Criação de equipes de trabalho, envio de convites e gestão de membros.
- [meus-chats.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/meus-chats.js): Carregamento dinâmico e organização das salas de chats (projetos, amigos, equipes).
- [chat.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/chat.js): Gerenciamento da conversa ativa em tempo real (envio e recebimento de mensagens).
- [meus-planos-empresa.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/meus-planos-empresa.js): Controle visual e ações de contratação de planos institucionais.

---

## 2. Detalhes Técnicos e Regras de Negócios

### 2.1. [perfil.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/perfil.js)
- **Roteamento de Campos**: Mostra/esconde formulários dinamicamente com base no tipo de usuário logado (freelancer exibe habilidades/área, empresa exibe descrição/localização/site).
- **Validações Client-side**:
  - Limita a biografia do freelancer a **280 caracteres** com atualização de contador em tempo real (`atualizarContadorBio`).
  - Impede o upload de fotos de perfil ou logotipos institucionais que excedam o tamanho máximo de **8 MB**.
- **Upload**: Envia a foto/logotipo selecionada ao Cloudinary de forma assíncrona antes de submeter os dados textuais ao Cloud Firestore.

### 2.2. [freelancer.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/freelancer.js)
- **Carregamento de Oportunidades**: Coleta a lista de problemas da empresa e a lista de candidaturas do freelancer.
- **Renderização Condicional**: Se o freelancer já se candidatou, renderiza o status da candidatura ("Pendente", "Recusado" ou o botão "Abrir chat" caso a empresa tenha aceitado a candidatura).

### 2.3. [meus-amigos.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/meus-amigos.js)
- **Painel de Convites**: Lista conexões que solicitaram amizade e permite aceitar a conexão com um clique.
- **Rede de Amigos**: Apresenta todos os freelancers parceiros conectados, permitindo a abertura direta de chat individual (gerando o Chat de Amizade dinamicamente).

### 2.4. [minhas-equipes.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/minhas-equipes.js)
- **Gestão de Time**: Permite a criação de equipes cooperativas de freelancers.
- **Integração de Convites**: Lógica para enviar convites por e-mail/ID a outros freelancers e responder a convites recebidos (inserindo o usuário na subcoleção de membros da equipe se aceito).

### 2.5. [chat.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/chat.js) & [meus-chats.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/features/meus-chats.js)
- **Filtro de Mensagens**: `meus-chats.js` separa as conversas por contexto (projetos, amigos ou equipes) e exibe selos de mensagens não lidas com base em timestamps de último acesso.
- **Chat Ativo**: `chat.js` conecta à subcoleção `/mensagens` no Firestore com `onSnapshot`, escutando novidades instantaneamente e rolando a conversa para o fim (`scrollIntoView`).
