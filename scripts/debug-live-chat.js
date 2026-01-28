async function testLiveChat() {
    const url = 'https://kacademyx-chatbot.vercel.app/api/chat';

    console.log(`Connecting to ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Hello, are you working?' }
                ]
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const text = await response.text();
            console.error('Error body:', text);
            return;
        }

        if (!response.body) {
            console.error('No response body!');
            return;
        }

        // Handle stream with native Web Streams API (Node 22)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log('>>> STREAM ENDED');
                break;
            }
            const chunk = decoder.decode(value, { stream: true });
            console.log('>>> CHUNK RECEIVED:', chunk);
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testLiveChat();
