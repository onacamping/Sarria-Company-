import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable, siteSettingsTable } from "@workspace/db";
import { ListProjectsQueryParams, GetProjectParams } from "@workspace/api-zod";

const router: IRouter = Router();

function serializeProject(p: typeof projectsTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    location: p.location,
    description: p.description,
    imageUrl: p.imageUrl,
    year: p.year,
    areaSqm: p.areaSqm ?? null,
    tags: p.tags ?? [],
  };
}

router.get("/projects/stats", async (req, res): Promise<void> => {
  const [projects, settings] = await Promise.all([
    db.select().from(projectsTable),
    db.select().from(siteSettingsTable),
  ]);

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const totalProjects = projects.length;
  const yearsExperience = Number(settingsMap["years_experience"] ?? 13);
  const totalClients = Number(settingsMap["active_clients"] ?? 60);
  const totalAreaSqm = projects.reduce((sum, p) => sum + (p.areaSqm ?? 0), 0);

  const byCategory: Record<string, number> = {};
  for (const p of projects) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
  }

  res.json({
    totalProjects,
    totalClients,
    yearsExperience,
    totalAreaSqm,
    byCategory,
  });
});

router.get("/projects", async (req, res): Promise<void> => {
  const params = ListProjectsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(projectsTable).$dynamic();

  if (params.data.category) {
    query = query.where(eq(projectsTable.category, params.data.category));
  }

  const projects = await query;
  res.json(projects.map(serializeProject));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "Proyecto no encontrado" });
    return;
  }

  res.json(serializeProject(project));
});

export default router;
