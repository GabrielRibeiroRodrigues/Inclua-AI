/**
 * INCLUA-AI POPUP
 * UI da extensão no navegador
 */

let isWidgetActive = true;

// Elementos
const toggleBtn = document.getElementById('toggleBtn');
const statusText = document.getElementById('status-text');
const settingsBtn = document.getElementById('settingsBtn');
const helpBtn = document.getElementById('helpBtn');

// Toggle widget
toggleBtn.addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleWidget' }, function(response) {
      if (response && response.status) {
        isWidgetActive = !isWidgetActive;
        updateToggleButton();
      }
    });
  });
});

// Settings button
settingsBtn.addEventListener('click', function() {
  chrome.runtime.openOptionsPage();
});

// Help button
helpBtn.addEventListener('click', function() {
  chrome.tabs.create({ url: 'https://github.com/GabrielRibeiroRodrigues/Inclua-AI' });
});

// Atualizar estado do botão
function updateToggleButton() {
  if (isWidgetActive) {
    toggleBtn.textContent = '✅ Widget Ativo';
    toggleBtn.style.background = '#4caf50';
    statusText.textContent = 'Widget ativo em todas as páginas';
  } else {
    toggleBtn.textContent = '❌ Widget Desativo';
    toggleBtn.style.background = '#f44336';
    statusText.textContent = 'Widget desativado nesta página';
  }
}

// Carregar estado inicial
chrome.storage.local.get('widgetState', function(result) {
  isWidgetActive = result.widgetState !== false;
  updateToggleButton();
});

// Salvar estado quando muda
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateWidgetState') {
    isWidgetActive = request.state;
    chrome.storage.local.set({ widgetState: isWidgetActive });
    updateToggleButton();
  }
});
