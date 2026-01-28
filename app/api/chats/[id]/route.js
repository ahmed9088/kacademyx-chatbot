import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateOwnership } from "@/lib/serverAuth";

export async function PATCH(req, props) {
    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
        return NextResponse.json({ message: "userId required" }, { status: 400 });
    }

    try {
        // Fetch and validate ownership
        const chat = await prisma.chat.findUnique({
            where: { id },
        });

        if (!chat) {
            return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        }

        validateOwnership(chat.userId, userId);

        const updatedChat = await prisma.chat.update({
            where: { id },
            data: {
                title: body.title !== undefined ? body.title : undefined,
                isPinned: body.isPinned !== undefined ? body.isPinned : undefined
            },
        });

        return NextResponse.json(updatedChat);
    } catch (error) {
        console.error("Error updating chat:", error);
        if (error.message?.includes('Forbidden')) {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        return NextResponse.json({ message: "Error updating chat" }, { status: 500 });
    }
}

export async function DELETE(req, props) {
    const params = await props.params;
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ message: "userId required" }, { status: 400 });
    }

    try {
        // Fetch and validate ownership
        const chat = await prisma.chat.findUnique({
            where: { id },
        });

        if (!chat) {
            return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        }

        validateOwnership(chat.userId, userId);

        await prisma.chat.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Chat deleted" });
    } catch (error) {
        console.error("Error deleting chat:", error);
        if (error.message?.includes('Forbidden')) {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        return NextResponse.json({ message: "Error deleting chat" }, { status: 500 });
    }
}
