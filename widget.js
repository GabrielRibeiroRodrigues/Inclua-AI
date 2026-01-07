/**
 * INCLUA-AI WIDGET - SENIOR DEV EDITION
 * Sistema completo de acessibilidade com IA
 * Arquitetura robusta, acessível e resiliente.
 */

class IncluaAIWidget {
    constructor() {
        this.isActive = false;
        this.features = {
            reader: false,
            highlightLinks: false,
            imageDescriber: false,
            textSummarizer: false,
            librasHover: false
        };

        this.settings = {
            // Ajustes Visuais
            fontSize: 0,
            colorFilter: 'none',
            highlightLinks: false,

            // Assistente de Leitura
            textReader: false,
            hoverReader: false,

            // IA
            imageDescriber: false,
            textSummarizer: false,
            didacticSummary: false,

            // Libras
            librasHover: false,

            // Novas funcionalidades
            voiceCommands: false,
            focusMode: false
        };

        this.currentSpeech = null;
        this.focusTrap = null;
        this.activeModal = null;

        // Voice Recognition
        this.speechRecognition = null;
        this.isListening = false;

        // Loading states
        this.loadingStates = new Map();
        this.loadingIndicator = null;

        // Hover reader indicator
        this.hoverIndicator = null;
        this.isReading = false;

        this.init();

        // Bind dos métodos para preservar referência
        this.boundHandleTextSelection = this.handleTextSelection.bind(this);
        this.boundHandleImageClick = this.handleImageClick.bind(this);
        this.boundHandleTextSummarization = this.handleTextSummarization.bind(this);
        this.boundHandleHover = this.handleHover.bind(this);
        this.boundHandleHoverOut = this.handleHoverOut.bind(this);
        this.hoverTimeout = null;

        // Binds para Libras
        this.boundHandleLibrasHover = this.handleLibrasHover.bind(this);
        this.boundHandleLibrasHoverOut = this.handleLibrasHoverOut.bind(this);
        this.librasHoverTimeout = null;
        this.currentLibrasTarget = null;
        this.currentOriginalText = null;
        this.currentLibrasGlosa = null;
    }

    init() {
        if (!this.checkBrowserCompatibility()) {
            console.error('Navegador não suportado.');
            return;
        }

        this.loadSettings();
        this.createWidget();
        this.setupEventListeners();
        this.setupKeyboardNavigation(); // Sistema de navegação por teclado e atalhos
        this.injectSVGFilters();
        this.injectCategoryStyles(); // Estilos do novo design de categorias
        this.setupVoices();
        this.checkApiHealth();
        this.setupErrorHandling();

        // Expor instância globalmente para handlers inline
        window.incluaAIWidget = this;
    }

    // ==========================================================================
    // ARCHITECTURE & UTILS
    // ==========================================================================

    checkBrowserCompatibility() {
        return 'fetch' in window && 'speechSynthesis' in window;
    }

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Erro Global:', event.error);
        });
    }

    async checkApiHealth() {
        try {
            const response = await this.fetchWithRetry(`${this.getApiBaseUrl()}/health`);
            if (response.ok) {
                this.updateStatusBadge('online');
            }
        } catch (error) {
            console.warn('API Offline:', error);
            this.updateStatusBadge('offline');
        }
    }

    updateStatusBadge(status) {
        // Status badge removido visualmente, mas mantido lógica interna se necessário
    }

    // Retry Logic com Exponential Backoff
    async fetchWithRetry(url, options = {}, retries = 3, backoff = 300) {
        try {
            const response = await this.fetchWithTimeout(url, options);
            if (!response.ok && response.status >= 500 && retries > 0) {
                throw new Error(`Server Error: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (retries > 0) {
                await new Promise(r => setTimeout(r, backoff));
                return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
            }
            throw error;
        }
    }

    async fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    getApiBaseUrl() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        return 'https://inclua-ai-servidor.onrender.com';
    }

    // ==========================================================================
    // UI COMPONENTS & TOAST SYSTEM
    // ==========================================================================

    createWidget() {
        const widgetHTML = `
            <div id="inclua-ai-widget">
                <div class="toast-container" id="inclua-ai-toasts"></div>
                
                <button id="inclua-ai-toggle" aria-label="Abrir assistente de acessibilidade" aria-expanded="false" aria-controls="inclua-ai-panel">
                    <svg id="inclua-ai-toggle-icon" viewBox="0 0 24 24">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 11.8 12.8 14 10 14C7.2 14 5 11.8 5 9V7L3 7V9C3 12.9 6.1 16 10 16V18H8V20H16V18H14V16C17.9 16 21 12.9 21 9Z"/>
                    </svg>
                </button>
                
                <div id="inclua-ai-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title" hidden>
                    <div class="panel-header">
                        <div class="header-content">
                            <h2 id="panel-title">Inclua-AI</h2>
                            <p>Assistente de Acessibilidade Inteligente</p>
                        </div>
                    </div>
                    <div class="panel-content">
                        ${this.createPanelSections()}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }


    createPanelSections() {
        return `
            ${this.createCategory('visual', '', 'Deficiência Visual', '#3b82f6', [
            { id: 'font-increase', emoji: '🔼', title: 'Aumentar', desc: 'Fonte maior', key: 'F2' },
            { id: 'font-decrease', emoji: '🔽', title: 'Diminuir', desc: 'Fonte menor', key: 'F3' },
            { id: 'highlight-links', emoji: '🔗', title: 'Links', desc: 'Destacar', key: 'F9' },
            { id: 'text-reader', emoji: '🔊', title: 'Leitor', desc: 'Ler texto', key: 'F4' },
            { id: 'hover-reader', emoji: '👆', title: 'Hover', desc: 'Ler ao passar', key: 'F5' },
            { id: 'describe-image', emoji: '🖼️', title: 'Imagem', desc: 'Descrever com IA', key: 'F6' }
        ])}

            <div class="category-colorblind">
                <div class="colorblind-label"> Filtros de Daltonismo</div>
                <select id="colorblind-filter" class="colorblind-select">
                    <option value="none">Nenhum filtro</option>
                    <option value="protanopia">Protanopia (Vermelho-Verde)</option>
                    <option value="deuteranopia">Deuteranopia (Verde-Vermelho)</option>
                    <option value="tritanopia">Tritanopia (Azul-Amarelo)</option>
                    <option value="achromatopsia">Acromatopsia (Sem cores)</option>
                </select>
            </div>

            ${this.createCategory('auditiva', '', 'Deficiência Auditiva', '#10b981', [
            { id: 'libras-hover', emoji: '🤟', title: 'Libras', desc: 'Traduzir', key: 'F8' }
        ])}

            ${this.createCategory('cognitiva', '', 'Dificuldades Cognitivas', '#8b5cf6', [
            { id: 'didactic-summary', emoji: '📚', title: 'Didático', desc: 'Resumo educacional', key: 'F10' },
            { id: 'summarize-text', emoji: '📝', title: 'Resumir', desc: 'Resumo rápido', key: 'F7' },
            { id: 'focus-mode', emoji: '🎯', title: 'Foco', desc: 'Destaca conteúdo', key: 'F11' }
        ])}

            ${this.createSection('Assistência Virtual', [
            { id: 'chatbot', emoji: '💬', title: 'ChatBot Assistente', desc: 'Converse com IA' },
            { id: 'call-center', emoji: '☎️', title: 'Central de Atendimento', desc: 'Atendimento por voz' }
        ])}

            <div class="menu-footer">
                <button class="reset-button" data-action="reset-settings">
                    <span>🔄</span> Resetar Configurações
                </button>
            </div>
        `;
    }

    createCategory(id, icon, title, color, items) {
        const cards = items.map(item => `
            <button class="feature-card" 
                    data-action="${item.id}" 
                    data-category="${id}"
                    aria-label="${item.title}: ${item.desc}. Estado: Desligado. ${item.key ? 'Atalho: ' + item.key : ''}">
                <div class="active-check">✓</div>
                <div class="card-icon">${item.emoji}</div>
                <div class="card-label">${item.title}</div>
                <div class="card-status">OFF</div>
            </button>
        `).join('');

        return `
            <div class="acess-category" data-category="${id}" style="--category-color: ${color}">
                <div class="category-header">
                    <span class="category-icon">${icon}</span>
                    <span class="category-title">${title}</span>
                </div>
                <div class="category-grid">
                    ${cards}
                </div>
            </div>
        `;
    }

    createSection(title, items) {
        const cards = items.map(item => `
            <button class="feature-card" 
                    data-action="${item.id}"
                    aria-label="${item.title}: ${item.desc}">
                <div class="active-check">✓</div>
                <div class="card-icon">${item.emoji}</div>
                <div class="card-label">${item.title}</div>
                <div class="card-status">OFF</div>
            </button>
        `).join('');

        return `
            <div class="acess-category" style="--category-color: #6366f1">
                <div class="category-header">
                    <span class="category-icon"></span>
                    <span class="category-title">${title}</span>
                </div>
                <div class="category-grid">
                    ${cards}
                </div>
            </div>
        `;
    }


    // ==========================================================================
    // TOAST NOTIFICATION SYSTEM
    // ==========================================================================

    showToast(message, type = 'info') {
        const container = document.getElementById('inclua-ai-toasts');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = '';
        switch (type) {
            case 'success': icon = '<path d="M20 6L9 17l-5-5"/>'; break;
            case 'error': icon = '<path d="M18 6L6 18M6 6l12 12"/>'; break;
            case 'warning': icon = '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>'; break;
            default: icon = '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>';
        }

        toast.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${icon}
            </svg>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => toast.remove());
        }, 4000);
    }

    showAlert(message, type = 'info') {
        // Fallback para manter compatibilidade, mas redireciona para Toast
        this.showToast(message, type);
    }

    // ==========================================================================
    // LOADING STATE SYSTEM
    // ==========================================================================

    showLoading(action, message = 'Processando...') {
        this.loadingStates.set(action, true);
        
        // Cria ou atualiza indicador de loading
        if (!this.loadingIndicator) {
            const loadingHTML = `
                <div id="inclua-loading-indicator" class="loading-overlay">
                    <div class="loading-content">
                        <div class="loading-spinner">
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                        </div>
                        <div class="loading-text">Processando...</div>
                        <div class="loading-subtext">Aguarde um momento</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', loadingHTML);
            this.loadingIndicator = document.getElementById('inclua-loading-indicator');
            this.injectLoadingStyles();
        }
        
        const textElement = this.loadingIndicator.querySelector('.loading-text');
        if (textElement) textElement.textContent = message;
        
        this.loadingIndicator.classList.add('show');
    }

    hideLoading(action) {
        this.loadingStates.delete(action);
        
        // Se não há mais estados de loading, esconde o indicador
        if (this.loadingStates.size === 0 && this.loadingIndicator) {
            this.loadingIndicator.classList.remove('show');
        }
    }

    injectLoadingStyles() {
        if (document.getElementById('inclua-loading-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'inclua-loading-styles';
        styles.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .loading-overlay.show {
                opacity: 1;
                visibility: visible;
            }

            .loading-content {
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                padding: 40px 50px;
                border-radius: 24px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                border: 2px solid rgba(59, 130, 246, 0.3);
                animation: loadingSlideIn 0.3s ease;
            }

            @keyframes loadingSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .loading-spinner {
                position: relative;
                width: 80px;
                height: 80px;
                margin: 0 auto 24px;
            }

            .spinner-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 4px solid transparent;
                border-radius: 50%;
                animation: spinnerRotate 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            }

            .spinner-ring:nth-child(1) {
                border-top-color: #3b82f6;
                animation-delay: -0.45s;
            }

            .spinner-ring:nth-child(2) {
                border-top-color: #8b5cf6;
                animation-delay: -0.3s;
            }

            .spinner-ring:nth-child(3) {
                border-top-color: #10b981;
                animation-delay: -0.15s;
            }

            @keyframes spinnerRotate {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }

            .loading-text {
                color: #f1f5f9;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 8px;
                font-family: 'Inter', sans-serif;
            }

            .loading-subtext {
                color: #94a3b8;
                font-size: 14px;
                font-weight: 500;
            }
        `;
        document.head.appendChild(styles);
    }

    // ==========================================================================
    // FOCUS TRAP & ACCESSIBILITY
    // ==========================================================================

    togglePanel() {
        this.isActive = !this.isActive;
        const panel = document.getElementById('inclua-ai-panel');
        const toggle = document.getElementById('inclua-ai-toggle');

        toggle.classList.toggle('active', this.isActive);
        toggle.setAttribute('aria-expanded', this.isActive);

        if (this.isActive) {
            panel.hidden = false;
            // Pequeno delay para permitir animação CSS
            requestAnimationFrame(() => {
                panel.classList.add('show');
                this.trapFocus(panel);
            });
        } else {
            panel.classList.remove('show');
            panel.addEventListener('transitionend', () => {
                if (!this.isActive) panel.hidden = true;
            }, { once: true });
            this.releaseFocus();
        }
    }

    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        this.focusTrap = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            } else if (e.key === 'Escape') {
                this.togglePanel();
            }
        };

        element.addEventListener('keydown', this.focusTrap);
        firstElement?.focus();
    }

    releaseFocus() {
        const panel = document.getElementById('inclua-ai-panel');
        if (panel && this.focusTrap) {
            panel.removeEventListener('keydown', this.focusTrap);
            this.focusTrap = null;
        }
        document.getElementById('inclua-ai-toggle').focus();
    }

    // ==========================================================================
    // EVENT LISTENERS & ACTIONS
    // ==========================================================================

    setupEventListeners() {
        const toggle = document.getElementById('inclua-ai-toggle');
        toggle.addEventListener('click', () => this.togglePanel());

        const panel = document.getElementById('inclua-ai-panel');
        panel.addEventListener('click', (e) => {
            const button = e.target.closest('.feature-button, .feature-card, .reset-button');
            if (button) {
                const action = button.dataset.action;
                this.handleAction(action, button);
            }
        });

        const colorblindFilter = document.getElementById('colorblind-filter');
        if (colorblindFilter) {
            colorblindFilter.addEventListener('change', (e) => this.applyColorblindFilter(e.target.value));
        }

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (this.isActive && !e.target.closest('#inclua-ai-widget')) {
                this.togglePanel();
            }
        });
    }

    async handleAction(action, button) {
        button.classList.add('processing');
        try {
            switch (action) {
                case 'font-increase': this.adjustFontSize(1); break;
                case 'font-decrease': this.adjustFontSize(-1); break;
                case 'highlight-links': this.toggleHighlightLinks(); break;
                case 'text-reader': this.toggleTextReader(); break;
                case 'hover-reader': this.toggleHoverReader(); break;
                case 'describe-image': this.toggleImageDescriber(); break;
                case 'summarize-text': this.toggleTextSummarizer(); break;
                case 'didactic-summary': this.toggleDidacticSummary(); break;
                case 'libras-hover': this.toggleLibrasHover(); break;
                case 'voice-commands': this.toggleVoiceCommands(); break;
                case 'focus-mode': this.toggleFocusMode(); break;
                case 'chatbot': this.openChatbot(); break;
                case 'call-center': this.openCallCenter(); break;
                case 'reset-settings': this.resetSettings(); break;
            }

            // Atualiza visual do botão após ação
            this.updateButtonVisuals(button);

        } catch (error) {
            this.showToast('Erro ao executar ação. Tente novamente.', 'error');
        } finally {
            setTimeout(() => button.classList.remove('processing'), 500);
        }
    }

    updateButtonVisuals(button) {
        // Verifica estado real baseada na ação
        let isActive = false;
        const action = button.dataset.action;

        // Lógica de estado para cada feature
        if (action === 'highlight-links') isActive = document.body.classList.contains('inclua-highlight-links');
        if (action === 'text-reader') isActive = this.settings.textReader;
        if (action === 'hover-reader') isActive = this.settings.hoverReader;
        if (action === 'describe-image') isActive = this.settings.imageDescriber;
        if (action === 'summarize-text') isActive = this.settings.textSummarizer;
        if (action === 'didactic-summary') isActive = this.settings.didacticSummary;
        if (action === 'libras-hover') isActive = this.settings.librasHover;
        if (action === 'voice-commands') isActive = this.settings.voiceCommands;
        if (action === 'focus-mode') isActive = this.settings.focusMode;

        // Aplica classes e textos
        if (isActive) {
            button.classList.add('active');
            const status = button.querySelector('.card-status');
            if (status) status.textContent = 'ON';
            button.setAttribute('aria-pressed', 'true');

            // Atualiza label para leitor de tela
            const currentLabel = button.getAttribute('aria-label') || '';
            button.setAttribute('aria-label', currentLabel.replace('Desligado', 'Ligado'));
        } else {
            // Apenas remove se for toggle, botões de ação momentânea (como fonte) não mantêm estado
            if (!['font-increase', 'font-decrease', 'reset-settings'].includes(action)) {
                button.classList.remove('active');
                const status = button.querySelector('.card-status');
                if (status) status.textContent = 'OFF';
                button.setAttribute('aria-pressed', 'false');

                const currentLabel = button.getAttribute('aria-label') || '';
                button.setAttribute('aria-label', currentLabel.replace('Ligado', 'Desligado'));
            }
        }
    }

    // ==========================================================================
    // NAVEGAÇÃO POR TECLADO E ATALHOS
    // ==========================================================================

    setupKeyboardNavigation() {
        // Atalhos globais e teclas de função
        document.addEventListener('keydown', (e) => {
            // Alt+A: Toggle widget
            if (e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                this.togglePanel();
                this.announceToScreenReader('Menu de acessibilidade ' + (this.isActive ? 'aberto' : 'fechado'));
                return;
            }

            // Esc: Fechar painel se estiver aberto
            if (e.key === 'Escape' && this.isActive) {
                this.togglePanel();
                return;
            }

            // Atalhos de Função (F1-F10)
            this.handleFunctionKeys(e);

            // Navegação por setas quando painel aberto
            if (this.isActive && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                this.navigateButtons(e);
            }
        });

        // Melhorar navegação por Tab nos botões
        this.enhanceButtonNavigation();
    }

    handleFunctionKeys(e) {
        const functionKeyMap = {
            'F1': () => this.showHelpScreen(),
            'F2': () => this.triggerAction('font-increase', 'Aumentar fonte'),
            'F3': () => this.triggerAction('font-decrease', 'Diminuir fonte'),
            'F4': () => this.triggerAction('text-reader', 'Leitor de texto'),
            'F5': () => this.triggerAction('hover-reader', 'Ler ao passar mouse'),
            'F6': () => this.triggerAction('describe-image', 'Descrever imagem'),
            'F7': () => this.triggerAction('summarize-text', 'Resumir texto'),
            'F8': () => this.triggerAction('libras-hover', 'Libras ao hover'),
            'F9': () => this.triggerAction('highlight-links', 'Destacar links'),
            'F10': () => this.triggerAction('didactic-summary', 'Resumo didático'),
            'F11': () => this.triggerAction('focus-mode', 'Modo foco'),
            'F12': () => this.triggerAction('voice-commands', 'Controle por voz')
        };

        if (functionKeyMap[e.key]) {
            e.preventDefault();
            functionKeyMap[e.key]();
        }
    }

    triggerAction(action, name) {
        const button = document.querySelector(`[data-action="${action}"]`);
        if (button) {
            this.handleAction(action, button);
            this.announceToScreenReader(`${name} ativado`);
        }
    }

    navigateButtons(e) {
        e.preventDefault();
        const buttons = Array.from(document.querySelectorAll('.feature-card, .feature-button'));
        const currentIndex = buttons.findIndex(btn => btn === document.activeElement);

        let nextIndex;
        if (e.key === 'ArrowDown') {
            nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        }

        buttons[nextIndex]?.focus();
    }

    enhanceButtonNavigation() {
        // Adicionar suporte a Enter/Space para ativar botões
        const panel = document.getElementById('inclua-ai-panel');
        panel.addEventListener('keydown', (e) => {
            const isFeatureElement = e.target.classList.contains('feature-button') ||
                e.target.classList.contains('feature-card');
            if ((e.key === 'Enter' || e.key === ' ') && isFeatureElement) {
                e.preventDefault();
                e.target.click();
            }
        });
    }

    showHelpScreen() {
        // Remove help screen anterior se existir
        const existingHelp = document.getElementById('inclua-help-screen');
        if (existingHelp) {
            existingHelp.remove();
            return; // Toggle: fecha se já estiver aberto
        }

        const helpHTML = `
            <div id="inclua-help-screen" class="help-screen" role="dialog" aria-labelledby="help-title" aria-modal="true">
                <div class="help-content">
                    <div class="help-header">
                        <h2 id="help-title">⌨️ Atalhos de Teclado</h2>
                        <button class="help-close" onclick="document.getElementById('inclua-help-screen').remove()" aria-label="Fechar ajuda">✕</button>
                    </div>
                    <div class="help-body">
                        <div class="help-section">
                            <h3>Atalhos Globais</h3>
                            <ul class="help-list">
                                <li><kbd>Alt</kbd> + <kbd>A</kbd> - Abrir/Fechar Menu</li>
                                <li><kbd>F1</kbd> - Mostrar esta ajuda</li>
                                <li><kbd>Esc</kbd> - Fechar painel</li>
                            </ul>
                        </div>
                        <div class="help-section">
                            <h3>Funcionalidades (F2-F12)</h3>
                            <ul class="help-list">
                                <li><kbd>F2</kbd> - Aumentar fonte</li>
                                <li><kbd>F3</kbd> - Diminuir fonte</li>
                                <li><kbd>F4</kbd> - Leitor de texto</li>
                                <li><kbd>F5</kbd> - Ler ao passar mouse</li>
                                <li><kbd>F6</kbd> - Descrever imagem</li>
                                <li><kbd>F7</kbd> - Resumir texto</li>
                                <li><kbd>F8</kbd> - Libras ao hover</li>
                                <li><kbd>F9</kbd> - Destacar links</li>
                                <li><kbd>F10</kbd> - Resumo didático</li>
                                <li><kbd>F11</kbd> - Modo foco</li>
                                <li><kbd>F12</kbd> - Controle por voz</li>
                            </ul>
                        </div>
                        <div class="help-section">
                            <h3>Comandos de Voz</h3>
                            <ul class="help-list">
                                <li>"aumentar" / "diminuir" - Fonte</li>
                                <li>"ler" / "parar" - Leitor</li>
                                <li>"foco" - Modo concentração</li>
                                <li>"resumir" / "libras" - Funções</li>
                                <li>"ajuda" - Ver comandos</li>
                            </ul>
                        </div>
                        <div class="help-section">
                            <h3>Navegação no Menu</h3>
                            <ul class="help-list">
                                <li><kbd>Tab</kbd> - Próximo elemento</li>
                                <li><kbd>Shift</kbd> + <kbd>Tab</kbd> - Elemento anterior</li>
                                <li><kbd>↑</kbd> - Botão anterior</li>
                                <li><kbd>↓</kbd> - Próximo botão</li>
                                <li><kbd>Enter</kbd> ou <kbd>Espaço</kbd> - Ativar</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', helpHTML);
        this.injectHelpStyles();

        // Foco no botão fechar
        document.querySelector('.help-close').focus();
        this.announceToScreenReader('Tela de ajuda aberta. Navegue com Tab para ver os atalhos');

        // Fechar com Esc ou F1
        const helpScreen = document.getElementById('inclua-help-screen');
        const closeHelp = (e) => {
            if (e.key === 'Escape' || e.key === 'F1') {
                e.preventDefault();
                helpScreen.remove();
                document.removeEventListener('keydown', closeHelp);
            }
        };
        document.addEventListener('keydown', closeHelp);
    }

    announceToScreenReader(message) {
        // Criar região ARIA live se não existir
        let liveRegion = document.getElementById('inclua-aria-live');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'inclua-aria-live';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = message;

        // Limpar após 1 segundo
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }

    // ==========================================================================
    // FEATURES IMPLEMENTATION
    // ==========================================================================

    adjustFontSize(delta) {
        this.settings.fontSize = Math.max(-2, Math.min(5, this.settings.fontSize + delta));
        const percentage = 100 + (this.settings.fontSize * 20);
        document.documentElement.style.fontSize = `${percentage}%`;
        this.saveSettings();
        this.showToast(`Tamanho da fonte: ${percentage}%`, 'success');
    }



    toggleHighlightLinks() {
        this.settings.highlightLinks = !this.settings.highlightLinks;
        document.body.classList.toggle('inclua-highlight-links', this.settings.highlightLinks);

        // Atualiza visual
        const btn = document.querySelector('[data-action="highlight-links"]');
        if (btn) this.updateButtonVisuals(btn);

        this.showToast(`Destaque de links ${this.settings.highlightLinks ? 'ativado' : 'desativado'}`, 'success');
    }

    toggleTextReader() {
        this.settings.textReader = !this.settings.textReader;

        // Atualiza visual
        const btn = document.querySelector('[data-action="text-reader"]');
        if (btn) this.updateButtonVisuals(btn);

        if (this.settings.textReader) {
            document.addEventListener('mouseup', this.boundHandleTextSelection);
            this.showToast('🔊 Leitor ativado: Selecione qualquer texto para ouvir', 'success');
            console.log('Leitor de texto ativado - Selecione texto para ler');
        } else {
            document.removeEventListener('mouseup', this.boundHandleTextSelection);
            speechSynthesis.cancel();
            this.showToast('Leitor de texto desativado', 'info');
            console.log('Leitor de texto desativado');
        }
    }

    handleTextSelection() {
        // Ignora seleções dentro do widget
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        if (range.startContainer.parentElement?.closest('#inclua-ai-widget')) return;
        
        const text = selection.toString().trim();
        if (text.length > 0) {
            console.log('Texto selecionado para leitura:', text.substring(0, 50) + '...');
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            utterance.onstart = () => {
                this.showToast('🔊 Lendo texto selecionado...', 'info');
            };
            
            utterance.onend = () => {
                console.log('Leitura finalizada');
            };
            
            utterance.onerror = (e) => {
                console.error('Erro na síntese de voz:', e);
                this.showToast('Erro ao ler texto', 'error');
            };
            
            speechSynthesis.speak(utterance);
        }
    }

    toggleHoverReader() {
        this.settings.hoverReader = !this.settings.hoverReader;

        // Atualiza visual
        const btn = document.querySelector('[data-action="hover-reader"]');
        if (btn) this.updateButtonVisuals(btn);

        if (this.settings.hoverReader) {
            document.addEventListener('mouseover', this.boundHandleHover);
            document.addEventListener('mouseout', this.boundHandleHoverOut);
            this.showToast('👆 Leitor de Tela ativado: Passe o mouse sobre textos', 'success');
            console.log('Leitor de tela (hover) ativado');
        } else {
            document.removeEventListener('mouseover', this.boundHandleHover);
            document.removeEventListener('mouseout', this.boundHandleHoverOut);
            clearTimeout(this.hoverTimeout);
            speechSynthesis.cancel();
            this.removeHighlight();
            this.hideHoverReadingIndicator();
            this.isReading = false;
            this.showToast('Leitor de tela desativado', 'info');
            console.log('Leitor de tela (hover) desativado');
        }
    }

    handleHover(e) {
        if (!this.settings.hoverReader) {
            console.log('Hover reader não está ativado');
            return;
        }
        
        if (this.activeModal || e.target.closest('#inclua-ai-widget')) return;
        if (e.target.closest('#inclua-hover-indicator') || e.target.closest('#inclua-loading-indicator')) return;

        // Elementos que devem ser lidos
        const readableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'BUTTON', 'LI', 'TD', 'TH', 'LABEL', 'DIV', 'ARTICLE', 'SECTION'];
        let target = e.target;

        // Procura o elemento mais apropriado para ler
        if (!readableTags.includes(target.tagName)) {
            target = target.closest(readableTags.map(t => t.toLowerCase()).join(','));
        }

        if (!target) return;

        // Para elementos inline (A, SPAN, BUTTON), lê apenas o elemento específico
        const inlineElements = ['A', 'BUTTON', 'LABEL', 'SPAN', 'STRONG', 'EM', 'B', 'I'];
        let text;
        
        if (inlineElements.includes(target.tagName)) {
            // Para links e botões, lê o texto específico + contexto
            text = target.innerText?.trim();
            if (target.tagName === 'A' && text) {
                text = `Link: ${text}`;
            } else if (target.tagName === 'BUTTON' && text) {
                text = `Botão: ${text}`;
            }
        } else {
            // Para blocos de texto, lê o conteúdo completo
            text = target.innerText?.trim();
        }

        // Validação: tem texto válido?
        if (!text || text.length === 0 || text.length > 5000) return;

        // Evita reler o mesmo elemento
        if (this.currentHighlighted === target) return;

        console.log('Hover sobre elemento:', target.tagName, '- Texto:', text.substring(0, 50) + '...');

        // Debounce para evitar leitura excessiva
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = setTimeout(() => {
            console.log('Iniciando leitura do texto...');
            this.highlightElement(target);
            this.showHoverReadingIndicator(target, text);

            // Cancela leitura anterior
            speechSynthesis.cancel();

            // Configura nova leitura
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 1.1; // Um pouco mais rápido para melhor experiência
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
                
            utterance.onstart = () => { 
                this.isReading = true;
                this.updateHoverIndicator('🔊 Lendo...', 'reading');
                console.log('Leitura iniciada');
            };
                
            utterance.onend = () => { 
                this.currentSpeech = null;
                this.isReading = false;
                console.log('Leitura finalizada');
                // Não esconde o indicador imediatamente, deixa visível
            };

            utterance.onerror = (error) => {
                this.currentSpeech = null;
                this.isReading = false;
                console.error('Erro na síntese de voz:', error);
                this.showToast('Erro na síntese de voz', 'error');
            };

            this.currentSpeech = utterance;
            speechSynthesis.speak(utterance);
        }, 300); // Delay reduzido para resposta mais rápida
    }

    handleHoverOut(e) {
        clearTimeout(this.hoverTimeout);
        speechSynthesis.cancel();
        this.removeHighlight();
        this.hideHoverReadingIndicator();
        this.isReading = false;
    }

    showHoverReadingIndicator(element, text = '') {
        if (!this.hoverIndicator) {
            const indicatorHTML = `
                <div id="inclua-hover-indicator" class="hover-reading-indicator">
                    <div class="indicator-icon">🔊</div>
                    <div class="indicator-content">
                        <div class="indicator-title">Leitor de Tela</div>
                        <div class="indicator-text">Preparando...</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', indicatorHTML);
            this.hoverIndicator = document.getElementById('inclua-hover-indicator');
            this.injectHoverIndicatorStyles();
        }
        
        // Atualiza o texto do preview
        const textElement = this.hoverIndicator.querySelector('.indicator-text');
        if (textElement && text) {
            const preview = text.length > 60 ? text.substring(0, 60) + '...' : text;
            textElement.textContent = preview;
        }
        
        // Posiciona próximo ao elemento
        const rect = element.getBoundingClientRect();
        const indicatorHeight = 70; // Altura aproximada do indicador
        
        // Posiciona acima do elemento, mas verifica se cabe na tela
        let top = rect.top - indicatorHeight - 10;
        if (top < 10) {
            // Se não cabe acima, coloca abaixo
            top = rect.bottom + 10;
        }
        
        this.hoverIndicator.style.top = `${top}px`;
        this.hoverIndicator.style.left = `${rect.left}px`;
        this.hoverIndicator.classList.add('show');
    }

    updateHoverIndicator(text, state = 'ready') {
        if (!this.hoverIndicator) return;
        
        const textElement = this.hoverIndicator.querySelector('.indicator-text');
        if (textElement) textElement.textContent = text;
        
        this.hoverIndicator.className = `hover-reading-indicator show ${state}`;
    }

    hideHoverReadingIndicator() {
        if (this.hoverIndicator) {
            this.hoverIndicator.classList.remove('show');
        }
    }

    injectHoverIndicatorStyles() {
        if (document.getElementById('inclua-hover-indicator-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'inclua-hover-indicator-styles';
        styles.textContent = `
            .hover-reading-indicator {
                position: fixed;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(59, 130, 246, 0.3);
                z-index: 999998;
                font-family: 'Inter', sans-serif;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px) scale(0.95);
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
                display: flex;
                align-items: center;
                gap: 12px;
                max-width: 400px;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }

            .hover-reading-indicator.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }

            .hover-reading-indicator.reading {
                background: linear-gradient(135deg, #065f46 0%, #047857 100%);
                box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4), 0 0 0 2px rgba(16, 185, 129, 0.5);
            }

            .indicator-icon {
                font-size: 24px;
                flex-shrink: 0;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            }

            .indicator-content {
                flex: 1;
                min-width: 0;
            }

            .indicator-title {
                font-size: 11px;
                font-weight: 700;
                color: rgba(255, 255, 255, 0.7);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }

            .indicator-text {
                color: white;
                font-size: 13px;
                font-weight: 500;
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }

            .hover-reading-indicator.reading .indicator-icon {
                animation: pulse 1.5s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
        `;
        document.head.appendChild(styles);
    }

    highlightElement(el) {
        this.removeHighlight();
        this.currentHighlighted = el;
        el.style.outline = '2px solid #2563eb';
        el.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
        el.style.transition = 'all 0.2s';
    }

    removeHighlight() {
        if (this.currentHighlighted) {
            this.currentHighlighted.style.outline = '';
            this.currentHighlighted.style.backgroundColor = '';
            this.currentHighlighted = null;
        }
    }

    toggleImageDescriber() {
        this.settings.imageDescriber = !this.settings.imageDescriber;

        // Atualiza visual
        const btn = document.querySelector('[data-action="describe-image"]');
        if (btn) this.updateButtonVisuals(btn);

        if (this.settings.imageDescriber) {
            document.addEventListener('click', this.boundHandleImageClick);
            document.body.style.cursor = 'help';
            this.showToast('Clique em uma imagem para descrição', 'info');
        } else {
            document.removeEventListener('click', this.boundHandleImageClick);
            document.body.style.cursor = '';
            this.showToast('Descrição de imagens desativada', 'info');
        }
    }

    async handleImageClick(e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            e.stopPropagation();
            const imageUrl = e.target.src;
            if (imageUrl) await this.describeImage(imageUrl, e.target);
        }
    }

    async describeImage(imageUrl, imgElement) {
        this.showLoading('image-description', '🖼️ Analisando imagem com IA...');
        try {
            const response = await this.fetchWithRetry(`${this.getApiBaseUrl()}/describe-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl })
            });

            if (!response.ok) throw new Error('Falha na API');
            const data = await response.json();
            
            this.hideLoading('image-description');

            this.showModal('🖼️ Descrição Inteligente', `
                <div class="ai-result-container">
                    <div class="ai-result-header">
                        <div class="ai-result-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        </div>
                        <div class="ai-result-meta">
                            <h3>Análise Visual</h3>
                            <span>IA Generativa</span>
                        </div>
                    </div>
                    <div class="ai-result-content">
                        <div class="ai-result-text">${data.description}</div>
                        <div class="ai-result-actions">
                            <button onclick="window.incluaAIWidget.copyDescription(this)" data-description="${data.description.replace(/"/g, '&quot;')}" class="btn btn-primary">Copiar</button>
                            <button onclick="window.incluaAIWidget.playDescription(this)" data-description="${data.description.replace(/"/g, '&quot;')}" class="btn btn-secondary">Ouvir</button>
                        </div>
                    </div>
                </div>
            `);
                this.showToast('✅ Imagem descrita com sucesso!', 'success');
                
                // Reproduz automaticamente a descrição em áudio
                setTimeout(() => {
                    console.log('Iniciando reprodução automática da descrição');
                    speechSynthesis.cancel(); // Garante que não há áudio anterior
                    
                    const utterance = new SpeechSynthesisUtterance(data.description);
                    utterance.lang = 'pt-BR';
                    utterance.rate = 1.0;
                    utterance.pitch = 1.0;
                    utterance.volume = 1.0;
                    
                    utterance.onstart = () => {
                        console.log('Áudio da descrição iniciado');
                        this.showToast('🔊 Reproduzindo descrição...', 'info');
                    };
                    
                    utterance.onend = () => {
                        console.log('Áudio da descrição finalizado');
                        this.currentSpeech = null;
                    };
                    
                    utterance.onerror = (e) => {
                        console.error('Erro na reprodução de áudio:', e);
                        this.showToast('Erro ao reproduzir áudio', 'error');
                    };
                    
                    this.currentSpeech = utterance;
                    speechSynthesis.speak(utterance);
                }, 800); // Delay maior para garantir que o modal esteja pronto
        } catch (error) {
            this.hideLoading('image-description');
            this.showToast('Erro ao descrever imagem', 'error');
        }
    }

    toggleTextSummarizer() {
        this.settings.textSummarizer = !this.settings.textSummarizer;

        // Se selecionar resumo normal, desabilita resumo didático
        if (this.settings.textSummarizer && this.settings.didacticSummary) {
            this.settings.didacticSummary = false;
            document.removeEventListener('mouseup', this.handleDidacticSummarization.bind(this));
            // Atualiza visual do botão didático se houver mudança cruzada
            const didacticBtn = document.querySelector('[data-action="didactic-summary"]');
            if (didacticBtn) this.updateButtonVisuals(didacticBtn);
        }

        if (this.settings.textSummarizer) {
            document.addEventListener('mouseup', this.boundHandleTextSummarization);
            this.showToast('Selecione texto para resumir', 'info');
        } else {
            document.removeEventListener('mouseup', this.boundHandleTextSummarization);
            this.showToast('Resumo de texto desativado', 'info');
        }
    }

    async handleTextSummarization() {
        const text = window.getSelection().toString().trim();
        if (text.length >= 50) {
            this.showLoading('text-summary', '📝 Gerando resumo inteligente...');
            try {
                const response = await this.fetchWithRetry(`${this.getApiBaseUrl()}/summarize-text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ textToSummarize: text })
                });

                if (!response.ok) throw new Error('Falha na API');
                const data = await response.json();
                
                this.hideLoading('text-summary');

                this.showModal('📄 Resumo Inteligente', `
                    <div class="ai-result-container">
                        <div class="ai-result-header">
                            <div class="ai-result-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
                            </div>
                            <div class="ai-result-meta">
                                <h3>Resumo Gerado</h3>
                                <span>${text.length} caracteres → Resumo</span>
                            </div>
                        </div>
                        <div class="ai-result-content">
                            <div class="ai-result-text">${data.summarizedText}</div>
                            <div class="ai-result-actions">
                                <button onclick="window.incluaAIWidget.copySummary(this)" data-summary="${data.summarizedText.replace(/"/g, '&quot;')}" class="btn btn-primary">Copiar</button>
                                <button onclick="window.incluaAIWidget.playSummary(this)" data-summary="${data.summarizedText.replace(/"/g, '&quot;')}" class="btn btn-secondary">Ouvir</button>
                            </div>
                        </div>
                    </div>
                `);
                this.showToast('✅ Resumo gerado com sucesso!', 'success');
            } catch (error) {
                this.hideLoading('text-summary');
                this.showToast('Erro ao resumir texto', 'error');
            }
        }
    }

    toggleDidacticSummary() {
        this.settings.didacticSummary = !this.settings.didacticSummary;

        // Se ativar resumo didático, desativar resumo normal
        if (this.settings.didacticSummary && this.settings.textSummarizer) {
            this.settings.textSummarizer = false;
            document.removeEventListener('mouseup', this.boundHandleTextSummarization);
            // Atualiza visual do botão resumir se houver mudança cruzada
            const summarizeBtn = document.querySelector('[data-action="summarize-text"]');
            if (summarizeBtn) this.updateButtonVisuals(summarizeBtn);
        }

        if (this.settings.didacticSummary) {
            // Usa boundHandle paraDidactic se ainda não existir, cria agora ou usa método direto se preferir
            if (!this.boundHandleDidacticSummarization) {
                this.boundHandleDidacticSummarization = this.handleDidacticSummarization.bind(this);
            }
            document.addEventListener('mouseup', this.boundHandleDidacticSummarization);
            this.showToast('Selecione texto para resumo didático', 'info');
        } else {
            if (this.boundHandleDidacticSummarization) {
                document.removeEventListener('mouseup', this.boundHandleDidacticSummarization);
            }
            this.showToast('Resumo didático desativado', 'info');
        }
    }

    async handleDidacticSummarization() {
        // Não gerar resumo se um modal estiver aberto
        if (this.activeModal) {
            return;
        }

        const text = window.getSelection().toString().trim();
        if (text.length >= 50 && this.settings.didacticSummary) {
            this.showLoading('didactic-summary', '📚 Criando resumo didático...');
            try {
                const response = await this.fetchWithRetry(`${this.getApiBaseUrl()}/didactic-summarize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ textToSummarize: text })
                });

                if (!response.ok) throw new Error('Falha na API');
                const data = await response.json();
                
                this.hideLoading('didactic-summary');

                this.showModal('📚 Resumo Didático', `
                    <div class="ai-result-container">
                        <div class="ai-result-header">
                            <div class="ai-result-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                            </div>
                            <div class="ai-result-meta">
                                <h3>Resumo Educacional</h3>
                                <span>${text.length} caracteres → Formato Didático</span>
                            </div>
                        </div>
                        <div class="ai-result-content">
                            <div class="ai-result-text" style="white-space: pre-line;">${data.didacticSummary}</div>
                            <div class="ai-result-actions">
                                <button onclick="window.incluaAIWidget.copyDidacticSummary(this)" data-didactic="${data.didacticSummary.replace(/"/g, '&quot;')}" class="btn btn-primary">Copiar</button>
                                <button onclick="window.incluaAIWidget.playDidacticSummary(this)" data-didactic="${data.didacticSummary.replace(/"/g, '&quot;')}" class="btn btn-secondary">Ouvir</button>
                            </div>
                        </div>
                    </div>
                `);
                this.showToast('✅ Resumo didático criado!', 'success');
            } catch (error) {
                this.hideLoading('didactic-summary');
                this.showToast('Erro ao gerar resumo didático', 'error');
            }
        }
    }

    // ==========================================================================
    // VOICE COMMANDS - Controle por Voz
    // ==========================================================================

    toggleVoiceCommands() {
        this.settings.voiceCommands = !this.settings.voiceCommands;

        // Atualiza visual
        const btn = document.querySelector('[data-action="voice-commands"]');
        if (btn) this.updateButtonVisuals(btn);

        if (this.settings.voiceCommands) {
            this.initVoiceRecognition();
        } else {
            this.stopVoiceRecognition();
        }
    }

    initVoiceRecognition() {
        // Verifica suporte
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.showToast('❌ Seu navegador não suporta reconhecimento de voz', 'error');
            this.settings.voiceCommands = false;
            return;
        }

        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.lang = 'pt-BR';

        this.speechRecognition.onstart = () => {
            this.isListening = true;
            this.showToast('🎙️ Ouvindo comandos... Diga "ajuda" para ver opções', 'success');
            this.showVoiceIndicator(true);
        };

        this.speechRecognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.toLowerCase().trim();
            this.processVoiceCommand(command);
        };

        this.speechRecognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                // Silêncio, não é erro crítico
                return;
            }
            console.error('Erro de reconhecimento:', event.error);
            this.showToast(`Erro de voz: ${event.error}`, 'error');
        };

        this.speechRecognition.onend = () => {
            // Reinicia se ainda estiver ativo
            if (this.settings.voiceCommands && this.isListening) {
                try {
                    this.speechRecognition.start();
                } catch (e) {
                    // Ignora erro de já estar rodando
                }
            }
        };

        try {
            this.speechRecognition.start();
        } catch (e) {
            this.showToast('Erro ao iniciar reconhecimento de voz', 'error');
        }
    }

    stopVoiceRecognition() {
        this.isListening = false;
        this.showVoiceIndicator(false);

        if (this.speechRecognition) {
            try {
                this.speechRecognition.stop();
            } catch (e) {
                // Ignora
            }
        }
        this.showToast('🎙️ Controle por voz desativado', 'info');
    }

    processVoiceCommand(command) {
        // Feedback visual imediato
        this.showToast(`🗣️ "${command}"`, 'info');

        // Mapear comandos com mais variações
        const commands = {
            // Fonte - múltiplas formas de dizer
            'aumentar fonte': () => this.execVoice('font-increase', 'Fonte aumentada'),
            'aumentar': () => this.execVoice('font-increase', 'Fonte aumentada'),
            'fonte maior': () => this.execVoice('font-increase', 'Fonte aumentada'),
            'maior': () => this.execVoice('font-increase', 'Fonte maior'),
            'grande': () => this.execVoice('font-increase', 'Texto maior'),

            'diminuir fonte': () => this.execVoice('font-decrease', 'Fonte diminuída'),
            'diminuir': () => this.execVoice('font-decrease', 'Fonte diminuída'),
            'fonte menor': () => this.execVoice('font-decrease', 'Fonte diminuída'),
            'menor': () => this.execVoice('font-decrease', 'Fonte menor'),
            'pequeno': () => this.execVoice('font-decrease', 'Texto menor'),

            // Leitura
            'ler texto': () => this.execVoice('text-reader', 'Leitor ativado'),
            'ler': () => this.execVoice('text-reader', 'Leitor ativado'),
            'leitor': () => this.execVoice('text-reader', 'Leitor de texto'),
            'leia': () => this.execVoice('text-reader', 'Leitor ativado'),
            'parar leitura': () => { speechSynthesis.cancel(); this.showToast('⏹️ Leitura parada', 'success'); },
            'parar': () => { speechSynthesis.cancel(); this.showToast('⏹️ Parado', 'success'); },
            'silêncio': () => { speechSynthesis.cancel(); this.showToast('🤫 Silenciado', 'success'); },
            'calar': () => { speechSynthesis.cancel(); this.showToast('🤫 OK', 'success'); },

            // Hover
            'passar mouse': () => this.execVoice('hover-reader', 'Leitura ao passar ativada'),
            'hover': () => this.execVoice('hover-reader', 'Hover reader'),

            // Foco
            'modo foco': () => this.execVoice('focus-mode', 'Modo foco'),
            'foco': () => this.execVoice('focus-mode', 'Modo foco'),
            'concentrar': () => this.execVoice('focus-mode', 'Concentração ativada'),
            'concentração': () => this.execVoice('focus-mode', 'Modo concentração'),

            // Links
            'destacar links': () => this.execVoice('highlight-links', 'Links destacados'),
            'mostrar links': () => this.execVoice('highlight-links', 'Links visíveis'),
            'links': () => this.execVoice('highlight-links', 'Links'),

            // Imagem
            'descrever imagem': () => this.execVoice('describe-image', 'Clique em uma imagem'),
            'descrever foto': () => this.execVoice('describe-image', 'Modo descrição de imagem'),
            'imagem': () => this.execVoice('describe-image', 'Descrição de imagem'),
            'foto': () => this.execVoice('describe-image', 'Modo foto'),

            // Resumir
            'resumir': () => this.execVoice('summarize-text', 'Selecione texto para resumir'),
            'resumo': () => this.execVoice('summarize-text', 'Modo resumo'),
            'resumir texto': () => this.execVoice('summarize-text', 'Resumidor ativado'),
            'didático': () => this.execVoice('didactic-summary', 'Resumo didático'),

            // Libras
            'libras': () => this.execVoice('libras-hover', 'Libras ativado'),
            'traduzir': () => this.execVoice('libras-hover', 'Tradução Libras'),
            'língua de sinais': () => this.execVoice('libras-hover', 'Libras'),

            // Ajuda
            'ajuda': () => this.showVoiceHelpModal(),
            'comandos': () => this.showVoiceHelpModal(),
            'o que posso falar': () => this.showVoiceHelpModal(),
            'help': () => this.showVoiceHelpModal(),

            // Menu
            'fechar menu': () => { if (this.isActive) this.togglePanel(); this.showToast('Menu fechado', 'success'); },
            'fechar': () => { if (this.isActive) this.togglePanel(); },
            'abrir menu': () => { if (!this.isActive) this.togglePanel(); this.showToast('Menu aberto', 'success'); },
            'abrir': () => { if (!this.isActive) this.togglePanel(); },
            'menu': () => { this.togglePanel(); },

            // Resetar
            'resetar': () => { this.resetSettings(); this.showToast('⚙️ Configurações resetadas', 'success'); },
            'limpar': () => { this.resetSettings(); },
            'reiniciar': () => { this.resetSettings(); },

            // Desativar voz
            'desativar voz': () => { this.toggleVoiceCommands(); },
            'parar de ouvir': () => { this.toggleVoiceCommands(); }
        };

        // Procura correspondência (ordem importa - mais específicos primeiro)
        let matched = false;
        const sortedCommands = Object.entries(commands).sort((a, b) => b[0].length - a[0].length);

        for (const [key, action] of sortedCommands) {
            if (command.includes(key)) {
                action();
                matched = true;
                break;
            }
        }

        if (!matched) {
            this.showToast('❓ Não entendi. Diga "ajuda" para ver comandos', 'info');
        }
    }

    execVoice(action, feedback) {
        const button = document.querySelector(`[data-action="${action}"]`);
        if (button) {
            this.handleAction(action, button);
            this.showToast(`✅ ${feedback}`, 'success');
        }
    }

    showVoiceHelpModal() {
        this.showModal('🎙️ Comandos de Voz', `
            <div style="text-align: left; line-height: 1.8;">
                <p><strong>📏 Fonte:</strong> "maior", "menor", "aumentar", "diminuir"</p>
                <p><strong>🔊 Leitura:</strong> "ler", "parar", "silêncio"</p>
                <p><strong>🎯 Foco:</strong> "foco", "concentrar"</p>
                <p><strong>🖼️ Imagem:</strong> "descrever imagem", "foto"</p>
                <p><strong>📝 Resumo:</strong> "resumir", "didático"</p>
                <p><strong>🔗 Links:</strong> "destacar links"</p>
                <p><strong>🤟 Libras:</strong> "libras", "traduzir"</p>
                <p><strong>📋 Menu:</strong> "abrir", "fechar"</p>
                <p><strong>⚙️ Sistema:</strong> "resetar", "desativar voz"</p>
            </div>
        `);
    }

    showVoiceIndicator(show) {
        let indicator = document.getElementById('inclua-voice-indicator');

        if (show) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'inclua-voice-indicator';
                indicator.innerHTML = `
                    <div class="voice-pulse"></div>
                    <span>🎙️ Ouvindo...</span>
                `;
                document.body.appendChild(indicator);
            }
            indicator.style.display = 'flex';
        } else {
            if (indicator) {
                indicator.style.display = 'none';
            }
        }
    }

    // ==========================================================================
    // FOCUS MODE - Modo de Concentração
    // ==========================================================================

    toggleFocusMode() {
        this.settings.focusMode = !this.settings.focusMode;

        // Atualiza visual
        const btn = document.querySelector('[data-action="focus-mode"]');
        if (btn) this.updateButtonVisuals(btn);

        if (this.settings.focusMode) {
            this.enableFocusMode();
            this.showToast('🎯 Modo Foco ativado - Passe o mouse para iluminar', 'success');
        } else {
            this.disableFocusMode();
            this.showToast('Modo Foco desativado', 'info');
        }
    }

    enableFocusMode() {
        // Cria overlay escuro
        if (!document.getElementById('inclua-focus-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'inclua-focus-overlay';
            document.body.appendChild(overlay);
        }

        // Bind do handler
        if (!this.boundFocusHandler) {
            this.boundFocusHandler = this.handleFocusHover.bind(this);
        }

        document.addEventListener('mousemove', this.boundFocusHandler);
        document.body.classList.add('inclua-focus-active');
    }

    disableFocusMode() {
        const overlay = document.getElementById('inclua-focus-overlay');
        if (overlay) overlay.remove();

        if (this.boundFocusHandler) {
            document.removeEventListener('mousemove', this.boundFocusHandler);
        }

        // Remove highlight de qualquer elemento
        const highlighted = document.querySelector('.focus-highlighted');
        if (highlighted) {
            highlighted.classList.remove('focus-highlighted');
        }

        document.body.classList.remove('inclua-focus-active');
    }

    handleFocusHover(e) {
        if (!this.settings.focusMode) return;
        if (e.target.closest('#inclua-ai-widget')) return;
        if (e.target.id === 'inclua-focus-overlay') return;

        // Remove highlight anterior
        const oldHighlight = document.querySelector('.focus-highlighted');
        if (oldHighlight && oldHighlight !== e.target) {
            oldHighlight.classList.remove('focus-highlighted');
        }

        // Encontra elemento de conteúdo mais próximo
        const contentTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'BLOCKQUOTE', 'DIV', 'ARTICLE', 'SECTION'];
        let target = e.target;

        // Sobe na árvore até encontrar um elemento de conteúdo significativo
        while (target && !contentTags.includes(target.tagName)) {
            target = target.parentElement;
        }

        if (target && target !== document.body) {
            target.classList.add('focus-highlighted');
        }
    }

    // ==========================================================================
    // LIBRAS ACCESSIBILITY FUNCTIONS
    // ==========================================================================

    toggleLibrasHover() {
        this.settings.librasHover = !this.settings.librasHover;

        if (this.settings.librasHover) {
            this.initLibrasPlayer();
            document.addEventListener('mouseover', this.boundHandleLibrasHover);
            document.addEventListener('mouseout', this.boundHandleLibrasHoverOut);
            this.showToast('🤟 Passe o mouse sobre textos para traduzir em Libras', 'info');
        } else {
            document.removeEventListener('mouseover', this.boundHandleLibrasHover);
            document.removeEventListener('mouseout', this.boundHandleLibrasHoverOut);
            clearTimeout(this.librasHoverTimeout);
            this.removeLibrasHighlight();
            this.hideLibrasPlayer();
            this.showToast('Libras ao hover desativado', 'info');
        }
    }

    initLibrasPlayer() {
        // Cria o player flutuante de Libras se não existir
        if (document.getElementById('inclua-libras-player')) return;

        const playerHTML = `
            <div id="inclua-libras-player" class="libras-player-container" style="display: none;">
                <div class="libras-player-header">
                    <span class="libras-player-title">🤟 Tradução em Libras</span>
                    <button class="libras-player-close" onclick="window.incluaAIWidget.hideLibrasPlayer()" aria-label="Fechar">✕</button>
                </div>
                <div class="libras-player-content">
                    <div class="libras-original-text" id="libras-original-text"></div>
                    <div class="libras-glosa-container">
                        <div class="libras-glosa-label">📝 Glosa em Libras:</div>
                        <div class="libras-glosa-text" id="libras-glosa-text"></div>
                    </div>
                    <div class="libras-hugo-container" id="libras-hugo-container">
                        <img src="hugo-avatar.png" 
                             alt="Avatar Hugo fazendo sinais de Libras" 
                             class="hugo-avatar-image"
                             id="hugo-avatar-img">
                        <div class="hugo-status" id="hugo-status">Avatar demonstrativo - Mostra como funcionaria</div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', playerHTML);
        this.injectLibrasStyles();
    }

    // Funções VLibras removidas - usando apenas imagem demonstrativa

    oldInitEmbeddedVLibras() {
        // Carrega o VLibras de forma embutida no nosso player
        if (this.vlibrasLoaded) {
            this.moveVLibrasToPlayer();
            return;
        }

        // Verifica se já existe o VLibras na página
        if (document.querySelector('[vw]')) {
            this.vlibrasLoaded = true;
            this.moveVLibrasToPlayer();
            return;
        }

        // Cria o container do VLibras
        const vlibrasDiv = document.createElement('div');
        vlibrasDiv.setAttribute('vw', '');
        vlibrasDiv.className = 'enabled';
        vlibrasDiv.id = 'vlibras-widget-container';
        vlibrasDiv.innerHTML = `
            <div vw-access-button class="active"></div>
            <div vw-plugin-wrapper>
                <div class="vw-plugin-top-wrapper"></div>
            </div>
        `;
        document.body.appendChild(vlibrasDiv);

        // Carrega o script do VLibras
        const script = document.createElement('script');
        script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        script.onload = () => {
            if (window.VLibras) {
                new window.VLibras.Widget('https://vlibras.gov.br/app');
                this.vlibrasLoaded = true;
                console.log('✅ VLibras Widget carregado');

                // Aguarda o widget renderizar e move para nosso player
                setTimeout(() => {
                    this.moveVLibrasToPlayer();
                }, 1500);
            }
        };
        script.onerror = () => {
            console.error('❌ Erro ao carregar VLibras');
            this.showHugoFallback();
        };
        document.head.appendChild(script);
    }

    moveVLibrasToPlayer() {
        const hugoContainer = document.getElementById('hugo-avatar-wrapper');
        const vlibrasWrapper = document.querySelector('[vw-plugin-wrapper]');
        const vlibrasButton = document.querySelector('[vw-access-button]');

        if (hugoContainer && vlibrasWrapper) {
            // Estiliza o wrapper do VLibras para caber no nosso player
            this.injectVLibrasOverrideStyles();

            // Atualiza status
            hugoContainer.innerHTML = `
                <div class="hugo-ready">
                    <div class="hugo-icon">🧏</div>
                    <span>Clique abaixo para ver o Hugo traduzindo!</span>
                    <small style="color: #64748b; font-size: 11px; margin-top: 8px; display: block;">O Hugo aparecerá no widget do VLibras (governo)</small>
                </div>
            `;

            console.log('✅ VLibras pronto para uso');
        }

        // Mantém o botão de acesso visível mas discreto
        if (vlibrasButton) {
            vlibrasButton.style.cssText = 'position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 9999 !important;';
        }
    }

    showHugoFallback() {
        const hugoContainer = document.getElementById('hugo-avatar-wrapper');
        if (hugoContainer) {
            hugoContainer.innerHTML = `
                <div class="hugo-fallback">
                    <div class="hugo-icon">🤟</div>
                    <span>Use a glosa acima para traduzir em Libras</span>
                </div>
            `;
        }
    }

    injectVLibrasOverrideStyles() {
        if (document.getElementById('vlibras-override-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'vlibras-override-styles';
        styles.textContent = `
            /* Estiliza o VLibras para aparecer em tela cheia quando ativado */
            [vw].enabled [vw-plugin-wrapper] {
                position: fixed !important;
                bottom: 80px !important;
                right: 20px !important;
                z-index: 999999 !important;
            }
            
            /* Animação suave ao abrir */
            [vw].enabled [vw-plugin-wrapper].active {
                animation: vlibrasOpen 0.3s ease forwards;
            }
            
            @keyframes vlibrasOpen {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(styles);
    }

    initVLibrasPlayer() {
        // Alias para compatibilidade
        this.initEmbeddedVLibras();
    }

    loadVLibrasWidget() {
        // Mantido para compatibilidade
        this.initEmbeddedVLibras();
    }

    activateVLibras() {
        // Abre o widget do VLibras
        const accessButton = document.querySelector('[vw-access-button]');
        if (accessButton) {
            accessButton.click();
        }
    }

    playHugoTranslation() {
        // Usa glosa se disponível, senão usa texto original
        const textToTranslate = this.currentLibrasGlosa || this.currentOriginalText;

        if (!textToTranslate) {
            this.showToast('Nenhuma tradução disponível', 'error');
            return;
        }

        // Ativa o VLibras primeiro
        this.activateVLibras();
        this.showToast('🤟 Abrindo Hugo...', 'info');

        // Aguarda o VLibras abrir e então envia o texto
        setTimeout(() => {
            this.sendTextToVLibras(textToTranslate);
        }, 800);
    }

    sendTextToVLibras(text) {
        // Tenta encontrar o campo de texto do VLibras
        const vlibrasWrapper = document.querySelector('[vw-plugin-wrapper]');

        if (!vlibrasWrapper) {
            // VLibras não carregou ainda, mostra instrução simples
            this.showToast('🤟 Aguarde o VLibras carregar...', 'info');
            return;
        }

        // Busca o textarea do VLibras
        const textInputs = vlibrasWrapper.querySelectorAll('textarea, input[type="text"], .vw-text-input');
        let textArea = null;

        for (const input of textInputs) {
            if (input.offsetParent !== null) { // Visível
                textArea = input;
                break;
            }
        }

        if (textArea) {
            // Insere o texto
            textArea.value = text;
            textArea.dispatchEvent(new Event('input', { bubbles: true }));
            textArea.dispatchEvent(new Event('change', { bubbles: true }));

            // Tenta clicar no botão de traduzir
            setTimeout(() => {
                const buttons = vlibrasWrapper.querySelectorAll('button');
                for (const btn of buttons) {
                    const btnText = btn.textContent?.toLowerCase() || '';
                    if (btnText.includes('traduzir') || btnText.includes('play') || btn.type === 'submit') {
                        btn.click();
                        this.showToast('🤟 Hugo está traduzindo!', 'success');
                        return;
                    }
                }
                // Se não encontrou botão específico, tenta o primeiro botão
                if (buttons.length > 0) {
                    buttons[0].click();
                    this.showToast('🤟 Hugo está traduzindo!', 'success');
                }
            }, 300);
        } else {
            // Aguarda mais um pouco e tenta novamente
            this.showToast('🤟 Insira o texto no campo do VLibras', 'info');
        }
    }

    translateWithVLibras(text) {
        // Método alternativo - salva o texto para uso posterior
        this.currentLibrasGlosa = text;
    }

    injectLibrasStyles() {
        if (document.getElementById('inclua-libras-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'inclua-libras-styles';
        styles.textContent = `
            .libras-player-container {
                position: fixed;
                bottom: 100px;
                right: 24px;
                width: 400px;
                background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                z-index: 999998;
                font-family: 'Inter', system-ui, sans-serif;
                overflow: hidden;
                animation: librasSlideIn 0.3s ease;
            }

            @keyframes librasSlideIn {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .libras-player-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 18px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }

            .libras-player-title { font-size: 15px; font-weight: 600; }

            .libras-player-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 26px;
                height: 26px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 13px;
                transition: background 0.2s;
            }

            .libras-player-close:hover { background: rgba(255, 255, 255, 0.35); }

            .libras-player-content { padding: 14px; }

            .libras-original-text {
                background: rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 10px 14px;
                margin-bottom: 12px;
                color: #e2e8f0;
                font-size: 13px;
                line-height: 1.5;
                max-height: 80px;
                overflow-y: auto;
            }

            .libras-original-text::before {
                content: "📄 Texto original: ";
                font-weight: 600;
                color: #94a3b8;
            }

            .libras-glosa-container {
                margin-bottom: 12px;
            }

            .libras-glosa-label {
                color: #64748b;
                font-size: 12px;
                margin-bottom: 6px;
                font-weight: 500;
            }

            .libras-glosa-text {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
                border: 2px solid rgba(16, 185, 129, 0.4);
                border-radius: 12px;
                padding: 16px;
                color: #34d399;
                font-size: 18px;
                font-weight: 700;
                text-align: center;
                letter-spacing: 2px;
                min-height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                word-break: break-word;
                text-transform: uppercase;
            }

            .libras-hugo-container {
                background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 12px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }

            .hugo-avatar-image {
                width: 200px;
                height: 200px;
                border-radius: 16px;
                object-fit: cover;
                box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
                border: 3px solid #10b981;
                animation: hugoPulse 3s ease-in-out infinite;
            }

            @keyframes hugoPulse {
                0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3); }
                50% { transform: scale(1.02); box-shadow: 0 12px 32px rgba(16, 185, 129, 0.5); }
            }

            .hugo-status {
                color: #94a3b8;
                font-size: 12px;
                font-style: italic;
                text-align: center;
            }

            .hugo-avatar-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 80px;
            }

            .hugo-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                color: #94a3b8;
            }

            .hugo-loading-avatar {
                font-size: 48px;
                animation: hugoPulseOld 2s ease-in-out infinite;
            }

            @keyframes hugoPulseOld {
                0%, 100% { transform: scale(1); opacity: 0.7; }
                50% { transform: scale(1.1); opacity: 1; }
            }

            .hugo-instruction {
                color: #64748b;
                font-size: 12px;
                line-height: 1.4;
            }

            .hugo-instruction strong {
                color: #10b981;
            }

            .hugo-ready, .hugo-fallback {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                color: #e2e8f0;
                padding: 10px;
            }

            .hugo-ready .hugo-icon {
                font-size: 48px;
                animation: hugoReady 1s ease;
            }

            .hugo-fallback .hugo-icon {
                font-size: 40px;
                opacity: 0.6;
            }

            @keyframes hugoReady {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
            }

            .hugo-ready span, .hugo-fallback span {
                font-size: 12px;
                color: #94a3b8;
                text-align: center;
            }

            .libras-player-actions {
                display: flex;
                gap: 10px;
                margin-top: 12px;
            }

            .libras-player-actions .btn {
                flex: 1;
                padding: 12px 16px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }

            .libras-player-actions .btn-primary {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }

            .libras-player-actions .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
            }

            .libras-player-actions .btn-full {
                width: 100%;
            }

            .libras-player-actions .btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: #e2e8f0;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .libras-player-actions .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            .libras-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                padding: 16px;
                color: #94a3b8;
            }

            .libras-loading-spinner {
                width: 36px;
                height: 36px;
                border: 3px solid rgba(16, 185, 129, 0.2);
                border-top-color: #10b981;
                border-radius: 50%;
                animation: librasSpin 1s linear infinite;
            }

            @keyframes librasSpin { to { transform: rotate(360deg); } }

            .inclua-libras-active {
                outline: 3px solid #10b981 !important;
                background-color: rgba(16, 185, 129, 0.12) !important;
                transition: all 0.2s ease !important;
                border-radius: 4px;
            }

            /* Esconder o botão azul do VLibras quando nosso player estiver ativo */
            .libras-player-container[style*="block"] ~ [vw] [vw-access-button] {
                opacity: 0.3;
            }
        `;
        document.head.appendChild(styles);
    }

    async handleLibrasHover(e) {
        if (this.activeModal || e.target.closest('#inclua-ai-widget') || e.target.closest('#inclua-libras-player')) return;

        const inlineTags = ['A', 'B', 'STRONG', 'I', 'EM', 'SPAN', 'LABEL', 'BUTTON'];
        let target = e.target;

        if (inlineTags.includes(target.tagName)) {
            target = target.parentElement || target;
        }

        const text = target.innerText ? target.innerText.trim() : '';

        if (text.length >= 5 && text.length < 500) {
            if (this.currentLibrasTarget === target) return;

            clearTimeout(this.librasHoverTimeout);
            this.librasHoverTimeout = setTimeout(async () => {
                this.highlightLibrasElement(target);
                this.currentLibrasTarget = target;
                this.showLoading('libras-translation', '🤟 Traduzindo para Libras...');
                this.showLibrasLoading(text);

                try {
                    const response = await this.fetchWithRetry(`${this.getApiBaseUrl()}/convert-to-libras`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text })
                    });

                    this.hideLoading('libras-translation');

                    if (response.ok) {
                        const data = await response.json();
                        this.currentLibrasGlosa = data.librasText;
                        this.currentOriginalText = text;
                        this.displayLibrasResult(text, data.librasText);
                    } else {
                        // API falhou - usar texto original
                        this.currentLibrasGlosa = null;
                        this.currentOriginalText = text;
                        this.displayLibrasResult(text, text.toUpperCase() + ' (texto original)');
                    }
                } catch (error) {
                    console.error('Erro ao processar Libras:', error);
                    this.hideLoading('libras-translation');
                    // API falhou - usar texto original
                    this.currentLibrasGlosa = null;
                    this.currentOriginalText = text;
                    this.displayLibrasResult(text, text.toUpperCase() + ' (texto original)');
                }
            }, 800);
        }
    }

    handleLibrasHoverOut(e) {
        if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('#inclua-libras-player')) return;
        clearTimeout(this.librasHoverTimeout);
    }

    highlightLibrasElement(el) {
        this.removeLibrasHighlight();
        this.currentLibrasHighlighted = el;
        el.classList.add('inclua-libras-active');
    }

    removeLibrasHighlight() {
        if (this.currentLibrasHighlighted) {
            this.currentLibrasHighlighted.classList.remove('inclua-libras-active');
            this.currentLibrasHighlighted = null;
        }
        this.currentLibrasTarget = null;
    }

    showLibrasLoading(originalText) {
        const player = document.getElementById('inclua-libras-player');
        if (!player) return;

        player.style.display = 'block';

        const originalEl = document.getElementById('libras-original-text');
        const glosaEl = document.getElementById('libras-glosa-text');

        if (originalEl) originalEl.textContent = originalText;
        if (glosaEl) {
            glosaEl.innerHTML = `
                <div class="libras-loading">
                    <div class="libras-loading-spinner"></div>
                    <span>Convertendo...</span>
                </div>
            `;
        }
    }

    displayLibrasResult(originalText, glosa) {
        const player = document.getElementById('inclua-libras-player');
        if (!player) return;

        player.style.display = 'block';
        this.currentLibrasGlosa = glosa;

        const originalEl = document.getElementById('libras-original-text');
        const glosaEl = document.getElementById('libras-glosa-text');
        const hugoContainer = document.getElementById('hugo-avatar-wrapper');

        if (originalEl) originalEl.textContent = originalText;
        if (glosaEl) glosaEl.textContent = glosa;

        // Atualiza container do Hugo com instruções
        if (hugoContainer) {
            hugoContainer.innerHTML = `
                <div class="hugo-loading-avatar">🧏</div>
                <div class="hugo-instruction">
                    Clique em <strong>"Ver em Libras"</strong> para ver o Hugo traduzindo!
                </div>
            `;
        }
    }

    hideLibrasPlayer() {
        const player = document.getElementById('inclua-libras-player');
        if (player) player.style.display = 'none';
        this.removeLibrasHighlight();
    }

    copyLibrasText() {
        if (this.currentLibrasGlosa) {
            navigator.clipboard.writeText(this.currentLibrasGlosa)
                .then(() => this.showToast('Glosa copiada! Cole no VLibras acima.', 'success'))
                .catch(() => this.showToast('Erro ao copiar', 'error'));
        }
    }

    // ==========================================================================
    // MODAL SYSTEM
    // ==========================================================================

    showModal(title, content, isHtml = true) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-header">
                    <h3 class="modal-title" id="modal-title">${title}</h3>
                    <button class="modal-close" aria-label="Fechar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="modal-content">
                    ${isHtml ? content : `<p>${content}</p>`}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.activeModal = overlay;

        // Fechar modal
        const closeBtn = overlay.querySelector('.modal-close');
        const close = () => {
            speechSynthesis.cancel();
            if (this.currentSpeech) this.currentSpeech = null;

            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
            this.activeModal = null;
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // Trap focus no modal
        this.trapFocus(overlay.querySelector('.modal'));
    }

    // ==========================================================================
    // ACTIONS HELPERS (Copy, Play, etc)
    // ==========================================================================

    copyDescription(btn) {
        const text = btn.dataset.description;
        navigator.clipboard.writeText(text).then(() => this.showToast('Copiado!', 'success'));
    }

    playDescription(btn) {
        const text = btn.dataset.description;
        this.speak(text);
    }

    copySummary(btn) {
        const text = btn.dataset.summary;
        navigator.clipboard.writeText(text).then(() => this.showToast('Copiado!', 'success'));
    }

    playSummary(btn) {
        const text = btn.dataset.summary;
        this.speak(text);
    }

    copyDidacticSummary(btn) {
        const text = btn.dataset.didactic;
        navigator.clipboard.writeText(text).then(() => this.showToast('Copiado!', 'success'));
    }

    playDidacticSummary(btn) {
        const text = btn.dataset.didactic;
        this.speak(text);
    }

    speak(text) {
        if (this.currentSpeech) {
            speechSynthesis.cancel();
            this.currentSpeech = null;
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.onend = () => { this.currentSpeech = null; };
        this.currentSpeech = utterance;
        speechSynthesis.speak(utterance);
    }

    // ==========================================================================
    // SETTINGS MANAGEMENT
    // ==========================================================================

    loadSettings() {
        const saved = localStorage.getItem('inclua-ai-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            this.applySettings();
        }
    }

    saveSettings() {
        localStorage.setItem('inclua-ai-settings', JSON.stringify(this.settings));
    }

    applySettings() {
        if (this.settings.fontSize !== 0) {
            const percentage = 100 + (this.settings.fontSize * 20);
            document.documentElement.style.fontSize = `${percentage}%`;
        }

        if (this.settings.colorFilter !== 'none') {
            this.applyColorblindFilter(this.settings.colorFilter);
        }
    }

    applyColorblindFilter(type) {
        this.settings.colorFilter = type;
        document.documentElement.className = document.documentElement.className.replace(/filter-\w+/g, '');
        if (type !== 'none') {
            document.documentElement.classList.add(`filter-${type}`);
        }
        this.saveSettings();
    }

    injectSVGFilters() {
        const filters = `
            <svg style="display: none">
                <defs>
                    <filter id="protanopia"><feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0"/></filter>
                    <filter id="deuteranopia"><feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0"/></filter>
                    <filter id="tritanopia"><feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0 0, 0.433, 0.567, 0, 0 0, 0.475, 0.525, 0, 0 0, 0, 0, 1, 0"/></filter>
                    <filter id="achromatopsia"><feColorMatrix type="matrix" values="0.299, 0.587, 0.114, 0, 0 0.299, 0.587, 0.114, 0, 0 0.299, 0.587, 0.114, 0, 0 0, 0, 0, 1, 0"/></filter>
                </defs>
            </svg>
            <style>
                .filter-protanopia { filter: url(#protanopia); }
                .filter-deuteranopia { filter: url(#deuteranopia); }
                .filter-tritanopia { filter: url(#tritanopia); }
                .filter-achromatopsia { filter: url(#achromatopsia); }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', filters);
    }

    setupVoices() {
        // Carrega vozes disponíveis
        speechSynthesis.onvoiceschanged = () => {
            const voices = speechSynthesis.getVoices();
            // Lógica de seleção de voz pode ser expandida aqui
        };
    }

    injectCategoryStyles() {
        // Tenta remover estilo antigo se existir para limpar cache
        const oldStyle = document.getElementById('inclua-category-styles');
        if (oldStyle) oldStyle.remove();

        if (document.getElementById('inclua-category-styles-v2')) return;

        const styles = document.createElement('style');
        styles.id = 'inclua-category-styles-v2';
        styles.textContent = `
            /* Layout do Painel Melhorado */
            .panel-content {
                padding: 16px !important;
                overflow-y: auto;
                max-height: 70vh;
            }

            /* Categorias de Acessibilidade */
            .acess-category {
                margin-bottom: 24px;
                animation: categoryFadeIn 0.4s ease forwards;
            }

            @keyframes categoryFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .category-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 2px solid var(--category-color);
            }

            .category-icon {
                font-size: 24px;
            }

            .category-title {
                font-size: 15px;
                font-weight: 700;
                color: var(--category-color);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Grid de Cards */
            .category-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 18px;
                padding: 4px;
            }

            /* Cards de Funcionalidade - CORES SÓLIDAS & INDICADORES */
            .feature-card {
                background: linear-gradient(145deg, #374151 0%, #1f2937 100%) !important;
                border: 2px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 16px;
                padding: 16px 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 10px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                min-height: 115px;
                box-shadow: 0 6px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1);
                color: #d1d5db !important;
                opacity: 1 !important;
                visibility: visible !important;
            }

            .feature-card:hover {
                background: linear-gradient(145deg, #4b5563 0%, #374151 100%) !important;
                border-color: rgba(255, 255, 255, 0.35) !important;
                color: #ffffff !important;
                transform: translateY(-4px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
            }

            /* ESTADO ATIVO - CLARAMENTE LIGADO */
            .feature-card.active {
                background: linear-gradient(145deg, var(--category-color) 0%, color-mix(in srgb, var(--category-color) 80%, black) 100%) !important;
                border-color: rgba(255, 255, 255, 0.5) !important;
                color: white !important;
                box-shadow: 0 0 20px var(--category-color), 0 8px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3) !important;
            }

            .feature-card.active .card-icon {
                transform: scale(1.1);
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }

            .feature-card.active .card-status {
                background: white;
                color: var(--category-color);
                opacity: 1;
                transform: translateY(0);
            }

            /* Indicador ON/OFF */
            .card-status {
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                background: #475569;
                color: #94a3b8;
                padding: 2px 8px;
                border-radius: 10px;
                margin-top: 4px;
                transition: all 0.2s;
                opacity: 0.8;
            }

            .feature-card:hover .card-status {
                background: #64748b;
                color: white;
            }

            /* Checkmark flutuante */
            .active-check {
                position: absolute;
                top: -8px;
                right: -8px;
                background: white;
                color: var(--category-color);
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: bold;
                border: 2px solid var(--category-color);
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                opacity: 0;
                transform: scale(0);
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .feature-card.active .active-check {
                opacity: 1;
                transform: scale(1);
            }

            .card-icon {
                font-size: 38px;
                margin-bottom: 4px;
                display: block !important;
                transition: all 0.3s ease;
                filter: drop-shadow(0 3px 8px rgba(0,0,0,0.4));
                opacity: 0.95;
            }

            .feature-card:hover .card-icon {
                transform: scale(1.1);
                filter: drop-shadow(0 4px 12px rgba(255,255,255,0.3));
                opacity: 1;
            }

            .feature-card.active .card-icon {
                filter: drop-shadow(0 4px 12px rgba(255,255,255,0.5));
            }

            .card-label {
                font-size: 11.5px;
                font-weight: 600;
                color: inherit;
                text-align: center;
                line-height: 1.3;
                display: block !important;
            }

            .card-shortcut {
                display: none;
                text-align: center;
                line-height: 1.2;
                max-width: 100%;
                word-wrap: break-word;
            }

            .card-shortcut {
                font-size: 9px;
                color: #94a3b8;
                background: rgba(0,0,0,0.3);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-weight: 600;
                position: absolute;
                top: 4px;
                right: 4px;
            }

            .feature-card:hover .card-shortcut {
                color: var(--category-color);
                background: rgba(0,0,0,0.5);
            }

            /* Filtro de Daltonismo */
            .category-colorblind {
                margin-bottom: 20px;
                padding: 12px 16px;
                background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
                border: 2px solid rgba(168, 85, 247, 0.3);
                border-radius: 12px;
            }

            .colorblind-label {
                font-size: 13px;
                font-weight: 600;
                color: #a855f7;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .colorblind-select {
                width: 100%;
                padding: 10px 12px;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 8px;
                color: #e2e8f0;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .colorblind-select:hover {
                border-color: #a855f7;
                background: rgba(0,0,0,0.4);
            }

            .colorblind-select:focus {
                outline: 2px solid #a855f7;
                outline-offset: 2px;
            }

            .colorblind-select option {
                background: #1e293b;
                color: #e2e8f0;
            }

            /* Rodapé do Menu */
            .menu-footer {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }

            .reset-button {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
                border: 2px solid rgba(239, 68, 68, 0.4);
                border-radius: 10px;
                color:#ef4444;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .reset-button:hover {
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%);
                border-color: #ef4444;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }

            .reset-button:focus-visible {
                outline: 3px solid #ef4444 !important;
                outline-offset: 2px !important;
            }

            .reset-button span {
                font-size: 18px;
            }

            /* Animação de entrada escalonada */
            .acess-category:nth-child(1) { animation-delay: 0s; }
            .acess-category:nth-child(2) { animation-delay: 0.1s; }
            .acess-category:nth-child(3) { animation-delay: 0.2s; }
            .acess-category:nth-child(4) { animation-delay: 0.3s; }
            .acess-category:nth-child(5) { animation-delay: 0.4s; }

            /* Highlight Links Feature */
            body.inclua-highlight-links a {
                background-color: yellow !important;
                color: black !important;
                outline: 2px solid #000 !important;
                text-decoration: underline !important;
                font-weight: bold !important;
                box-shadow: 0 0 5px rgba(255, 255, 0, 0.8) !important;
            }

            /* Voice Indicator */
            #inclua-voice-indicator {
                position: fixed;
                bottom: 100px;
                left: 20px;
                background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 30px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 8px 25px rgba(236, 72, 153, 0.4);
                z-index: 999998;
                animation: voiceSlideIn 0.3s ease;
            }

            @keyframes voiceSlideIn {
                from { transform: translateX(-100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            .voice-pulse {
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
                animation: voicePulse 1s ease-in-out infinite;
            }

            @keyframes voicePulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.5; }
            }

            /* Focus Mode */
            #inclua-focus-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 99990;
                pointer-events: none;
                transition: opacity 0.3s;
            }

            body.inclua-focus-active * {
                transition: all 0.2s ease;
            }

            .focus-highlighted {
                position: relative;
                z-index: 99995 !important;
                background: white !important;
                color: black !important;
                box-shadow: 0 0 0 10px rgba(255, 255, 255, 0.3), 
                            0 0 40px rgba(255, 255, 255, 0.5),
                            0 0 80px rgba(139, 92, 246, 0.3) !important;
                border-radius: 8px !important;
                padding: 16px !important;
                margin: -8px !important;
            }

            .focus-highlighted * {
                color: black !important;
            }

            /* Responsivo */
            @media (max-width: 400px) {
                .category-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .feature-card {
                    min-height: 90px;
                }

                #inclua-voice-indicator {
                    bottom: 80px;
                    left: 10px;
                    padding: 8px 15px;
                    font-size: 12px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    injectHelpStyles() {
        if (document.getElementById('inclua-help-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'inclua-help-styles';
        styles.textContent = `
            /* Help Screen */
            .help-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .help-content {
                background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
                border-radius: 20px;
                padding: 0;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }

            .help-header {
                background: rgba(16, 185, 129, 0.1);
                padding: 20px 24px;
                border-bottom: 2px solid rgba(16, 185, 129, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .help-header h2 {
                margin: 0;
                color: #10b981;
                font-size: 24px;
                font-weight: 700;
            }

            .help-close {
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.5);
                color: #ef4444;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .help-close:hover {
                background: rgba(239, 68, 68, 0.3);
                transform: scale(1.1);
            }

            .help-close:focus {
                outline: 3px solid #10b981;
                outline-offset: 2px;
            }

            .help-body {
                padding: 24px;
                overflow-y: auto;
                max-height: calc(80vh - 80px);
            }

            .help-section {
                margin-bottom: 24px;
            }

            .help-section h3 {
                color: #e2e8f0;
                font-size: 16px;
                margin: 0 0 12px 0;
                font-weight: 600;
            }

            .help-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .help-list li {
                padding: 8px 0;
                color: #cbd5e1;
                font-size: 14px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }

            .help-list li:last-child {
                border-bottom: none;
            }

            kbd {
                background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
                border: 1px solid #475569;
                border-radius: 4px;
                padding: 2px 8px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                color: #10b981;
                font-weight: 600;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            /* Foco Visual Aprimorado */
            .feature-button:focus-visible,
            button:focus-visible,
            select:focus-visible {
                outline: 3px solid #10b981 !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.2) !important;
            }

            .feature-button:focus {
                z-index: 10;
                transform: scale(1.02);
            }

            /* Screen Reader Only */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
        `;
        document.head.appendChild(styles);
    }

    resetSettings() {
        localStorage.removeItem('inclua-ai-settings');
        location.reload();
    }

    // ==========================================================================
    // CHATBOT E CALL CENTER (SIMULAÇÃO VISUAL)
    // ==========================================================================

    openChatbot() {
        const modalHTML = `
            <div class="modal-overlay" id="chatbot-modal" role="dialog" aria-modal="true" aria-labelledby="chatbot-title">
                <div class="modal-content demo-container">
                    <div class="modal-header">
                        <h2 id="chatbot-title" class="modal-title">💬 ChatBot</h2>
                        <button class="modal-close" onclick="incluaAIWidget.closeChatbot()" aria-label="Fechar" title="Fechar">
                            ✕
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="demo-badge">🎭 Modo Demonstração</div>
                        
                        <div class="demo-preview">
                            <div class="chat-demo-window">
                                <div class="demo-message bot">
                                    <div class="demo-avatar"></div>
                                    <div class="demo-bubble">Olá! Como posso ajudar?</div>
                                </div>
                                <div class="demo-message user">
                                    <div class="demo-bubble">Preciso de ajuda com acessibilidade</div>
                                    <div class="demo-avatar">👤</div>
                                </div>
                                <div class="demo-message bot">
                                    <div class="demo-avatar"></div>
                                    <div class="demo-bubble">Posso te ajudar! Temos recursos de leitura, descrição de imagens...</div>
                                </div>
                            </div>
                            
                            <div class="demo-input-bar">
                                <div class="demo-input">Digite sua mensagem...</div>
                                <button class="demo-voice-btn">🎤</button>
                            </div>
                        </div>

                        <div class="demo-info">
                            <h3>✨ Recursos do ChatBot:</h3>
                            <ul class="demo-features-list">
                                <li>💬 Conversação natural em texto</li>
                                <li>🎤 Entrada por comando de voz</li>
                                <li>🔊 Respostas em áudio (TTS)</li>
                                <li> IA treinada em acessibilidade</li>
                                <li>📱 Disponível 24/7</li>
                            </ul>
                            <p class="demo-note">Este é um preview visual. Funcionalidade em desenvolvimento.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('chatbot-modal');
        this.activeModal = modal;
        
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeChatbot();
            }
        });
        
        requestAnimationFrame(() => {
            modal.style.display = 'flex';
            requestAnimationFrame(() => modal.style.opacity = '1');
        });

        this.trapFocus(modal);
    }

    closeChatbot() {
        const modal = document.getElementById('chatbot-modal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
            this.activeModal = null;
            this.releaseFocus();
        }
    }

    openCallCenter() {
        const modalHTML = `
            <div class="modal-overlay" id="callcenter-modal" role="dialog" aria-modal="true" aria-labelledby="callcenter-title">
                <div class="modal-content demo-container">
                    <div class="modal-header">
                        <h2 id="callcenter-title" class="modal-title">☎️ Central de Atendimento</h2>
                        <button class="modal-close" onclick="incluaAIWidget.closeCallCenter()" aria-label="Fechar" title="Fechar">
                            ✕
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="demo-badge">🎭 Modo Demonstração</div>
                        
                        <div class="demo-preview call-preview">
                            <div class="call-demo-screen">
                                <div class="call-demo-avatar pulsing">
                                    🎧
                                </div>
                                <h3>Atendente Virtual</h3>
                                <p class="call-status-text">Conectado</p>
                                <div class="call-timer-demo">02:34</div>
                                
                                <div class="call-controls-demo">
                                    <div class="call-btn-demo mute">🔇</div>
                                    <div class="call-btn-demo end">📞</div>
                                    <div class="call-btn-demo speaker">🔊</div>
                                </div>
                                
                                <div class="call-transcript-demo">
                                    <p><strong>Você:</strong> Olá, preciso de ajuda</p>
                                    <p><strong>Atendente:</strong> Olá! Como posso ajudar?</p>
                                </div>
                            </div>
                        </div>

                        <div class="demo-info">
                            <h3>✨ Recursos da Central:</h3>
                            <ul class="demo-features-list">
                                <li>☎️ Atendimento por voz em tempo real</li>
                                <li>🎯 Roteamento inteligente para departamentos</li>
                                <li>📝 Transcrição automática da conversa</li>
                                <li>🔊 Síntese de voz natural (TTS)</li>
                                <li>🌐 Suporte multilíngue</li>
                                <li>♿ Totalmente acessível</li>
                            </ul>
                            <p class="demo-note">Este é um preview visual. Funcionalidade em desenvolvimento.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('callcenter-modal');
        this.activeModal = modal;
        
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCallCenter();
            }
        });
        
        requestAnimationFrame(() => {
            modal.style.display = 'flex';
            requestAnimationFrame(() => modal.style.opacity = '1');
        });

        this.trapFocus(modal);
    }

    closeCallCenter() {
        const modal = document.getElementById('callcenter-modal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
            this.activeModal = null;
            this.releaseFocus();
        }
    }
}

// Inicialização segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.incluaAIWidget = new IncluaAIWidget());
} else {
    window.incluaAIWidget = new IncluaAIWidget();
}
