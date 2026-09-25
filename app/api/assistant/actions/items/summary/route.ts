import { NextRequest } from "next/server";
import { assistantActionErrorResponse, assistantJson } from "@/lib/assistant-api";
import { getOwnedItemsSummary } from "@/lib/assistant-item-actions";
import { authorizeAssistantAction } from "@/lib/assistant-request-auth";
import { prisma } from "@/lib/prisma";
import { createPrismaAssistantItemStore } from "@/lib/prisma-assistant-item-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const claims = authorizeAssistantAction({
      headers: request.headers,
      requiredScope: "items:read",
    });

    const summary = await getOwnedItemsSummary(
      createPrismaAssistantItemStore(prisma),
      claims.sub
    );

    return assistantJson({
      ok: true,
      ...summary,
      message:
        summary.total === 0
          ? "Você ainda não publicou nenhum anúncio."
          : `Você tem ${summary.total} anúncio${summary.total === 1 ? "" : "s"}: ${summary.counts.available} ${summary.counts.available === 1 ? "disponível" : "disponíveis"} e ${summary.counts.paused} pausado${summary.counts.paused === 1 ? "" : "s"}.`,
    });
  } catch (error) {
    return assistantActionErrorResponse(error);
  }
}
