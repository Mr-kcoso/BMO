<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BMO - Conecte talento a desafios reais</title>
  <link rel="stylesheet" href="../styles/design.css">
  <link rel="icon" href="../assets/fotos/logo.png" type="image/x-icon">
</head>

<body class="landing-page">
  <header class="landing-header" id="topo">
    <div class="landing-container landing-header-inner">
      <a class="landing-logo" href="index.html">BMO</a>
      <button class="landing-menu-toggle" type="button" aria-expanded="false" aria-controls="landingNav"
        aria-label="Abrir menu principal">
        <span></span><span></span><span></span>
      </button>
      <nav class="landing-nav" id="landingNav" aria-label="Menu principal">
        <a href="index.html">Início</a>
        <a href="#como-funciona">Diferenciais</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="landing-hero" id="sobre">
      <div class="landing-container landing-hero-grid">
        <div>
          <h1>O que é o BMO?</h1>
          <br>
          <div id="texto_sobre">
            <p>Nossa plataforma foi criada para conectar estudantes, profissionais e empresas de forma simples,
              organizada e acessível. O projeto busca facilitar oportunidades acadêmicas e profissionais, promovendo
              networking, colaboração em equipe e desenvolvimento de carreira através de um ambiente intuitivo e
              tecnológico.</p>
          </div>
        </div>

        <div class="landing-hero-visual" aria-hidden="true">
          <img id="bmo1" src="../assets/fotos/bmo_surpreso.jpeg">
        </div>
      </div>
    </section>



    <section class="landing-beneficios" id="como-funciona">
      <div class="landing-container">
        <h2>Diferenciais da nossa plataforma</h2>
        <div class="landing-beneficios-grid">
          <article class="landing-beneficio-item">
            <span class="landing-icon">●</span>
            <h3>Taxas menores</h3>
            <p>Menos taxas sobre transações.</p>
          </article>
          <article class="landing-beneficio-item">
            <span class="landing-icon">●</span>
            <h3>Equipes colaborativas</h3>
            <p>Colabore e aprenda com parceiros em tempo real.</p>
          </article>
          <article class="landing-beneficio-item">
            <span class="landing-icon">●</span>
            <h3>Foco em iniciantes</h3>
            <p>Projetos focados nos iniciantes nessas áreas.</p>
          </article>
        </div>
      </div>
    </section>



    <section class="landing-final-cta" id="pre-cadastro">
      <div class="landing-container">
        <h2>Sua carreira começa aqui. Junte-se à comunidade agora.</h2>
        <a class="landing-cta landing-cta-light" href="register.html">Entrar ou cadastrar</a>
      </div>
    </section>
  </main>

  <footer class="landing-footer">
    <div class="landing-container landing-footer-inner">
      <a href="termosdeuso.html">Termos de uso</a>
      <a href="politica.html" class="plt">Política de privacidade</a>
      <a href="contato.html"><img src="../assets/fotos/insta.png" class="insta" width="63px" height="40px"></a>
      <a href="contato.html"><img src="../assets/fotos/whats.png" width="63px" height="42px"></a>
    </div>
  </footer>
  <script type="module" src="../scripts/animation.js"></script>
</body>

</html>