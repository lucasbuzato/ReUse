import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: "Faça login para manifestar interesse." }, { status: 401 });
    }

    const { itemId, message } = await req.json();
    if (!itemId || !message?.trim()) {
      return NextResponse.json({ error: "Item e mensagem são obrigatórios." }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    if (item.ownerId === userId) {
      return NextResponse.json({ error: "Você não pode manifestar interesse no próprio item." }, { status: 400 });
    }
    if (item.status !== "DISPONIVEL") {
      return NextResponse.json({ error: "Este item não está mais disponível." }, { status: 409 });
    }

    const existingInterest = await prisma.interest.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (existingInterest) {
      return NextResponse.json({ error: "Você já manifestou interesse neste item." }, { status: 409 });
    }

    const interest = await prisma.interest.create({
      data: { itemId, userId, message: message.trim() },
    });

    return NextResponse.json(interest, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao registrar interesse." }, { status: 500 });
  }
}
