const { createHuggingFace } = require('@ai-sdk/huggingface');
const { generateText } = require('ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testProvider(name, model) {
    console.log(`\n>>> Testing ${name}...`);
    try {
        const promise = generateText({
            model: model,
            prompt: 'Say "Hi"',
            maxTokens: 5
        });

        // 10 second timeout
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));

        const result = await Promise.race([promise, timeout]);
        console.log(`SUCCESS: "${result.text}"`);
        return true;
    } catch (error) {
        console.error(`FAILED:`, error.message);
        return false;
    }
}

async function main() {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (hfKey) {
        const hf = createHuggingFace({ apiKey: hfKey });
        // Try various models
        await testProvider('HF Mistral 7B v0.3', hf('mistralai/Mistral-7B-Instruct-v0.3'));
        await testProvider('HF Llama 3.1 8B', hf('meta-llama/Meta-Llama-3.1-8B-Instruct'));
        await testProvider('HF Zephyr 7B Beta', hf('HuggingFaceH4/zephyr-7b-beta'));
        await testProvider('HF Gemma 2 2B', hf('google/gemma-2-2b-it'));
    }
}

main().catch(console.error);
