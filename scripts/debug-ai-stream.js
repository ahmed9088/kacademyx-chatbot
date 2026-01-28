
const { streamText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function testStream() {
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) {
        console.error("No HUGGINGFACE_API_KEY found");
        return;
    }

    console.log("Testing AI Stream config...");
    console.log("Key length:", hfKey.length);
    console.log("Model: zai-org/GLM-4.7-Flash:novita");

    try {
        const openai = createOpenAI({
            apiKey: hfKey,
            baseURL: "https://router.huggingface.co/v1",
        });

        const result = streamText({
            model: openai("zai-org/GLM-4.7-Flash:novita"),
            system: 'You are a test assistant.',
            messages: [{ role: 'user', content: 'Say hello!' }],
            maxTokens: 100,
        });

        for await (const chunk of result.textStream) {
            process.stdout.write(chunk);
        }
        console.log("\nDone!");

    } catch (error) {
        console.error("Stream Failed:", error);
    }
}

testStream();
