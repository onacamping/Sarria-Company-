import { Router, type IRouter } from "express";
import { db, siteSettingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  const rows = await db.select().from(siteSettingsTable);
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  res.json(map);
});

export default router;
