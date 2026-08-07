# Documentação de Regras do Firebase (`firestore.rules`) - BMO

As regras de segurança do Firebase controlam o acesso (leitura, escrita e exclusão) aos documentos do banco de dados Cloud Firestore. Elas garantem que apenas usuários autenticados e autorizados possam visualizar ou modificar dados confidenciais do projeto BMO.

---

## 1. Funções Auxiliares (Helpers)

Para evitar repetição de código e aumentar a clareza, são definidas funções na raiz:

- **`isSignedIn()`**:
  - Verifica se a requisição contém um token de autenticação válido do Firebase (`request.auth != null`).
- **`isTeamMember(teamId)`**:
  - Verifica se o usuário autenticado é membro de uma equipe específica, checando a subcoleção `/equipes/{teamId}/membros/{userId}`.
- **`isTeamAdmin(teamId)`**:
  - Verifica se o usuário autenticado tem a regra (`role`) de `"admin"` dentro da subcoleção de membros da equipe.

---

## 2. Regras de Coleções e Documentos

### 2.1. Coleção `/usuarios/{userId}`
- **Leitura**: Qualquer usuário autenticado (`isSignedIn()`) pode ler dados de outros perfis (necessário para a busca e perfis públicos).
- **Criação e Edição**: Permitida apenas se o ID do usuário autenticado for igual ao ID do documento (`request.auth.uid == userId`).
- **Exclusão**: Bloqueada para todos (`allow delete: if false`).

### 2.2. Coleção `/amizades/{amizadeId}`
Gerencia conexões sociais entre usuários.
- **Leitura**: Permitida apenas se o usuário autenticado for um dos dois participantes da amizade (`userA` ou `userB`).
- **Criação**: Permitida apenas se o remetente for `userA`, os participantes forem diferentes e o status inicial for `"pendente"`.
- **Edição**: Permitida apenas para o destinatário (`userB`) aceitar a amizade (mudança de status para `"aceita"`).

### 2.3. Coleção `/problemas/{problemaId}`
Armazena os projetos ou problemas publicados pelas empresas.
- **Leitura**: Qualquer usuário autenticado pode ler as vagas e problemas.
- **Escrita (Criar, Editar, Excluir)**: Permitida apenas se a empresa criadora (`empresaId`) for o próprio usuário autenticado.

### 2.4. Coleção `/candidaturas/{candidaturaId}`
Inscrições de freelancers em vagas de empresas.
- **Leitura**: O próprio freelancer candidato ou a empresa que publicou a vaga podem ler a candidatura.
- **Criação**: Permitida apenas se o freelancer autenticado for o dono da candidatura e o status inicial for `"pendente"`.
- **Edição**: Permitida a ambos os envolvidos (empresa para aceitar/recusar, freelancer para atualizar/cancelar).

### 2.5. Coleção `/equipes/{equipeId}`
Gerenciamento de equipes de freelancers.
- **Criação**: Qualquer usuário autenticado pode criar, definindo a si mesmo como `criadorId`.
- **Leitura**: Restrita aos membros da equipe (`isTeamMember()`).
- **Edição/Exclusão**: Restrita aos administradores da equipe (`isTeamAdmin()`).
- **Subcoleção `/membros/{userId}`**:
  - Usuários comuns só criam sua entrada se forem convidados ou se criaram a equipe. Administradores têm plenos poderes de gerenciamento.

### 2.6. Coleção `/convitesEquipe/{conviteId}`
- **Leitura**: Apenas o usuário convidado (`convidadoId`) pode visualizar seu convite.
- **Criação**: Qualquer usuário autenticado pode convidar outros para equipes.
- **Edição**: O convidado pode atualizar o status para `"aceito"` ou `"recusado"`.

### 2.7. Coleções de Mensagens e Chats
O sistema possui 3 canais de comunicação isolados:

1. **Chats B2B/B2C (`/chats/{chatId}`)**:
   - Entre Empresa e Freelancer.
   - Leitura/Escrita permitida apenas se o UID do usuário for igual a `empresaId` ou `freelancerId`.
2. **Chats de Amigos (`/chatsAmizade/{chatId}`)**:
   - Entre dois freelancers conectados.
   - Leitura/Escrita permitida se o UID do usuário estiver na lista `participants`.
3. **Chats de Equipe (`/chatsEquipe/{chatId}`)**:
   - Grupo da equipe de freelancers.
   - O ID do chat corresponde ao ID da equipe (`equipeId`).
   - Leitura/Escrita restrita a membros na lista de `participants`.
