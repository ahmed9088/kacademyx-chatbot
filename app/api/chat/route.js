


export const maxDuration = 30;
// export const runtime = 'edge'; // Switched to Node.js for stability

export async function POST(req) {
    try {
        const { messages, system } = await req.json();
        const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

        if (!hfKey) {
            console.error("[Server] Missing API Key");
            return new Response(JSON.stringify({ error: 'HF API key missing' }), { status: 500 });
        }

        const activeSystemPrompt = system || `You are Kacademyx...`; // (Truncated for brevity, normally I'd keep the full prompt string here, but reusing existing constant if possible is better. I will inline it to be safe or use the existing variable logic if I can match it.)
        // Actually, to ensure I don't lose the prompt, I will reconstruct the full function body to be safe, or just replace the inner logic.
        // Let's replace the inner logic of POST.

        // Re-defining system prompt to ensure it's present
        const defaultSystemPrompt = `You are Kacademyx, a highly advanced AI tutor designed to provide the maximum possible depth, accuracy, and completeness.

ADAPTIVE BEHAVIOR:
1. IF the user asks a simple, factual, or limited question (e.g., "What is 2+2?", "Capital of France"), provide a concise, direct, and accurate answer immediately. Do not over-explain.
2. IF the user asks a complex, open-ended, or deep question (e.g., "Explain Quantum Mechanics", "Write a full essay"), you must:
   - Use <thinking>...</thinking> tags to plan your response, analyzing the request depth, necessary sub-topics, and structure.
   - Provide a comprehensive, profound, and well-structured answer.
   - Use Markdown heavily (headers, lists, bolding) for readability.
   - Aim for expert-level depth.

Your goal is to be the ultimate educational resource, adapting perfectly to the user's intent.`;

        const finalSystemPrompt = system || defaultSystemPrompt;

        const filteredMessages = messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '')
        }));

        const payload = {
            model: "zai-org/GLM-4.7-Flash",
            messages: [
                { role: 'system', content: finalSystemPrompt },
                ...filteredMessages
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 4000
        };

        console.log(`[Server] Raw Fetch to HF Router for GLM-4.7...`);

        const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${hfKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Server] HF API Error: ${response.status} - ${errorText}`);
            throw new Error(`HF API Error: ${response.status} ${errorText}`);
        }

        console.log("[Server] HF Response OK. Streaming...");

        // Parser for SSE (Server-Sent Events) from HF/OpenAI
        const streamResponse = new ReadableStream({
            async start(controller) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop(); // Keep incomplete line in buffer

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || trimmed === "data: [DONE]") continue;
                            if (trimmed.startsWith("data: ")) {
                                try {
                                    const json = JSON.parse(trimmed.slice(6));
                                    const content = json.choices?.[0]?.delta?.content || "";
                                    if (content) {
                                        // Vercel AI Data Stream Protocol: 0:"json_content"\n
                                        const packet = `0:${JSON.stringify(content)}\n`;
                                        controller.enqueue(new TextEncoder().encode(packet));
                                    }
                                } catch (e) {
                                    console.error("JSON Parse Error on chunk:", trimmed, e);
                                }
                            }
                        }
                    }
                    controller.close();
                } catch (err) {
                    console.error("Stream Pump Error:", err);
                    controller.error(err);
                }
            }
        });

        return new Response(streamResponse, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Vercel-AI-Data-Stream': 'v1'
            }
        });

    } catch (error) {
        console.error("Fatal Handler Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
