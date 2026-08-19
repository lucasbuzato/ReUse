import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      where: {
        status: "DISPONIVEL",
      },
      include: {
        category: true,
        owner: {
          select: {
            name: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Erro ao buscar itens:", error);

    return NextResponse.json(
      { error: "Erro ao buscar itens." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ownerId = await getCurrentUser();

    if (!ownerId) {
      return NextResponse.json(
        { error: "Faça login para anunciar um item." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      title,
      description,
      condition,
      imageUrl,
      categoryId,
    } = body;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !categoryId ||
      !condition
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria inválida." },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        condition,
        imageUrl: imageUrl?.trim() || null,
        categoryId,
        ownerId,
      },
      include: {
        category: true,
        owner: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json(item, {
      status: 201,
    });
  } catch (error) {
    console.error("Erro ao criar item:", error);

    return NextResponse.json(
      { error: "Erro ao criar item." },
      { status: 500 }
    );
  }
}