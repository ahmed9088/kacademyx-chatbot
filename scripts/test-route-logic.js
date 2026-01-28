const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { generateText, convertToModelMessages } = require('ai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
const GEMINI_KEY = envConfig.GEMINI_API_KEY || envConfig.GOOGLE_GENERATIVE_AI_API_KEY;

const google = createGoogleGenerativeAI({
    apiKey: GEMINI_KEY,
});

const SYSTEM_PROMPT = `You are an educational chatbot.`;

async function testRouteLogic() {
    console.log(`\n--- Testing Route Logic with Manual Conversion ---`);
    const messages = [{ role: 'user', content: 'Hello' }];

    try {
        const cleanedMessages = messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: typeof m.content === 'string' ? m.content : ''
        }));

        const result = await generateText({
            model: google('gemini-2.5-flash'),
            system: SYSTEM_PROMPT,
            messages: cleanedMessages,
            temperature: 0.7,
        });
        console.log(`Success: ${result.text}`);
    } catch (e) {
        console.error(`FAILED: ${e.message}`);
        if (e.data) console.log('Data:', JSON.stringify(e.data));
    }
}

testRouteLogic();
