// popup.js - Script principal para a interface do popup

// Variáveis globais
let currentQRCode = null;
let qrCodeInstance = null;
let cameraStream = null;
let scannerInterval = null;
let settings = {
  maxHistoryItems: 10,
  defaultQrSize: 200,
  defaultForeground: '#000000',
  defaultBackground: '#ffffff',
  saveHistory: true,
  showNotifications: true
};

// Elementos DOM que serão usados frequentemente
const elements = {
  qrText: document.getElementById('qrText'),
  qrCode: document.getElementById('qrCode'),
  qrSize: document.getElementById('qrSize'),
  qrSizeValue: document.getElementById('qrSizeValue'),
  qrForeground: document.getElementById('qrForeground'),
  qrBackground: document.getElementById('qrBackground'),
  qrErrorCorrection: document.getElementById('qrErrorCorrection'),
  generateQR: document.getElementById('generateQR'),
  copyQR: document.getElementById('copyQR'),
  downloadQR: document.getElementById('downloadQR'),
  showInPageQR: document.getElementById('showInPageQR'),
  tabButtons: document.querySelectorAll('.tab-button'),
  tabContents: document.querySelectorAll('.tab-content'),
  qrReadLink: document.getElementById('qrReadLink'),
  historyList: document.getElementById('historyList'),
  historyEmpty: document.getElementById('historyEmpty'),
  clearHistory: document.getElementById('clearHistory'),
  readFromCamera: document.getElementById('readFromCamera'),
  readFromFile: document.getElementById('readFromFile'),
  qrFileInput: document.getElementById('qrFileInput'),
  cameraContainer: document.getElementById('cameraContainer'),
  cameraPreview: document.getElementById('cameraPreview'),
  captureCameraButton: document.getElementById('captureCameraButton'),
  closeCameraButton: document.getElementById('closeCameraButton'),
  imagePreview: document.getElementById('imagePreview'),
  qrImagePreview: document.getElementById('qrImagePreview'),
  closeImageButton: document.getElementById('closeImageButton'),
  qrReadResult: document.getElementById('qrReadResult'),
  qrReadText: document.getElementById('qrReadText'),
  copyQrResult: document.getElementById('copyQrResult'),
  openQrResult: document.getElementById('openQrResult'),
  generateFromResult: document.getElementById('generateFromResult'),
  themeToggle: document.getElementById('themeToggle'),
  notification: document.getElementById('notification'),
  notificationMessage: document.getElementById('notificationMessage'),
  notificationClose: document.getElementById('notificationClose'),
  // Elementos de configurações
  settingSaveHistory: document.getElementById('settingSaveHistory'),
  settingShowNotifications: document.getElementById('settingShowNotifications'),
  settingMaxHistoryItems: document.getElementById('settingMaxHistoryItems'),
  settingMaxHistoryItemsValue: document.getElementById('settingMaxHistoryItemsValue'),
  settingDefaultQrSize: document.getElementById('settingDefaultQrSize'),
  settingDefaultQrSizeValue: document.getElementById('settingDefaultQrSizeValue'),
  settingDefaultForeground: document.getElementById('settingDefaultForeground'),
  settingDefaultBackground: document.getElementById('settingDefaultBackground'),
  resetSettings: document.getElementById('resetSettings'),
  exportSettings: document.getElementById('exportSettings'),
  importSettings: document.getElementById('importSettings'),
  importSettingsFile: document.getElementById('importSettingsFile')
};

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  // Carregar configurações
  await loadSettings();
  
  // Aplicar tema salvo
  applyTheme();
  
  // Inicializar valores de controles com base nas configurações
  initializeControls();
  
  // Carregar histórico
  await loadHistory();
  
  // Verificar se há dados temporários do background script
  await checkTempData();
  
  // Configurar listeners de eventos
  setupEventListeners();
});

// Função para carregar configurações
async function loadSettings() {
  try {
    const data = await chrome.storage.sync.get('settings');
    if (data.settings) {
      settings = { ...settings, ...data.settings };
    } else {
      // Salvar configurações padrão se não existirem
      await chrome.storage.sync.set({ settings });
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    showNotification('Erro ao carregar configurações', 'error');
  }
}

// Função para inicializar controles com valores das configurações
function initializeControls() {
  // Inicializar controles da aba de geração
  elements.qrSize.value = settings.defaultQrSize;
  elements.qrSizeValue.textContent = `${settings.defaultQrSize}px`;
  elements.qrForeground.value = settings.defaultForeground;
  elements.qrBackground.value = settings.defaultBackground;
  
  // Inicializar controles da aba de configurações
  elements.settingSaveHistory.checked = settings.saveHistory;
  elements.settingShowNotifications.checked = settings.showNotifications;
  elements.settingMaxHistoryItems.value = settings.maxHistoryItems;
  elements.settingMaxHistoryItemsValue.textContent = `${settings.maxHistoryItems} itens`;
  elements.settingDefaultQrSize.value = settings.defaultQrSize;
  elements.settingDefaultQrSizeValue.textContent = `${settings.defaultQrSize}px`;
  elements.settingDefaultForeground.value = settings.defaultForeground;
  elements.settingDefaultBackground.value = settings.defaultBackground;
}

// Função para configurar listeners de eventos
function setupEventListeners() {
  // Eventos da aba de geração
  elements.qrText.addEventListener('input', debounce(updateQRCode, 500));
  elements.generateQR.addEventListener('click', generateQRCode);
  elements.qrSize.addEventListener('input', updateQRSize);
  elements.qrForeground.addEventListener('input', updateQRColors);
  elements.qrBackground.addEventListener('input', updateQRColors);
  elements.qrErrorCorrection.addEventListener('change', updateQRCode);
  elements.copyQR.addEventListener('click', copyQRCode);
  elements.downloadQR.addEventListener('click', downloadQRCode);
  elements.showInPageQR.addEventListener('click', showQRInPage);
  
  // Eventos da navegação por abas
  elements.tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });
  
  // Eventos da aba de histórico
  elements.clearHistory.addEventListener('click', clearHistory);
  
  // Eventos da aba de leitura de QR code
  elements.readFromCamera.addEventListener('click', startCameraScanner);
  elements.readFromFile.addEventListener('click', () => elements.qrFileInput.click());
  elements.qrFileInput.addEventListener('change', handleFileSelect);
  elements.closeCameraButton.addEventListener('click', stopCameraScanner);
  elements.closeImageButton.addEventListener('click', closeImagePreview);
  elements.captureCameraButton.addEventListener('click', captureFromCamera);
  elements.copyQrResult.addEventListener('click', copyQrResultText);
  elements.openQrResult.addEventListener('click', openQrResultUrl);
  elements.generateFromResult.addEventListener('click', generateFromResult);
  
  // Eventos da aba de configurações
  elements.settingSaveHistory.addEventListener('change', updateSetting);
  elements.settingShowNotifications.addEventListener('change', updateSetting);
  elements.settingMaxHistoryItems.addEventListener('input', updateSettingWithValue);
  elements.settingDefaultQrSize.addEventListener('input', updateSettingWithValue);
  elements.settingDefaultForeground.addEventListener('input', updateSetting);
  elements.settingDefaultBackground.addEventListener('input', updateSetting);
  elements.resetSettings.addEventListener('click', resetSettings);
  elements.exportSettings.addEventListener('click', exportSettings);
  elements.importSettings.addEventListener('click', () => elements.importSettingsFile.click());
  elements.importSettingsFile.addEventListener('change', importSettings);
  
  // Eventos de tema
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Eventos de notificação
  elements.notificationClose.addEventListener('click', hideNotification);
}

// Verificar dados temporários do background script
async function checkTempData() {
  try {
    const data = await chrome.storage.local.get('tempData');
    if (data.tempData && Date.now() - data.tempData.timestamp < 10000) {
      // Dados são recentes (menos de 10 segundos)
      const { type, data: content } = data.tempData;
      
      switch (type) {
        case 'text':
        case 'url':
          // Preencher o campo de texto e gerar QR code
          elements.qrText.value = content;
          generateQRCode();
          switchTab('generate');
          break;
        case 'read':
          // Carregar imagem para leitura
          loadImageForReading(content);
          switchTab('read');
          break;
      }
      
      // Limpar dados temporários
      await chrome.storage.local.remove('tempData');
    }
  } catch (error) {
    console.error('Erro ao verificar dados temporários:', error);
  }
}

// Função para alternar entre abas
function switchTab(tabId) {
  // Desativar todas as abas
  elements.tabButtons.forEach(button => {
    button.classList.remove('active');
  });
  elements.tabContents.forEach(content => {
    content.classList.remove('active');
  });
  
  // Ativar a aba selecionada
  document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
  document.getElementById(tabId).classList.add('active');
  
  // Ações específicas para certas abas
  if (tabId === 'history') {
    loadHistory();
  } else if (tabId === 'read') {
    // Parar a câmera se estiver ativa e o usuário mudar de aba
    stopCameraScanner();
  }
}

// Função para gerar QR code
function generateQRCode() {
  const text = elements.qrText.value.trim();
  if (!text) {
    showNotification('Por favor, digite um texto ou URL', 'warning');
    return;
  }
  
  const size = parseInt(elements.qrSize.value);
  const errorCorrectionLevel = elements.qrErrorCorrection.value;
  const foreground = elements.qrForeground.value;
  const background = elements.qrBackground.value;
  
  // Limpar QR code anterior
  if (qrCodeInstance) {
    qrCodeInstance.clear();
  }
  
  try {
    // Criar nova instância
    qrCodeInstance = new QRCode(elements.qrCode, {
      text: text,
      width: size,
      height: size,
      colorDark: foreground,
      colorLight: background,
      correctLevel: QRCode.CorrectLevel[errorCorrectionLevel]
    });
    
    // Armazenar dados do QR code atual
    currentQRCode = {
      text: text,
      type: text.match(/^https?:\/\//i) ? 'url' : 'text',
      options: {
        size: size,
        foreground: foreground,
        background: background,
        errorCorrection: errorCorrectionLevel
      },
      dataUrl: getQRCodeDataUrl()
    };
    
    // Adicionar ao histórico
    if (settings.saveHistory) {
            addToHistory(currentQRCode);
    }
    
    // Habilitar botões de ação
    enableActionButtons();
    
    // Mostrar notificação de sucesso
    showNotification('QR Code gerado com sucesso', 'success');
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    showNotification('Erro ao gerar QR code', 'error');
  }
}

// Função para atualizar o QR code quando os parâmetros mudam
function updateQRCode() {
  const text = elements.qrText.value.trim();
  if (text) {
    generateQRCode();
  }
}

// Função para atualizar o tamanho do QR code
function updateQRSize() {
  const size = elements.qrSize.value;
  elements.qrSizeValue.textContent = `${size}px`;
  updateQRCode();
}

// Função para atualizar as cores do QR code
function updateQRColors() {
  updateQRCode();
}

// Função para obter o DataURL do QR code atual
function getQRCodeDataUrl() {
  const canvas = elements.qrCode.querySelector('canvas');
  return canvas ? canvas.toDataURL('image/png') : null;
}

// Função para copiar o QR code para a área de transferência
async function copyQRCode() {
  if (!currentQRCode || !currentQRCode.dataUrl) {
    showNotification('Nenhum QR code para copiar', 'warning');
    return;
  }
  
  try {
    // Converter dataUrl para blob
    const response = await fetch(currentQRCode.dataUrl);
    const blob = await response.blob();
    
    // Criar um ClipboardItem
    const item = new ClipboardItem({ 'image/png': blob });
    
    // Copiar para a área de transferência
    await navigator.clipboard.write([item]);
    
    showNotification('QR code copiado para a área de transferência', 'success');
  } catch (error) {
    console.error('Erro ao copiar QR code:', error);
    
    // Fallback para método alternativo de cópia
    try {
      const img = document.createElement('img');
      img.src = currentQRCode.dataUrl;
      img.style.position = 'absolute';
      img.style.left = '-9999px';
      document.body.appendChild(img);
      
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNode(img);
      selection.removeAllRanges();
      selection.addRange(range);
      
      const success = document.execCommand('copy');
      selection.removeAllRanges();
      document.body.removeChild(img);
      
      if (success) {
        showNotification('QR code copiado para a área de transferência', 'success');
      } else {
        throw new Error('Comando de cópia falhou');
      }
    } catch (fallbackError) {
      console.error('Erro no método alternativo de cópia:', fallbackError);
      showNotification('Não foi possível copiar o QR code', 'error');
    }
  }
}

// Função para baixar o QR code como imagem
function downloadQRCode() {
  if (!currentQRCode || !currentQRCode.dataUrl) {
    showNotification('Nenhum QR code para baixar', 'warning');
    return;
  }
  
  // Criar nome de arquivo baseado no conteúdo
  const text = currentQRCode.text;
  const filename = `qrcode-${text.replace(/[^a-z0-9]/gi, '-').substring(0, 30)}.png`;
  
  // Criar link de download
  const link = document.createElement('a');
  link.href = currentQRCode.dataUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('QR code baixado', 'success');
}

// Função para mostrar o QR code na página atual
async function showQRInPage() {
  if (!currentQRCode || !currentQRCode.dataUrl) {
    showNotification('Nenhum QR code para mostrar', 'warning');
    return;
  }
  
  try {
    // Obter a aba ativa
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Enviar mensagem para o content script
    await chrome.tabs.sendMessage(tab.id, {
      action: 'displayQrOverlay',
      qrData: currentQRCode,
      qrOptions: {
        autoClose: 0 // Não fechar automaticamente
      }
    });
    
    // Fechar o popup
    window.close();
  } catch (error) {
    console.error('Erro ao mostrar QR code na página:', error);
    showNotification('Não foi possível mostrar o QR code na página', 'error');
  }
}

// Função para adicionar QR code ao histórico
async function addToHistory(qrData) {
  try {
    // Obter histórico atual
    const data = await chrome.storage.local.get('history');
    let history = data.history || [];
    
    // Verificar se já existe um item idêntico
    const existingIndex = history.findIndex(item => item.text === qrData.text);
    if (existingIndex !== -1) {
      // Remover o item existente para adicioná-lo novamente no topo
      history.splice(existingIndex, 1);
    }
    
    // Adicionar novo item no início
    history.unshift({
      ...qrData,
      timestamp: Date.now()
    });
    
    // Limitar o tamanho do histórico
    if (history.length > settings.maxHistoryItems) {
      history = history.slice(0, settings.maxHistoryItems);
    }
    
    // Salvar histórico atualizado
    await chrome.storage.local.set({ history });
    
    // Atualizar a interface se estiver na aba de histórico
    if (document.getElementById('history').classList.contains('active')) {
      loadHistory();
    }
  } catch (error) {
    console.error('Erro ao adicionar ao histórico:', error);
  }
}

// Função para carregar histórico
async function loadHistory() {
  try {
    // Obter histórico
    const data = await chrome.storage.local.get('history');
    const history = data.history || [];
    
    // Limpar lista
    elements.historyList.innerHTML = '';
    
    // Mostrar mensagem se o histórico estiver vazio
    if (history.length === 0) {
      elements.historyEmpty.style.display = 'flex';
      return;
    }
    
    // Ocultar mensagem de vazio
    elements.historyEmpty.style.display = 'none';
    
    // Adicionar itens à lista
    history.forEach((item, index) => {
      const listItem = document.createElement('li');
      listItem.className = 'history-item';
      
      // Criar thumbnail do QR code
      const thumbnail = document.createElement('div');
      thumbnail.className = 'history-thumbnail';
      const img = document.createElement('img');
      img.src = item.dataUrl;
      img.alt = 'QR Code';
      thumbnail.appendChild(img);
      
      // Criar conteúdo do item
      const content = document.createElement('div');
      content.className = 'history-content';
      
      // Título (primeiros 30 caracteres do texto)
      const title = document.createElement('h4');
      title.className = 'history-title';
      title.textContent = item.text.length > 30 
        ? item.text.substring(0, 27) + '...' 
        : item.text;
      
      // Data formatada
      const date = document.createElement('span');
      date.className = 'history-date';
      date.textContent = formatDate(item.timestamp);
      
      content.appendChild(title);
      content.appendChild(date);
      
      // Criar botões de ação
      const actions = document.createElement('div');
      actions.className = 'history-actions';
      
      // Botão para restaurar
      const restoreButton = document.createElement('button');
      restoreButton.className = 'history-action-button';
      restoreButton.title = 'Restaurar este QR code';
      restoreButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';
      restoreButton.addEventListener('click', () => restoreFromHistory(item));
      
      // Botão para remover
      const removeButton = document.createElement('button');
      removeButton.className = 'history-action-button';
      removeButton.title = 'Remover do histórico';
      removeButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
      removeButton.addEventListener('click', () => removeFromHistory(index));
      
      actions.appendChild(restoreButton);
      actions.appendChild(removeButton);
      
      // Montar o item completo
      listItem.appendChild(thumbnail);
      listItem.appendChild(content);
      listItem.appendChild(actions);
      
      // Adicionar evento de clique no item para restaurar
      listItem.addEventListener('click', (e) => {
        // Evitar ação se o clique foi em um botão
        if (!e.target.closest('.history-action-button')) {
          restoreFromHistory(item);
        }
      });
      
      // Adicionar à lista
      elements.historyList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    showNotification('Erro ao carregar histórico', 'error');
  }
}

// Função para restaurar QR code do histórico
function restoreFromHistory(item) {
  // Preencher campos com os dados do item
  elements.qrText.value = item.text;
  elements.qrSize.value = item.options.size;
  elements.qrSizeValue.textContent = `${item.options.size}px`;
  elements.qrForeground.value = item.options.foreground;
  elements.qrBackground.value = item.options.background;
  elements.qrErrorCorrection.value = item.options.errorCorrection;
  
  // Mudar para a aba de geração
  switchTab('generate');
  
  // Gerar o QR code
  generateQRCode();
}

// Função para remover item do histórico
async function removeFromHistory(index) {
  try {
    // Obter histórico atual
    const data = await chrome.storage.local.get('history');
    let history = data.history || [];
    
    // Remover o item
    if (index >= 0 && index < history.length) {
      history.splice(index, 1);
      
      // Salvar histórico atualizado
      await chrome.storage.local.set({ history });
      
      // Recarregar a lista
      loadHistory();
      
      showNotification('Item removido do histórico', 'success');
    }
  } catch (error) {
    console.error('Erro ao remover do histórico:', error);
    showNotification('Erro ao remover item do histórico', 'error');
  }
}

// Função para limpar todo o histórico
async function clearHistory() {
  // Confirmar antes de limpar
  if (!confirm('Tem certeza que deseja limpar todo o histórico?')) {
    return;
  }
  
  try {
    // Limpar histórico
    await chrome.storage.local.remove('history');
    
    // Recarregar lista vazia
    loadHistory();
    
    showNotification('Histórico limpo com sucesso', 'success');
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    showNotification('Erro ao limpar histórico', 'error');
  }
}

// Função para iniciar o scanner de câmera
async function startCameraScanner() {
  try {
    // Verificar suporte à câmera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Seu navegador não suporta acesso à câmera');
    }
    
    // Obter acesso à câmera
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    
    // Conectar stream ao elemento de vídeo
    elements.cameraPreview.srcObject = cameraStream;
    
    // Mostrar container da câmera
    elements.cameraContainer.style.display = 'flex';
    
    // Iniciar scanner em intervalos
    scannerInterval = setInterval(() => {
      scanQRCodeFromVideo();
    }, 500);
  } catch (error) {
    console.error('Erro ao acessar câmera:', error);
    showNotification(`Erro ao acessar câmera: ${error.message}`, 'error');
  }
}

// Função para parar o scanner de câmera
function stopCameraScanner() {
  // Parar o intervalo de escaneamento
  if (scannerInterval) {
    clearInterval(scannerInterval);
    scannerInterval = null;
  }
  
  // Parar a stream da câmera
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  
  // Ocultar container da câmera
  elements.cameraContainer.style.display = 'none';
}

// Função para escanear QR code do vídeo
function scanQRCodeFromVideo() {
  if (!cameraStream || !elements.cameraPreview.videoWidth) return;
  
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = elements.cameraPreview;
    
    // Definir dimensões do canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Desenhar frame atual no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Obter dados da imagem
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Tentar decodificar QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });
    
    // Se encontrou um QR code
    if (code) {
      // Parar o scanner
      stopCameraScanner();
      
      // Mostrar resultado
      showQRCodeResult(code.data);
    }
  } catch (error) {
    console.error('Erro ao escanear QR code:', error);
  }
}

// Função para capturar frame da câmera e escanear
function captureFromCamera() {
  if (!cameraStream || !elements.cameraPreview.videoWidth) {
    showNotification('Câmera não está pronta', 'warning');
    return;
  }
  
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = elements.cameraPreview;
    
    // Definir dimensões do canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Desenhar frame atual no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Obter dados da imagem
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Tentar decodificar QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });
    
    // Se encontrou um QR code
    if (code) {
      // Parar o scanner
      stopCameraScanner();
      
      // Mostrar resultado
      showQRCodeResult(code.data);
    } else {
      showNotification('Nenhum QR code detectado', 'warning');
    }
  } catch (error) {
    console.error('Erro ao capturar frame:', error);
    showNotification('Erro ao processar imagem', 'error');
  }
}

// Função para lidar com seleção de arquivo
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Verificar se é uma imagem
  if (!file.type.match('image.*')) {
    showNotification('Por favor, selecione uma imagem', 'warning');
    return;
  }
  
  // Carregar a imagem
  const reader = new FileReader();
  reader.onload = (e) => {
    loadImageForReading(e.target.result);
  };
  reader.readAsDataURL(file);
}

// Função para carregar imagem para leitura
function loadImageForReading(dataUrl) {
  // Mostrar preview da imagem
  elements.qrImagePreview.src = dataUrl;
  elements.imagePreview.style.display = 'flex';
  
  // Criar imagem para processamento
  const image = new Image();
  image.onload = () => {
    // Criar canvas para processar a imagem
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Definir dimensões do canvas
    canvas.width = image.width;
    canvas.height = image.height;
    
    // Desenhar imagem no canvas
    context.drawImage(image, 0, 0);
    
    // Obter dados da imagem
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Tentar decodificar QR code
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });
      
      if (code) {
        // Mostrar resultado
        showQRCodeResult(code.data);
      } else {
        showNotification('Nenhum QR code detectado na imagem', 'warning');
      }
    } catch (error) {
      console.error('Erro ao decodificar QR code:', error);
      showNotification('Erro ao processar a imagem', 'error');
    }
  };
  
  image.src = dataUrl;
}

// Função para fechar preview de imagem
function closeImagePreview() {
  elements.imagePreview.style.display = 'none';
  elements.qrImagePreview.src = '';
}

// Função para mostrar resultado da leitura de QR code
function showQRCodeResult(text) {
  if (!text) return;
  
  // Preencher texto e estilizar como link se for URL
  const isUrl = text.match(/^https?:\/\//i);
  
  if (isUrl) {
    elements.qrReadText.innerHTML = `<a href="${text}" target="_blank" style="color: #0066cc; text-decoration: underline;">${text}</a>`;
    elements.qrReadLink.href = text;
    elements.qrReadLink.textContent = 'Abrir em nova aba';
    elements.qrReadLink.style.display = 'block';
    elements.openQrResult.style.display = 'flex';
  } else {
    elements.qrReadText.textContent = text;
    elements.qrReadLink.style.display = 'none';
    elements.openQrResult.style.display = 'none';
  }
  
  // Mostrar resultado
  elements.qrReadResult.style.display = 'block';
}

// Função para copiar texto do resultado
function copyQrResultText() {
  const text = elements.qrReadText.textContent;
  if (!text) return;
  
  navigator.clipboard.writeText(text)
    .then(() => {
      showNotification('Texto copiado para a área de transferência', 'success');
    })
    .catch(error => {
      console.error('Erro ao copiar texto:', error);
      showNotification('Erro ao copiar texto', 'error');
    });
}

// Função para abrir URL do resultado
function openQrResultUrl() {
  const text = elements.qrReadText.textContent;
  if (!text || !text.match(/^https?:\/\//i)) return;
  
  // Abrir URL em nova aba
  chrome.tabs.create({ url: text });
}

// Função para gerar QR code a partir do resultado
function generateFromResult() {
  const text = elements.qrReadText.textContent;
  if (!text) return;
  
  // Preencher campo de texto
  elements.qrText.value = text;
  
  // Mudar para aba de geração
  switchTab('generate');
  
  // Gerar QR code
  generateQRCode();
}

// Funções para gerenciar configurações
function updateSetting(event) {
  const target = event.target;
  const settingName = target.id.replace('setting', '');
  const settingKey = settingName.charAt(0).toLowerCase() + settingName.slice(1);
  
  // Atualizar valor na configuração
  if (target.type === 'checkbox') {
    settings[settingKey] = target.checked;
  } else if (target.type === 'color') {
    settings[settingKey] = target.value;
  } else if (target.type === 'range') {
    settings[settingKey] = parseInt(target.value);
  }
  
  // Salvar configurações
  saveSettings();
}

// Função para atualizar configuração com valor exibido
function updateSettingWithValue(event) {
  const target = event.target;
  const settingName = target.id.replace('setting', '');
  const settingKey = settingName.charAt(0).toLowerCase() + settingName.slice(1);
  const valueElement = document.getElementById(`${target.id}Value`);
  
  // Atualizar valor na configuração
  settings[settingKey] = parseInt(target.value);
  
  // Atualizar texto do valor
  if (settingKey === 'maxHistoryItems') {
    valueElement.textContent = `${target.value} itens`;
  } else if (settingKey === 'defaultQrSize') {
    valueElement.textContent = `${target.value}px`;
  }
  
  // Salvar configurações
  saveSettings();
}

// Função para salvar configurações
async function saveSettings() {
  try {
    await chrome.storage.sync.set({ settings });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    showNotification('Erro ao salvar configurações', 'error');
  }
}

// Função para resetar configurações
async function resetSettings() {
  // Confirmar antes de resetar
  if (!confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
    return;
  }
  
  // Definir valores padrão
  settings = {
    maxHistoryItems: 10,
    defaultQrSize: 200,
    defaultForeground: '#000000',
    defaultBackground: '#ffffff',
    saveHistory: true,
    showNotifications: true
  };
  
  // Atualizar controles
  initializeControls();
  
  // Salvar configurações
  await saveSettings();
  
  showNotification('Configurações restauradas com sucesso', 'success');
}

// Função para exportar configurações
function exportSettings() {
  // Criar objeto com configurações e histórico
  const exportData = {
    settings: settings,
    exportDate: new Date().toISOString()
  };
  
  // Converter para JSON
  const jsonData = JSON.stringify(exportData, null, 2);
  
  // Criar blob e link para download
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `qrcode-settings-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  // Liberar URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
  
  showNotification('Configurações exportadas com sucesso', 'success');
}

// Função para importar configurações
async function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    // Ler arquivo
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validar dados
    if (!data.settings) {
      throw new Error('Arquivo inválido');
    }
    
    // Atualizar configurações
    settings = { ...settings, ...data.settings };
    
    // Atualizar controles
    initializeControls();
    
    // Salvar configurações
    await saveSettings();
    
    showNotification('Configurações importadas com sucesso', 'success');
  } catch (error) {
    console.error('Erro ao importar configurações:', error);
    showNotification('Erro ao importar configurações', 'error');
  }
  
  // Limpar input de arquivo
  event.target.value = '';
}

// Funções para gerenciar tema
function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Salvar tema
  chrome.storage.sync.set({ theme: newTheme });
  
  // Aplicar tema
  applyTheme(newTheme);
}

// Função para aplicar tema
async function applyTheme(theme) {
  if (!theme) {
    // Carregar tema das configurações
    const data = await chrome.storage.sync.get('theme');
    theme = data.theme || 'light';
  }
  
  // Aplicar classe ao body
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

// Funções para botões de ação
function enableActionButtons() {
  elements.copyQR.disabled = false;
  elements.downloadQR.disabled = false;
  elements.showInPageQR.disabled = false;
}

// Funções de utilidade
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Função para mostrar notificação
function showNotification(message, type = 'info') {
  // Verificar se notificações estão habilitadas
  if (!settings.showNotifications) return;
  
  // Definir classe com base no tipo
  elements.notification.className = `notification ${type}`;
  
  // Definir mensagem
  elements.notificationMessage.textContent = message;
  
  // Mostrar notificação
  elements.notification.classList.add('visible');
  
  // Esconder após 3 segundos
  setTimeout(hideNotification, 3000);
}

// Função para esconder notificação
function hideNotification() {
  elements.notification.classList.remove('visible');
}

// Função de debounce para evitar chamadas excessivas
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Comunicação com o background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateHistory') {
    loadHistory();
    sendResponse({ success: true });
    return true;
  }
});

