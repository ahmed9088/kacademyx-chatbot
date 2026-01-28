const { createHuggingFace } = require('@ai-sdk/huggingface');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { createOpenAI } = require('@ai-sdk/openai');
const { generateText } = require('ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testProvider(name, model) {
    console.log(`\n>>> Testing ${name}...`);
    try {
        const { text } = await generateText({
            model: model,
            prompt: 'Say "Hello"',
            maxTokens: 5
        });
        console.log(`SUCCESS: "${text}"`);
        return true;
    } catch (error) {
        console.error(`FAILED:`, error.message);
        if (error.data) {
            console.log('Error Data:', JSON.stringify(error.data, null, 2));
        }
        return false;
    }
}

async function main() {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    console.log('Keys present:', { HF: !!hfKey, Gemini: !!geminiKey, OpenAI: !!openaiKey });

    if (hfKey) {
        const hf = createHuggingFace({ apiKey: hfKey });
        await testProvider('Hugging Face (Llama 70B)', hf('meta-llama/Meta-Llama-3.1-70B-Instruct'));
        await testProvider('Hugging Face (Mistral 7B)', hf('mistralai/Mistral-7B-Instruct-v0.3'));
    }

    if (geminiKey) {
        const google = createGoogleGenerativeAI({ apiKey: geminiKey });
        await testProvider('Gemini 2.0 Flash', google('gemini-2.0-flash'));
        await testProvider('Gemini 1.5 Flash', google('gemini-1.5-flash'));
    }

    if (openaiKey) {
        const openai = createOpenAI({ apiKey: openaiKey });
        await testProvider('OpenAI GPT-4o Mini', openai('gpt-4o-mini'));
    }
}

main().catch(console.error);
