# BMO - Building My Opportunity

Esta pasta contém a aplicação do BMO. Para a visão geral, instalação, configuração do Firebase/Cloudinary, modelo de dados e mapa completo do projeto, consulte o [README principal](../README.md).

## Atalhos

- [Páginas](pages/)
- [Features](features/)
- [Scripts](scripts/)
- [Serviços](services/)
- [Estilos](styles/)
- [Assets](assets/)
- [Documentação técnica](md/index.md)
- [Regras do Firestore](fire.rules/firestore.rules)
- [Índices do Firestore](fire.rules/firestore.indexes.json)
- [Configuração do Firebase](firebase.json)

## Execução local

Execute o servidor na raiz do repositório, para que os caminhos da landing page sejam resolvidos corretamente:

```bash
python -m http.server 8000
```

Abra [http://localhost:8000/](http://localhost:8000/) e, se necessário, use o Firebase Emulator Suite conforme descrito no README principal.
