// Native fetch is available in Node 18+

async function testChat() {
    console.log('Testing Chat API...');
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Hello, are you working?' }]
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Error ${response.status}: ${text}`);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            console.log('Received chunk:', decoder.decode(value, { stream: true }));
        }
        console.log('Stream finished.');

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testChat();
