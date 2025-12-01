# 📘 Manual do Usuário - Inclua-AI

Bem-vindo ao **Inclua-AI**, sua ferramenta completa de acessibilidade web potencializada por Inteligência Artificial. Este documento serve como um guia prático para instalação, uso e aproveitamento máximo de todas as funcionalidades.

---

## 🌟 Visão Geral do Projeto

O Inclua-AI é um widget que pode ser adicionado a qualquer site para torná-lo instantaneamente mais acessível. Ele combina recursos tradicionais (como aumento de fonte e contraste) com ferramentas avançadas de IA (como descrição de imagens e resumo de textos).

### Principais Componentes
1.  **Widget (Frontend)**: A interface flutuante que o usuário vê e interage no site.
2.  **Servidor (Backend)**: O "cérebro" que processa as requisições de IA usando o Google Gemini.

---

## 🚀 Guia de Início Rápido

Siga estes passos para rodar o projeto no seu computador em menos de 5 minutos.

### Pré-requisitos
-   **Node.js** instalado (versão 18 ou superior).
-   Uma **Chave de API do Google Gemini** (Gratuita no Google AI Studio).

### Passo a Passo

1.  **Baixe o Projeto**
    Se você tem o git instalado:
    ```bash
    git clone https://github.com/GabrielRibeiroRodrigues/Inclua-AI.git
    cd Inclua-AI
    ```
    *Ou apenas baixe o ZIP e extraia.*

2.  **Configure o Servidor**
    Abra o terminal na pasta do projeto e entre na pasta do servidor:
    ```bash
    cd servidor
    npm install
    ```

3.  **Configure a Chave de API**
    Crie um arquivo chamado `.env` dentro da pasta `servidor` e adicione sua chave:
    ```env
    GEMINI_API_KEY=sua_chave_aqui_colada_sem_aspas
    PORT=3000
    ```

4.  **Inicie o Servidor**
    Ainda na pasta `servidor`, execute:
    ```bash
    npm start
    ```
    Você verá uma mensagem de sucesso indicando que o servidor está rodando na porta 3000.

5.  **Teste a Aplicação**
    Abra seu navegador e acesse:
    `http://localhost:3000/index-new.html`

    Você verá o ícone de acessibilidade no canto da tela!

---

## 📖 Como Usar as Funcionalidades

### 🎨 Ajustes Visuais
No painel "Ajustes Visuais", você pode personalizar a aparência do site:
-   **Aumentar/Diminuir Fonte**: Ajuste o tamanho do texto para melhor leitura.
-   **Modo Escuro**: Inverte as cores para um tema escuro confortável.
-   **Destacar Links**: Adiciona uma borda e cor de destaque a todos os links clicáveis.

### 👁️ Filtros para Daltonismo
No painel "Filtros para Daltonismo", selecione o tipo de visão para ajustar as cores do site automaticamente:
-   **Protanopia**: Para dificuldade com vermelho.
-   **Deuteranopia**: Para dificuldade com verde.
-   **Tritanopia**: Para dificuldade com azul.
-   **Acromatopsia**: Para visão em tons de cinza.

### 🔊 Assistente de Leitura
-   **Leitor de Texto**: Ative esta opção e **selecione qualquer texto** na página com o mouse. O assistente lerá o texto em voz alta para você.

### 🤖 IA para Acessibilidade (Recursos Avançados)
Estas funções usam inteligência artificial e precisam do servidor rodando.

#### 1. Descrever Imagem 🖼️
-   Ative o botão "Descrever Imagem".
-   O cursor do mouse mudará para uma mira.
-   **Clique em qualquer imagem** do site.
-   Aguarde alguns segundos e uma janela abrirá com uma descrição detalhada do que há na imagem.
-   Você pode ouvir a descrição ou copiá-la.

#### 2. Resumir Texto 📝
-   Ative o botão "Resumir Texto".
-   **Selecione um texto longo** (mínimo 50 caracteres) na página.
-   Uma janela abrirá com um resumo inteligente dos pontos principais.

---

## ❓ Solução de Problemas Comuns

**O widget não abre ou dá erro de conexão.**
-   Verifique se o servidor está rodando (`npm start` na pasta `servidor`).
-   Verifique se o terminal não mostra erros.

**A IA diz "Erro ao processar imagem" ou "Quota excedida".**
-   Verifique se sua chave de API no arquivo `.env` está correta.
-   A chave gratuita tem limites de uso por minuto. Aguarde um pouco e tente novamente.

**As imagens não são descritas.**
-   O servidor precisa conseguir acessar a imagem. Imagens que estão apenas no seu computador (file://) podem não funcionar se o servidor não tiver acesso a elas. Em `localhost` geralmente funciona bem.

---

## 📞 Suporte

Se tiver dúvidas técnicas, consulte o arquivo `README.md` para detalhes de desenvolvimento ou entre em contato com o desenvolvedor.
