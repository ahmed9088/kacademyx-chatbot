const { createOpenAI } = require('@ai-sdk/openai');
const { generateText } = require('ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function test() {
    console.log('Testing HF Router with GLM-4.7-Flash...');
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
        console.error('No API key found!');
        return;
    }

    const hfRouter = createOpenAI({
        apiKey: apiKey,
        baseURL: "https://router.huggingface.co/v1"
    });

    try {
        const { text } = await generateText({
            model: hfRouter('zai-org/GLM-4.7-Flash:novita'),
            prompt: 'Say "Working"',
        });
        console.log('Response:', text);
    } catch (e) {
        console.error('FAILED:', e.message);
        if (e.data) console.log('Error Data:', JSON.stringify(e.data, null, 2));
    }
}

test().catch(console.error);
