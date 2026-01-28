const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { generateText } = require('ai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
const GEMINI_KEY = envConfig.GEMINI_API_KEY || envConfig.GOOGLE_GENERATIVE_AI_API_KEY;

const google = createGoogleGenerativeAI({
    apiKey: GEMINI_KEY,
});

async function testModel(modelId) {
    try {
        console.log(`Checking: ${modelId}`);
        const result = await generateText({
            model: google(modelId),
            prompt: 'Hi',
            maxTokens: 5
        });
        console.log(`  ✅ SUCCESS: ${modelId}`);
        return true;
    } catch (e) {
        console.log(`  ❌ FAILED: ${modelId} - ${e.message}`);
        return false;
    }
}

async function main() {
    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-2.5-pro'
    ];

    console.log('--- Testing Gemini Models with AI SDK ---\n');
    for (const m of modelsToTest) {
        await testModel(m);
    }
}

main();
