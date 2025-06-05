// DOM Elements
const qrText = document.getElementById('qr-text');
const qrColor = document.getElementById('qr-color');
const qrSize = document.getElementById('qr-size');
const sizeValue = document.getElementById('size-value');
const qrcodeContainer = document.getElementById('qrcode');
const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');
const currentUrlBtn = document.getElementById('current-url');
const selectedTextBtn = document.getElementById('selected-text');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const searchHistory = document.getElementById('search-history');
const historyList = document.getElementById('history-list');

// State
let qrCode = null;
let history = [];

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Initialize tabs
  setupTabs();
  
  // Load saved history
  loadHistory();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize QR code with default values
  generateQRCode();
});

function setupTabs() {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab') + '-tab';
      document.getElementById(tabId).classList.add('active');
    });
  });
}

function setupEventListeners() {
  // Generate QR code when text changes
  qrText.addEventListener('input', generateQRCode);
  
  // Update QR code when color or size changes
  qrColor.addEventListener('input', generateQRCode);
  qrSize.addEventListener('input', () => {
    sizeValue.textContent = `${qrSize.value}px`;
    generateQRCode();
  });
  
  // Button click handlers
  currentUrlBtn.addEventListener('click', useCurrentUrl);
  selectedTextBtn.addEventListener('click', useSelectedText);
  downloadBtn.addEventListener('click', downloadQRCode);
  copyBtn.addEventListener('click', copyQRCodeToClipboard);
  
  // Search history
  searchHistory.addEventListener('input', filterHistory);
}

function generateQRCode() {
  const text = qrText.value.trim();
  if (!text) {
    qrcodeContainer.innerHTML = '<p>Digite um texto ou URL para gerar o QR Code</p>';
    return;
  }
  
  console.log('Gerando QR Code para:', text);
  
  try {
    // Clear previous QR code
    qrcodeContainer.innerHTML = '';
    
    // Create container for QR code
    const qrContainer = document.createElement('div');
    qrcodeContainer.appendChild(qrContainer);
    
    // Generate QR code using the correct API for the library
    const qrCode = new QRCode(qrContainer, {
      text: text,
      width: parseInt(qrSize.value),
      height: parseInt(qrSize.value),
      colorDark: qrColor.value,
      colorLight: '#ffffff',
      correctLevel: 2 // H (30% error correction)
    });
    
    // Store the QR code instance if needed later
    window.currentQRCode = qrCode;
    
    console.log('QR Code gerado com sucesso!');
    
    // Add to history
    addToHistory(text);
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    qrcodeContainer.innerHTML = '<p>Erro ao gerar QR Code. Tente novamente.</p>';
  }
}

async function useCurrentUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    qrText.value = tab.url;
    generateQRCode();
  } catch (error) {
    console.error('Error getting current URL:', error);
  }
}

async function useSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject content script to get selected text
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString().trim()
    });
    
    const selectedText = results[0].result;
    if (selectedText) {
      qrText.value = selectedText;
      generateQRCode();
    } else {
      alert('Nenhum texto selecionado na página atual.');
    }
  } catch (error) {
    console.error('Error getting selected text:', error);
  }
}

function downloadQRCode() {
  const img = qrcodeContainer.querySelector('img');
  if (!img) return;
  
  // Create download link directly from the image
  const link = document.createElement('a');
  link.download = `qrcode-${Date.now()}.png`;
  link.href = img.src;
  link.click();
}

async function copyQRCodeToClipboard() {
  try {
    const img = qrcodeContainer.querySelector('img');
    if (!img) return;
    
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match image
    canvas.width = img.naturalWidth || 200;
    canvas.height = img.naturalHeight || 200;
    
    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });
    
    if (!blob) {
      throw new Error('Falha ao criar a imagem do QR Code');
    }
    
    // Copy to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    
    // Show success feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copiado!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error('Erro ao copiar QR code:', error);
    alert('Não foi possível copiar o QR Code para a área de transferência.');
  }
}

// History functions
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get('qrHistory');
    history = result.qrHistory || [];
    renderHistory();
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

async function addToHistory(text) {
  if (!text) return;
  
  // Check if already in history
  const existingIndex = history.findIndex(item => item.text === text);
  
  if (existingIndex >= 0) {
    // Move to top if already exists
    history.splice(existingIndex, 1);
  }
  
  // Add to beginning of array
  history.unshift({
    text,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 50 items
  if (history.length > 50) {
    history = history.slice(0, 50);
  }
  
  // Save to storage
  await chrome.storage.local.set({ qrHistory: history });
  
  // Update UI
  renderHistory();
}

function renderHistory(filter = '') {
  const filteredHistory = filter 
    ? history.filter(item => 
        item.text.toLowerCase().includes(filter.toLowerCase())
      )
    : history;
  
  historyList.innerHTML = filteredHistory.length > 0
    ? filteredHistory.map(item => `
        <div class="history-item" data-text="${escapeHtml(item.text)}">
          <div class="history-text">${truncateText(item.text, 50)}</div>
          <div class="history-date">${formatDate(item.timestamp)}</div>
        </div>
      `).join('')
    : '<p>Nenhum item no histórico</p>';
  
  // Add click handlers to history items
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const text = item.getAttribute('data-text');
      qrText.value = text;
      // Switch to generator tab
      document.querySelector('[data-tab="generator"]').click();
      generateQRCode();
    });
  });
}

function filterHistory() {
  renderHistory(searchHistory.value);
}

// Utility functions
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return escapeHtml(text);
  return escapeHtml(text.substring(0, maxLength)) + '...';
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Verificar se QRCode está disponível
if (typeof QRCode === 'undefined') {
  console.error('QRCode não está definido. Certifique-se de que a biblioteca foi carregada corretamente.');
}

// Testar inicialização do objeto QRCode
try {
  const testQRCode = new QRCode(document.createElement('div'), { text: 'Test' });
  console.log('QRCode inicializado com sucesso:', testQRCode);
} catch (error) {
  console.error('Erro ao inicializar QRCode:', error);
}
