const { createHuggingFace } = require('@ai-sdk/huggingface');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { createOpenAI } = require('@ai-sdk/openai');
const { streamText } = require('ai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Mocking environment variables for testing if needed, or using .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function verifyFallback() {
    console.log('\n--- VERIFYING API FALLBACK LOGIC ---');

    // Simulate what's in route.js
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    console.log('Keys detected:', {
        HF: !!hfKey,
        Gemini: !!geminiKey,
        OpenAI: !!openaiKey
    });

    const messages = [{ role: 'user', content: 'Say "Fallback Test Successful"' }];

    // We can't easily mock the entire POST route without a server, 
    // but we can test the sequence of model attempts.

    const providers = [];
    if (hfKey) {
        const hf = createHuggingFace({ apiKey: hfKey });
        providers.push({ name: 'Hugging Face (Llama 3.1 70B)', model: hf('meta-llama/Meta-Llama-3.1-70B-Instruct') });
    }
    if (geminiKey) {
        const google = createGoogleGenerativeAI({ apiKey: geminiKey });
        providers.push({ name: 'Google Gemini 2.0 Flash', model: google('gemini-2.0-flash-001') });
    }
    if (openaiKey) {
        const openai = createOpenAI({ apiKey: openaiKey });
        providers.push({ name: 'OpenAI GPT-4o Mini', model: openai('gpt-4o-mini') });
    }

    for (const { name, model } of providers) {
        try {
            console.log(`\n>>> Testing ${name}...`);
            const { textStream } = await streamText({
                model: model,
                messages: messages,
                maxTokens: 20
            });

            let fullText = '';
            for await (const delta of textStream) {
                fullText += delta;
            }

            console.log(`>>> ${name} SUCCESS: "${fullText.trim()}"`);
            // In the real route, we would return here. 
            // For verification, we can optionally continue to test others, 
            // but let's just confirm the sequence works.

        } catch (error) {
            console.error(`!!! ${name} FAILED:`, error.message);
            console.log('Moving to next provider...');
        }
    }
}

verifyFallback().catch(console.error);
