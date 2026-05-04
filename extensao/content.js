/**
 * INCLUA-AI CONTENT SCRIPT
 * Injeta o widget automaticamente em todas as páginas
 */

// Verificar se widget já está injetado
if (!window.incluaAIExtensionInjected) {
  window.incluaAIExtensionInjected = true;

  // Determinar qual URL usar (local ou produção)
  const WIDGET_URL = {
    css: 'http://localhost:3000/widget.css',
    js: 'http://localhost:3000/widget.js'
  };

  // Função para injetar o widget
  function injectWidget() {
    // Verificar se já está injetado
    if (document.getElementById('inclua-ai-widget')) {
      console.log('✅ Inclua-AI widget já está injetado');
      return;
    }

    // Injetar CSS
    const cssLink = document.createElement('link');
    cssLink.id = 'inclua-ai-css';
    cssLink.rel = 'stylesheet';
    cssLink.href = WIDGET_URL.css;
    
    cssLink.onerror = function() {
      console.error('❌ Erro ao carregar CSS do Inclua-AI');
      // Tenta carregar da produção
      cssLink.href = 'https://inclua-ai-servidor.onrender.com/widget.css';
    };
    
    document.head.appendChild(cssLink);

    // Injetar JavaScript
    const scriptTag = document.createElement('script');
    scriptTag.id = 'inclua-ai-script';
    scriptTag.src = WIDGET_URL.js;
    
    scriptTag.onerror = function() {
      console.error('❌ Erro ao carregar JavaScript do Inclua-AI');
      // Tenta carregar da produção
      scriptTag.src = 'https://inclua-ai-servidor.onrender.com/widget.js';
      document.head.appendChild(scriptTag);
    };
    
    scriptTag.onload = function() {
      console.log('✅ Inclua-AI Widget injetado com sucesso!');
      
      // Restaurar preferências salvas
      chrome.storage.local.get('incluaAISettings', function(result) {
        if (result.incluaAISettings && window.incluaAIWidget) {
          console.log('🔧 Restaurando preferências do usuário...');
          // As preferências são restauradas automaticamente pelo widget
        }
      });
    };
    
    document.head.appendChild(scriptTag);
  }

  // Injetar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }

  // Listen para mensagens do popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleWidget') {
      const widget = document.getElementById('inclua-ai-widget');
      if (widget) {
        widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
        sendResponse({ status: 'toggled' });
      } else {
        injectWidget();
        sendResponse({ status: 'injected' });
      }
    }
  });
}
