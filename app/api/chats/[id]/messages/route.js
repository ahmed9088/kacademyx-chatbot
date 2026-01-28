import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateOwnership } from "@/lib/serverAuth";

export async function GET(req, props) {
    const params = await props.params;
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ message: "userId required" }, { status: 400 });
    }

    try {
        const chat = await prisma.chat.findUnique({
            where: { id },
        });

        if (!chat) {
            return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        }

        validateOwnership(chat.userId, userId);

        const messages = await prisma.message.findMany({
            where: { chatId: id },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        if (error.message?.includes('Forbidden')) {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        return NextResponse.json({ message: "Error fetching messages" }, { status: 500 });
    }
}

export async function POST(req, props) {
    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    const { userId, role, content, id: messageId } = body;

    if (!userId) {
        return NextResponse.json({ message: "userId required" }, { status: 400 });
    }

    if (!content) {
        return NextResponse.json({ message: "Content required" }, { status: 400 });
    }

    try {
        const chat = await prisma.chat.findUnique({
            where: { id },
        });

        if (!chat) {
            return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        }

        validateOwnership(chat.userId, userId);

        const messageData = {
            chatId: id,
            role,
            content,
        };

        // If ID is provided (for syncing AI messages), use it
        if (messageId) {
            messageData.id = messageId;
        }

        const message = await prisma.message.create({
            data: messageData,
        });

        // Update chat timestamp
        await prisma.chat.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error("Error creating message:", error);
        if (error.message?.includes('Forbidden')) {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        return NextResponse.json({ message: "Error creating message" }, { status: 500 });
    }
}
