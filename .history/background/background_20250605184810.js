// background.js - Script de serviço em segundo plano para a extensão QR Code Generator

// Configuração inicial quando a extensão é instalada ou atualizada
chrome.runtime.onInstalled.addListener(async () => {
  console.log('QR Code Generator instalado/atualizado');
  
  // Inicializar as configurações padrão
  const defaultSettings = {
    maxHistoryItems: 10,
    defaultQrSize: 200,
    defaultForeground: '#000000',
    defaultBackground: '#ffffff',
    saveHistory: true,
    showNotifications: true
  };

  // Verificar se já existem configurações salvas
  const existingSettings = await chrome.storage.sync.get('settings');
  if (!existingSettings.settings) {
    await chrome.storage.sync.set({ settings: defaultSettings });
    console.log('Configurações padrão inicializadas');
  }

  // Inicializar o histórico se não existir
  const existingHistory = await chrome.storage.sync.get('history');
  if (!existingHistory.history) {
    await chrome.storage.sync.set({ history: [] });
    console.log('Histórico inicializado');
  }

  // Criar itens de menu de contexto
  chrome.contextMenus.create({
    id: 'generateQrFromSelection',
    title: 'Gerar QR Code do texto selecionado',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'generateQrFromLink',
    title: 'Gerar QR Code deste link',
    contexts: ['link']
  });

  chrome.contextMenus.create({
    id: 'generateQrFromImage',
    title: 'Ler QR Code desta imagem',
    contexts: ['image']
  });
});

// Manipular cliques nos itens do menu de contexto
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'generateQrFromSelection':
      if (info.selectionText) {
        openPopupWithData('text', info.selectionText);
      }
      break;
    case 'generateQrFromLink':
      if (info.linkUrl) {
        openPopupWithData('url', info.linkUrl);
      }
      break;
    case 'generateQrFromImage':
      if (info.srcUrl) {
        // Abrir popup com modo de leitura ativado
        openPopupWithData('read', info.srcUrl);
      }
      break;
  }
});

// Função para abrir o popup com dados pré-carregados
function openPopupWithData(type, data) {
  // Armazenar temporariamente os dados para o popup acessar
  chrome.storage.local.set({ 
    tempData: {
      type: type,
      data: data,
      timestamp: Date.now()
    }
  }, () => {
    // Abrir o popup
    chrome.action.openPopup();
  });
}

// Gerenciar mensagens de outros scripts da extensão
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'addToHistory') {
    addToHistory(message.qrData)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indica que a resposta será assíncrona
  }
  
  if (message.action === 'getHistory') {
    getHistory()
      .then(history => sendResponse({ success: true, history }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indica que a resposta será assíncrona
  }
  
  if (message.action === 'clearHistory') {
    clearHistory()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indica que a resposta será assíncrona
  }

  if (message.action === 'showQrInPage') {
    // Encaminhar a mensagem para a aba ativa
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'displayQrOverlay',
          qrData: message.qrData,
          qrOptions: message.qrOptions
        });
      }
    });
    sendResponse({ success: true });
  }
});

// Função para adicionar um item ao histórico
async function addToHistory(qrData) {
  try {
    // Verificar se o histórico está habilitado nas configurações
    const { settings } = await chrome.storage.sync.get('settings');
    if (!settings.saveHistory) {
      return; // Não salvar se o histórico estiver desabilitado
    }

    // Obter o histórico atual
    const { history = [] } = await chrome.storage.sync.get('history');
    
    // Criar novo item de histórico
    const historyItem = {
      id: Date.now().toString(),
      data: qrData.text,
      type: qrData.type || 'text',
      timestamp: Date.now(),
      options: qrData.options || {}
    };
    
    // Remover duplicatas (se o mesmo conteúdo já existir)
    const filteredHistory = history.filter(item => item.data !== qrData.text);
    
    // Adicionar o novo item no início
    filteredHistory.unshift(historyItem);
    
    // Limitar o tamanho do histórico
    const maxItems = settings.maxHistoryItems || 10;
    const trimmedHistory = filteredHistory.slice(0, maxItems);
    
    // Salvar o histórico atualizado
    await chrome.storage.sync.set({ history: trimmedHistory });
    
    // Notificar outros componentes da extensão sobre a atualização do histórico
    chrome.runtime.sendMessage({ action: 'historyUpdated', history: trimmedHistory });
    
    return trimmedHistory;
  } catch (error) {
    console.error('Erro ao adicionar ao histórico:', error);
    throw error;
  }
}

// Função para obter o histórico
async function getHistory() {
  try {
    const { history = [] } = await chrome.storage.sync.get('history');
    return history;
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    throw error;
  }
}

// Função para limpar o histórico
async function clearHistory() {
  try {
    await chrome.storage.sync.set({ history: [] });
    // Notificar outros componentes da extensão
    chrome.runtime.sendMessage({ action: 'historyUpdated', history: [] });
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    throw error;
  }
}
