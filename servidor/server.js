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

app.use(cors());
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

// 5. Inicializa o cliente do Gemini com configuração otimizada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 1000,
  },
});

// 5.1. Função para chamar a API do Gemini com retry automático
async function callGeminiWithRetry(generateFunction, maxRetries = 3) {
  const baseDelay = 1000; // 1 segundo
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Tentativa ${attempt}/${maxRetries} - Chamando Gemini API...`);
      const result = await generateFunction();
      console.log(`✅ Sucesso na tentativa ${attempt}`);
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isRetriableError = error.message.includes('overloaded') || 
                              error.message.includes('503') ||
                              error.message.includes('429') ||
                              error.message.includes('quota');
      
      console.warn(`⚠️ Tentativa ${attempt} falhou: ${error.message}`);
      
      if (!isRetriableError || isLastAttempt) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s...
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

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
      timeout: 10000 // 10 segundos timeout
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

// Health check com teste da API Gemini
app.get('/health', async (req, res) => {
  try {
    // Teste básico da API Gemini
    const testPrompt = "Responda apenas: OK";
    const testResult = await callGeminiWithRetry(() => 
      model.generateContent(testPrompt), 1 // Apenas 1 tentativa para health check
    );
    
    res.json({ 
      status: 'ok', 
      service: 'Inclua-AI Server',
      api: 'Google Gemini 1.5 Flash',
      geminiStatus: 'available',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    // API indisponível, mas servidor está funcionando
    res.status(200).json({ 
      status: 'degraded', 
      service: 'Inclua-AI Server',
      api: 'Google Gemini 1.5 Flash',
      geminiStatus: 'unavailable',
      geminiError: error.message.includes('overloaded') ? 'overloaded' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
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

    const result = await callGeminiWithRetry(() => 
      model.generateContent([prompt, ...imageParts])
    );
    const description = result.response.text().trim();

    const responseTime = Date.now() - startTime;
    console.log(`✅ Descrição gerada em ${responseTime}ms: ${description.substring(0, 100)}...`);
    
    res.json({ description });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Erro após ${responseTime}ms:`, error.message);
    
    // Tratamento específico de erros da API Gemini
    if (error.message.includes('overloaded') || error.message.includes('503')) {
      res.status(503).json({ 
        error: 'Serviço de IA temporariamente sobrecarregado. Tente novamente em alguns segundos.',
        retryAfter: 5
      });
    } else if (error.message.includes('SAFETY')) {
      res.status(400).json({ error: 'Imagem rejeitada por questões de segurança.' });
    } else if (error.message.includes('quota') || error.message.includes('429')) {
      res.status(429).json({ 
        error: 'Quota da API excedida. Tente novamente mais tarde.',
        retryAfter: 60
      });
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

    const result = await callGeminiWithRetry(() => 
      model.generateContent(prompt)
    );
    const summarizedText = result.response.text().trim();

    console.log('✅ Resumo gerado com sucesso');
    res.json({ summarizedText });
    
  } catch (error) {
    console.error('❌ Erro ao resumir texto:', error.message);
    
    // Tratamento específico de erros da API Gemini
    if (error.message.includes('overloaded') || error.message.includes('503')) {
      res.status(503).json({ 
        error: 'Serviço de IA temporariamente sobrecarregado. Tente novamente em alguns segundos.',
        retryAfter: 5
      });
    } else if (error.message.includes('quota') || error.message.includes('429')) {
      res.status(429).json({ 
        error: 'Quota da API excedida. Tente novamente mais tarde.',
        retryAfter: 60
      });
    } else {
      res.status(500).json({ error: 'Falha ao gerar resumo do texto.' });
    }
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

    const result = await callGeminiWithRetry(() => 
      model.generateContent(prompt)
    );
    const simplifiedText = result.response.text().trim();

    console.log('✅ Texto simplificado gerado');
    res.json({ simplifiedText });
    
  } catch (error) {
    console.error('❌ Erro ao simplificar texto:', error.message);
    res.status(500).json({ error: 'Falha ao simplificar o texto.' });
  }
});

// NOVA FEATURE: Análise de contraste de cores
app.post('/analyze-contrast', rateLimitMiddleware, async (req, res) => {
  console.log('🎨 Recebida requisição para analisar contraste...');
  
  try {
    const { foregroundColor, backgroundColor, elementType = 'texto' } = req.body;
    
    if (!foregroundColor || !backgroundColor) {
      return res.status(400).json({ error: 'Cores de primeiro plano e fundo são obrigatórias.' });
    }

    const prompt = `Analise o contraste entre as cores fornecidas para acessibilidade web:

CORES:
- Primeiro plano (texto): ${foregroundColor}
- Fundo: ${backgroundColor}
- Tipo de elemento: ${elementType}

Forneça uma análise completa incluindo:
1. Ratio de contraste aproximado
2. Conformidade com WCAG (AA/AAA)
3. Sugestões de melhoria se necessário
4. Cores alternativas mais acessíveis

Responda em formato JSON com as chaves: ratio, wcagCompliance, suggestions, alternativeColors`;

    const result = await callGeminiWithRetry(() => 
      model.generateContent(prompt)
    );
    const analysis = result.response.text().trim();

    console.log('✅ Análise de contraste gerada');
    res.json({ analysis });
    
  } catch (error) {
    console.error('❌ Erro ao analisar contraste:', error.message);
    res.status(500).json({ error: 'Falha ao analisar contraste de cores.' });
  }
});

// NOVA FEATURE: Geração de alt-text automático
app.post('/generate-alt-text', rateLimitMiddleware, async (req, res) => {
  console.log('🏷️ Recebida requisição para gerar alt-text...');
  
  try {
    const { imageUrl, context = '' } = req.body;
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'URL da imagem é obrigatória.' });
    }

    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({ error: 'URL da imagem inválida.' });
    }

    const imageParts = [await urlToGenerativePart(imageUrl)];
    const prompt = `Gere um texto alternativo (alt-text) otimizado para esta imagem:

CONTEXTO DA PÁGINA: ${context || 'Não fornecido'}

DIRETRIZES PARA ALT-TEXT:
- Máximo 125 caracteres
- Descreva a função/propósito da imagem no contexto
- Se decorativa, indique "Imagem decorativa"
- Se informativa, seja preciso e conciso
- Se complexa (gráfico/diagrama), descreva os dados principais
- Use linguagem clara e objetiva

Responda apenas com o alt-text, sem aspas ou explicações.`;

    const result = await callGeminiWithRetry(() => 
      model.generateContent([prompt, ...imageParts])
    );
    const altText = result.response.text().trim();

    console.log('✅ Alt-text gerado');
    res.json({ altText });
    
  } catch (error) {
    console.error('❌ Erro ao gerar alt-text:', error.message);
    res.status(500).json({ error: 'Falha ao gerar alt-text.' });
  }
});

// NOVA FEATURE: Análise de acessibilidade da página
app.post('/analyze-accessibility', rateLimitMiddleware, async (req, res) => {
  console.log('♿ Recebida requisição para análise de acessibilidade...');
  
  try {
    const { htmlContent, pageUrl = '' } = req.body;
    
    if (!htmlContent || typeof htmlContent !== 'string') {
      return res.status(400).json({ error: 'Conteúdo HTML é obrigatório.' });
    }

    const prompt = `Analise o código HTML fornecido para problemas de acessibilidade:

HTML:
${htmlContent}

URL da página: ${pageUrl}

Identifique e liste problemas de acessibilidade seguindo as diretrizes WCAG 2.1:

1. ESTRUTURA:
- Falta de headings hierárquicos
- Landmarks ARIA ausentes
- Elementos semânticos inadequados

2. IMAGENS:
- Alt-text ausente ou inadequado
- Imagens decorativas sem aria-hidden

3. FORMULÁRIOS:
- Labels ausentes
- Fieldsets sem legend
- Instruções inadequadas

4. NAVEGAÇÃO:
- Links sem texto descritivo
- Foco não visível
- Skip links ausentes

5. CORES E CONTRASTE:
- Dependência apenas de cor
- Contraste insuficiente

Forneça resposta em formato JSON com: problems (array), severity (high/medium/low), suggestions (array)`;

    const result = await callGeminiWithRetry(() => 
      model.generateContent(prompt)
    );
    const analysis = result.response.text().trim();

    console.log('✅ Análise de acessibilidade gerada');
    res.json({ analysis });
    
  } catch (error) {
    console.error('❌ Erro ao analisar acessibilidade:', error.message);
    res.status(500).json({ error: 'Falha ao analisar acessibilidade.' });
  }
});

// NOVA FEATURE: Explicação de fórmulas matemáticas
app.post('/explain-math', rateLimitMiddleware, async (req, res) => {
  console.log('🧮 Recebida requisição para explicar matemática...');
  
  try {
    const { mathExpression, level = 'intermediário' } = req.body;
    
    if (!mathExpression || typeof mathExpression !== 'string') {
      return res.status(400).json({ error: 'Expressão matemática é obrigatória.' });
    }

    const prompt = `Explique a seguinte expressão matemática de forma acessível:

EXPRESSÃO: ${mathExpression}
NÍVEL: ${level}

Forneça:
1. Leitura em português (como um leitor de tela leria)
2. Explicação passo a passo
3. Contexto/aplicação prática
4. Resultado (se aplicável)

Use linguagem adequada ao nível ${level} e seja muito claro para pessoas com deficiência visual.`;

    const result = await callGeminiWithRetry(() => 
      model.generateContent(prompt)
    );
    const explanation = result.response.text().trim();

    console.log('✅ Explicação matemática gerada');
    res.json({ explanation });
    
  } catch (error) {
    console.error('❌ Erro ao explicar matemática:', error.message);
    res.status(500).json({ error: 'Falha ao explicar expressão matemática.' });
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
  console.log(`📊 Features: 7 AI endpoints + health check`);
  console.log('🚀 ========================================');
});
