async function testHFDirect() {
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || "YOUR_HF_KEY";
    const url = `https://router.huggingface.co/v1/chat/completions`;

    console.log(`Testing HF API Direct: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "zai-org/GLM-4.7-Flash:novita",
                messages: [
                    { role: 'user', content: 'Hello!' }
                ],
                stream: true,
                max_tokens: 100
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const txt = await response.text();
            console.error(txt);
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
            console.log('CHUNK:', chunk.slice(0, 100) + "..."); // log just a bit
            break; // Success if we get even one chunk
        }
        console.log("Success: Stream started.");

    } catch (error) {
        console.error('Direct HF Test Failed:', error);
    }
}

testHFDirect();
