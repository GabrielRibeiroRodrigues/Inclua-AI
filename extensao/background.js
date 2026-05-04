/**
 * INCLUA-AI SERVICE WORKER
 * Background script da extensão
 */

// Inicializar extensão
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('✅ Inclua-AI extensão instalada!');
    // Abrir página de boas-vindas
    chrome.tabs.create({ url: 'welcome.html' });
  }
});

// Mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.local.get('incluaAISettings', (result) => {
      sendResponse(result.incluaAISettings || {});
    });
    return true;
  }

  if (request.action === 'saveSettings') {
    chrome.storage.local.set({ incluaAISettings: request.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
