import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { GetProjectParams } from "@workspace/api-zod";

const router: IRouter = Router();

function serializeProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    imageUrl: p.imageUrl,
    unit: p.unit,
    inStock: p.inStock,
    featured: p.featured,
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;

  let query = db.select().from(productsTable).$dynamic();
  if (category) {
    query = query.where(eq(productsTable.category, category));
  }

  const products = await query;
  res.json(products.map(serializeProduct));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Producto no encontrado" });
    return;
  }

  res.json(serializeProduct(product));
});

export default router;
