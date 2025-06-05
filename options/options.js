// DOM Elements
const defaultSizeInput = document.getElementById('default-size');
const sizeValue = document.getElementById('size-value');
const defaultColorInput = document.getElementById('default-color');
const autoCopyCheckbox = document.getElementById('auto-copy');
const showNotificationCheckbox = document.getElementById('show-notification');
const clearHistoryBtn = document.getElementById('clear-history');
const exportHistoryBtn = document.getElementById('export-history');
const importHistoryBtn = document.getElementById('import-history');
const importFileInput = document.getElementById('import-file');
const historyCount = document.getElementById('history-count');
const storageUsage = document.getElementById('storage-usage');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');

// Default settings
const defaultSettings = {
  defaultSize: 200,
  defaultColor: '#000000',
  autoCopy: true,
  showNotification: true
};

// Initialize the options page
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateHistoryStats();
  setupEventListeners();
});

// Load saved settings
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(Object.keys(defaultSettings));
    
    // Apply saved settings or defaults
    const settings = { ...defaultSettings, ...result };
    
    defaultSizeInput.value = settings.defaultSize;
    sizeValue.textContent = `${settings.defaultSize}px`;
    defaultColorInput.value = settings.defaultColor;
    autoCopyCheckbox.checked = settings.autoCopy;
    showNotificationCheckbox.checked = settings.showNotification;
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Update history statistics
async function updateHistoryStats() {
  try {
    const result = await chrome.storage.local.get('qrHistory');
    const history = result.qrHistory || [];
    
    // Update count
    historyCount.textContent = history.length;
    
    // Calculate storage usage (approximate)
    const usage = JSON.stringify(history).length;
    storageUsage.textContent = `${Math.ceil(usage / 1024)} KB`;
    
  } catch (error) {
    console.error('Error updating history stats:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Update size value display
  defaultSizeInput.addEventListener('input', () => {
    sizeValue.textContent = `${defaultSizeInput.value}px`;
  });
  
  // Clear history button
  clearHistoryBtn.addEventListener('click', clearHistory);
  
  // Export history button
  exportHistoryBtn.addEventListener('click', exportHistory);
  
  // Import history button
  importHistoryBtn.addEventListener('click', () => {
    importFileInput.click();
  });
  
  // Handle file import
  importFileInput.addEventListener('change', importHistory);
  
  // Save button
  saveBtn.addEventListener('click', saveSettings);
  
  // Reset button
  resetBtn.addEventListener('click', resetToDefaults);
}

// Clear all history
async function clearHistory() {
  if (!confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  try {
    await chrome.storage.local.set({ qrHistory: [] });
    updateHistoryStats();
    showMessage('Histórico limpo com sucesso!', 'success');
  } catch (error) {
    console.error('Error clearing history:', error);
    showMessage('Erro ao limpar o histórico.', 'error');
  }
}

// Export history to JSON file
async function exportHistory() {
  try {
    const result = await chrome.storage.local.get('qrHistory');
    const history = result.qrHistory || [];
    
    if (history.length === 0) {
      showMessage('Nenhum item no histórico para exportar.', 'info');
      return;
    }
    
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    showMessage('Histórico exportado com sucesso!', 'success');
    
  } catch (error) {
    console.error('Error exporting history:', error);
    showMessage('Erro ao exportar o histórico.', 'error');
  }
}

// Import history from JSON file
async function importHistory(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!confirm('Importar histórico substituirá o histórico atual. Deseja continuar?')) {
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      const history = JSON.parse(e.target.result);
      
      // Validate imported data
      if (!Array.isArray(history) || !history.every(item => item.text && item.timestamp)) {
        throw new Error('Formato de arquivo inválido');
      }
      
      await chrome.storage.local.set({ qrHistory: history });
      updateHistoryStats();
      showMessage('Histórico importado com sucesso!', 'success');
      
    } catch (error) {
      console.error('Error importing history:', error);
      showMessage('Erro ao importar o histórico. Certifique-se de que o arquivo está no formato correto.', 'error');
    }
    
    // Reset file input
    event.target.value = '';
  };
  
  reader.onerror = () => {
    showMessage('Erro ao ler o arquivo.', 'error');
    event.target.value = '';
  };
  
  reader.readAsText(file);
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      defaultSize: parseInt(defaultSizeInput.value, 10),
      defaultColor: defaultColorInput.value,
      autoCopy: autoCopyCheckbox.checked,
      showNotification: showNotificationCheckbox.checked
    };
    
    await chrome.storage.sync.set(settings);
    showMessage('Configurações salvas com sucesso!', 'success');
    
    // Notify other parts of the extension about settings change
    chrome.runtime.sendMessage({ action: 'settingsUpdated' });
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('Erro ao salvar as configurações.', 'error');
  }
}

// Reset settings to defaults
async function resetToDefaults() {
  if (!confirm('Tem certeza que deseja redefinir todas as configurações para os valores padrão?')) {
    return;
  }
  
  try {
    // Reset sync settings
    await chrome.storage.sync.clear();
    
    // Reload default settings
    await loadSettings();
    
    showMessage('Configurações redefinidas para os valores padrão.', 'success');
    
  } catch (error) {
    console.error('Error resetting settings:', error);
    showMessage('Erro ao redefinir as configurações.', 'error');
  }
}

// Show status message
function showMessage(message, type = 'info') {
  // Remove any existing messages
  const existingMessage = document.querySelector('.status-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = `status-message ${type}`;
  messageEl.textContent = message;
  
  // Style the message
  messageEl.style.position = 'fixed';
  messageEl.style.bottom = '20px';
  messageEl.style.left = '50%';
  messageEl.style.transform = 'translateX(-50%)';
  messageEl.style.padding = '10px 20px';
  messageEl.style.borderRadius = '4px';
  messageEl.style.color = 'white';
  messageEl.style.zIndex = '1000';
  messageEl.style.opacity = '0';
  messageEl.style.transition = 'opacity 0.3s';
  
  // Set background color based on message type
  if (type === 'success') {
    messageEl.style.backgroundColor = '#27ae60';
  } else if (type === 'error') {
    messageEl.style.backgroundColor = '#e74c3c';
  } else if (type === 'info') {
    messageEl.style.backgroundColor = '#3498db';
  } else {
    messageEl.style.backgroundColor = '#7f8c8d';
  }
  
  // Add to page
  document.body.appendChild(messageEl);
  
  // Trigger fade in
  setTimeout(() => {
    messageEl.style.opacity = '1';
  }, 10);
  
  // Auto-remove after delay
  setTimeout(() => {
    messageEl.style.opacity = '0';
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 300);
  }, 3000);
}
