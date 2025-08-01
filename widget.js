/**
 * INCLUA-AI WIDGET - VERSÃO AVANÇADA
 * Sistema completo de acessibilidade com IA
 * Desenvolvido para máxima usabilidade e inclusão
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
        
        this.init();
    }

    init() {
        // Verificar compatibilidade do navegador
        if (!this.checkBrowserCompatibility()) {
            this.showAlert('Navegador não suportado. Use uma versão mais recente do Chrome, Firefox, Safari ou Edge.', 'error');
            return;
        }
        
        this.loadSettings();
        this.createWidget();
        this.setupEventListeners();
        this.injectSVGFilters();
        this.setupVoices();
        this.checkApiHealth();
        this.setupErrorHandling();
    }

    // Verificação de compatibilidade do navegador
    checkBrowserCompatibility() {
        // Verificar APIs essenciais
        const requiredAPIs = [
            'fetch',
            'AbortController',
            'speechSynthesis',
            'localStorage',
            'addEventListener'
        ];

        for (const api of requiredAPIs) {
            if (!(api in window)) {
                console.error(`API não suportada: ${api}`);
                return false;
            }
        }

        // Verificar suporte a ES6
        try {
            eval('const test = () => {}');
            eval('class Test {}');
        } catch (e) {
            console.error('Navegador não suporta ES6');
            return false;
        }

        return true;
    }

    // Configuração de tratamento de erros global
    setupErrorHandling() {
        // Capturar erros JavaScript não tratados
        window.addEventListener('error', (event) => {
            console.error('Erro JavaScript:', event.error);
            this.showAlert('Ocorreu um erro inesperado. Algumas funcionalidades podem não funcionar corretamente.', 'error');
        });

        // Capturar promises rejeitadas não tratadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejeitada:', event.reason);
            this.showAlert('Erro de conectividade. Verifique sua conexão com a internet.', 'error');
        });
    }

    // Verificação de saúde da API
    async checkApiHealth() {
        try {
            const response = await this.fetchWithTimeout(`${this.getApiBaseUrl()}/health`, {
                method: 'GET'
            }, 5000);
            
            if (response.ok) {
                const health = await response.json();
                console.log('✅ API Status:', health.status);
                this.updateStatusBadge('online');
            } else {
                throw new Error(`API retornou status ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ API offline ou inacessível:', error.message);
            this.updateStatusBadge('offline');
        }
    }

    // Atualizar badge de status
    updateStatusBadge(status) {
        const badge = document.querySelector('.status-badge');
        if (badge) {
            badge.textContent = status === 'online' ? '🟢 Online' : '🔴 Offline';
            badge.className = `status-badge ${status}`;
        }
    }

    // Função helper para fetch com timeout otimizado
    async fetchWithTimeout(url, options = {}, timeout = 15000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Tempo limite da requisição excedido. Tente novamente.');
            }
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Erro de conectividade. Verifique sua conexão com a internet.');
            }
            throw error;
        }
    }

    // Função para detectar URL da API
    getApiBaseUrl() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        return 'https://inclua-ai-servidor.onrender.com';
    }

    // Criação da interface do widget
    createWidget() {
        const widgetHTML = `
            <div id="inclua-ai-widget">
                <button id="inclua-ai-toggle" aria-label="Abrir assistente de acessibilidade">
                    <svg id="inclua-ai-toggle-icon" viewBox="0 0 24 24">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 11.8 12.8 14 10 14C7.2 14 5 11.8 5 9V7L3 7V9C3 12.9 6.1 16 10 16V18H8V20H16V18H14V16C17.9 16 21 12.9 21 9Z"/>
                    </svg>
                </button>
                <div id="inclua-ai-panel">
                    <div class="panel-header">
                        <h2>Inclua-AI</h2>
                        <p>Assistente de Acessibilidade Inteligente</p>
                        <div class="status-badge"></div>
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
            <!-- SEÇÃO: Ajustes Visuais -->
            <div class="feature-section">
                <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24">
                        <path d="M12 9C13.38 9 14.5 10.12 14.5 11.5S13.38 14 12 14S9.5 12.88 9.5 11.5S10.62 9 12 9M12 7C9.52 7 7.5 9.02 7.5 11.5S9.52 16 12 16S16.5 13.98 16.5 11.5S14.48 7 12 7M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                    </svg>
                    Ajustes Visuais
                </div>
                <div class="feature-group">
                    <button class="feature-button" data-action="font-increase">
                        <svg class="feature-icon" viewBox="0 0 24 24">
                            <path d="M2 20H7V18H5.5L6.5 15H9.5L10.5 18H9V20H14V18H13L10 9H8L5 18H2V20M6.85 13L8 9.87L9.15 13H6.85M15 4V6H17V12H19V6H21V4H15M19 14V16H21V18H19V20H17V18H15V16H17V14H19Z"/>
                        </svg>
                        <div class="feature-text">
                            <div class="feature-title">Aumentar Fonte</div>
                            <div class="feature-description">Torna o texto maior para facilitar leitura</div>
                        </div>
                    </button>
                    <button class="feature-button" data-action="font-decrease">
                        <svg class="feature-icon" viewBox="0 0 24 24">
                            <path d="M2 20H7V18H5.5L6.5 15H9.5L10.5 18H9V20H14V18H13L10 9H8L5 18H2V20M6.85 13L8 9.87L9.15 13H6.85M15 18H21V16H15V18Z"/>
                        </svg>
                        <div class="feature-text">
                            <div class="feature-title">Diminuir Fonte</div>
                            <div class="feature-description">Reduz o tamanho do texto</div>
                        </div>
                    </button>
                    <button class="feature-button" data-action="dark-mode">
                        <svg class="feature-icon" viewBox="0 0 24 24">
                            <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z"/>
                        </svg>
                        <div class="feature-text">
                            <div class="feature-title">Modo Escuro</div>
                            <div class="feature-description">Ativa tema escuro para reduzir cansaço visual</div>
                        </div>
                    </button>
                    <button class="feature-button" data-action="highlight-links">
                        <svg class="feature-icon" viewBox="0 0 24 24">
                            <path d="M10.59,13.41C11,13.8 11,14.4 10.59,14.81C10.2,15.2 9.6,15.2 9.19,14.81L7.77,13.39L7.77,13.39L6.36,12L6.36,12C4.78,10.4 4.78,7.9 6.36,6.31L6.36,6.31L7.77,4.89C9.36,3.31 11.86,3.31 13.45,4.89C15.03,6.47 15.03,8.97 13.45,10.56L12.8,11.21C12.4,11.6 11.8,11.6 11.41,11.21C11,10.8 11,10.2 11.41,9.81L12.06,9.16C12.87,8.35 12.87,7.04 12.06,6.23C11.25,5.42 9.94,5.42 9.13,6.23L7.72,7.64C6.91,8.45 6.91,9.76 7.72,10.57L10.59,13.41M13.41,9.2C13.8,8.81 14.4,8.81 14.81,9.2L16.22,10.61C17.8,12.2 17.8,14.7 16.22,16.28L14.81,17.69C13.22,19.28 10.72,19.28 9.14,17.69C7.56,16.11 7.56,13.61 9.14,12.03L9.79,11.38C10.2,10.97 10.8,10.97 11.19,11.38C11.6,11.77 11.6,12.37 11.19,12.78L10.54,13.43C9.73,14.24 9.73,15.55 10.54,16.36C11.35,17.17 12.66,17.17 13.47,16.36L14.88,14.95C15.69,14.14 15.69,12.83 14.88,12.02L13.41,9.2Z"/>
                        </svg>
                        <div class="feature-text">
                            <div class="feature-title">Destacar Links</div>
                            <div class="feature-description">Destaca todos os links da página</div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- SEÇÃO: Assistente de Leitura -->
            <div class="feature-section">
                <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24">
                        <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                    </svg>
                    Assistente de Leitura
                </div>
                <div class="feature-group">
                    <button class="feature-button" data-action="text-reader">
                        <svg class="feature-icon" viewBox="0 0 24 24">
                            <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                        </svg>
                        <div class="feature-text">
                            <div class="feature-title">Leitor de Texto</div>
                            <div class="feature-description">Lê textos selecionados em voz alta</div>
                        </div>
                    </button>
                    <button class="feature-button disabled" data-action="libras-interpreter">
                        <svg class="feature-icon" viewBox="0 0 24 24">
                            <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M21,9V7L15,7V9A5,5 0 0,1 10,14A5,5 0 0,1 5,9V7L3,7V9A7,7 0 0,0 10,16V18H8V20H16V18H14V16A7,7 0 0,0 21,9M12,8L14,10L12,12L10,10L12,8Z"/>
                        </svg>
                        <div class="feature-text">
                            <div class="feature-title">Intérprete de Libras 3D</div>
                            <div class="feature-description">Avatar 3D para tradução em Libras</div>
                            <div class="development-badge">Em desenvolvimento</div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- SEÇÃO: IA para Acessibilidade -->
            <div class="feature-section">
                <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24">
                        <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
                    </svg>
                    IA para Acessibilidade
                    <span class="new-badge">Novo</span>
                </div>
                <div class="feature-group">
                    <button class="feature-button" data-action="describe-image">
                        <svg class="feature-icon" viewBox="0 0 24 24">
                            <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
                        </svg>
                        <div class="feature-text">
                            <div class="feature-title">Descrever Imagem</div>
                            <div class="feature-description">Clique em imagens para descrição detalhada</div>
                        </div>
                    </button>
                    <button class="feature-button" data-action="summarize-text">
                        <svg class="feature-icon" viewBox="0 0 24 24">
                            <path d="M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z"/>
                        </svg>
                        <div class="feature-text">
                            <div class="feature-title">Resumir Texto</div>
                            <div class="feature-description">Selecione texto para resumo inteligente</div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- SEÇÃO: Filtros Visuais -->
            <div class="feature-section">
                <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24">
                        <path d="M12,18.5A6.5,6.5 0 0,1 5.5,12A6.5,6.5 0 0,1 12,5.5A6.5,6.5 0 0,1 18.5,12A6.5,6.5 0 0,1 12,18.5M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7Z"/>
                    </svg>
                    Filtros para Daltonismo
                </div>
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

            <!-- SEÇÃO: Configurações -->
            <div class="feature-section">
                <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24">
                        <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                    </svg>
                    Configurações
                </div>
                <div class="feature-group">
                    <button class="feature-button" data-action="reset-settings">
                        <svg class="feature-icon" viewBox="0 0 24 24">
                            <path d="M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.5L7,5.5L12,0.5V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z"/>
                        </svg>
                        <div class="feature-text">
                            <div class="feature-title">Resetar Configurações</div>
                            <div class="feature-description">Volta às configurações padrão</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const toggle = document.getElementById('inclua-ai-toggle');
        const panel = document.getElementById('inclua-ai-panel');
        
        toggle.addEventListener('click', () => {
            this.isActive = !this.isActive;
            panel.classList.toggle('show', this.isActive);
            toggle.classList.toggle('active', this.isActive);
        });

        // Event delegation para todos os botões
        panel.addEventListener('click', (e) => {
            const button = e.target.closest('.feature-button');
            if (button) {
                const action = button.dataset.action;
                this.handleAction(action, button);
            }
        });

        // Event listener para filtro de daltonismo
        const colorblindFilter = document.getElementById('colorblind-filter');
        if (colorblindFilter) {
            colorblindFilter.addEventListener('change', (e) => {
                this.applyColorblindFilter(e.target.value);
            });
        }

        // Fechar painel ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#inclua-ai-widget')) {
                this.isActive = false;
                panel.classList.remove('show');
                toggle.classList.remove('active');
            }
        });
    }

    async handleAction(action, button) {
        button.classList.add('processing');
        
        try {
            switch (action) {
                case 'font-increase':
                    this.adjustFontSize(1);
                    break;
                case 'font-decrease':
                    this.adjustFontSize(-1);
                    break;
                case 'dark-mode':
                    this.toggleDarkMode();
                    break;
                case 'highlight-links':
                    this.toggleHighlightLinks();
                    break;
                case 'text-reader':
                    this.toggleTextReader();
                    break;
                case 'describe-image':
                    this.toggleImageDescriber();
                    break;
                case 'summarize-text':
                    this.toggleTextSummarizer();
                    break;
                case 'reset-settings':
                    this.resetSettings();
                    break;
                case 'libras-interpreter':
                    this.showLibrasInDevelopment();
                    break;
            }
        } catch (error) {
            console.error('Erro ao executar ação:', error);
            
            // Mensagens de erro mais específicas
            let errorMessage = 'Erro ao executar funcionalidade.';
            
            if (error.message.includes('Tempo limite')) {
                errorMessage = 'A operação demorou muito para responder. Tente novamente.';
            } else if (error.message.includes('conectividade') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
            } else if (error.message.includes('404')) {
                errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
            } else if (error.message.includes('429')) {
                errorMessage = 'Muitas requisições. Aguarde um momento antes de tentar novamente.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Erro interno do servidor. Nossa equipe foi notificada.';
            }
            
            this.showAlert(errorMessage, 'error');
        } finally {
            setTimeout(() => {
                button.classList.remove('processing');
            }, 500);
        }
    }

    // Funcionalidades principais
    adjustFontSize(delta) {
        this.settings.fontSize = Math.max(-2, Math.min(5, this.settings.fontSize + delta));
        const percentage = 100 + (this.settings.fontSize * 20);
        document.documentElement.style.fontSize = `${percentage}%`;
        this.saveSettings();
        this.showAlert(`Tamanho da fonte: ${percentage}%`, 'success');
    }

    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        document.body.classList.toggle('widget-dark-mode', this.settings.darkMode);
        this.saveSettings();
        this.showAlert(`Modo escuro ${this.settings.darkMode ? 'ativado' : 'desativado'}`, 'success');
    }

    toggleHighlightLinks() {
        this.features.highlightLinks = !this.features.highlightLinks;
        document.documentElement.classList.toggle('widget-highlight-links', this.features.highlightLinks);
        this.showAlert(`Destaque de links ${this.features.highlightLinks ? 'ativado' : 'desativado'}`, 'success');
    }

    toggleTextReader() {
        this.features.reader = !this.features.reader;
        
        if (this.features.reader) {
            document.addEventListener('mouseup', this.handleTextSelection.bind(this));
            this.showAlert('Selecione texto para ouvir a leitura', 'success');
        } else {
            document.removeEventListener('mouseup', this.handleTextSelection.bind(this));
            speechSynthesis.cancel();
            this.showAlert('Leitor de texto desativado', 'success');
        }
    }

    handleTextSelection() {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
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
            document.body.style.cursor = 'crosshair';
            this.showAlert('Clique em uma imagem para descrição', 'success');
        } else {
            document.removeEventListener('click', this.handleImageClick.bind(this));
            document.body.style.cursor = '';
            this.showAlert('Descritor de imagens desativado', 'success');
        }
    }

    async handleImageClick(e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            e.stopPropagation();
            
            const img = e.target;
            const imageUrl = img.src;
            
            if (imageUrl && this.isValidImageUrl(imageUrl)) {
                await this.describeImage(imageUrl, img);
            } else {
                this.showAlert('URL da imagem inválida ou não suportada', 'error');
            }
        }
    }

    // Validação robusta de URL de imagem
    isValidImageUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Verificar protocolo seguro
            if (!['http:', 'https:', 'data:'].includes(urlObj.protocol)) {
                return false;
            }
            
            // Para data URLs, verificar se é imagem
            if (urlObj.protocol === 'data:') {
                return url.startsWith('data:image/');
            }
            
            // Verificar extensões de imagem comuns
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
            const pathname = urlObj.pathname.toLowerCase();
            
            return validExtensions.some(ext => pathname.includes(ext)) || 
                   pathname.includes('image') || 
                   urlObj.search.includes('image') ||
                   !pathname.includes('.') || // URLs sem extensão (podem ser APIs de imagem)
                   pathname.endsWith('/'); // URLs de diretório
        } catch {
            return false;
        }
    }

    async describeImage(imageUrl, imgElement) {
        try {
            this.showModal('Analisando Imagem', 'Gerando descrição inteligente...', true);
            
            const response = await this.fetchWithTimeout(`${this.getApiBaseUrl()}/describe-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            this.showModal('🖼️ Descrição Inteligente', `
                <div class="description-container">
                    <div class="description-header">
                        <div class="description-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                        </div>
                        <div class="description-meta">
                            <h3>Análise Visual Completa</h3>
                            <span class="image-stats">Descrição gerada por IA</span>
                        </div>
                    </div>
                    
                    <div class="description-content">
                        <div class="description-text">
                            ${data.description}
                        </div>
                        
                        <div class="description-actions">
                            <button onclick="window.incluaAIWidget.copyDescription(this)" 
                                    data-description="${data.description.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"
                                    class="action-btn primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="m5 15-4-4 4-4"/>
                                </svg>
                                Copiar Descrição
                            </button>
                            <button onclick="window.incluaAIWidget.playDescription(this)" 
                                    data-description="${data.description.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"
                                    class="action-btn secondary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                    <path d="m19.07 4.93-1.41 1.41A10 10 0 0 1 23 12a10 10 0 0 1-5.34 8.66L19.07 21.07"/>
                                </svg>
                                Ouvir Descrição
                            </button>
                        </div>
                    </div>
                </div>
                
                <style>
                .description-container {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .description-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    padding: 20px;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    border-radius: 12px;
                    color: white;
                }
                
                .description-icon {
                    background: rgba(255,255,255,0.2);
                    padding: 12px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .description-meta h3 {
                    margin: 0 0 4px 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .image-stats {
                    font-size: 13px;
                    opacity: 0.9;
                    font-weight: 400;
                }
                
                .description-content {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 24px;
                    border: 1px solid #e2e8f0;
                }
                
                .description-text {
                    font-size: 16px;
                    line-height: 1.7;
                    color: #2d3748;
                    margin-bottom: 24px;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    border-left: 4px solid #4f46e5;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .description-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                
                /* Dark mode para descrição */
                .widget-dark-mode .description-content {
                    background: #2d3748 !important;
                    border-color: #4a5568 !important;
                }
                
                .widget-dark-mode .description-text {
                    background: #1a202c !important;
                    color: #e2e8f0 !important;
                    border-left-color: #5b21b6 !important;
                }
                </style>
            `, false);
            
            // Adiciona alt-text à imagem se não existir
            if (!imgElement.alt || imgElement.alt.trim() === '') {
                imgElement.alt = data.description;
                imgElement.title = data.description;
            }
            
        } catch (error) {
            console.error('Erro ao descrever imagem:', error);
            this.showModal('Erro', 'Não foi possível gerar a descrição da imagem.', false);
        }
    }

    toggleTextSummarizer() {
        this.features.textSummarizer = !this.features.textSummarizer;
        
        if (this.features.textSummarizer) {
            document.addEventListener('mouseup', this.handleTextSummarization.bind(this));
            this.showAlert('Selecione texto para resumir (mínimo 50 caracteres)', 'success');
        } else {
            document.removeEventListener('mouseup', this.handleTextSummarization.bind(this));
            this.showAlert('Resumidor de texto desativado', 'success');
        }
    }

    async handleTextSummarization() {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text.length >= 50) {
            await this.summarizeText(text);
        } else if (text.length > 0) {
            this.showAlert('Selecione pelo menos 50 caracteres para resumir', 'warning');
        }
    }

    async summarizeText(text) {
        try {
            this.showModal('Resumindo Texto', 'Criando resumo inteligente...', true);
            
            const response = await this.fetchWithTimeout(`${this.getApiBaseUrl()}/summarize-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ textToSummarize: text })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            this.showModal('📄 Resumo Inteligente', `
                <div class="summary-container">
                    <div class="summary-header">
                        <div class="summary-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10,9 9,9 8,9"/>
                            </svg>
                        </div>
                        <div class="summary-meta">
                            <h3>Resumo Gerado</h3>
                            <span class="text-stats">${text.length} caracteres → Resumo conciso</span>
                        </div>
                    </div>
                    
                    <div class="summary-content">
                        <div class="summary-text">
                            ${data.summarizedText}
                        </div>
                        
                        <div class="summary-actions">
                            <button onclick="window.incluaAIWidget.copySummary(this)" 
                                    data-summary="${data.summarizedText.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"
                                    class="action-btn primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="m5 15-4-4 4-4"/>
                                </svg>
                                Copiar Resumo
                            </button>
                            <button onclick="window.incluaAIWidget.playSummary(this)" 
                                    data-summary="${data.summarizedText.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"
                                    class="action-btn secondary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                    <path d="m19.07 4.93-1.41 1.41A10 10 0 0 1 23 12a10 10 0 0 1-5.34 8.66L19.07 21.07"/>
                                </svg>
                                Ouvir Resumo
                            </button>
                        </div>
                    </div>
                </div>
                
                <style>
                .summary-container {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .summary-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    color: white;
                }
                
                .summary-icon {
                    background: rgba(255,255,255,0.2);
                    padding: 12px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .summary-meta h3 {
                    margin: 0 0 4px 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .text-stats {
                    font-size: 13px;
                    opacity: 0.9;
                    font-weight: 400;
                }
                
                .summary-content {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 24px;
                    border: 1px solid #e2e8f0;
                }
                
                .summary-text {
                    font-size: 16px;
                    line-height: 1.7;
                    color: #2d3748;
                    margin-bottom: 24px;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .summary-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                
                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                }
                
                .action-btn.primary {
                    background: #667eea;
                    color: white;
                }
                
                .action-btn.primary:hover {
                    background: #5a67d8;
                    transform: translateY(-1px);
                }
                
                .action-btn.secondary {
                    background: #e2e8f0;
                    color: #4a5568;
                }
                
                .action-btn.secondary:hover {
                    background: #cbd5e0;
                    transform: translateY(-1px);
                }
                
                /* Dark mode */
                .widget-dark-mode .summary-content {
                    background: #2d3748 !important;
                    border-color: #4a5568 !important;
                }
                
                .widget-dark-mode .summary-text {
                    background: #1a202c !important;
                    color: #e2e8f0 !important;
                    border-left-color: #4c51bf !important;
                }
                
                .widget-dark-mode .action-btn.secondary {
                    background: #4a5568 !important;
                    color: #e2e8f0 !important;
                }
                
                .widget-dark-mode .action-btn.secondary:hover {
                    background: #2d3748 !important;
                }
                </style>
            `, false);
            
        } catch (error) {
            console.error('Erro ao resumir texto:', error);
            this.showModal('Erro', 'Não foi possível resumir o texto selecionado.', false);
        }
    }

    // Método para copiar resumo
    copySummary(button) {
        const summary = button.getAttribute('data-summary');
        navigator.clipboard.writeText(summary).then(() => {
            const originalText = button.innerHTML;
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
                Copiado!
            `;
            button.style.background = '#10b981';
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '#667eea';
            }, 2000);
        }).catch(() => {
            this.showAlert('Erro ao copiar resumo', 'error');
        });
    }

    // Método para reproduzir áudio do resumo
    playSummary(button) {
        const summary = button.getAttribute('data-summary');
        const originalText = button.innerHTML;
        
        // Parar qualquer reprodução anterior
        if (this.currentSpeech) {
            speechSynthesis.cancel();
            this.currentSpeech = null;
        }

        if (button.classList.contains('playing')) {
            // Parar reprodução
            speechSynthesis.cancel();
            button.classList.remove('playing');
            button.innerHTML = originalText;
            return;
        }

        button.classList.add('playing');
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
            Pausar
        `;

        const utterance = new SpeechSynthesisUtterance(summary);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onend = () => {
            button.classList.remove('playing');
            button.innerHTML = originalText;
            this.currentSpeech = null;
        };

        utterance.onerror = () => {
            button.classList.remove('playing');
            button.innerHTML = originalText;
            this.currentSpeech = null;
            this.showAlert('Erro ao reproduzir áudio do resumo', 'error');
        };

        this.currentSpeech = utterance;
        speechSynthesis.speak(utterance);
    }

    // Método para copiar descrição de imagem
    copyDescription(button) {
        const description = button.getAttribute('data-description');
        navigator.clipboard.writeText(description).then(() => {
            const originalText = button.innerHTML;
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
                Copiado!
            `;
            button.style.background = '#10b981';
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '#667eea';
            }, 2000);
        }).catch(() => {
            this.showAlert('Erro ao copiar descrição', 'error');
        });
    }

    // Método para reproduzir áudio da descrição
    playDescription(button) {
        const description = button.getAttribute('data-description');
        const originalText = button.innerHTML;
        
        // Parar qualquer reprodução anterior
        if (this.currentSpeech) {
            speechSynthesis.cancel();
            this.currentSpeech = null;
        }

        if (button.classList.contains('playing')) {
            // Parar reprodução
            speechSynthesis.cancel();
            button.classList.remove('playing');
            button.innerHTML = originalText;
            return;
        }

        button.classList.add('playing');
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
            Pausar
        `;

        const utterance = new SpeechSynthesisUtterance(description);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onend = () => {
            button.classList.remove('playing');
            button.innerHTML = originalText;
            this.currentSpeech = null;
        };

        utterance.onerror = () => {
            button.classList.remove('playing');
            button.innerHTML = originalText;
            this.currentSpeech = null;
            this.showAlert('Erro ao reproduzir áudio da descrição', 'error');
        };

        this.currentSpeech = utterance;
        speechSynthesis.speak(utterance);
    }

    applyColorblindFilter(filterType) {
        // Remove filtros anteriores
        document.documentElement.className = document.documentElement.className.replace(/filter-\w+/g, '');
        
        if (filterType !== 'none') {
            document.documentElement.classList.add(`filter-${filterType}`);
            this.showAlert(`Filtro aplicado: ${this.getFilterName(filterType)}`, 'success');
        } else {
            this.showAlert('Filtro removido', 'success');
        }
        
        this.settings.colorFilter = filterType;
        this.saveSettings();
    }

    getFilterName(filterType) {
        const names = {
            'protanopia': 'Protanopia (Vermelho-Verde)',
            'deuteranopia': 'Deuteranopia (Verde-Vermelho)', 
            'tritanopia': 'Tritanopia (Azul-Amarelo)',
            'achromatopsia': 'Acromatopsia (Sem cores)'
        };
        return names[filterType] || filterType;
    }

    // Funcionalidades auxiliares
    showModal(title, content, isLoading = false) {
        // Remove modal existente
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        
        const loadingContent = isLoading ? `
            <div class="loading-container">
                <div style="display: flex; align-items: center; justify-content: center;">
                    <div class="spinner"></div>
                    <span>${content}</span>
                </div>
                <div class="loading-progress">
                    <div class="loading-progress-bar"></div>
                </div>
                <div class="loading-text">Processando com IA... Isso pode levar alguns segundos.</div>
            </div>
        ` : content;
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    ${!isLoading ? '<button class="modal-close" aria-label="Fechar">×</button>' : ''}
                </div>
                <div class="modal-content">
                    ${loadingContent}
                </div>
                ${!isLoading ? '<div class="modal-actions"><button class="btn btn-secondary modal-close">Fechar</button></div>' : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        if (!isLoading) {
            modal.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => modal.remove());
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }
    }

    showAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} fade-in`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000001;
            min-width: 300px;
            max-width: 400px;
        `;
        
        alert.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                ${type === 'success' ? '<path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>' : '<path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>'}
            </svg>
            ${message}
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }

    injectSVGFilters() {
        // Filtros para daltonismo (simplificado)
        const filters = `
            <svg style="display: none;">
                <defs>
                    <filter id="protanopia">
                        <feColorMatrix values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0"/>
                    </filter>
                    <filter id="deuteranopia">
                        <feColorMatrix values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0"/>
                    </filter>
                    <filter id="tritanopia">
                        <feColorMatrix values="0.95, 0.05, 0, 0, 0 0, 0.433, 0.567, 0, 0 0, 0.475, 0.525, 0, 0 0, 0, 0, 1, 0"/>
                    </filter>
                    <filter id="achromatopsia">
                        <feColorMatrix values="0.299, 0.587, 0.114, 0, 0 0.299, 0.587, 0.114, 0, 0 0.299, 0.587, 0.114, 0, 0 0, 0, 0, 1, 0"/>
                    </filter>
                </defs>
            </svg>
        `;
        document.body.insertAdjacentHTML('beforeend', filters);
    }

    setupVoices() {
        // Configuração básica de vozes (pode ser expandida)
        speechSynthesis.addEventListener('voiceschanged', () => {
            const voices = speechSynthesis.getVoices();
            console.log('Vozes disponíveis:', voices.filter(v => v.lang.includes('pt')));
        });
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('inclua-ai-settings');
            if (saved) {
                Object.assign(this.settings, JSON.parse(saved));
                this.applySettings();
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('inclua-ai-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
        }
    }

    applySettings() {
        if (this.settings.fontSize !== 0) {
            document.documentElement.style.fontSize = `${100 + (this.settings.fontSize * 20)}%`;
        }
        if (this.settings.darkMode) {
            document.body.classList.add('widget-dark-mode');
        }
        if (this.settings.colorFilter && this.settings.colorFilter !== 'none') {
            document.documentElement.classList.add(`filter-${this.settings.colorFilter}`);
            const filterSelect = document.getElementById('colorblind-filter');
            if (filterSelect) {
                filterSelect.value = this.settings.colorFilter;
            }
        }
    }

    resetSettings() {
        this.settings = {
            fontSize: 0,
            darkMode: false,
            voice: '',
            colorFilter: 'none'
        };
        
        this.features = {
            reader: false,
            highlightLinks: false,
            imageDescriber: false,
            textSummarizer: false
        };
        
        // Limpar alterações visuais
        document.documentElement.style.fontSize = '';
        document.documentElement.className = document.documentElement.className.replace(/filter-\w+/g, '');
        document.body.classList.remove('widget-dark-mode');
        document.documentElement.classList.remove('widget-highlight-links');
        document.body.style.cursor = '';
        speechSynthesis.cancel();
        
        // Resetar filtro de daltonismo
        const filterSelect = document.getElementById('colorblind-filter');
        if (filterSelect) {
            filterSelect.value = 'none';
        }
        
        // Remover event listeners ativos
        document.removeEventListener('mouseup', this.handleTextSelection.bind(this));
        document.removeEventListener('click', this.handleImageClick.bind(this));
        
        this.saveSettings();
        this.showAlert('Configurações resetadas com sucesso!', 'success');
    }

    showLibrasInDevelopment() {
        this.showModal('🤟 Intérprete de Libras 3D', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🚧</div>
                <h3 style="color: #374151; margin-bottom: 16px;">Funcionalidade em Desenvolvimento</h3>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    O <strong>Intérprete de Libras 3D</strong> está sendo desenvolvido para oferecer tradução automática 
                    de texto para Língua Brasileira de Sinais através de um avatar 3D interativo.
                </p>
                
                <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <h4 style="color: #374151; margin-bottom: 12px; font-size: 14px;">📋 Recursos Planejados:</h4>
                    <ul style="text-align: left; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        <li>Avatar 3D realista para interpretação em Libras</li>
                        <li>Tradução automática de texto para sinais</li>
                        <li>Velocidade ajustável de interpretação</li>
                        <li>Biblioteca completa de sinais brasileiros</li>
                        <li>Interface intuitiva e acessível</li>
                    </ul>
                </div>
                
                <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <p style="color: #047857; font-weight: 500; margin: 0; font-size: 14px;">
                        🎯 Esta funcionalidade será lançada em uma próxima atualização!
                    </p>
                </div>
            </div>
        `, false);
    }
}

// Inicializar o widget quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new IncluaAIWidget());
} else {
    new IncluaAIWidget();
}
