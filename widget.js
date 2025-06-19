// widget.js (VERSÃO FINAL E COMPLETA)
// Inclui: Persistência de Configurações, Modo Escuro, Fonte, Leitor, Destacar Links, Daltonismo e Funções de IA.

// --- Variáveis Globais de Estado ---
let isReaderActive = false;
let isHighlightLinksActive = false;
let isSimplifierActive = false;
let isImageDescriberActive = false;
let fontSizeLevel = 0; // Controla o nível de zoom da fonte
const MAX_FONT_LEVEL = 5; // Limite para não aumentar a fonte infinitamente
const MIN_FONT_LEVEL = -2; // Limite para não diminuir a fonte infinitamente
const utterance = new SpeechSynthesisUtterance();
utterance.lang = 'pt-BR';

// --- Função Principal de Inicialização ---
window.addEventListener('DOMContentLoaded', () => {
    console.log('Widget de Acessibilidade Carregado!');
    loadAndApplySavedSettings(); // Carrega as configurações salvas do localStorage
    injectSVGFilters();
    createWidgetUI();
    updateUIFromState(); // Garante que os botões reflitam o estado carregado
});


// --- Funções de Criação da Interface ---

/**
 * Cria e insere a interface do widget (botão e painel) no documento.
 */
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
        <div class="button-group">
            <button id="increaseFontBtn" title="Aumentar Fonte">A+</button>
            <button id="decreaseFontBtn" title="Diminuir Fonte">A-</button>
        </div>
        <button id="darkModeBtn">Modo Escuro</button>
        <button id="highlightLinksBtn">Destacar Links</button>
        <button id="readTextBtn">Ativar Leitor</button>
        <div class="widget-separator"></div>
        <strong>Funcionalidades com IA:</strong>
        <button id="describeImagesBtn">Descrever Imagem</button>
        <button id="simplifyTextBtn">Simplificar Texto</button>
        <div class="widget-separator"></div>
        <label for="colorblind-select">Filtro para Daltonismo:</label>
        <select id="colorblind-select">
            <option value="none">Nenhum</option>
            <option value="protanopia">Protanopia</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="tritanopia">Tritanopia</option>
            <option value="achromatopsia">Acromatopsia</option>
        </select>
        <div class="widget-separator"></div>
        <button id="resetSettingsBtn">Resetar Configurações</button>
    `;
    document.body.appendChild(controlPanel);

    floatingButton.addEventListener('click', () => {
        controlPanel.classList.toggle('visible');
    });

    // Conectar todos os botões e controles às suas funções
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('increaseFontBtn').addEventListener('click', increaseFontSize);
    document.getElementById('decreaseFontBtn').addEventListener('click', decreaseFontSize);
    document.getElementById('readTextBtn').addEventListener('click', toggleReader);
    document.getElementById('highlightLinksBtn').addEventListener('click', toggleHighlightLinks);
    document.getElementById('describeImagesBtn').addEventListener('click', toggleImageDescriber);
    document.getElementById('simplifyTextBtn').addEventListener('click', toggleTextSimplifier);
    document.getElementById('colorblind-select').addEventListener('change', (event) => applyColorblindFilter(event.target.value));
    document.getElementById('resetSettingsBtn').addEventListener('click', resetAllSettings);
}

/**
 * Injeta um container SVG oculto com todas as definições de filtros de cor.
 */
function injectSVGFilters() {
    const svgFilters = `
        <svg id="colorblind-filters" style="display: none;">
            <defs>
                <filter id="protanopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0"/></filter>
                <filter id="deuteranopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0"/></filter>
                <filter id="tritanopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0"/></filter>
                <filter id="achromatopsia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0"/></filter>
            </defs>
        </svg>
    `;
    document.body.insertAdjacentHTML('beforeend', svgFilters);
}

// --- Funções de Persistência de Configurações ---

/**
 * Carrega e aplica todas as configurações salvas no localStorage ao iniciar.
 */
function loadAndApplySavedSettings() {
    const savedFontSizeLevel = localStorage.getItem('widget_fontSizeLevel');
    if (savedFontSizeLevel) {
        fontSizeLevel = parseInt(savedFontSizeLevel, 10);
        applyFontSize(fontSizeLevel);
    }
    if (localStorage.getItem('widget_darkMode') === 'true') {
        document.documentElement.classList.add('widget-dark-mode');
    }
    if (localStorage.getItem('widget_highlightLinks') === 'true') {
        isHighlightLinksActive = true;
        document.documentElement.classList.add('widget-highlight-links');
    }
    const savedFilter = localStorage.getItem('widget_colorblindFilter');
    if (savedFilter && savedFilter !== 'none') {
        applyColorblindFilter(savedFilter);
    }
}

/**
 * Garante que a UI do widget (botões, selects) reflita o estado carregado do localStorage.
 */
function updateUIFromState() {
    if (isHighlightLinksActive) {
        const btn = document.getElementById('highlightLinksBtn');
        btn.textContent = 'Remover Destaque';
        btn.style.backgroundColor = '#a3e4a3';
    }
    const savedFilter = localStorage.getItem('widget_colorblindFilter');
    if (savedFilter) {
        document.getElementById('colorblind-select').value = savedFilter;
    }
}

/**
 * Limpa todas as configurações salvas e recarrega a página.
 */
function resetAllSettings() {
    if (confirm('Tem certeza que deseja resetar todas as configurações de acessibilidade?')) {
        localStorage.clear();
        window.location.reload();
    }
}

// --- Funções de Acessibilidade Visual (MODIFICADAS PARA PERSISTÊNCIA) ---

function toggleDarkMode() {
    applyColorblindFilter('none');
    document.getElementById('colorblind-select').value = 'none';
    const isActive = document.documentElement.classList.toggle('widget-dark-mode');
    localStorage.setItem('widget_darkMode', isActive);
}

function increaseFontSize() {
    if (fontSizeLevel < MAX_FONT_LEVEL) {
        fontSizeLevel++;
        applyFontSize(fontSizeLevel);
        localStorage.setItem('widget_fontSizeLevel', fontSizeLevel);
    }
}

function decreaseFontSize() {
    if (fontSizeLevel > MIN_FONT_LEVEL) {
        fontSizeLevel--;
        applyFontSize(fontSizeLevel);
        localStorage.setItem('widget_fontSizeLevel', fontSizeLevel);
    }
}

function applyFontSize(level) {
    const scale = 1 + (level * 0.1);
    const elements = document.querySelectorAll('p, a, h1, h2, h3, li, span, button');
    elements.forEach(el => {
        if (!el.closest('#accessibility-widget-button') && !el.closest('#accessibility-widget-panel')) {
            const baseSize = el.getAttribute('data-widget-base-font-size');
            if (!baseSize) {
                const originalSize = window.getComputedStyle(el).fontSize;
                el.setAttribute('data-widget-base-font-size', originalSize);
            }
            const newSize = parseFloat(el.getAttribute('data-widget-base-font-size')) * scale;
            el.style.fontSize = `${newSize}px`;
        }
    });
}

function toggleHighlightLinks() {
    isHighlightLinksActive = !isHighlightLinksActive;
    const btn = document.getElementById('highlightLinksBtn');
    document.documentElement.classList.toggle('widget-highlight-links');
    if (isHighlightLinksActive) {
        btn.textContent = 'Remover Destaque';
        btn.style.backgroundColor = '#a3e4a3';
    } else {
        btn.textContent = 'Destacar Links';
        btn.style.backgroundColor = '';
    }
    localStorage.setItem('widget_highlightLinks', isHighlightLinksActive);
}

function applyColorblindFilter(filterType) {
    const rootElement = document.documentElement;
    if (rootElement.classList.contains('widget-dark-mode')) {
        rootElement.classList.remove('widget-dark-mode');
        localStorage.setItem('widget_darkMode', 'false');
    }
    const filterClasses = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
    filterClasses.forEach(cls => rootElement.classList.remove(`filter-${cls}`));
    if (filterType !== 'none') {
        rootElement.classList.add(`filter-${filterType}`);
    }
    localStorage.setItem('widget_colorblindFilter', filterType);
}

// --- Funções de Leitura de Tela ---

function toggleReader() {
    isReaderActive = !isReaderActive;
    const readTextBtn = document.getElementById('readTextBtn');
    if (isReaderActive) {
        readTextBtn.textContent = 'Desativar Leitor';
        readTextBtn.style.backgroundColor = '#a3e4a3';
        document.body.addEventListener('mouseover', readTextOnHover);
    } else {
        readTextBtn.textContent = 'Ativar Leitor';
        readTextBtn.style.backgroundColor = '';
        window.speechSynthesis.cancel();
        document.body.removeEventListener('mouseover', readTextOnHover);
    }
}

function readTextOnHover(event) {
    const targetElement = event.target;
    if (targetElement.innerText && !targetElement.closest('#accessibility-widget-panel')) {
        speakText(targetElement.innerText);
    }
}

function speakText(text) {
    window.speechSynthesis.cancel();
    utterance.text = text;
    window.speechSynthesis.speak(utterance);
}

// --- Funções de Inteligência Artificial ---

function toggleImageDescriber() {
    isImageDescriberActive = !isImageDescriberActive;
    const btn = document.getElementById('describeImagesBtn');
    const rootElement = document.documentElement;
    if (isImageDescriberActive) {
        btn.textContent = 'Sair da Descrição';
        btn.style.backgroundColor = '#a3e4a3';
        rootElement.classList.add('widget-describer-active');
        document.body.addEventListener('click', handleImageDescribeClick, true);
    } else {
        btn.textContent = 'Descrever Imagem';
        btn.style.backgroundColor = '';
        rootElement.classList.remove('widget-describer-active');
        document.body.removeEventListener('click', handleImageDescribeClick, true);
    }
}

function handleImageDescribeClick(event) {
    if (event.target.closest('#accessibility-widget-panel')) return;
    if (event.target.tagName === 'IMG') {
        event.preventDefault();
        event.stopPropagation();
        describeSingleImageAI(event.target);
        toggleImageDescriber();
    } else {
        alert('Por favor, clique em uma imagem para que ela seja descrita.');
    }
}

async function describeSingleImageAI(imgElement) {
    showImageDescriptionModal(imgElement.src, '<em>Descrevendo imagem, por favor aguarde...</em>');
    try {
        const response = await fetch('http://localhost:3000/describe-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: imgElement.src }),
        });
        if (!response.ok) throw new Error('Falha na resposta do servidor');
        const data = await response.json();
        if (data.description) {
            imgElement.alt = data.description;
            showImageDescriptionModal(imgElement.src, data.description);
            speakText(data.description);
        }
    } catch (error) {
        console.error(`Erro ao descrever a imagem ${imgElement.src}:`, error);
        showImageDescriptionModal(imgElement.src, '<strong>Desculpe, ocorreu um erro ao tentar descrever a imagem.</strong>');
    }
}

function showImageDescriptionModal(imageSrc, descriptionHtml) {
    const oldModal = document.getElementById('widget-image-desc-modal');
    if (oldModal) oldModal.remove();
    const modal = document.createElement('div');
    modal.id = 'widget-image-desc-modal';
    modal.className = 'widget-modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close-btn">&times;</button>
            <h3>Descrição da Imagem</h3>
            <div class="image-desc-container">
                <img src="${imageSrc}" alt="Imagem analisada" class="image-preview">
                <p class="image-description">${descriptionHtml.replace(/\n/g, '<br>')}</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const closeAndStop = () => {
        window.speechSynthesis.cancel();
        modal.remove();
    };
    modal.querySelector('.modal-close-btn').addEventListener('click', closeAndStop);
    modal.addEventListener('click', (event) => {
        if (event.target.id === 'widget-image-desc-modal') {
            closeAndStop();
        }
    });
}

function toggleTextSimplifier() {
    isSimplifierActive = !isSimplifierActive;
    const btn = document.getElementById('simplifyTextBtn');
    const rootElement = document.documentElement;
    if (isSimplifierActive) {
        btn.textContent = 'Sair da Simplificação';
        btn.style.backgroundColor = '#a3e4a3';
        rootElement.classList.add('widget-simplifier-active');
        document.body.addEventListener('click', handleSimplifierClick, true);
    } else {
        btn.textContent = 'Simplificar Texto';
        btn.style.backgroundColor = '';
        rootElement.classList.remove('widget-simplifier-active');
        document.body.removeEventListener('click', handleSimplifierClick, true);
    }
}

function handleSimplifierClick(event) {
    if (event.target.closest('#accessibility-widget-panel')) return;
    event.preventDefault();
    event.stopPropagation();
    const targetElement = event.target.closest('p, li, h1, h2, h3, h4');
    if (targetElement && targetElement.innerText.trim().length > 20) {
        simplifyTextAI(targetElement.innerText);
    } else {
        alert('Clique em um parágrafo ou bloco de texto com mais conteúdo para simplificar.');
    }
    toggleTextSimplifier();
}

async function simplifyTextAI(text) {
    showSimplifierResultModal(text, '<em>Simplificando, por favor aguarde...</em>');
    try {
        const response = await fetch('http://localhost:3000/simplify-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textToSimplify: text }),
        });
        if (!response.ok) throw new Error('Falha na resposta do servidor de IA.');
        const data = await response.json();
        if (data.simplifiedText) {
            showSimplifierResultModal(text, data.simplifiedText);
        }
    } catch (error) {
        console.error('Erro ao chamar a API de simplificação:', error);
        showSimplifierResultModal(text, '<strong>Desculpe, ocorreu um erro ao tentar simplificar o texto.</strong>');
    }
}

function showSimplifierResultModal(originalHtml, simplifiedHtml) {
    const oldModal = document.getElementById('widget-simplifier-modal');
    if (oldModal) oldModal.remove();
    const modal = document.createElement('div');
    modal.id = 'widget-simplifier-modal';
    modal.className = 'widget-modal-overlay';
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
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (event) => {
        if (event.target.id === 'widget-simplifier-modal') modal.remove();
    });
}