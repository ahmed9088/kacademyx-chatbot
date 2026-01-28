const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function test() {
    console.log('Testing Gemini Direct...');
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error('No API key found!');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
        const result = await model.generateContent("Say 'Gemini is working'");
        const response = await result.response;
        const text = response.text();
        console.log('Response:', text);
    } catch (e) {
        console.error('FAILED:', e.message);
    }
}

test().catch(console.error);
