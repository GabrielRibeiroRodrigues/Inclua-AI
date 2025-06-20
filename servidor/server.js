// Arquivo: servidor/server.js (CORRIGIDO)

// 1. Importa as bibliotecas
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

// 2. Carrega as variáveis de ambiente (sua chave de API)
dotenv.config();

// 3. Inicializa o Express e o CORS
const app = express();
app.use(cors());
app.use(express.json());

// 4. Inicializa o cliente do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Função auxiliar para converter uma URL de imagem em dados que a IA entende
async function urlToGenerativePart(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buffer).toString('base64'),
      mimeType: response.headers.get('content-type'),
    },
  };
}

// 5. Define TODOS os endpoints da API

app.post('/describe-image', async (req, res) => {
  console.log('Recebida requisição para descrever imagem...');
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'URL da imagem não fornecida.' });

    const imageParts = [await urlToGenerativePart(imageUrl)];
    const prompt = 'Descreva esta imagem de forma concisa para fins de acessibilidade (texto alternativo). Seja objetivo e direto. Responda em português.';
    const result = await model.generateContent([prompt, ...imageParts]);
    const description = result.response.text();

    console.log('Descrição gerada:', description);
    res.json({ description });
  } catch (error) {
    console.error('Erro ao processar a imagem:', error);
    res.status(500).json({ error: 'Falha ao gerar descrição da imagem.' });
  }
});

app.post('/summarize-text', async (req, res) => {
  console.log('Recebida requisição para resumir texto...');
  try {
    const { textToSummarize } = req.body;
    if (!textToSummarize) return res.status(400).json({ error: 'Nenhum texto fornecido.' });

    const prompt = `Você é um especialista em comunicação e síntese. Sua tarefa é criar um resumo conciso e objetivo do texto a seguir, em português. Extraia apenas as informações mais importantes e essenciais. O resumo deve ter no máximo 3 ou 4 sentenças. Texto a ser resumido: "${textToSummarize}"`;
    const result = await model.generateContent(prompt);
    const summarizedText = result.response.text();

    console.log('Resumo gerado com sucesso.');
    res.json({ summarizedText });
  } catch (error) {
    console.error('Erro ao resumir o texto:', error);
    res.status(500).json({ error: 'Falha ao gerar o resumo do texto.' });
  }
});

app.post('/simplify-text', async (req, res) => {
  console.log('Recebida requisição para simplificar texto...');
  try {
    const { textToSimplify } = req.body;
    if (!textToSimplify) return res.status(400).json({ error: 'Nenhum texto fornecido.' });

    const prompt = `Reescreva o texto a seguir em uma linguagem muito simples, como se estivesse explicando para uma criança de 12 anos. Use frases curtas e palavras comuns. Não adicione opiniões, apenas simplifique o conteúdo. O texto é: "${textToSimplify}"`;
    const result = await model.generateContent(prompt);
    const simplifiedText = result.response.text();

    console.log('Texto simplificado gerado.');
    res.json({ simplifiedText });
  } catch (error) {
    console.error('Erro ao simplificar o texto:', error);
    res.status(500).json({ error: 'Falha ao simplificar o texto.' });
  }
});

// 6. Inicia o servidor (SEMPRE NO FINAL DO ARQUIVO)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT} ou na porta do Render`);
});
