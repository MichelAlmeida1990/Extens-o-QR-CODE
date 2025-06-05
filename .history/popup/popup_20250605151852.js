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

// State
let history = [];

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  setupEventListeners();
  generateQRCode();
});

function setupEventListeners() {
  qrText.addEventListener('input', generateQRCode);
  qrColor.addEventListener('input', generateQRCode);
  qrSize.addEventListener('input', () => {
    sizeValue.textContent = `${qrSize.value}px`;
    generateQRCode();
  });
  downloadBtn.addEventListener('click', downloadQRCode);
  copyBtn.addEventListener('click', copyQRCodeToClipboard);
  searchHistory.addEventListener('input', () => {
    filterHistory(searchHistory.value);
  });
}

function generateQRCode() {
  if (typeof QRCode === 'undefined') {
    console.error('QRCode library is not loaded.');
    qrcodeContainer.innerHTML = '<p>Error: QRCode library not loaded.</p>';
    return;
  }
  const text = qrText.value.trim();
  if (!text) {
    qrcodeContainer.innerHTML = '<p>Enter text or URL to generate QR Code</p>';
    return;
  }
  qrcodeContainer.innerHTML = '';
  const qrContainer = document.createElement('div');
  qrcodeContainer.appendChild(qrContainer);
  new QRCode(qrContainer, {
    text: text,
    width: parseInt(qrSize.value),
    height: parseInt(qrSize.value),
    colorDark: qrColor.value,
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
  addToHistory(text);
}

function downloadQRCode() {
  const img = qrcodeContainer.querySelector('img');
  if (!img) {
    console.error('No QR code image found.');
    return;
  }
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
      alert('QR Code copied to clipboard!');
    });
  } catch (error) {
    console.error('Error copying QR code:', error);
  }
}

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
    listItem.textContent = `${entry.text} (Generated on: ${new Date(entry.timestamp).toLocaleString()})`;
    historyList.appendChild(listItem);
  });
}

function filterHistory(query) {
  const filtered = history.filter(entry => entry.text.includes(query));
  historyList.innerHTML = '';
  filtered.forEach(entry => {
    const listItem = document.createElement('li');
    listItem.textContent = `${entry.text} (Generated on: ${new Date(entry.timestamp).toLocaleString()})`;
    historyList.appendChild(listItem);
  });
}
