
const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env.local' });

async function verifyAdapter() {
    console.log("Verifying GLM-4.7 with LangChainAdapter...");

    // Dynamic import for ESM package 'ai'
    const { LangChainAdapter } = await import('ai');

    // Fallback logic from route.js
    const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    if (!hfKey) {
        console.error("Error: HUGGINGFACE_API_KEY not found");
        return;
    }

    const openai = new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: hfKey,
    });

    try {
        const stream = await openai.chat.completions.create({
            model: "zai-org/GLM-4.7-Flash",
            messages: [{ role: "user", content: "Say 'Adapter Works'" }],
            stream: true,
            max_tokens: 100,
        });

        console.log("Stream created. Testing Adapter transformation...");

        // Simulate what the browser receives
        const response = LangChainAdapter.toDataStreamResponse(stream);

        // Handle the response body decoding manually since we are in node
        // response.body is a ReadableStream (web standard), not Node stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            console.log("Raw Chunk:", chunk);
        }
        console.log("\nVerification Complete.");

    } catch (error) {
        console.error("Verification Failed:", error);
    }
}

verifyAdapter();
