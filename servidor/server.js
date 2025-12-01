// Arquivo: servidor/server.js (GOOGLE GEMINI - VERSÃO OTIMIZADA)

// 1. Importa as bibliotecas
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// 2. Carrega as variáveis de ambiente do arquivo .env no diretório atual
dotenv.config({ path: path.join(__dirname, '.env') });

// 3. Validação da chave de API
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ ERRO: GEMINI_API_KEY não encontrada no arquivo .env');
  console.log('💡 Crie um arquivo .env com: GEMINI_API_KEY=sua_chave_aqui');
  process.exit(1);
}

// 4. Inicializa o Express e middlewares
const app = express();
// path já foi importado acima

// Configurar CORS para permitir bookmarklet
app.use(cors({
  origin: ['*'], // Permitir qualquer origem para bookmarklet
  credentials: false,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' })); // Aumenta limite para imagens

// Middleware para log de requisições
app.use((req, res, next) => {
  const start = Date.now();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.url;

    const emoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
    console.log(`${emoji} ${method} ${url} - ${status} (${duration}ms) [${ip}]`);
  });

  next();
});

// Servir arquivos estáticos do diretório pai (onde estão index.html, widget.js, etc.)
app.use(express.static(path.join(__dirname, '..')));

// Rota principal para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 5. Inicializa o cliente do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-flash-latest',
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 1000,
  },
});

// 6. Função auxiliar melhorada para imagens com validação de segurança
async function urlToGenerativePart(url) {
  try {
    console.log(`📥 Baixando imagem de: ${url.substring(0, 100)}...`);

    // Validações de segurança
    const urlObj = new URL(url);

    // Bloquear protocolos inseguros
    if (!['http:', 'https:', 'data:'].includes(urlObj.protocol)) {
      throw new Error('Protocolo de URL não permitido');
    }

    // Bloquear IPs locais (para prevenir SSRF)
    if (urlObj.hostname.match(/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|localhost$|0\.0\.0\.0$)/)) {
      throw new Error('Acesso a recursos locais não permitido');
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Inclua-AI/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 segundos timeout com AbortSignal
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`URL não é uma imagem válida. Content-Type: ${contentType}`);
    }

    // Verificar tamanho da imagem
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
      throw new Error('Imagem muito grande (máximo 10MB)');
    }

    const buffer = await response.arrayBuffer();

    // Verificar tamanho real
    if (buffer.byteLength > 10 * 1024 * 1024) {
      throw new Error('Imagem muito grande (máximo 10MB)');
    }

    const base64 = Buffer.from(buffer).toString('base64');

    console.log(`✅ Imagem processada: ${(buffer.byteLength / 1024).toFixed(1)}KB`);

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

// 7. Rate limiting inteligente (em memória)
const requestCounts = new Map();
const RATE_LIMIT = 20; // requests por minuto (mais restritivo)
const RATE_WINDOW = 60000; // 1 minuto
const BURST_LIMIT = 5; // máximo 5 requests em 10 segundos
const BURST_WINDOW = 10000; // 10 segundos

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = requestCounts.get(ip) || [];

  // Remove requests antigas
  const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);
  const burstRequests = userRequests.filter(time => now - time < BURST_WINDOW);

  // Verificar limite de burst
  if (burstRequests.length >= BURST_LIMIT) {
    return { allowed: false, reason: 'burst' };
  }

  // Verificar limite geral
  if (recentRequests.length >= RATE_LIMIT) {
    return { allowed: false, reason: 'rate' };
  }

  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  return { allowed: true };
}

// 8. Middleware de rate limiting melhorado
function rateLimitMiddleware(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  const rateCheck = checkRateLimit(clientIP);

  if (!rateCheck.allowed) {
    const message = rateCheck.reason === 'burst'
      ? 'Muitas requisições muito rápidas. Aguarde 10 segundos.'
      : 'Limite de requisições excedido. Tente novamente em 1 minuto.';

    const retryAfter = rateCheck.reason === 'burst' ? 10 : 60;

    return res.status(429).json({
      error: message,
      retryAfter,
      type: rateCheck.reason
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

    const prompt = `Analise o texto a seguir e crie um resumo inteligente e profissional em português:

TEXTO PARA ANÁLISE:
"${textToSummarize}"

DIRETRIZES PARA O RESUMO:
- Extraia APENAS os pontos mais essenciais e relevantes
- Use linguagem clara, objetiva e profissional
- Máximo de 3 frases concisas
- Mantenha o contexto e significado original
- Não mencione que é um resumo, vá direto ao conteúdo
- Seja preciso e informativo

Responda apenas com o conteúdo resumido, sem prefixos ou explicações:`;

    const result = await model.generateContent(prompt);
    const summarizedText = result.response.text().trim();

    console.log('✅ Resumo gerado com sucesso');
    res.json({ summarizedText });

  } catch (error) {
    console.error('❌ Erro ao resumir texto:', error.message);
    res.status(500).json({ error: 'Falha ao gerar resumo do texto.' });
  }
});

// 10. Middleware de erro global
app.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  console.error(`❌ [${timestamp}] Erro não tratado de ${ip}:`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent')
  });

  res.status(500).json({
    error: 'Erro interno do servidor.',
    timestamp,
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
});

// 11. Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log(`🎯 Servidor Inclua-AI rodando na porta ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🔗 Render: https://inclua-ai-servidor.onrender.com`);
  console.log(`🤖 API: Google Gemini 1.5 Flash`);
  console.log(`⚡ Rate Limit: ${RATE_LIMIT} req/min (burst: ${BURST_LIMIT} req/10s)`);
  console.log(`🛡️ Segurança: SSRF protection, size limits, timeout controls`);
  console.log(`📊 Features: 2 AI endpoints + health check`);
  console.log('🚀 ========================================');
});

// 12. Handlers para evitar encerramento inesperado
process.on('uncaughtException', (error) => {
  console.error('❌ [UNCAUGHT EXCEPTION] Erro não tratado:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Não finalizar o processo, apenas log o erro
  console.log('⚠️ Servidor continuando após erro não tratado...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UNHANDLED REJECTION] Promise rejeitada:', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString()
  });

  // Não finalizar o processo, apenas log o erro
  console.log('⚠️ Servidor continuando após promise rejeitada...');
});

process.on('SIGTERM', () => {
  console.log('📊 Recebido SIGTERM. Iniciando graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📊 Recebido SIGINT (Ctrl+C). Finalizando servidor...');
  process.exit(0);
});

// Log de status a cada 5 minutos
setInterval(() => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  console.log(`💚 [STATUS] Servidor ativo há ${Math.floor(uptime / 60)}min | RAM: ${Math.floor(memUsage.heapUsed / 1024 / 1024)}MB`);
}, 5 * 60 * 1000);