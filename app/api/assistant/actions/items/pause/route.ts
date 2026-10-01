import { NextRequest } from "next/server";
import { assistantActionErrorResponse, assistantJson } from "@/lib/assistant-api";
import { pauseOwnedAvailableItems } from "@/lib/assistant-item-actions";
import { authorizeAssistantAction } from "@/lib/assistant-request-auth";
import { prisma } from "@/lib/prisma";
import { createPrismaAssistantItemStore } from "@/lib/prisma-assistant-item-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const claims = authorizeAssistantAction({
      headers: request.headers,
      requiredScope: "items:pause",
    });

    const result = await pauseOwnedAvailableItems(
      createPrismaAssistantItemStore(prisma),
      claims.sub
    );

    return assistantJson(result);
  } catch (error) {
    return assistantActionErrorResponse(error);
  }
}
