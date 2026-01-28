const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
const GEMINI_KEY = envConfig.GEMINI_API_KEY || envConfig.GOOGLE_GENERATIVE_AI_API_KEY;
const OPENAI_KEY = envConfig.OPENAI_API_KEY;

async function checkGeminiModels() {
    console.log('\n--- Checking Gemini Models ---');
    if (!GEMINI_KEY) {
        console.log('No Gemini Key found.');
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching Gemini models:', data.error.message);
        } else if (data.models) {
            const names = data.models.map(m => m.name.replace('models/', ''));
            console.log('\nAvailable Gemini Models:');
            names.forEach(name => console.log(`- ${name}`));
        }
    } catch (e) {
        console.error('Failed to check Gemini:', e.message);
    }
}

async function checkOpenAI() {
    console.log('\n--- Checking OpenAI Key ---');
    if (!OPENAI_KEY) {
        console.log('No OpenAI Key found.');
        return;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${OPENAI_KEY}`
            }
        });

        if (response.status === 200) {
            console.log('OpenAI Key is VALID. (Can list models)');
        } else {
            console.error(`OpenAI Key is INVALID or Quota Exceeded. Status: ${response.status}`);
            const text = await response.text();
            console.log('Details:', text);
        }
    } catch (e) {
        console.error('Failed to check OpenAI:', e.message);
    }
}

async function testOpenAIGen() {
    console.log('\n--- Testing OpenAI Generation ---');
    if (!OPENAI_KEY) return;
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            })
        });
        const data = await response.json();
        if (response.ok) {
            console.log('OpenAI Generation: SUCCESS');
        } else {
            console.error('OpenAI Generation FAILED:', JSON.stringify(data));
        }
    } catch (e) {
        console.error('OpenAI Gen Error:', e.message);
    }
}

async function main() {
    await checkGeminiModels();
    await checkOpenAI();
    await testOpenAIGen();
}

main();
