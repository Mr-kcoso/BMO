# Regras recomendadas do Firebase Storage (BMO)

Use estas regras no Firebase Console > Storage > Rules para permitir upload de perfil por usuário autenticado.

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /perfil/{tipo}/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Observações

- Essas regras exigem usuário logado e dono do diretório (`userId`).
- Se quiser liberar leitura pública de currículos/fotos, ajuste apenas `allow read`.
- Depois de publicar regras, aguarde alguns segundos e teste novamente.
