/**
 * Configuração Firebase
 * Inicializa Firebase com credenciais do projeto
 */

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBx89cfWELGD7OY6M5uta30hz6aTCV2oo4",
    authDomain: "bmo-bmo.firebaseapp.com",
    projectId: "bmo-bmo",
    storageBucket: "bmo-bmo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Inicializa Firebase quando disponível
function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined' || !firebase.initializeApp) {
            console.log('[Firebase] Aguardando Firebase CDN...');
            setTimeout(initializeFirebase, 100);
            return;
        }

        // Verifica se já foi inicializado
        if (firebase.apps.length > 0) {
            console.log('[Firebase] ✓ Já inicializado');
            setupAuthListener();
            return;
        }

        firebase.initializeApp(firebaseConfig);
        console.log('[Firebase] ✓ Inicializado');
        setupAuthListener();

    } catch (error) {
        console.error('[Firebase] Erro na inicialização:', error);
    }
}

// Setup de listeners de autenticação
function setupAuthListener() {
    try {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('[Firebase] ✓ Usuário autenticado:', user.email);
            } else {
                console.log('[Firebase] Usuário não autenticado');
            }
        });
    } catch (error) {
        console.error('[Firebase] Erro ao setup auth:', error);
    }
}

// Inicia quando script carrega
initializeFirebase();
