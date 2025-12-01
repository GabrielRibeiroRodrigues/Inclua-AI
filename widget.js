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
            textSummarizer: false
        };

        this.settings = {
            fontSize: 0,
            darkMode: false,
            voice: '',
            colorFilter: 'none'
        };

        this.currentSpeech = null;
        this.focusTrap = null;
        this.activeModal = null;

        this.init();
    }

    init() {
        if (!this.checkBrowserCompatibility()) {
            console.error('Navegador não suportado.');
            return;
        }

        this.loadSettings();
        this.createWidget();
        this.setupEventListeners();
        this.injectSVGFilters();
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
        // Mantendo a estrutura HTML existente das seções, mas garantindo ARIA attributes nos botões
        // (O código HTML das seções é longo, vou simplificar aqui mantendo a lógica original mas com melhorias)
        return `
            ${this.createSection('Ajustes Visuais', [
            { id: 'font-increase', icon: 'M2 20H7V18H5.5L6.5 15H9.5L10.5 18H9V20H14V18H13L10 9H8L5 18H2V20M6.85 13L8 9.87L9.15 13H6.85M15 4V6H17V12H19V6H21V4H15M19 14V16H21V18H19V20H17V18H15V16H17V14H19Z', title: 'Aumentar Fonte', desc: 'Torna o texto maior' },
            { id: 'font-decrease', icon: 'M2 20H7V18H5.5L6.5 15H9.5L10.5 18H9V20H14V18H13L10 9H8L5 18H2V20M6.85 13L8 9.87L9.15 13H6.85M15 18H21V16H15V18Z', title: 'Diminuir Fonte', desc: 'Reduz o tamanho do texto' },
            { id: 'dark-mode', icon: 'M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z', title: 'Modo Escuro', desc: 'Alto contraste escuro' },
            { id: 'highlight-links', icon: 'M10.59,13.41C11,13.8 11,14.4 10.59,14.81C10.2,15.2 9.6,15.2 9.19,14.81L7.77,13.39L7.77,13.39L6.36,12L6.36,12C4.78,10.4 4.78,7.9 6.36,6.31L6.36,6.31L7.77,4.89C9.36,3.31 11.86,3.31 13.45,4.89C15.03,6.47 15.03,8.97 13.45,10.56L12.8,11.21C12.4,11.6 11.8,11.6 11.41,11.21C11,10.8 11,10.2 11.41,9.81L12.06,9.16C12.87,8.35 12.87,7.04 12.06,6.23C11.25,5.42 9.94,5.42 9.13,6.23L7.72,7.64C6.91,8.45 6.91,9.76 7.72,10.57L10.59,13.41M13.41,9.2C13.8,8.81 14.4,8.81 14.81,9.2L16.22,10.61C17.8,12.2 17.8,14.7 16.22,16.28L14.81,17.69C13.22,19.28 10.72,19.28 9.14,17.69C7.56,16.11 7.56,13.61 9.14,12.03L9.79,11.38C10.2,10.97 10.8,10.97 11.19,11.38C11.6,11.77 11.6,12.37 11.19,12.78L10.54,13.43C9.73,14.24 9.73,15.55 10.54,16.36C11.35,17.17 12.66,17.17 13.47,16.36L14.88,14.95C15.69,14.14 15.69,12.83 14.88,12.02L13.41,9.2Z', title: 'Destacar Links', desc: 'Identificar links' }
        ])}

            ${this.createSection('Assistente de Leitura', [
            { id: 'text-reader', icon: 'M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z', title: 'Leitor de Texto', desc: 'Lê textos selecionados' }
        ])}

            ${this.createSection('IA para Acessibilidade', [
            { id: 'describe-image', icon: 'M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z', title: 'Descrever Imagem', desc: 'IA descreve imagens' },
            { id: 'summarize-text', icon: 'M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z', title: 'Resumir Texto', desc: 'IA resume conteúdo' }
        ])}

            <div class="feature-section">
                <div class="section-header">Filtros para Daltonismo</div>
                <div class="feature-group">
                    <div class="form-group">
                        <label class="form-label" for="colorblind-filter">Tipo de Daltonismo:</label>
                        <select id="colorblind-filter" class="form-select">
                            <option value="none">Nenhum filtro</option>
                            <option value="protanopia">Protanopia (Vermelho-Verde)</option>
                            <option value="deuteranopia">Deuteranopia (Verde-Vermelho)</option>
                            <option value="tritanopia">Tritanopia (Azul-Amarelo)</option>
                            <option value="achromatopsia">Acromatopsia (Sem cores)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="feature-section">
                <div class="feature-group">
                    <button class="feature-button" data-action="reset-settings">
                        <div class="feature-icon-container">
                            <svg class="feature-icon" viewBox="0 0 24 24"><path d="M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.5L7,5.5L12,0.5V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z"/></svg>
                        </div>
                        <div class="feature-text">
                            <div class="feature-title">Resetar Configurações</div>
                            <div class="feature-description">Volta ao padrão</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }

    createSection(title, items) {
        const buttons = items.map(item => `
            <button class="feature-button" data-action="${item.id}">
                <div class="feature-icon-container">
                    <svg class="feature-icon" viewBox="0 0 24 24"><path d="${item.icon}"/></svg>
                </div>
                <div class="feature-text">
                    <div class="feature-title">${item.title}</div>
                    <div class="feature-description">${item.desc}</div>
                </div>
            </button>
        `).join('');

        return `
            <div class="feature-section">
                <div class="section-header">${title}</div>
                <div class="feature-group">${buttons}</div>
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
            const button = e.target.closest('.feature-button');
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
                case 'dark-mode': this.toggleDarkMode(); break;
                case 'highlight-links': this.toggleHighlightLinks(); break;
                case 'text-reader': this.toggleTextReader(); break;
                case 'describe-image': this.toggleImageDescriber(); break;
                case 'summarize-text': this.toggleTextSummarizer(); break;
                case 'reset-settings': this.resetSettings(); break;
            }
        } catch (error) {
            this.showToast('Erro ao executar ação. Tente novamente.', 'error');
        } finally {
            setTimeout(() => button.classList.remove('processing'), 500);
        }
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

    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        document.body.classList.toggle('widget-dark-mode', this.settings.darkMode);
        this.saveSettings();
        this.showToast(`Modo escuro ${this.settings.darkMode ? 'ativado' : 'desativado'}`, 'success');
    }

    toggleHighlightLinks() {
        this.features.highlightLinks = !this.features.highlightLinks;
        document.documentElement.classList.toggle('widget-highlight-links', this.features.highlightLinks);
        this.showToast(`Destaque de links ${this.features.highlightLinks ? 'ativado' : 'desativado'}`, 'success');
    }

    toggleTextReader() {
        this.features.reader = !this.features.reader;
        if (this.features.reader) {
            document.addEventListener('mouseup', this.handleTextSelection.bind(this));
            this.showToast('Selecione texto para ouvir a leitura', 'info');
        } else {
            document.removeEventListener('mouseup', this.handleTextSelection.bind(this));
            speechSynthesis.cancel();
            this.showToast('Leitor de texto desativado', 'info');
        }
    }

    handleTextSelection() {
        const text = window.getSelection().toString().trim();
        if (text.length > 0) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            speechSynthesis.speak(utterance);
        }
    }

    toggleImageDescriber() {
        this.features.imageDescriber = !this.features.imageDescriber;
        if (this.features.imageDescriber) {
            document.addEventListener('click', this.handleImageClick.bind(this));
            document.body.style.cursor = 'help';
            this.showToast('Clique em uma imagem para descrição', 'info');
        } else {
            document.removeEventListener('click', this.handleImageClick.bind(this));
            document.body.style.cursor = '';
            this.showToast('Descritor de imagens desativado', 'info');
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
        this.showToast('Analisando imagem...', 'info');
        try {
            const response = await this.fetchWithRetry(`${this.getApiBaseUrl()}/describe-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl })
            });

            if (!response.ok) throw new Error('Falha na API');
            const data = await response.json();

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

            if (!imgElement.alt) imgElement.alt = data.description;

        } catch (error) {
            this.showToast('Erro ao descrever imagem', 'error');
        }
    }

    toggleTextSummarizer() {
        this.features.textSummarizer = !this.features.textSummarizer;
        if (this.features.textSummarizer) {
            document.addEventListener('mouseup', this.handleTextSummarization.bind(this));
            this.showToast('Selecione texto para resumir', 'info');
        } else {
            document.removeEventListener('mouseup', this.handleTextSummarization.bind(this));
            this.showToast('Resumidor desativado', 'info');
        }
    }

    async handleTextSummarization() {
        const text = window.getSelection().toString().trim();
        if (text.length >= 50) {
            this.showToast('Gerando resumo...', 'info');
            try {
                const response = await this.fetchWithRetry(`${this.getApiBaseUrl()}/summarize-text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ textToSummarize: text })
                });

                if (!response.ok) throw new Error('Falha na API');
                const data = await response.json();

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
            } catch (error) {
                this.showToast('Erro ao resumir texto', 'error');
            }
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
        if (this.settings.darkMode) {
            document.body.classList.add('widget-dark-mode');
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

    resetSettings() {
        localStorage.removeItem('inclua-ai-settings');
        location.reload();
    }
}

// Inicialização segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.incluaAIWidget = new IncluaAIWidget());
} else {
    window.incluaAIWidget = new IncluaAIWidget();
}
