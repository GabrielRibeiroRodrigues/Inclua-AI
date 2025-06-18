// widget.js (VERSÃO FINAL)
// Inclui: Modo Escuro, Fonte, Leitor, Destacar Links, Daltonismo e **Simplificador de Texto (IA)**.

// --- Variáveis Globais ---
let isReaderActive = false;
let isHighlightLinksActive = false;
let isSimplifierActive = false; // NOVA VARIÁVEL GLOBAL
const utterance = new SpeechSynthesisUtterance();
utterance.lang = 'pt-BR';

// --- Função Principal de Inicialização ---
window.addEventListener('DOMContentLoaded', () => {
    console.log('Widget de Acessibilidade Carregado!');
    injectSVGFilters();
    createWidgetUI();
});

// --- Funções de Criação da Interface ---

function createWidgetUI() {
    const floatingButton = document.createElement('button');
    floatingButton.id = 'accessibility-widget-button';
    floatingButton.innerText = '♿';
    floatingButton.setAttribute('aria-label', 'Abrir menu de acessibilidade');
    document.body.appendChild(floatingButton);

    const controlPanel = document.createElement('div');
    controlPanel.id = 'accessibility-widget-panel';
    controlPanel.innerHTML = `
        <h2>Acessibilidade</h2>
        <button id="darkModeBtn">Modo Escuro</button>
        <button id="increaseFontBtn">Aumentar Fonte</button>
        <button id="readTextBtn">Ativar Leitor</button>
        <button id="highlightLinksBtn">Destacar Links</button>
        <div class="widget-separator"></div>
        <strong>Funcionalidades com IA:</strong>
        <button id="describeImagesBtn">Descrever Imagens</button>
        <button id="simplifyTextBtn">Simplificar Texto</button> <div class="widget-separator"></div>
        <label for="colorblind-select">Filtro para Daltonismo:</label>
        <select id="colorblind-select">
            <option value="none">Nenhum</option>
            <option value="protanopia">Protanopia</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="tritanopia">Tritanopia</option>
            <option value="achromatopsia">Acromatopsia</option>
        </select>
    `;
    document.body.appendChild(controlPanel);

    floatingButton.addEventListener('click', () => {
        controlPanel.classList.toggle('visible');
    });

    // Conectar todos os botões e controles às suas funções
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('increaseFontBtn').addEventListener('click', increaseFontSize);
    document.getElementById('readTextBtn').addEventListener('click', toggleReader);
    document.getElementById('highlightLinksBtn').addEventListener('click', toggleHighlightLinks);
    document.getElementById('describeImagesBtn').addEventListener('click', describeImagesAI);
    document.getElementById('simplifyTextBtn').addEventListener('click', toggleTextSimplifier); // NOVO EVENT LISTENER
    document.getElementById('colorblind-select').addEventListener('change', (event) => applyColorblindFilter(event.target.value));
}

function injectSVGFilters() { /* ...código existente, sem alterações... */ }

// --- Funções de Acessibilidade Visual ---
function toggleDarkMode() { /* ...código existente, sem alterações... */ }
function increaseFontSize() { /* ...código existente, sem alterações... */ }
function toggleHighlightLinks() { /* ...código existente, sem alterações... */ }
function applyColorblindFilter(filterType) { /* ...código existente, sem alterações... */ }

// --- Funções de Leitura de Tela ---
function toggleReader() { /* ...código existente, sem alterações... */ }
function readTextOnHover(event) { /* ...código existente, sem alterações... */ }

// --- Funções de Inteligência Artificial ---

async function describeImagesAI() { /* ...código existente, sem alterações... */ }

// --- NOVAS FUNÇÕES PARA O SIMPLIFICADOR DE TEXTO (IA) ---

/**
 * Ativa ou desativa o "modo de simplificação de texto".
 * Quando ativo, o usuário pode clicar em parágrafos para simplificá-los.
 */
function toggleTextSimplifier() {
    isSimplifierActive = !isSimplifierActive;
    const btn = document.getElementById('simplifyTextBtn');
    const rootElement = document.documentElement;

    if (isSimplifierActive) {
        btn.textContent = 'Sair da Simplificação';
        btn.style.backgroundColor = '#a3e4a3';
        rootElement.classList.add('widget-simplifier-active'); // Muda o cursor
        document.body.addEventListener('click', handleSimplifierClick, true); // Usa captura para prioridade
    } else {
        btn.textContent = 'Simplificar Texto';
        btn.style.backgroundColor = '';
        rootElement.classList.remove('widget-simplifier-active');
        document.body.removeEventListener('click', handleSimplifierClick, true);
    }
}

/**
 * Manipula o clique no corpo do documento quando o modo simplificador está ativo.
 * @param {MouseEvent} event
 */
function handleSimplifierClick(event) {
    // Se o clique foi dentro do painel do widget, não faz nada
    if (event.target.closest('#accessibility-widget-panel')) {
        return;
    }
    
    event.preventDefault();
    event.stopPropagation();

    const targetElement = event.target.closest('p, li, h1, h2, h3, h4');
    if (targetElement && targetElement.innerText.trim().length > 20) {
        simplifyTextAI(targetElement.innerText, targetElement);
    } else {
        alert('Clique em um parágrafo ou bloco de texto com mais conteúdo para simplificar.');
    }
    // Desativa o modo após um clique para evitar múltiplos popups
    toggleTextSimplifier();
}

/**
 * Envia o texto para a API de simplificação e exibe o resultado em um modal.
 * @param {string} text - O texto a ser simplificado.
 */
async function simplifyTextAI(text) {
    showSimplifierResultModal(text, '<em>Simplificando, por favor aguarde...</em>');

    try {
        const response = await fetch('http://localhost:3000/simplify-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textToSimplify: text }),
        });

        if (!response.ok) {
            throw new Error('Falha na resposta do servidor de IA.');
        }

        const data = await response.json();

        if (data.simplifiedText) {
            showSimplifierResultModal(text, data.simplifiedText);
        }
    } catch (error) {
        console.error('Erro ao chamar a API de simplificação:', error);
        showSimplifierResultModal(text, '<strong>Desculpe, ocorreu um erro ao tentar simplificar o texto.</strong>');
    }
}

/**
 * Cria e exibe um modal com o texto original e o simplificado.
 * @param {string} originalHtml - O texto original.
 * @param {string} simplifiedHtml - O texto simplificado (pode ser HTML).
 */
function showSimplifierResultModal(originalHtml, simplifiedHtml) {
    // Remove qualquer modal antigo
    const oldModal = document.getElementById('widget-simplifier-modal');
    if (oldModal) {
        oldModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'widget-simplifier-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close-btn">&times;</button>
            <h3>Texto Original</h3>
            <div class="text-box original-text">${originalHtml}</div>
            <h3>Texto Simplificado pela IA</h3>
            <div class="text-box simplified-text">${simplifiedHtml.replace(/\n/g, '<br>')}</div>
        </div>
    `;
    document.body.appendChild(modal);

    // Adiciona evento para fechar o modal
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
        modal.remove();
    });
    // Fecha também se clicar fora do conteúdo
    modal.addEventListener('click', (event) => {
        if (event.target.id === 'widget-simplifier-modal') {
            modal.remove();
        }
    });
}


// --- Colar aqui as funções não alteradas ---
// ... (toggleHighlightLinks, readTextOnHover, describeImagesAI, etc.)
// ...