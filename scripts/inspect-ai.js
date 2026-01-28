const { createOpenAI } = require('@ai-sdk/openai');
const { streamText } = require('ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function test() {
    const hfRouter = createOpenAI({
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseURL: "https://router.huggingface.co/v1"
    });

    const result = await streamText({
        model: hfRouter('zai-org/GLM-4.7-Flash:novita'),
        prompt: 'Hi',
    });

    console.log('Result methods:', Object.keys(result).filter(k => typeof result[k] === 'function'));
    console.log('Result prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(result)).filter(k => typeof result[k] === 'function'));
}

test().catch(console.error);
