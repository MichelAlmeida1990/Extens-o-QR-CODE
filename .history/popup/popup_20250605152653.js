// DOM Elements
const qrText = document.getElementById('qr-text');
const qrColor = document.getElementById('qr-color');
const qrSize = document.getElementById('qr-size');
const sizeValue = document.getElementById('size-value');
const qrcodeContainer = document.getElementById('qrcode');
const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');
const searchHistory = document.getElementById('search-history');
const historyList = document.getElementById('history-list');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// State
let history = [];
const MAX_HISTORY_ITEMS = 50;

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for QRCode library to load
  await waitForQRCode();
  setupTabs();
  loadHistory();
  setupEventListeners();
});

async function waitForQRCode(attempts = 0) {
  if (attempts > 10) {
    showError('Failed to load QRCode library. Please reload the extension.');
    return;
  }
  
  if (typeof QRCode === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
    return waitForQRCode(attempts + 1);
  }
}

function setupTabs() {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

function setupEventListeners() {
  qrText.addEventListener('input', () => {
    if (qrText.value.trim()) {
      generateQRCode();
    } else {
      qrcodeContainer.innerHTML = '<p>Enter text or URL to generate QR Code</p>';
    }
  });
  
  qrColor.addEventListener('input', generateQRCode);
  qrSize.addEventListener('input', () => {
    sizeValue.textContent = `${qrSize.value}px`;
    generateQRCode();
  });
  
  downloadBtn.addEventListener('click', downloadQRCode);
  copyBtn.addEventListener('click', copyQRCodeToClipboard);
  searchHistory.addEventListener('input', () => filterHistory(searchHistory.value));

  // Sync with chrome.storage
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.qrHistory) {
      history = changes.qrHistory.newValue || [];
      updateHistoryList();
    }
  });
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  qrcodeContainer.innerHTML = '';
  qrcodeContainer.appendChild(errorDiv);
}

function generateQRCode() {
  if (typeof QRCode === 'undefined') {
    showError('QRCode library not loaded. Please reload the extension.');
    return;
  }
  
  const text = qrText.value.trim();
  if (!text) {
    qrcodeContainer.innerHTML = '<p>Enter text or URL to generate QR Code</p>';
    return;
  }
  
  try {
    qrcodeContainer.innerHTML = '';
    const qrContainer = document.createElement('div');
    qrcodeContainer.appendChild(qrContainer);
    
    const qr = new QRCode(qrContainer, {
      text: text,
      width: parseInt(qrSize.value),
      height: parseInt(qrSize.value),
      colorDark: qrColor.value,
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    // Verify if QR Code was generated successfully
    const img = qrContainer.querySelector('img');
    if (!img || img.src === '') {
      throw new Error('Failed to generate QR Code image');
    }
    
    addToHistory(text);
  } catch (error) {
    console.error('QR Code generation error:', error);
    showError('Failed to generate QR Code. Please try again.');
  }
}

function downloadQRCode() {
  try {
    const img = qrcodeContainer.querySelector('img');
    if (!img) {
      showError('No QR code to download. Generate one first.');
      return;
    }
    
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = img.src;
    link.click();
  } catch (error) {
    showError('Failed to download QR Code. Please try again.');
    console.error('Download error:', error);
  }
}

async function copyQRCodeToClipboard() {
  try {
    const img = qrcodeContainer.querySelector('img');
    if (!img) {
      showError('No QR code to copy. Generate one first.');
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    
    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = 'QR Code copied to clipboard!';
    qrcodeContainer.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 2000);
  } catch (error) {
    showError('Failed to copy QR Code. Please try again.');
    console.error('Copy error:', error);
  }
}

function addToHistory(text) {
  const timestamp = new Date().toISOString();
  
  // Add to local history
  history.unshift({ text, timestamp });
  if (history.length > MAX_HISTORY_ITEMS) {
    history = history.slice(0, MAX_HISTORY_ITEMS);
  }
  
  // Update UI
  updateHistoryList();
  
  // Sync with chrome.storage
  chrome.runtime.sendMessage({
    action: 'addToHistory',
    text: text
  });
}

function loadHistory() {
  chrome.storage.local.get(['qrHistory'], (result) => {
    history = result.qrHistory || [];
    updateHistoryList();
  });
}

function updateHistoryList() {
  historyList.innerHTML = '';
  history.forEach(entry => {
    const listItem = document.createElement('li');
    listItem.className = 'history-item';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'history-text';
    textSpan.textContent = entry.text;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'history-time';
    timeSpan.textContent = new Date(entry.timestamp).toLocaleString();
    
    const useButton = document.createElement('button');
    useButton.className = 'history-use-btn';
    useButton.textContent = 'Use';
    useButton.onclick = () => {
      qrText.value = entry.text;
      generateQRCode();
      document.querySelector('[data-tab="generator"]').click();
    };
    
    listItem.appendChild(textSpan);
    listItem.appendChild(timeSpan);
    listItem.appendChild(useButton);
    historyList.appendChild(listItem);
  });
}

function filterHistory(query) {
  const filtered = history.filter(entry => 
    entry.text.toLowerCase().includes(query.toLowerCase())
  );
  
  historyList.innerHTML = '';
  filtered.forEach(entry => {
    const listItem = document.createElement('li');
    listItem.className = 'history-item';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'history-text';
    textSpan.textContent = entry.text;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'history-time';
    timeSpan.textContent = new Date(entry.timestamp).toLocaleString();
    
    const useButton = document.createElement('button');
    useButton.className = 'history-use-btn';
    useButton.textContent = 'Use';
    useButton.onclick = () => {
      qrText.value = entry.text;
      generateQRCode();
      document.querySelector('[data-tab="generator"]').click();
    };
    
    listItem.appendChild(textSpan);
    listItem.appendChild(timeSpan);
    listItem.appendChild(useButton);
    historyList.appendChild(listItem);
  });
}
