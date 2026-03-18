# Plano de Evolução Técnica do BMO

## 1) Arquitetura e organização

Estrutura inicial proposta já aplicada no frontend:

- `authService.js`: autenticação e perfil de usuário.
- `candidaturaService.js`: consultas/criação de candidaturas e status.
- `chatService.js`: validação de acesso, listener em tempo real e envio.
- `uiFreelancer.js`: renderização da lista de problemas/candidaturas.
- `utils.js`: utilidades de UI (`toast`, loading de botão, criação de elementos).

Camadas:

1. **Dados**: acesso ao Firestore (`*Service.js`).
2. **Negócio**: validações e regras simples (`STATUS`, autorização do chat).
3. **Interface**: páginas e renderização (`chat.js`, `freelancer.js`, `uiFreelancer.js`).

## 2) Segurança (prioridade alta)

### Regras Firestore sugeridas

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isEmpresa() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == "empresa";
    }

    function isFreelancer() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == "freelancer";
    }

    match /chats/{chatId} {
      allow read: if isSignedIn() &&
        (resource.data.empresaId == request.auth.uid || resource.data.freelancerId == request.auth.uid);

      allow create: if isEmpresa();

      match /mensagens/{mensagemId} {
        allow read, create: if isSignedIn() &&
          (get(/databases/$(database)/documents/chats/$(chatId)).data.empresaId == request.auth.uid ||
           get(/databases/$(database)/documents/chats/$(chatId)).data.freelancerId == request.auth.uid);
      }
    }

    match /candidaturas/{candidaturaId} {
      allow read: if isSignedIn() &&
        (resource.data.freelancerId == request.auth.uid || resource.data.empresaId == request.auth.uid);

      allow create: if isFreelancer() &&
        request.resource.data.freelancerId == request.auth.uid;

      allow update: if isEmpresa() &&
        resource.data.empresaId == request.auth.uid;
    }
  }
}
```

## 3) Performance

- Evitar `getDocs` por problema: feito no dashboard freelancer usando **uma query de candidaturas** + `Map` em memória.
- Próximo passo: paginação de problemas com `limit` + `startAfter` + botão “Carregar mais”.

## 4) UX

- Troca de `alert()` por **toasts**.
- Estado “Carregando problemas...” no dashboard freelancer.
- Botões com estado de envio (desabilitados durante operação).
- Candidatura atualiza item sem `window.location.reload()`.

## 5) Chat

- Validação de permissão no frontend antes de abrir chat.
- Mensagens em tempo real com `onSnapshot`.
- Mensagens separadas visualmente por autor (esquerda/direita).
- Scroll automático para o fim.
- Botão voltar com `window.history.back()`.

## 6) Índices Firestore recomendados

Criar índices compostos:

1. coleção `candidaturas`: `problemaId ASC`, `freelancerId ASC`.
2. subcoleção `chats/{chatId}/mensagens`: `criadoEm ASC`.

## 7) Próximas fases

1. Segurança completa via regras.
2. Paginação e otimizações de leitura.
3. Controle de status ampliado (`recusado`, `concluído`, `cancelado`).
4. Notificações com `lida: false`.
5. Sistema de avaliação pós-projeto.
