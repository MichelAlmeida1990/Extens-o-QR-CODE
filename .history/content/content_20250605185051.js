// content.js - Script que é injetado nas páginas web para interagir com o conteúdo

// Variáveis para controlar o overlay do QR Code
let qrOverlay = null;
let qrImage = null;
let qrCloseButton = null;
let qrDownloadButton = null;
let qrCopyButton = null;
let qrCaption = null;
let qrTimeout = null;

// Ouvir mensagens do background script ou popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'displayQrOverlay') {
    showQrCodeOverlay(message.qrData, message.qrOptions);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'hideQrOverlay') {
    hideQrCodeOverlay();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ text: selectedText });
    return true;
  }
});

// Função para mostrar o QR code como overlay na página
function showQrCodeOverlay(qrData, qrOptions = {}) {
  // Limpar qualquer overlay existente
  hideQrCodeOverlay();
  
  // Cancelar qualquer timeout pendente
  if (qrTimeout) {
    clearTimeout(qrTimeout);
    qrTimeout = null;
  }
  
  // Criar o elemento de overlay principal
  qrOverlay = document.createElement('div');
  qrOverlay.className = 'qr-code-overlay';
  
  // Criar o container do QR code
  const qrContainer = document.createElement('div');
  qrContainer.className = 'qr-code-container';
  
  // Criar a imagem do QR code
  qrImage = document.createElement('img');
  qrImage.className = 'qr-code-image';
  qrImage.alt = 'QR Code';
  qrImage.src = qrData.dataUrl || qrData;
  
  // Adicionar legenda se fornecida
  if (qrData.text) {
    qrCaption = document.createElement('div');
    qrCaption.className = 'qr-code-caption';
    
    // Limitar o texto a 50 caracteres para evitar legendas muito longas
    const displayText = qrData.text.length > 50 
      ? qrData.text.substring(0, 47) + '...' 
      : qrData.text;
    
    qrCaption.textContent = displayText;
    
    // Se for uma URL, torná-la clicável
    if (qrData.text.match(/^https?:\/\//i)) {
      qrCaption.classList.add('qr-code-url');
      qrCaption.addEventListener('click', () => {
        window.open(qrData.text, '_blank');
      });
    }
  }
  
  // Criar botão de fechar
  qrCloseButton = document.createElement('button');
  qrCloseButton.className = 'qr-code-close-button';
  qrCloseButton.innerHTML = '&times;';
  qrCloseButton.title = 'Fechar';
  qrCloseButton.addEventListener('click', hideQrCodeOverlay);
  
  // Criar botão de download
  qrDownloadButton = document.createElement('button');
  qrDownloadButton.className = 'qr-code-action-button qr-code-download-button';
  qrDownloadButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';
  qrDownloadButton.title = 'Download QR Code';
  qrDownloadButton.addEventListener('click', () => {
    downloadQrCode(qrData.dataUrl || qrData, qrData.text || 'qrcode');
  });
  
  // Criar botão de copiar
  qrCopyButton = document.createElement('button');
  qrCopyButton.className = 'qr-code-action-button qr-code-copy-button';
  qrCopyButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
  qrCopyButton.title = 'Copiar QR Code';
  qrCopyButton.addEventListener('click', () => {
    copyQrCodeToClipboard(qrData.dataUrl || qrData);
  });
  
  // Criar barra de ações
  const actionBar = document.createElement('div');
  actionBar.className = 'qr-code-action-bar';
  actionBar.appendChild(qrDownloadButton);
  actionBar.appendChild(qrCopyButton);
  
  // Montar o container
  qrContainer.appendChild(qrCloseButton);
  qrContainer.appendChild(qrImage);
  if (qrCaption) {
    qrContainer.appendChild(qrCaption);
  }
  qrContainer.appendChild(actionBar);
  
  // Adicionar o container ao overlay
  qrOverlay.appendChild(qrContainer);
  
  // Adicionar o overlay à página
  document.body.appendChild(qrOverlay);
  
  // Adicionar evento para fechar ao clicar fora
  qrOverlay.addEventListener('click', (e) => {
    if (e.target === qrOverlay) {
      hideQrCodeOverlay();
    }
  });
  
  // Tornar o overlay visível com animação
  setTimeout(() => {
    qrOverlay.classList.add('visible');
  }, 10);
  
  // Configurar auto-fechamento se especificado
  if (qrOptions.autoClose && typeof qrOptions.autoClose === 'number') {
    qrTimeout = setTimeout(() => {
      hideQrCodeOverlay();
    }, qrOptions.autoClose);
  }
  
  // Adicionar tecla de escape para fechar
  document.addEventListener('keydown', handleEscapeKey);
}

// Função para esconder o overlay do QR code
function hideQrCodeOverlay() {
  if (qrOverlay) {
    // Adicionar classe para animar a saída
    qrOverlay.classList.remove('visible');
    
    // Remover após a animação
    setTimeout(() => {
      if (qrOverlay && qrOverlay.parentNode) {
        qrOverlay.parentNode.removeChild(qrOverlay);
      }
      qrOverlay = null;
      qrImage = null;
      qrCloseButton = null;
      qrDownloadButton = null;
      qrCopyButton = null;
      qrCaption = null;
    }, 300); // Corresponde à duração da transição CSS
    
    // Remover o listener de tecla escape
    document.removeEventListener('keydown', handleEscapeKey);
  }
  
  // Limpar qualquer timeout pendente
  if (qrTimeout) {
    clearTimeout(qrTimeout);
    qrTimeout = null;
  }
}

// Função para lidar com a tecla Escape
function handleEscapeKey(e) {
  if (e.key === 'Escape' && qrOverlay) {
    hideQrCodeOverlay();
  }
}

// Função para fazer download do QR code
function downloadQrCode(dataUrl, text) {
  const filename = `qrcode-${text.replace(/[^a-z0-9]/gi, '-').substring(0, 30)}.png`;
  
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Mostrar feedback de sucesso
  showActionFeedback('download');
}

// Função para copiar o QR code para a área de transferência
function copyQrCodeToClipboard(dataUrl) {
  // Converter dataUrl para blob
  fetch(dataUrl)
    .then(res => res.blob())
    .then(blob => {
      // Criar um ClipboardItem
      const item = new ClipboardItem({ 'image/png': blob });
      
      // Copiar para a área de transferência
      navigator.clipboard.write([item])
        .then(() => {
          console.log('QR code copiado para a área de transferência');
          showActionFeedback('copy');
        })
        .catch(err => {
          console.error('Erro ao copiar QR code: ', err);
          showActionFeedback('error');
        });
    });
}

// Função para mostrar feedback visual após uma ação
function showActionFeedback(action) {
  if (!qrOverlay) return;
  
  // Remover qualquer feedback anterior
  const existingFeedback = qrOverlay.querySelector('.qr-action-feedback');
  if (existingFeedback) {
    existingFeedback.parentNode.removeChild(existingFeedback);
  }
  
  // Criar elemento de feedback
  const feedback = document.createElement('div');
  feedback.className = 'qr-action-feedback';
  
  // Definir mensagem e classe com base na ação
  switch (action) {
    case 'copy':
      feedback.textContent = 'QR Code copiado!';
      feedback.classList.add('success');
      break;
    case 'download':
      feedback.textContent = 'QR Code baixado!';
      feedback.classList.add('success');
      break;
    case 'error':
      feedback.textContent = 'Erro na operação!';
      feedback.classList.add('error');
      break;
    default:
      feedback.textContent = 'Operação concluída!';
      feedback.classList.add('info');
  }
  
  // Adicionar ao container
  const container = qrOverlay.querySelector('.qr-code-container');
  container.appendChild(feedback);
  
  // Animar entrada
  setTimeout(() => {
    feedback.classList.add('visible');
  }, 10);
  
  // Remover após alguns segundos
  setTimeout(() => {
    feedback.classList.remove('visible');
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 300);
  }, 2000);
}

// Detectar cliques em elementos que podem conter QR codes
document.addEventListener('click', (e) => {
  // Implementar detecção de QR codes em imagens se necessário
});

// Notificar que o script de conteúdo foi carregado
chrome.runtime.sendMessage({ action: 'contentScriptLoaded' });
