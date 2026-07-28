import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, promoCodesTable } from "@workspace/db";

const router: IRouter = Router();

// Public: validate a promo code (used by the storefront)
router.get("/promo-codes/validate/:code", async (req, res): Promise<void> => {
  const code = (req.params["code"] as string).toUpperCase();

  const [promo] = await db
    .select()
    .from(promoCodesTable)
    .where(eq(promoCodesTable.code, code));

  if (!promo || !promo.active) {
    res.status(404).json({ error: "Código no válido" });
    return;
  }
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    res.status(400).json({ error: "Código expirado" });
    return;
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    res.status(400).json({ error: "Código agotado" });
    return;
  }

  res.json({
    id: promo.id,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    description: promo.description,
    minOrderAmount: promo.minOrderAmount,
    appliesTo: promo.appliesTo,
  });
});

export default router;
