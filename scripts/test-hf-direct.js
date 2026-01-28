require('dotenv').config({ path: '.env.local' });
// const fetch = require('node-fetch'); // REMOVED: Using Native Fetch

async function testHFDirect() {
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
    console.log("Using Key:", HUGGINGFACE_API_KEY ? HUGGINGFACE_API_KEY.slice(0, 5) + "..." : "UNDEFINED");

    if (!HUGGINGFACE_API_KEY) {
        console.error("No HUGGINGFACE_API_KEY found in .env.local");
        return;
    }
    const url = `https://router.huggingface.co/v1/chat/completions`;
    const MODEL = "Qwen/Qwen2.5-Coder-32B-Instruct";

    console.log(`Testing HF API Direct: ${url} with model ${MODEL}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'user', content: 'Return the word SUCCESS.' }
                ],
                stream: true,
                max_tokens: 50
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const txt = await response.text();
            console.error("Error Body:", txt);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log(">>> STREAM ENDED");
                break;
            }
            const chunk = decoder.decode(value, { stream: true });
            if (chunk.trim()) {
                console.log('CHUNK RECEIVED (sample):', chunk.slice(0, 50).replace(/\n/g, '\\n'));
                break;
            }
        }
        console.log("Test Complete: API is responsive.");

    } catch (error) {
        console.error('Direct HF Test Failed:', error);
    }
}

testHFDirect();
