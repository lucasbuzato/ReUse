import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { InterestPanelData } from "@/lib/interest-types";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const [{ id }, userId] = await Promise.all([params, getCurrentUser()]);

    const item = await prisma.item.findUnique({
      where: { id },
      select: {
        ownerId: true,
        _count: {
          select: { interests: true },
        },
      },
    });

    if (!item) {
      return noStoreJson({ error: "Item não encontrado." }, { status: 404 });
    }

    if (userId === item.ownerId) {
      const interests = await prisma.interest.findMany({
        where: { itemId: id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const data: InterestPanelData = {
        role: "owner",
        total: item._count.interests,
        ownInterest: null,
        interests: interests.map((interest) => ({
          id: interest.id,
          message: interest.message,
          createdAt: interest.createdAt.toISOString(),
          user: interest.user,
        })),
      };

      return noStoreJson(data);
    }

    if (userId) {
      const ownInterest = await prisma.interest.findUnique({
        where: {
          userId_itemId: {
            userId,
            itemId: id,
          },
        },
      });

      const data: InterestPanelData = {
        role: "visitor",
        total: item._count.interests,
        interests: [],
        ownInterest: ownInterest
          ? {
              id: ownInterest.id,
              message: ownInterest.message,
              createdAt: ownInterest.createdAt.toISOString(),
            }
          : null,
      };

      return noStoreJson(data);
    }

    const data: InterestPanelData = {
      role: "anonymous",
      total: item._count.interests,
      interests: [],
      ownInterest: null,
    };

    return noStoreJson(data);
  } catch (error) {
    console.error("Erro ao carregar interesses:", error);
    return noStoreJson(
      { error: "Não foi possível carregar os interesses." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const [{ id }, userId] = await Promise.all([params, getCurrentUser()]);

    if (!userId) {
      return noStoreJson(
        { error: "Faça login para manifestar interesse." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (message.length < 10) {
      return noStoreJson(
        { error: "Escreva uma mensagem com pelo menos 10 caracteres." },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return noStoreJson(
        { error: "A mensagem deve ter no máximo 500 caracteres." },
        { status: 400 }
      );
    }

    const item = await prisma.item.findUnique({
      where: { id },
      select: {
        ownerId: true,
        status: true,
      },
    });

    if (!item) {
      return noStoreJson({ error: "Item não encontrado." }, { status: 404 });
    }

    if (item.ownerId === userId) {
      return noStoreJson(
        { error: "Você não pode manifestar interesse no próprio item." },
        { status: 400 }
      );
    }

    if (item.status !== "DISPONIVEL") {
      return noStoreJson(
        { error: "Este item não está mais disponível." },
        { status: 409 }
      );
    }

    const interest = await prisma.interest.create({
      data: {
        itemId: id,
        userId,
        message,
      },
    });

    const total = await prisma.interest.count({
      where: { itemId: id },
    });

    const data: InterestPanelData = {
      role: "visitor",
      total,
      interests: [],
      ownInterest: {
        id: interest.id,
        message: interest.message,
        createdAt: interest.createdAt.toISOString(),
      },
    };

    return noStoreJson(data, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return noStoreJson(
        { error: "Você já manifestou interesse neste item." },
        { status: 409 }
      );
    }

    console.error("Erro ao registrar interesse:", error);
    return noStoreJson(
      { error: "Não foi possível registrar seu interesse." },
      { status: 500 }
    );
  }
}
