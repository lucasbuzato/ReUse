import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do item não informado." },
        { status: 400 }
      );
    }

    const item = await prisma.item.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        owner: {
          select: {
            name: true,
            city: true,
          },
        },
        _count: {
          select: {
            interests: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Erro ao buscar item:", error);

    return NextResponse.json(
      { error: "Erro ao buscar item." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do item não informado." },
        { status: 400 }
      );
    }

    const userId = await getCurrentUser();

    if (!userId) {
      return NextResponse.json(
        { error: "Faça login." },
        { status: 401 }
      );
    }

    const item = await prisma.item.findUnique({
      where: {
        id,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item não encontrado." },
        { status: 404 }
      );
    }

    if (item.ownerId !== userId) {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status } = body;

    const allowedStatuses = [
      "DISPONIVEL",
      "RESERVADO",
      "DOADO",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status inválido." },
        { status: 400 }
      );
    }

    const updated = await prisma.item.update({
      where: {
        id,
      },
      data: {
        status,
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar item:", error);

    return NextResponse.json(
      { error: "Erro ao atualizar o item." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do item não informado." },
        { status: 400 }
      );
    }

    const userId = await getCurrentUser();

    if (!userId) {
      return NextResponse.json(
        { error: "Faça login." },
        { status: 401 }
      );
    }

    const item = await prisma.item.findUnique({
      where: {
        id,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item não encontrado." },
        { status: 404 }
      );
    }

    if (item.ownerId !== userId) {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    await prisma.item.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Item removido com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover item:", error);

    return NextResponse.json(
      { error: "Não foi possível remover o item." },
      { status: 500 }
    );
  }
}