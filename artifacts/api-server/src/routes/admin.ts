import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { randomBytes } from "crypto";
import { eq, desc } from "drizzle-orm";
import path from "path";
import { mkdirSync, existsSync } from "fs";
import multer from "multer";
import {
  db,
  projectsTable,
  productsTable,
  quotesTable,
  siteSettingsTable,
  testimonialsTable,
  servicesTable,
} from "@workspace/db";

const router: IRouter = Router();

const adminTokens = new Set<string>();
const ADMIN_USERNAME = process.env["ADMIN_USERNAME"] ?? "admin";
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "sarria2024";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/\.(jpe?g|png|webp|gif|mp4|webm|mov|svg)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido"));
    }
  },
});

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers["authorization"];
  if (typeof auth !== "string" || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  const token = auth.slice(7);
  if (!adminTokens.has(token)) {
    res.status(401).json({ error: "Token inválido o expirado" });
    return;
  }
  next();
}

router.post("/admin/login", (req: Request, res: Response): void => {
  const { username, password } = req.body as { username: string; password: string };
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = randomBytes(32).toString("hex");
    adminTokens.add(token);
    res.json({ token, ok: true });
  } else {
    res.status(401).json({ error: "Credenciales incorrectas" });
  }
});

router.post("/admin/logout", requireAdmin, (req: Request, res: Response): void => {
  const token = (req.headers["authorization"] as string).slice(7);
  adminTokens.delete(token);
  res.json({ ok: true });
});

router.get("/admin/me", requireAdmin, (_req: Request, res: Response): void => {
  res.json({ ok: true, username: ADMIN_USERNAME });
});

router.post("/admin/upload", requireAdmin, upload.single("file"), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: "No se recibió ningún archivo" });
    return;
  }
  res.json({ url: `/api/uploads/${req.file.filename}`, filename: req.file.filename });
});

router.get("/admin/settings", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const settings = await db.select().from(siteSettingsTable);
  res.json(settings);
});

router.put("/admin/settings/:key", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const key = req.params["key"] as string;
  const { value } = req.body as { value: string };
  await db
    .insert(siteSettingsTable)
    .values({ key, value: String(value), label: key, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: String(value), updatedAt: new Date() } });
  res.json({ ok: true });
});

router.get("/admin/projects", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const projects = await db.select().from(projectsTable);
  res.json(projects);
});

router.post("/admin/projects", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const d = req.body as any;
  const [project] = await db
    .insert(projectsTable)
    .values({
      title: d.title, category: d.category, location: d.location, description: d.description,
      imageUrl: d.imageUrl ?? "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800",
      year: Number(d.year), areaSqm: d.areaSqm ? Number(d.areaSqm) : null,
      tags: Array.isArray(d.tags) ? d.tags : [],
    })
    .returning();
  res.json(project);
});

router.put("/admin/projects/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  const d = req.body as any;
  const [project] = await db
    .update(projectsTable)
    .set({
      title: d.title, category: d.category, location: d.location, description: d.description,
      imageUrl: d.imageUrl, year: Number(d.year),
      areaSqm: d.areaSqm ? Number(d.areaSqm) : null, tags: Array.isArray(d.tags) ? d.tags : [],
    })
    .where(eq(projectsTable.id, id))
    .returning();
  res.json(project);
});

router.delete("/admin/projects/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await db.delete(projectsTable).where(eq(projectsTable.id, Number(req.params["id"])));
  res.json({ ok: true });
});

router.get("/admin/products", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const products = await db.select().from(productsTable);
  res.json(products);
});

router.post("/admin/products", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const d = req.body as any;
  const [product] = await db
    .insert(productsTable)
    .values({
      name: d.name, description: d.description, price: Number(d.price), category: d.category,
      imageUrl: d.imageUrl ?? "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800",
      unit: d.unit ?? "unidad", inStock: d.inStock ?? true, featured: d.featured ?? false,
    })
    .returning();
  res.json(product);
});

router.put("/admin/products/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  const d = req.body as any;
  const [product] = await db
    .update(productsTable)
    .set({
      name: d.name, description: d.description, price: Number(d.price), category: d.category,
      imageUrl: d.imageUrl, unit: d.unit ?? "unidad", inStock: d.inStock ?? true, featured: d.featured ?? false,
    })
    .where(eq(productsTable.id, id))
    .returning();
  res.json(product);
});

router.delete("/admin/products/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await db.delete(productsTable).where(eq(productsTable.id, Number(req.params["id"])));
  res.json({ ok: true });
});

router.get("/admin/quotes", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const quotes = await db.select().from(quotesTable).orderBy(desc(quotesTable.createdAt));
  res.json(quotes);
});

router.get("/admin/testimonials", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const testimonials = await db.select().from(testimonialsTable).orderBy(testimonialsTable.sortOrder);
  res.json(testimonials);
});

router.post("/admin/testimonials", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const d = req.body as any;
  const [t] = await db.insert(testimonialsTable).values({
    quote: d.quote, author: d.author, role: d.role, location: d.location ?? "",
    active: d.active ?? true, sortOrder: Number(d.sortOrder) || 0,
  }).returning();
  res.json(t);
});

router.put("/admin/testimonials/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  const d = req.body as any;
  const [t] = await db.update(testimonialsTable).set({
    quote: d.quote, author: d.author, role: d.role, location: d.location ?? "",
    active: d.active ?? true, sortOrder: Number(d.sortOrder) || 0,
  }).where(eq(testimonialsTable.id, id)).returning();
  res.json(t);
});

router.delete("/admin/testimonials/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await db.delete(testimonialsTable).where(eq(testimonialsTable.id, Number(req.params["id"])));
  res.json({ ok: true });
});

router.get("/admin/services", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const services = await db.select().from(servicesTable).orderBy(servicesTable.sortOrder);
  res.json(services);
});

router.post("/admin/services", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const d = req.body as any;
  const [svc] = await db.insert(servicesTable).values({
    title: d.title, description: d.description, iconName: d.iconName ?? "Leaf",
    active: d.active ?? true, sortOrder: Number(d.sortOrder) || 0,
  }).returning();
  res.json(svc);
});

router.put("/admin/services/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  const d = req.body as any;
  const [svc] = await db.update(servicesTable).set({
    title: d.title, description: d.description, iconName: d.iconName ?? "Leaf",
    active: d.active ?? true, sortOrder: Number(d.sortOrder) || 0,
  }).where(eq(servicesTable.id, id)).returning();
  res.json(svc);
});

router.delete("/admin/services/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await db.delete(servicesTable).where(eq(servicesTable.id, Number(req.params["id"])));
  res.json({ ok: true });
});

export default router;
