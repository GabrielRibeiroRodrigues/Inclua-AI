// TESTE RÁPIDO DA API GEMINI
// Execute: node teste-api-gemini.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

async function testarAPIGemini() {
    console.log('🧪 TESTE DA API GEMINI');
    console.log('='.repeat(50));
    
    // 1. Verificar se a API key existe
    console.log('1️⃣ Verificando API Key...');
    if (!process.env.GEMINI_API_KEY) {
        console.log('❌ GEMINI_API_KEY não encontrada!');
        return;
    }
    console.log('✅ API Key encontrada:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
    
    // 2. Inicializar cliente
    console.log('\n2️⃣ Inicializando cliente Gemini...');
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 100,
            },
        });
        console.log('✅ Cliente inicializado com sucesso');
        
        // 3. Teste simples de texto
        console.log('\n3️⃣ Testando geração de texto...');
        const prompt = 'Responda apenas "Teste bem-sucedido" se você conseguir me ouvir.';
        
        const startTime = Date.now();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const duration = Date.now() - startTime;
        
        console.log('✅ Resposta recebida em', duration + 'ms');
        console.log('📝 Resposta:', text);
        
        // 4. Verificar se a resposta faz sentido
        if (text.toLowerCase().includes('teste') || text.toLowerCase().includes('sucesso')) {
            console.log('✅ API funcionando perfeitamente!');
        } else {
            console.log('⚠️ API respondeu, mas resposta inesperada');
        }
        
    } catch (error) {
        console.log('❌ Erro ao testar API:', error.message);
        
        // Diagnóstico específico do erro
        if (error.message.includes('API_KEY_INVALID')) {
            console.log('💡 Solução: Verifique se a API key está correta');
        } else if (error.message.includes('quota')) {
            console.log('💡 Solução: Limite de requisições atingido, aguarde');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            console.log('💡 Solução: Verifique sua conexão com a internet');
        } else {
            console.log('💡 Erro desconhecido - verifique os logs do servidor');
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 Teste finalizado');
}

// Executar teste
testarAPIGemini();
