import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, landingPagesTable, landingContactsTable, insertLandingContactSchema } from "@workspace/db";

const router: IRouter = Router();

router.get("/landing-pages", async (_req, res): Promise<void> => {
  const pages = await db
    .select()
    .from(landingPagesTable)
    .where(eq(landingPagesTable.active, true))
    .orderBy(asc(landingPagesTable.sortOrder), asc(landingPagesTable.createdAt));
  res.json(pages);
});

router.get("/landing-pages/:slug", async (req, res): Promise<void> => {
  const slug = req.params["slug"] as string;
  const [page] = await db
    .select()
    .from(landingPagesTable)
    .where(eq(landingPagesTable.slug, slug));

  if (!page || !page.active) {
    res.status(404).json({ error: "Landing page no encontrada" });
    return;
  }
  res.json(page);
});

router.post("/landing-contacts", async (req, res): Promise<void> => {
  const parsed = insertLandingContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [contact] = await db.insert(landingContactsTable).values(parsed.data).returning();
  res.status(201).json(contact);
});

export default router;
