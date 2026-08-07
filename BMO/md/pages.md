# Documentação de Páginas HTML (`pages/`) - BMO

O diretório `pages/` reúne as telas que compõem a interface visual do BMO. Trata-se de um aplicativo web multipáginas (MPA) onde a navegação ocorre por arquivos HTML individuais, estilizados pelo design system e dinamizados pelos scripts e serviços do projeto.

---

## 1. Mapa de Páginas e Fluxos

### 1.1. Portal e Acesso Público
- **[index.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/index.html)**:
  - Landing page principal do projeto BMO. Apresenta o produto, os benefícios para freelancers e parceiros de negócios, e inclui os vídeos animados do mascote BMO.
- **[sobre.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/sobre.html)**:
  - Apresenta informações detalhadas da proposta institucional e acadêmica do TCC por trás do BMO.
- **[register.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/register.html)**:
  - Página unificada de login e cadastro. Conta com efeitos de órbita decorativos e alternância de formulários sem recarregamento de página.
- **[contato.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/contato.html)**:
  - Informações de contato e formulário de fale conosco para suporte e parcerias.

### 1.2. Roteamento de Perfis
- **[perfil.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/perfil.html)**:
  - Página intermediária de redirecionamento dinâmico. Lê os metadados do usuário logado e redireciona para `perfil-empresa.html` ou `perfil-freelancer.html`.
- **[perfil-freelancer.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/perfil-freelancer.html)**:
  - Dashboard de configuração do perfil do freelancer (upload de foto, upload do PDF de currículo, habilidades e área de atuação).
- **[perfil-empresa.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/perfil-empresa.html)**:
  - Dashboard de configuração do perfil institucional da empresa (segmento, descrição, logotipo).
- **[perfil-publico.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/perfil-publico.html)**:
  - Visualização de portfólio acessível a terceiros (ex: empresas avaliando o currículo de um freelancer).

### 1.3. Ambiente do Freelancer
- **[dashboard-freelancer.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/dashboard-freelancer.html)**:
  - Painel principal do freelancer. Exibe o feed geral de oportunidades publicadas por empresas para candidatura direta.
- **[meus-amigos.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/meus-amigos.html)**:
  - Lista de outros freelancers conectados (amigos), com atalho para iniciar conversas privadas.
- **[minhas-equipes.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/minhas-equipes.html)**:
  - Painel de gerenciamento de equipes de freelancers (criar equipe, ver membros, convites recebidos).
- **[busca-perfis.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/busca-perfis.html)**:
  - Interface para pesquisar outros freelancers e empresas cadastrados na plataforma.

### 1.4. Ambiente da Empresa
- **[dashboard-empresa.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/dashboard-empresa.html)**:
  - Painel principal da empresa parceira. Permite criar novos problemas/projetos, listar problemas publicados e gerenciar candidaturas recebidas.
- **[meus-planos-empresa.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/meus-planos-empresa.html)**:
  - Página institucional exibindo planos de assinatura da BMO para empresas parceiras.

### 1.5. Comunicação Integrada
- **[meus-chats.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/meus-chats.html)**:
  - Centro de mensagens do usuário. Agrupa e filtra as conversas ativas por 3 abas principais: Projetos (Vagas), Amigos (Freelancers) e Equipes.
- **[chat.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/chat.html)**:
  - Sala de conversa em tempo real selecionada, integrando fluxo de mensagens instantâneas e detalhes dos participantes.

### 1.6. Termos Legais
- **[politica.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/politica.html)**:
  - Política de Privacidade e proteção de dados da plataforma.
- **[termosdeuso.html](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/pages/termosdeuso.html)**:
  - Contrato de Termos de Uso do site detalhando regras de conformidade.
