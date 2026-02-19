# Módulo de Perfil - BMO

## Objetivo

Estruturar identidade digital de freelancers e empresas para aumentar confiança e transparência.

## Modelagem sugerida (coleção `usuarios`)

- `tipo`: `empresa | freelancer`
- `nome`, `email`, `fotoURL`, `bio`, `habilidades[]`, `curriculoURL`
- `areaAtuacao`, `disponibilidade`, `criadoEm`
- Empresa: `logoURL`, `descricaoInstitucional`, `localizacao`, `site`

## Fluxo técnico implementado

1. Autenticar usuário.
2. Carregar `usuarios/{uid}`.
3. Preencher formulário automaticamente.
4. Upload para Firebase Storage (foto, currículo PDF, logo).
5. Salvar com `setDoc(..., { merge: true })`.

## Regras sugeridas (Firestore)

```txt
match /usuarios/{userId} {
  allow read: if request.auth != null;
  allow update, create: if request.auth != null && request.auth.uid == userId;
}
```

## Regras sugeridas (Storage)

```txt
match /b/{bucket}/o {
  match /perfil/{allPaths=**} {
    allow read: if request.auth != null;
    allow write: if request.auth != null;
  }
}
```

> Validar MIME em frontend e, se necessário, por convenção de path + Cloud Functions.
