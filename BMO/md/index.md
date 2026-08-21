# Documentação Técnica - BMO (Building My Opportunity)

Bem-vindo à documentação centralizada da plataforma **BMO (Building My Opportunity)**. 

BMO é uma plataforma digital para intermediação de serviços que conecta clientes/empresas a freelancers nas áreas de desenvolvimento de software e hardware, oferecendo recursos modernos de chat em tempo real, gestão de equipes, busca avançada de perfis e rede de conexões.

---

## 🧭 Mapa de Navegação da Documentação

A documentação técnica está organizada em módulos específicos que cobrem cada camada do projeto. Use os links abaixo para acessar os detalhes de cada área:

1. **[Visual e Estilos (CSS)](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/md/styles.md)**
   - Detalha a folha de estilo base, variáveis de cores do design system, responsividade (mobile first), layouts de glassmorphism e animações complexas.
2. **[Recursos de Mídia (Assets)](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/md/assets.md)**
   - Explica a organização e inventário de logotipos, imagens de demonstração e vídeos de loops decorativos para a interface.
3. **[Segurança do Banco de Dados (Firebase Rules)](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/md/fire_rules.md)**
   - Documenta as regras de leitura e escrita do Cloud Firestore e os controles de acesso dos canais de comunicação.
4. **[Scripts de Suporte (JavaScript)](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/md/scripts.md)**
   - Cobre os utilitários DOM comuns, animações de scroll (IntersectionObserver), tratamento de estados de botões e toasts na tela.
5. **[Serviços e Integrações (Firebase & Cloudinary APIs)](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/md/services.md)**
   - Mapeia a lógica de acesso a dados (DAL), conexões de banco NoSQL, controle de autenticação e envio de mídia via API Cloudinary.
6. **[Estrutura de Páginas (HTML Views)](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/md/pages.md)**
   - Lista todas as telas do aplicativo (dashboards, fluxos públicos e configurações) e explica seu propósito no roteamento da aplicação.
7. **[Controladores Funcionais (Features Logic)](file:///c:/Users/Windows/Downloads/BMO/Bmo-feat/md/features.md)**
   - Detalha a lógica por trás de cada tela (validações de formulário, lógica de listagem de amigos, convites de equipe e listeners de chat).

---

## 🛠️ Tecnologias Utilizadas no Projeto

- **Frontend**: HTML5 Semântico e Javascript Moderno (ES6 Modules).
- **Estilização**: CSS3 com variáveis nativas, Flexbox/Grid layouts, animações e media queries.
- **Banco de Dados & Autenticação**: Firebase Suite (Authentication, Cloud Firestore, Cloud Storage).
- **Mídia Dinâmica**: Cloudinary (Upload e otimização de imagens em nuvem).
- **Animações de UX**: IntersectionObserver API e CSS Transitions.
