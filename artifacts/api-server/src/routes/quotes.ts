import { Router, type IRouter } from "express";
import { db, quotesTable } from "@workspace/db";
import { SubmitQuoteBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/quotes", async (req, res): Promise<void> => {
  const parsed = SubmitQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [quote] = await db
    .insert(quotesTable)
    .values({
      name: parsed.data.name,
      company: parsed.data.company,
      clientType: parsed.data.clientType,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      service: parsed.data.service,
      location: parsed.data.location ?? null,
      area: parsed.data.area ?? null,
      message: parsed.data.message,
    })
    .returning();

  req.log.info({ quoteId: quote.id }, "New quote request received");

  res.status(201).json({
    id: quote.id,
    name: quote.name,
    company: quote.company,
    clientType: quote.clientType,
    phone: quote.phone,
    email: quote.email,
    service: quote.service,
    location: quote.location,
    area: quote.area,
    message: quote.message,
    createdAt: quote.createdAt.toISOString(),
  });
});

export default router;
