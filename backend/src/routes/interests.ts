import { Router } from "express";
import { requireUser } from "../lib/auth.js";
import { asyncHandler, HttpError, noStore } from "../lib/http.js";
import { readString } from "../lib/validation.js";
import { createInterest } from "../services/interests.js";

/** Rota legada (v1): POST /api/interests { itemId, message }. Prefira POST /api/items/:id/interests. */
export const interestsRouter = Router();

interestsRouter.post(
  "/",
  requireUser("Faça login para manifestar interesse."),
  asyncHandler(async (req, res) => {
    noStore(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const itemId = readString(body.itemId, { max: 60 });
    if (!itemId) throw new HttpError(400, "Item e mensagem são obrigatórios.", "validation_error");
    const interest = await createInterest(itemId, res.locals.userId as string, body.message);
    res.status(201).json(interest);
  })
);
