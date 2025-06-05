// Service Worker para o Gerador de QR Code
console.log('Service Worker inicializado');

// Inicialização básica
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extensão instalada/atualizada');
  
  // Inicializa o armazenamento local
  chrome.storage.local.get(['qrHistory'], (result) => {
    if (!result.qrHistory) {
      chrome.storage.local.set({ qrHistory: [] });
    }
  });
});

// Manipulador de mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Mensagem recebida:', request.action);
  
  // Obter URL da aba atual
  if (request.action === 'getCurrentTabUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0]?.url || '' });
    });
    return true; // Indica que a resposta será assíncrona
  }
  
  // Adicionar ao histórico
  if (request.action === 'addToHistory') {
    chrome.storage.local.get(['qrHistory'], (result) => {
      const history = result.qrHistory || [];
      const existingIndex = history.findIndex(item => item.text === request.text);
      
      if (existingIndex >= 0) {
        history.splice(existingIndex, 1);
      }
      
      history.unshift({
        text: request.text,
        timestamp: new Date().toISOString()
      });
      
      // Mantém apenas os 50 itens mais recentes
      if (history.length > 50) {
        history.length = 50;
      }
      
      chrome.storage.local.set({ qrHistory: history });
    });
  }
  
  // Obter histórico
  if (request.action === 'getHistory') {
    chrome.storage.local.get(['qrHistory'], (result) => {
      sendResponse({ history: result.qrHistory || [] });
    });
    return true; // Indica que a resposta será assíncrona
  }
});
