const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ ERRO: GEMINI_API_KEY não encontrada no arquivo .env');
    process.exit(1);
}

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        // This is a bit of a hack since the SDK doesn't expose listModels directly on the main class easily in all versions
        // But we can try to use the API directly if needed, or check if the SDK supports it.
        // Let's try a direct fetch which is more reliable for debugging raw API availability.

        console.log('🔍 Buscando modelos disponíveis via API REST...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Modelos encontrados:');
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log('Nenhum modelo encontrado na resposta.');
        }

    } catch (error) {
        console.error('❌ Erro ao listar modelos:', error);
    }
}

listModels();
