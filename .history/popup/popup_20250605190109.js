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
