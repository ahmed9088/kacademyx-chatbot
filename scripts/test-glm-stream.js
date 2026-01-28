const { createOpenAI } = require('@ai-sdk/openai');
const { streamText } = require('ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function test() {
    console.log('Testing HF Router STREAMING with GLM-4.7-Flash...');
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
        const result = await streamText({
            model: hfRouter('zai-org/GLM-4.7-Flash:novita'),
            prompt: 'Say "Streaming works" in 3 sentences.',
        });

        for await (const textPart of result.textStream) {
            process.stdout.write(textPart);
        }
        console.log('\nStream finished.');
    } catch (e) {
        console.error('FAILED:', e.message);
        if (e.data) console.log('Error Data:', JSON.stringify(e.data, null, 2));
    }
}

test().catch(console.error);
