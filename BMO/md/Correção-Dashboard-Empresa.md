Refatoração das páginas de Freelancers da Empresa

Contexto

Identifiquei um problema na arquitetura do projeto: algumas páginas, rotas e IDs parecem ter sido compartilhados entre os dashboards de Empresa e Freelancer, provavelmente devido à reutilização ou mesclagem de diretórios durante o desenvolvimento.

Atualmente, no menu lateral da Empresa existem as opções:

Freelancers salvos

Buscar freelancers

Entretanto, ambas estão redirecionando para as páginas do dashboard do Freelancer, o que não é o comportamento esperado.

Objetivo

Criar duas páginas exclusivas para o dashboard da Empresa, mantendo a mesma identidade visual e experiência de uso do dashboard do Freelancer, mas com rotas, arquivos e lógica independentes.

As novas páginas devem ser:

/empresa/freelancers-salvos

/empresa/buscar-freelancers

O que deve ser feito

1. Criar a página "Freelancers Salvos"

Utilize a página equivalente do Freelancer apenas como referência de layout e estrutura.

Adapte seu conteúdo para o contexto empresarial.

A página deve conter, por exemplo:

Lista de freelancers favoritados;

Barra de pesquisa;

Filtros;

Cards dos freelancers;

Botão para visualizar perfil;

Botão para convidar para um projeto;

Botão para remover dos salvos.

2. Criar a página "Buscar Freelancers"

Também utilize a versão do Freelancer apenas como base visual.

A página deve conter:

Barra de pesquisa;

Filtros por tecnologia;

Localização;

Experiência;

Disponibilidade;

Cards dos freelancers;

Paginação ou scroll infinito (caso o sistema já utilize esse padrão).

3. Corrigir as rotas

Atualize o menu lateral da Empresa para que:

Freelancers salvos abra a nova página exclusiva da Empresa.

Buscar freelancers abra a nova página exclusiva da Empresa.

Nenhum item do dashboard da Empresa deve navegar para páginas pertencentes ao dashboard do Freelancer.

4. Revisar conflitos de arquitetura

Durante a implementação, revise possíveis problemas como:

IDs duplicados;

Rotas compartilhadas indevidamente;

Imports apontando para arquivos do Freelancer;

Links incorretos;

Componentes sendo importados da pasta errada.

Caso encontre outros conflitos semelhantes entre os dois dashboards, corrija-os durante esta refatoração.

Estrutura esperada

A organização deve seguir algo semelhante a:

pages/
├── empresa/
│   ├── dashboard/
│   ├── projetos/
│   ├── freelancers-salvos/
│   └── buscar-freelancers/
│
└── freelancer/
    ├── dashboard/
    ├── buscar-projetos/
    ├── projetos-salvos/
    └── ...

A estrutura pode ser adaptada ao padrão atual do projeto, desde que Empresa e Freelancer possuam páginas independentes.

Reutilização de componentes

Sempre que possível:

Reutilize componentes compartilháveis;

Evite duplicação de código;

Centralize componentes genéricos em uma pasta compartilhada (ex.: components/shared).

Exemplos de componentes compartilháveis:

Cards;

Inputs;

Filtros;

Modais;

Botões;

Tabelas;

Paginação;

Skeletons;

Estados vazios.

Importante: Compartilhe apenas componentes. As páginas devem permanecer separadas para cada tipo de usuário.

Critérios de aceite

Ao final da implementação:

A Empresa possui suas próprias páginas para gerenciamento de freelancers.

O menu lateral da Empresa nunca redireciona para páginas do Freelancer.

Não existem conflitos de IDs, rotas ou imports.

A interface mantém a mesma identidade visual entre os dois dashboards.

O código fica mais organizado, modular e preparado para futuras expansões.