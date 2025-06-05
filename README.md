# Gerador de QR Code Dinâmico

Uma extensão para navegador que permite gerar e personalizar códigos QR de forma rápida e fácil.

## Recursos

- Geração de QR codes a partir de texto ou URLs
- Personalização de cores e tamanhos
- Histórico de códigos gerados
- Opção para usar a URL atual ou texto selecionado
- Exportação de QR codes como imagens PNG
- Copiar para a área de transferência
- Interface amigável e responsiva

## Instalação

1. Baixe ou clone este repositório
2. Abra o Chrome e acesse `chrome://extensions/`
3. Ative o "Modo do programador" no canto superior direito
4. Clique em "Carregar sem compactação"
5. Selecione a pasta `qr-code-extension`

## Uso

1. Clique no ícone da extensão na barra de ferramentas
2. Digite o texto ou URL desejado
3. Personalize as opções conforme necessário
4. Clique em "Gerar"
5. Baixe ou copie o QR code gerado

### Atalhos

- **URL Atual**: Gera um QR code para a página atual
- **Texto Selecionado**: Gera um QR code para o texto selecionado na página
- **Menu de Contexto**: Clique com o botão direito em textos ou links para gerar QR codes rapidamente

## Personalização

Acesse as opções da extensão para:
- Definir tamanho padrão
- Escolher cor padrão
- Gerenciar histórico
- Configurar notificações

## Desenvolvimento

### Estrutura de Arquivos

```
qr-code-extension/
├── assets/
│   └── styles/
│       └── common.css
├── background/
│   └── background.js
├── content/
│   ├── content.css
│   └── content.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── libs/
│   └── qrcode.min.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── manifest.json
└── README.md
```

### Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- Chrome Extension API

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Autor

[Seu Nome] - [Seu Email]

## Agradecimentos

- [QRCode.js](https://davidshimjs.github.io/qrcodejs/) - Biblioteca para geração de QR codes
- Ícones por [Icons8](https://icons8.com)
