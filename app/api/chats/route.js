import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ message: "userId required" }, { status: 400 });
        }

        const chats = await prisma.chat.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
        return NextResponse.json(chats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        return NextResponse.json({ message: "Error fetching chats" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, title = "New Chat" } = body;

        if (!userId) {
            return NextResponse.json({ message: "userId required" }, { status: 400 });
        }

        const chat = await prisma.chat.create({
            data: {
                userId,
                title,
            },
        });

        return NextResponse.json(chat);
    } catch (error) {
        console.error("Error creating chat:", error);
        return NextResponse.json({ message: "Error creating chat" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ message: "userId required" }, { status: 400 });
        }

        await prisma.chat.deleteMany({
            where: { userId },
        });
        return NextResponse.json({ message: "All chats deleted" });
    } catch (error) {
        console.error("Error deleting chats:", error);
        return NextResponse.json({ message: "Error deleting chats" }, { status: 500 });
    }
}
