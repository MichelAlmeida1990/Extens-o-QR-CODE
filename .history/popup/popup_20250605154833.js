// DOM Elements
let qrText, qrColor, qrSize, sizeValue, qrcodeContainer, downloadBtn, copyBtn, searchHistory, historyList, tabButtons, tabContents;

// Initialize DOM elements
function initializeElements() {
  qrText = document.getElementById('qr-text');
  qrColor = document.getElementById('qr-color');
  qrSize = document.getElementById('qr-size');
  sizeValue = document.getElementById('size-value');
  qrcodeContainer = document.getElementById('qrcode');
  downloadBtn = document.getElementById('download-btn');
  copyBtn = document.getElementById('copy-btn');
  searchHistory = document.getElementById('search-history');
  historyList = document.getElementById('history-list');
  tabButtons = document.querySelectorAll('.tab-button');
  tabContents = document.querySelectorAll('.tab-content');
}

// State
let history = [];
const MAX_HISTORY_ITEMS = 50;

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  if (typeof QRCode === 'undefined') {
    showError('QRCode library not loaded. Please reload the extension.');
    return;
  }

  // Initialize DOM elements first
  initializeElements();
  
  // Then setup tabs
  setupTabs();
  
  // Show initial tab (generator)
  document.querySelector('[data-tab="generator"]').click();
  
  loadHistory();
  setupEventListeners();
  
  // Configurar o valor inicial do tamanho
  sizeValue.textContent = `${qrSize.value}px`;
});

function setupTabs() {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and content
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to current button and content
      button.classList.add('active');
      const tabContent = document.getElementById(`${tabId}-tab`);
      if (tabContent) {
        tabContent.classList.add('active');
      }
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

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function makeQRCodeClickable(container, text) {
  if (isValidUrl(text)) {
    container.style.cursor = 'pointer';
    container.title = 'Click to open URL';
    container.addEventListener('click', () => {
      chrome.tabs.create({ url: text });
    });
  }
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
    // Clear previous QR code
    qrcodeContainer.innerHTML = '';

    // Create new container
    const qrContainer = document.createElement('div');
    qrContainer.style.padding = '10px';
    qrcodeContainer.appendChild(qrContainer);
    
    // Initialize QR Code with basic options first
    const qr = new QRCode(qrContainer, {
      width: parseInt(qrSize.value),
      height: parseInt(qrSize.value)
    });

    // Then make the QR code
    qr.makeCode(text);

    // Wait for the image to be created
    const checkImage = setInterval(() => {
      const img = qrContainer.querySelector('img');
      if (img && img.complete) {
        clearInterval(checkImage);
        addToHistory(text);

        // Apply colors after image is generated
        if (img.style) {
          img.style.border = 'none';
          const canvas = qrContainer.querySelector('canvas');
          if (canvas) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = qrColor.value;
            context.fillRect(0, 0, canvas.width, canvas.height);
          }
        }

        // Make QR Code clickable if it's a valid URL
        makeQRCodeClickable(qrContainer, text);
      }
    }, 50);

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
