import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, testimonialsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/testimonials", async (_req, res): Promise<void> => {
  const testimonials = await db
    .select()
    .from(testimonialsTable)
    .where(eq(testimonialsTable.active, true))
    .orderBy(testimonialsTable.sortOrder);
  res.json(testimonials);
});

export default router;
