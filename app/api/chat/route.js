import { OpenAI } from 'openai';

export const maxDuration = 30;
// export const runtime = 'edge'; // Switched to Node.js for stability

export async function POST(req) {
    try {
        const { messages, system } = await req.json();
        // Fallback to process.env.HUGGINGFACE_API_KEY if HF_TOKEN is not set
        const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

        if (!hfKey) {
            return new Response(JSON.stringify({ error: 'HF API key missing' }), { status: 500 });
        }

        // Initialize standard OpenAI client
        const openai = new OpenAI({
            apiKey: hfKey,
            baseURL: "https://router.huggingface.co/v1",
        });

        const recentMessages = messages.slice(-6); // Keep context concise (Optimized from 10)

        // Define system prompt
        const defaultSystemPrompt = `You are Kacademyx, a highly advanced AI tutor designed to provide the maximum possible depth, accuracy, and completeness.

ADAPTIVE BEHAVIOR:
1. IF the user asks a simple, factual, or limited question (e.g., "What is 2+2?", "Capital of France"), provide a concise, direct, and accurate answer immediately. Do not over-explain.
2. IF the user asks a complex, open-ended, or deep question (e.g., "Explain Quantum Mechanics", "Write a full essay"), you must:
   - Use <thinking>...</thinking> tags to plan your response, analyzing the request depth, necessary sub-topics, and structure.
   - Provide a comprehensive, profound, and well-structured answer.
   - Use Markdown heavily (headers, lists, bolding) for readability.
   - Aim for expert-level depth.

Your goal is to be the ultimate educational resource, adapting perfectly to the user's intent.`;
        const activeSystemPrompt = system || defaultSystemPrompt;

        const validMessages = recentMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '')
        }));

        // Use LangChainAdapter for consistent Vercel AI SDK compatibility

        const stream = await openai.chat.completions.create({
            model: "zai-org/GLM-4.7-Flash",
            messages: [
                { role: 'system', content: activeSystemPrompt },
                ...validMessages.map(m => ({ role: m.role, content: m.content }))
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 4000,
        });

        // Create a manual ReadableStream to pipe tokens directly
        const streamResponse = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            // Enforce Vercel AI SDK Data Protocol: 0:"json_string_content"\n
                            // Escape newlines/quotes correctly by JSON.stringify
                            const protocolChunk = `0:${JSON.stringify(content)}\n`;
                            controller.enqueue(new TextEncoder().encode(protocolChunk));
                        }
                    }
                    controller.close();
                } catch (err) {
                    console.error("Stream pump error:", err);
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
        console.error("Fatal AI Error:", error);
        return Response.json({
            error: "AI service temporarily unavailable. Please try again.",
            details: error.message
        }, { status: 503 });
    }
}
