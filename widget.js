// widget.js (VERSÃO FINAL, COMPLETA E REATORADA)
// Inclui: Persistência, Seleção de Voz, Modo Escuro, Fonte, Leitor, Links, Daltonismo e Funções de IA.

// --- Variáveis Globais de Estado ---
let isReaderActive = false;
let isHighlightLinksActive = false;
let isSimplifierActive = false;
let isImageDescriberActive = false;
let isSummarizerActive = false; // NOVO: Estado do resumidor
let fontSizeLevel = 0;
const MAX_FONT_LEVEL = 5;
const MIN_FONT_LEVEL = -2;
const utterance = new SpeechSynthesisUtterance();
utterance.lang = 'pt-BR';
let debounceTimeout;
let availableVoices = [];

// --- Função para detectar URL da API ---
function getApiBaseUrl() {
    // Se estiver rodando em localhost, usa o servidor local
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    // Caso contrário, usa o servidor do Render
    return 'https://inclua-ai-servidor.onrender.com';
}

// --- Função Principal de Inicialização ---
function initializeWidget() {
    try {
        injectSVGFilters();
        createWidgetUI();
        loadAndApplySavedSettings();
        setupVoiceSelection();
    } catch (error) {
        console.error('ERRO CRÍTICO durante a inicialização do widget:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
} else {
    initializeWidget();
}

// --- Funções de Criação da Interface ---

function createWidgetUI() {
    const floatingButton = document.createElement('button');
    floatingButton.id = 'accessibility-widget-button';
    floatingButton.innerText = '♿';
    floatingButton.setAttribute('aria-label', 'Abrir menu de acessibilidade');
    document.body.appendChild(floatingButton);

    const controlPanel = document.createElement('div');
    controlPanel.id = 'accessibility-widget-panel';
    // MODIFICADO: Adicionado botão do resumidor
    controlPanel.innerHTML = `
        <h2>Acessibilidade</h2>
        <div class="button-group">
            <button id="increaseFontBtn" title="Aumentar Fonte">A+</button>
            <button id="decreaseFontBtn" title="Diminuir Fonte">A-</button>
        </div>
        <button id="darkModeBtn">Modo Escuro</button>
        <button id="highlightLinksBtn">Destacar Links</button>
        <button id="readTextBtn">Ativar Leitor</button>
        
        <label for="voice-select" style="margin-top: 10px; display: block;">Voz do Leitor:</label>
        <select id="voice-select">
            <option value="">Padrão do Navegador</option>
        </select>

        <div class="widget-separator"></div>
        <strong>Funcionalidades com IA:</strong>
        <button id="describeImagesBtn">Descrever Imagem</button>
        <button id="simplifyTextBtn">Simplificar Texto</button>
        <button id="summarizeTextBtn">Resumir Texto</button> <div class="widget-separator"></div>
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
    document.getElementById('darkModeBtn').addEventListener('click', () => toggleDarkMode());
    document.getElementById('increaseFontBtn').addEventListener('click', increaseFontSize);
    document.getElementById('decreaseFontBtn').addEventListener('click', decreaseFontSize);
    document.getElementById('readTextBtn').addEventListener('click', toggleReader);
    document.getElementById('highlightLinksBtn').addEventListener('click', () => toggleHighlightLinks());
    document.getElementById('describeImagesBtn').addEventListener('click', toggleImageDescriber);
    document.getElementById('simplifyTextBtn').addEventListener('click', toggleTextSimplifier);
    document.getElementById('summarizeTextBtn').addEventListener('click', toggleSummarizer); // NOVO EVENTO
    document.getElementById('colorblind-select').addEventListener('change', (event) => applyColorblindFilter(event.target.value));
    document.getElementById('resetSettingsBtn').addEventListener('click', resetAllSettings);
    document.getElementById('voice-select').addEventListener('change', setVoice);
}

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

function loadAndApplySavedSettings() {
    if (localStorage.getItem('widget_darkMode') === 'true') {
        toggleDarkMode(false);
    }
    if (localStorage.getItem('widget_highlightLinks') === 'true') {
        toggleHighlightLinks(false);
    }
    const savedFilter = localStorage.getItem('widget_colorblindFilter');
    if (savedFilter) {
        document.getElementById('colorblind-select').value = savedFilter;
        applyColorblindFilter(savedFilter, false);
    }
    const savedFontSizeLevel = localStorage.getItem('widget_fontSizeLevel');
    if (savedFontSizeLevel) {
        fontSizeLevel = parseInt(savedFontSizeLevel, 10);
        applyFontSize(fontSizeLevel);
    }
}

function resetAllSettings() {
    if (confirm('Tem certeza que deseja resetar todas as configurações de acessibilidade?')) {
        localStorage.clear();
        window.location.reload();
    }
}


// --- Funções de Acessibilidade Visual ---

function toggleDarkMode(save = true) {
    const root = document.documentElement;
    const isActive = root.classList.toggle('widget-dark-mode');
    
    if (isActive) {
        applyColorblindFilter('none', false);
        document.getElementById('colorblind-select').value = 'none';
    }
    
    if (save) localStorage.setItem('widget_darkMode', isActive);
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
    const base = 100;
    const step = 12.5;
    document.documentElement.style.fontSize = `${base + (level * step)}%`;
}

function toggleHighlightLinks(save = true) {
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
    if (save) localStorage.setItem('widget_highlightLinks', isHighlightLinksActive);
}

function applyColorblindFilter(filterType, save = true) {
    const root = document.documentElement;
    if (filterType !== 'none' && root.classList.contains('widget-dark-mode')) {
        root.classList.remove('widget-dark-mode');
        if (save) localStorage.setItem('widget_darkMode', 'false');
    }
    const filterClasses = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
    filterClasses.forEach(cls => root.classList.remove(`filter-${cls}`));
    if (filterType !== 'none') {
        root.classList.add(`filter-${filterType}`);
    }
    if (save) localStorage.setItem('widget_colorblindFilter', filterType);
}


// --- Funções de Leitura de Tela ---

function setupVoiceSelection() {
    function populateVoiceList() {
        availableVoices = speechSynthesis.getVoices().filter(voice => voice.lang === 'pt-BR');
        const voiceSelect = document.getElementById('voice-select');
        
        while (voiceSelect.options.length > 1) {
            voiceSelect.remove(1);
        }

        availableVoices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = voice.name;
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });

        const savedVoiceName = localStorage.getItem('widget_selectedVoice');
        if (savedVoiceName) {
            const savedVoice = availableVoices.find(voice => voice.name === savedVoiceName);
            if (savedVoice) {
                utterance.voice = savedVoice;
                for (let i = 0; i < voiceSelect.options.length; i++) {
                    if (voiceSelect.options[i].getAttribute('data-name') === savedVoiceName) {
                        voiceSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
    }
    speechSynthesis.onvoiceschanged = populateVoiceList;
    populateVoiceList();
}

function setVoice() {
    const voiceSelect = document.getElementById('voice-select');
    const selectedVoiceName = voiceSelect.selectedOptions[0].getAttribute('data-name');
    const selectedVoice = availableVoices.find(voice => voice.name === selectedVoiceName);

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        localStorage.setItem('widget_selectedVoice', selectedVoice.name);
        speakText("Voz alterada.");
    } else {
        utterance.voice = null;
        localStorage.removeItem('widget_selectedVoice');
    }
}

function toggleReader() {
    isReaderActive = !isReaderActive;
    const readTextBtn = document.getElementById('readTextBtn');
    if (isReaderActive) {
        readTextBtn.textContent = 'Desativar Leitor';
        readTextBtn.style.backgroundColor = '#a3e4a3';
        document.body.addEventListener('mouseover', debouncedReadTextOnHover);
    } else {
        readTextBtn.textContent = 'Ativar Leitor';
        readTextBtn.style.backgroundColor = '';
        window.speechSynthesis.cancel();
        document.body.removeEventListener('mouseover', debouncedReadTextOnHover);
    }
}

function debouncedReadTextOnHover(event) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const targetElement = event.target;
        if (targetElement.innerText && !targetElement.closest('#accessibility-widget-panel')) {
            speakText(targetElement.innerText);
        }
    }, 300);
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
    showModal('Descrição da Imagem', `<em>Descrevendo imagem, por favor aguarde...</em>`, `desc-modal-${imgElement.src}`);
    try {
        const response = await fetch(`${getApiBaseUrl()}/describe-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: imgElement.src }),
        });
        if (!response.ok) throw new Error('Falha na resposta do servidor');
        const data = await response.json();
        if (data.description) {
            imgElement.alt = data.description;
            const finalContent = `<div class="image-desc-container"><img src="${imgElement.src}" alt="Imagem analisada" class="image-preview"><p class="image-description">${data.description.replace(/\n/g, '<br>')}</p></div>`;
            showModal('Descrição da Imagem', finalContent, `desc-modal-${imgElement.src}`);
            speakText(data.description);
        }
    } catch (error) {
        console.error(`Erro ao descrever a imagem ${imgElement.src}:`, error);
        const errorContent = `<strong>Desculpe, ocorreu um erro ao tentar descrever a imagem.</strong>`;
        showModal('Erro na Descrição', errorContent, `desc-modal-${imgElement.src}`);
    }
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
    const originalContent = `<div class="text-box original-text">${text}</div>`;
    const loadingContent = `<h3>Texto Simplificado pela IA</h3><div class="text-box simplified-text"><em>Simplificando, por favor aguarde...</em></div>`;
    showModal('Texto Original', originalContent + loadingContent, 'simplifier-modal');
    try {
        const response = await fetch(`${getApiBaseUrl()}/simplify-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textToSimplify: text }),
        });
        if (!response.ok) throw new Error('Falha na resposta do servidor de IA.');
        const data = await response.json();
        if (data.simplifiedText) {
            const finalContent = `<h3>Texto Simplificado pela IA</h3><div class="text-box simplified-text">${data.simplifiedText.replace(/\n/g, '<br>')}</div>`;
            showModal('Texto Original e Simplificado', originalContent + finalContent, 'simplifier-modal');
        }
    } catch (error) {
        console.error('Erro ao chamar a API de simplificação:', error);
        const errorContent = `<h3>Texto Simplificado pela IA</h3><div class="text-box simplified-text"><strong>Desculpe, ocorreu um erro ao tentar simplificar o texto.</strong></div>`;
        showModal('Erro na Simplificação', originalContent + errorContent, 'simplifier-modal');
    }
}function toggleSummarizer() {
    isSummarizerActive = !isSummarizerActive;
    const btn = document.getElementById('summarizeTextBtn');
    
    if (isSummarizerActive) {
        btn.textContent = 'Desativar Resumo';
        btn.style.backgroundColor = '#a3e4a3';
        document.addEventListener('mouseup', handleTextSelectionForSummarize);
    } else {
        btn.textContent = 'Resumir Texto';
        btn.style.backgroundColor = '';
        document.removeEventListener('mouseup', handleTextSelectionForSummarize);
        const floatingBtn = document.getElementById('widget-summarize-button');
        if (floatingBtn) floatingBtn.remove();
    }
}

function handleTextSelectionForSummarize(event) {
    // Remove qualquer botão flutuante anterior
    const oldFloatingBtn = document.getElementById('widget-summarize-button');
    if (oldFloatingBtn) oldFloatingBtn.remove();

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 50) { // Só mostra o botão se o texto for longo o suficiente
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const floatingBtn = document.createElement('button');
        floatingBtn.id = 'widget-summarize-button';
        floatingBtn.textContent = 'Resumir Texto Selecionado';
        document.body.appendChild(floatingBtn);
        
        // Posiciona o botão perto do texto selecionado
        floatingBtn.style.position = 'absolute';
        floatingBtn.style.top = `${window.scrollY + rect.bottom + 5}px`;
        floatingBtn.style.left = `${window.scrollX + rect.left}px`;

        floatingBtn.onclick = () => {
            summarizeTextAI(selectedText);
            floatingBtn.remove();
        };
    }
}
async function summarizeTextAI(text) {
    showModal('Resumo do Texto', '<em>Resumindo o texto, por favor aguarde...</em>', 'summarizer-modal');
    try {
        const response = await fetch(`${getApiBaseUrl()}/summarize-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textToSummarize: text }),
        });
        if (!response.ok) throw new Error('Falha na resposta do servidor de IA.');
        const data = await response.json();
        if (data.summarizedText) {
            const content = `<div class="text-box simplified-text">${data.summarizedText.replace(/\n/g, '<br>')}</div>`;
            showModal('Resumo Gerado pela IA', content, 'summarizer-modal');
        }
    } catch (error) {
        console.error('Erro ao chamar a API de resumo:', error);
        showModal('Erro no Resumo', '<strong>Desculpe, ocorreu um erro ao tentar resumir o texto.</strong>', 'summarizer-modal');
    }
}
// --- Funções de Modal ---

function showModal(title, contentHtml, modalId) {
    const oldModal = document.getElementById(modalId);
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'widget-modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close-btn">&times;</button>
            <h3>${title}</h3>
            ${contentHtml}
        </div>
    `;
    document.body.appendChild(modal);

    const closeAndStop = () => {
        window.speechSynthesis.cancel();
        modal.remove();
    };

    modal.querySelector('.modal-close-btn').addEventListener('click', closeAndStop);
    modal.addEventListener('click', (event) => {
        if (event.target.id === modalId) {
            closeAndStop();
        }
    });
}
