
const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env.local' });

async function verifyManualStream() {
    console.log("Verifying GLM-4.7 Manual Stream...");

    // Fallback logic from route.js
    const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

    const openai = new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: hfKey,
    });

    try {
        const stream = await openai.chat.completions.create({
            model: "zai-org/GLM-4.7-Flash",
            messages: [{ role: "user", content: "Hi" }],
            stream: true,
            max_tokens: 50,
        });

        console.log("Stream connected.");

        for await (const chunk of stream) {
            console.log("CHUNK:", JSON.stringify(chunk));
        }
        console.log("Verification Complete.");

    } catch (error) {
        console.error("Verification Failed:", error);
    }
}

verifyManualStream();
