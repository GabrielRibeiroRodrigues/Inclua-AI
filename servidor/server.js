// Arquivo: servidor/server.js (GOOGLE GEMINI - VERSÃO OTIMIZADA)

// 1. Importa as bibliotecas
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

// 2. Carrega as variáveis de ambiente
dotenv.config();

// 3. Validação da chave de API
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ ERRO: GEMINI_API_KEY não encontrada no arquivo .env');
  console.log('💡 Crie um arquivo .env com: GEMINI_API_KEY=sua_chave_aqui');
  process.exit(1);
}

// 4. Inicializa o Express e middlewares
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumenta limite para imagens

// 5. Inicializa o cliente do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 1000,
  },
});

// 6. Função auxiliar melhorada para imagens
async function urlToGenerativePart(url) {
  try {
    console.log(`📥 Baixando imagem de: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`URL não é uma imagem válida. Content-Type: ${contentType}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    console.log(`✅ Imagem processada: ${base64.length} caracteres`);
    
    return {
      inlineData: {
        data: base64,
        mimeType: contentType,
      },
    };
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error.message);
    throw error;
  }
}

// 7. Rate limiting simples (em memória)
const requestCounts = new Map();
const RATE_LIMIT = 30; // requests por minuto
const RATE_WINDOW = 60000; // 1 minuto

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = requestCounts.get(ip) || [];
  
  // Remove requests antigas
  const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  return true;
}

// 8. Middleware de rate limiting
function rateLimitMiddleware(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ 
      error: 'Muitas requisições. Tente novamente em 1 minuto.',
      retryAfter: 60 
    });
  }
  
  next();
}

// 9. ENDPOINTS DA API

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Inclua-AI Server',
    api: 'Google Gemini 1.5 Flash',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Descrição de imagens
app.post('/describe-image', rateLimitMiddleware, async (req, res) => {
  const startTime = Date.now();
  console.log('🖼️ Recebida requisição para descrever imagem...');
  
  try {
    const { imageUrl } = req.body;
    
    // Validação de entrada
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'URL da imagem é obrigatória e deve ser uma string.' });
    }

    // Valida se é uma URL
    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({ error: 'URL da imagem inválida.' });
    }

    const imageParts = [await urlToGenerativePart(imageUrl)];
    const prompt = `Analise esta imagem e crie uma descrição acessível em português para pessoas com deficiência visual.

Diretrizes:
- Seja objetivo e conciso (máximo 2-3 frases)
- Descreva os elementos principais e o contexto
- Use linguagem clara e descritiva
- Foque no que é mais importante visualmente

Responda apenas com a descrição, sem explicações adicionais.`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const description = result.response.text().trim();

    const responseTime = Date.now() - startTime;
    console.log(`✅ Descrição gerada em ${responseTime}ms: ${description.substring(0, 100)}...`);
    
    res.json({ description });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Erro após ${responseTime}ms:`, error.message);
    
    if (error.message.includes('SAFETY')) {
      res.status(400).json({ error: 'Imagem rejeitada por questões de segurança.' });
    } else if (error.message.includes('quota')) {
      res.status(429).json({ error: 'Quota da API excedida. Tente novamente mais tarde.' });
    } else {
      res.status(500).json({ error: 'Falha ao gerar descrição da imagem.' });
    }
  }
});

// Resumo de texto
app.post('/summarize-text', rateLimitMiddleware, async (req, res) => {
  console.log('📝 Recebida requisição para resumir texto...');
  
  try {
    const { textToSummarize } = req.body;
    
    if (!textToSummarize || typeof textToSummarize !== 'string') {
      return res.status(400).json({ error: 'Texto para resumir é obrigatório.' });
    }

    if (textToSummarize.length < 50) {
      return res.status(400).json({ error: 'Texto muito curto para resumir (mínimo 50 caracteres).' });
    }

    if (textToSummarize.length > 10000) {
      return res.status(400).json({ error: 'Texto muito longo (máximo 10.000 caracteres).' });
    }

    const prompt = `Crie um resumo conciso e objetivo do texto a seguir em português:

TEXTO:
"${textToSummarize}"

INSTRUÇÕES:
- Extraia apenas os pontos mais importantes
- Use 2-4 frases máximo
- Mantenha o tom e contexto original
- Seja claro e direto

RESUMO:`;

    const result = await model.generateContent(prompt);
    const summarizedText = result.response.text().trim();

    console.log('✅ Resumo gerado com sucesso');
    res.json({ summarizedText });
    
  } catch (error) {
    console.error('❌ Erro ao resumir texto:', error.message);
    res.status(500).json({ error: 'Falha ao gerar resumo do texto.' });
  }
});

// Simplificação de texto
app.post('/simplify-text', rateLimitMiddleware, async (req, res) => {
  console.log('🔤 Recebida requisição para simplificar texto...');
  
  try {
    const { textToSimplify } = req.body;
    
    if (!textToSimplify || typeof textToSimplify !== 'string') {
      return res.status(400).json({ error: 'Texto para simplificar é obrigatório.' });
    }

    if (textToSimplify.length > 5000) {
      return res.status(400).json({ error: 'Texto muito longo para simplificar (máximo 5.000 caracteres).' });
    }

    const prompt = `Reescreva o texto a seguir em linguagem muito simples e acessível:

TEXTO ORIGINAL:
"${textToSimplify}"

INSTRUÇÕES:
- Use palavras simples e comuns
- Frases curtas e diretas
- Como se explicasse para uma criança de 12 anos
- Mantenha todas as informações importantes
- Não adicione opiniões próprias

TEXTO SIMPLIFICADO:`;

    const result = await model.generateContent(prompt);
    const simplifiedText = result.response.text().trim();

    console.log('✅ Texto simplificado gerado');
    res.json({ simplifiedText });
    
  } catch (error) {
    console.error('❌ Erro ao simplificar texto:', error.message);
    res.status(500).json({ error: 'Falha ao simplificar o texto.' });
  }
});

// 10. Middleware de erro global
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// 11. Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log(`� Servidor Inclua-AI rodando na porta ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🔗 Render: https://inclua-ai-servidor.onrender.com`);
  console.log(`🤖 API: Google Gemini 1.5 Flash`);
  console.log(`⚡ Rate Limit: ${RATE_LIMIT} req/min`);
  console.log('🚀 ========================================');
});
