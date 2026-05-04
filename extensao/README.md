# 🚀 Extensão Inclua-AI para Chrome

A versão de extensão do Inclua-AI carrega automaticamente em **TODAS** as páginas que você visita. Sem bookmarklets, sem cliques!

## 📦 Arquivos da Extensão

```
extensao/
├── manifest.json       # Configuração da extensão
├── background.js       # Service worker
├── content.js          # Script injetado em páginas
├── popup.html          # UI do popup
├── popup.js            # Lógica do popup
├── welcome.html        # Página de boas-vindas
└── icons/              # Ícones da extensão
```

## ⚙️ Como Instalar em Desenvolvimento (Chrome/Edge)

### Passo 1: Abra o gerenciador de extensões
- **Chrome**: `chrome://extensions`
- **Edge**: `edge://extensions`

### Passo 2: Ative o "Modo de desenvolvedor"
Clique em "Modo de desenvolvedor" no canto superior direito

### Passo 3: Carregue a extensão
Clique em "Carregar extensão sem empacotar" e selecione a pasta `extensao/`

### Pronto! ✅
A extensão está instalada e funcionando! O widget aparecerá automaticamente em todas as páginas.

---

## 🔧 Configuração

### URL do Servidor

A extensão tenta conectar em:
1. **Primeiro**: `http://localhost:3000` (desenvolvimento local)
2. **Fallback**: `https://inclua-ai-servidor.onrender.com` (produção)

Se você estiver rodando o servidor local, certifique-se que está em `http://localhost:3000`

---

## 📱 Funcionamento

### Carregamento Automático
- Widget é injetado em todas as páginas automaticamente
- Não precisa de bookmarklet
- Não precisa clicar toda vez que muda de página
- Preferências são salvas localmente

### Popup da Extensão
Clique no ícone do Inclua-AI no navegador para:
- Ativar/desativar o widget
- Ver status do servidor
- Acessar configurações
- Ver ajuda

---

## 🐛 Troubleshooting

### Widget não aparece?
1. Verifique o console do navegador (`F12`)
2. Certifique-se que o servidor está rodando em `http://localhost:3000`
3. Recarregue a página (`F5`)
4. Verifique se a extensão está habilitada em `chrome://extensions`

### Erro de CORS?
A extensão usa `<all_urls>` e CORS já está configurado no servidor

### Widget desaparece ao recarregar página?
Isso é normal. O script de conteúdo reinjetar automaticamente.

---

## 📝 Publicar na Chrome Web Store

Quando estiver pronto para publicar:

1. Crie ícones profissionais:
   - 16x16px
   - 48x48px
   - 128x128px

2. Empacote a extensão:
   ```bash
   cd extensao
   zip -r ../inclua-ai-extension.zip *
   ```

3. Envie para [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore)

---

## 🔐 Privacidade

- Nenhum dado pessoal é coletado
- Tudo roda localmente no navegador
- Apenas comunicação com Google Gemini API para IA
- Preferências salvas em `chrome.storage.local`

---

## 📄 Licença

MIT - Veja LICENSE para detalhes

---

**Desenvolvido com ❤️ para uma web mais acessível**
