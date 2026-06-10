import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quotesRouter from "./quotes";
import projectsRouter from "./projects";
import productsRouter from "./products";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quotesRouter);
router.use(projectsRouter);
router.use(productsRouter);

export default router;
