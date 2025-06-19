// Arquivo: servidor/server.js

// 1. Importa as bibliotecas
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

// 2. Carrega as variáveis de ambiente (sua chave de API)
dotenv.config();

// 3. Inicializa o Express e o CORS
const app = express();
app.use(cors()); // Permite requisições de outras origens (seu widget)
app.use(express.json()); // Permite que o servidor entenda JSON

// 4. Inicializa o cliente do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Usamos o modelo mais recente e rápido

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

// 5. Cria o endpoint que vai receber a imagem e retornar a descrição
app.post('/describe-image', async (req, res) => {
  console.log('Recebida requisição para descrever imagem...');
  
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL da imagem não fornecida.' });
    }

    const imageParts = [await urlToGenerativePart(imageUrl)];

    const prompt = 'Descreva esta imagem de forma concisa para fins de acessibilidade (texto alternativo). Seja objetivo e direto. Responda em português.';

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const description = response.text();

    console.log('Descrição gerada:', description);
    res.json({ description });

  } catch (error) {
    console.error('Erro ao processar a imagem:', error);
    res.status(500).json({ error: 'Falha ao gerar descrição da imagem.' });
  }
});

// 6. Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});
// Adicione este novo endpoint ao seu arquivo servidor/server.js

app.post('/simplify-text', async (req, res) => {
  console.log('Recebida requisição para simplificar texto...');
  
  try {
    const { textToSimplify } = req.body;
    if (!textToSimplify) {
      return res.status(400).json({ error: 'Nenhum texto fornecido.' });
    }

    // O prompt é a chave para a IA. Pedimos a ela para atuar como um simplificador.
    const prompt = `Reescreva o texto a seguir em uma linguagem muito simples, como se estivesse explicando para uma criança de 12 anos. Use frases curtas e palavras comuns. Não adicione opiniões, apenas simplifique o conteúdo. O texto é: "${textToSimplify}"`;

    // Usa o mesmo modelo do Gemini que já está configurado
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const simplifiedText = response.text();

    console.log('Texto simplificado gerado.');
    res.json({ simplifiedText });

  } catch (error) {
    console.error('Erro ao simplificar o texto:', error);
    res.status(500).json({ error: 'Falha ao simplificar o texto.' });
  }
});