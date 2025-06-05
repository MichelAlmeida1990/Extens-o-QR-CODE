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
  searchHistory.addEventListener('input', () => {
    filterHistory(searchHistory.value);
  });
}

function generateQRCode() {
  if (typeof QRCode === 'undefined') {
    console.error('QRCode library is not loaded.');
    qrcodeContainer.innerHTML = '<p>Erro: Biblioteca QRCode não carregada.</p>';
    return;
  }
  const text = qrText.value.trim();
  if (!text) {
    qrcodeContainer.innerHTML = '<p>Digite um texto ou URL para gerar o QR Code</p>';
    return;
  }
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
      correctLevel: QRCode.CorrectLevel.H
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
    if (!img) {
      console.error('No QR code image found.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(async (blob) => {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('QR Code copiado para a área de transferência!');
    });
  } catch (error) {
    console.error('Error copying QR code:', error);
  }
}

// History functions
function addToHistory(text) {
  const timestamp = new Date().toISOString();
  history.push({ text, timestamp });
  localStorage.setItem('qrHistory', JSON.stringify(history));
  updateHistoryList();
}

function loadHistory() {
  const savedHistory = localStorage.getItem('qrHistory');
  if (savedHistory) {
    history = JSON.parse(savedHistory);
    updateHistoryList();
  }
}

function updateHistoryList() {
  historyList.innerHTML = '';
  history.forEach(entry => {
    const listItem = document.createElement('li');
    listItem.textContent = `${entry.text} (Gerado em: ${new Date(entry.timestamp).toLocaleString()})`;
    historyList.appendChild(listItem);
  });
}

function filterHistory(query) {
  const filtered = history.filter(entry => entry.text.includes(query));
  historyList.innerHTML = '';
  filtered.forEach(entry => {
    const listItem = document.createElement('li');
    listItem.textContent = `${entry.text} (Gerado em: ${new Date(entry.timestamp).toLocaleString()})`;
    historyList.appendChild(listItem);
  });
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
