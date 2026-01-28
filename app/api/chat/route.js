import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 30;
// export const runtime = 'edge'; // Switched to Node.js for stability

export async function POST(req) {
    try {
        const { messages, system } = await req.json();
        const hfKey = process.env.HUGGINGFACE_API_KEY;

        if (!hfKey) {
            return new Response(JSON.stringify({ error: 'HF API key missing' }), { status: 500 });
        }

        // Initialize OpenAI with HF key
        const openai = createOpenAI({
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

        console.log(">>> AI Streaming Starting - Qwen/Qwen2.5-Coder-32B-Instruct");

        const validMessages = recentMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '')
        }));

        // Generate stream
        const result = await streamText({
            model: openai("Qwen/Qwen2.5-Coder-32B-Instruct"),
            system: activeSystemPrompt,
            messages: validMessages, // Pass sanitized messages
            temperature: 0.7,
            maxTokens: 4000,
        });

        // Robust stream handling compatible with different SDK versions/responses
        if (typeof result.toDataStreamResponse === 'function') {
            console.log("SERVER DEBUG: Using toDataStreamResponse");
            return result.toDataStreamResponse();
        }

        if (typeof result.toTextStreamResponse === 'function') {
            console.log("SERVER DEBUG: Using toTextStreamResponse");
            return result.toTextStreamResponse();
        }

        // Fallback for unexpected result structure
        console.error("SERVER DEBUG: No stream method found!");
        return new Response(JSON.stringify({ error: "Stream method missing on AI result" }), { status: 500 });

    } catch (error) {
        console.error("Fatal AI Error:", error);
        return Response.json({
            error: "AI service temporarily unavailable. Please try again.",
            details: error.message
        }, { status: 503 });
    }
}
