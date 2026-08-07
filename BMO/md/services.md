# Documentação de Serviços de Integração (`services/`) - BMO

A pasta `services/` atua como a camada de abstração de dados (Data Access Layer - DAL) da aplicação, centralizando a lógica de comunicação com o **Firebase (Authentication, Cloud Firestore e Cloud Storage)** e serviços externos como o **Cloudinary** para upload de imagens.

---

## 1. Visão Geral dos Serviços

Os arquivos de serviços e suas responsabilidades são:

- [firebase.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/firebase.js): Inicialização oficial do Firebase SDK e exportação das instâncias principais (`auth`, `db`, `storage`).
- [authService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/authService.js): Autenticação de usuários, observação de estado de login e busca avançada de perfis.
- [perfilService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/perfilService.js): Cadastro, recuperação, atualização de dados de perfis e upload de avatares com Cloudinary.
- [candidaturaService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/candidaturaService.js): Fluxo de vagas e candidaturas (problemas/projetos publicados).
- [amizadeService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/amizadeService.js): Sistema de amizades, solicitações de conexões e chats entre amigos.
- [equipeService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/equipeService.js): Criação e gerenciamento de equipes de freelancers, controle de membros e convites.
- [chatService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/chatService.js): Gerenciamento em tempo real (onSnapshot) de mensagens e salas de conversação (projetos, amigos e equipes).

---

## 2. Detalhes das Operações por Arquivo

### 2.1. [firebase.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/firebase.js)
- Importa os módulos essenciais do Firebase v10.7.1 JS SDK.
- Exporta:
  - `auth`: Firebase Auth, controle de sessões.
  - `db`: Cloud Firestore, banco NoSQL para persistência.
  - `storage`: Firebase Storage, balde de armazenamento estático.

### 2.2. [authService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/authService.js)
- `observeAuthenticatedUser(onAuth, onUnauth)`: Registra um listener (`onAuthStateChanged`) para responder à alteração no login do usuário.
- `getUserProfile(userId)`: Consulta os dados do usuário autenticado na coleção `/usuarios`.
- `buscarPerfis({ termo, tipo, excluirUserId })`: Executa buscas de perfis na coleção `/usuarios` com base em termos de pesquisa de texto (nome, área, bio, habilidades) e tipo de perfil (freelancer, empresa).

### 2.3. [perfilService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/perfilService.js)
- `garantirUidUsuario(userId)`: Verifica se o perfil do usuário possui o código identificador estruturado (ex: `BMO-XXXXXX-XXXXXX`). Caso não exista, gera e salva usando `merge: true`.
- `uploadImagemCloudinary(file)`: Envia imagens para o servidor Cloudinary usando o Preset Unsigned `bmo_unsigned_upload` e retorna a URL segura HTTPs gerada.

### 2.4. [candidaturaService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/candidaturaService.js)
- Define a constante global `STATUS` de candidatura (pendente, aceito, recusado, concluído, cancelado).
- `getProblemas()`: Lista os projetos abertos de empresas no Firestore.
- `criarCandidatura(...)`: Cria um documento de inscrição associando o ID do problema, ID da empresa e informações do freelancer.

### 2.5. [amizadeService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/amizadeService.js)
- `buildAmizadeId(userA, userB)`: Gera um ID previsível e ordenado alfabeticamente para a amizade.
- `enviarPedidoAmizade(remetente, destinatario)`: Inicia uma solicitação com status `pendente`.
- `listarAmigos(userId)`: Faz queries combinadas no Firestore para buscar conexões aceitas onde o usuário é tanto `userA` quanto `userB`.
- `garantirChatAmizade(userA, userB)`: Cria uma entrada em `/chatsAmizade` para conversação privada assim que a conexão é estabelecida.

### 2.6. [equipeService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/equipeService.js)
- Utiliza **Firestore Batches** (`writeBatch`) para operações atômicas: ao criar uma equipe, ela é criada e o fundador é adicionado imediatamente como `admin` na subcoleção de membros.
- `listarEquipesDoUsuario(userId)`: Recupera equipes onde o freelancer está inscrito através de queries de grupo de subcoleção (`collectionGroup("membros")`).
- `responderConviteEquipe(...)`: Aceita ou recusa convites, realizando a entrada na equipe atomicamente.

### 2.7. [chatService.js](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/services/chatService.js)
- `validarAcessoAoChat(...)`: Executa verificações de segurança antes de abrir chats, garantindo conformidade com as regras de negócios.
- `escutarMensagens(chatId, callback)`: Escuta em tempo real novos documentos na subcoleção `/mensagens` usando o método do SDK `onSnapshot()`.
- `enviarMensagem(...)`: Salva a mensagem no banco e atualiza os metadados da sala (último acesso por participante, última mensagem, timestamp).
