// This script runs in the context of web pages

// Add a style element for our QR code overlay
const style = document.createElement('style');
style.textContent = `
  .qr-code-overlay {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    max-width: 300px;
    font-family: Arial, sans-serif;
  }
  
  .qr-code-overlay h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: #333;
  }
  
  .qr-code-overlay-close {
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: #666;
  }
  
  .qr-code-overlay-close:hover {
    color: #000;
  }
  
  .qr-code-image {
    max-width: 100%;
    height: auto;
    margin: 10px 0;
  }
  
  .qr-code-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  
  .qr-code-button {
    padding: 5px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f5f5f5;
    cursor: pointer;
    font-size: 12px;
  }
  
  .qr-code-button:hover {
    background: #e5e5e5;
  }
  
  .qr-code-button.primary {
    background: #4a90e2;
    color: white;
    border-color: #3a7bc8;
  }
  
  .qr-code-button.primary:hover {
    background: #3a7bc8;
  }
`;
document.head.appendChild(style);

// Function to show QR code overlay
function showQRCodeOverlay(qrCodeUrl, text) {
  // Remove existing overlay if any
  const existingOverlay = document.querySelector('.qr-code-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'qr-code-overlay';
  
  // Generate a shortened version of the text for display
  const displayText = text.length > 50 ? text.substring(0, 47) + '...' : text;
  
  overlay.innerHTML = `
    <button class="qr-code-overlay-close" title="Fechar">&times;</button>
    <h3>QR Code gerado</h3>
    <div>${escapeHtml(displayText)}</div>
    <img class="qr-code-image" src="${qrCodeUrl}" alt="QR Code">
    <div class="qr-code-actions">
      <button class="qr-code-button download-btn" title="Baixar QR Code">
        <span>Baixar</span>
      </button>
      <button class="qr-code-button primary copy-btn" title="Copiar QR Code">
        <span>Copiar</span>
      </button>
    </div>
  `;
  
  // Add close button handler
  const closeButton = overlay.querySelector('.qr-code-overlay-close');
  closeButton.addEventListener('click', () => {
    overlay.remove();
  });
  
  // Add download button handler
  const downloadButton = overlay.querySelector('.download-btn');
  downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
  });
  
  // Add copy button handler
  const copyButton = overlay.querySelector('.copy-btn');
  copyButton.addEventListener('click', async () => {
    try {
      // Fetch the QR code image
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      
      // Show feedback
      const originalText = copyButton.textContent;
      copyButton.textContent = 'Copiado!';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Error copying QR code:', error);
    }
  });
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Close when clicking outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  // Close with Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showQRCode') {
    showQRCodeOverlay(request.qrCodeUrl, request.text);
  }
});
