
const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env.local' });

// Mimic backend logic to verify model access locally
async function verifyModel() {
    console.log("Verifying GLM-4.7 Model access...");

    if (!process.env.HUGGINGFACE_API_KEY) {
        console.error("Error: HUGGINGFACE_API_KEY not found in .env.local");
        return;
    }

    const client = new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    try {
        const stream = await client.chat.completions.create({
            model: "zai-org/GLM-4.7-Flash",
            messages: [{ role: "user", content: "Hello, say 'Test OK'" }],
            stream: true,
        });

        console.log("Stream connected!");
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            process.stdout.write(content);
        }
        console.log("\nVerification Complete.");

    } catch (error) {
        console.error("Verification Failed:", error);
    }
}

verifyModel();
