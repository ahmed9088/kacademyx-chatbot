const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
const GEMINI_KEY = envConfig.GEMINI_API_KEY || envConfig.GOOGLE_GENERATIVE_AI_API_KEY;

async function listAll() {
    console.log('--- Full Gemini Model List ---\n');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
        const data = await response.json();
        if (data.models) {
            data.models.forEach(m => {
                console.log(`${m.name} - ${m.displayName}`);
            });
        } else {
            console.log('No models found or error:', JSON.stringify(data));
        }
    } catch (e) {
        console.error(e);
    }
}

listAll();
