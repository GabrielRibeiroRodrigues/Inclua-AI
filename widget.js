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
            { id: 'font-increase', emoji: '🔼', title: 'Aumentar Fonte', desc: 'Torna o texto maior' },
            { id: 'font-decrease', emoji: '🔽', title: 'Diminuir Fonte', desc: 'Reduz o tamanho do texto' },
            { id: 'highlight-links', emoji: '🔗', title: 'Destacar Links', desc: 'Identificar links' }
        ])}

            ${this.createSection('Assistente de Leitura', [
            { id: 'text-reader', emoji: '🔊', title: 'Leitor de Texto', desc: 'Lê textos selecionados' }
        ])}

            ${this.createSection('IA para Acessibilidade', [
            { id: 'describe-image', emoji: '🖼️', title: 'Descrever Imagem', desc: 'IA descreve imagens' },
            { id: 'summarize-text', emoji: '📝', title: 'Resumir Texto', desc: 'IA resume conteúdo' }
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
                            <span class="feature-emoji">🔄</span>
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
                    ${item.emoji ? `<span class="feature-emoji">${item.emoji}</span>` : `<svg class="feature-icon" viewBox="0 0 24 24"><path d="${item.icon}"/></svg>`}
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
