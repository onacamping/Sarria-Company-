import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quotesRouter from "./quotes";
import projectsRouter from "./projects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quotesRouter);
router.use(projectsRouter);

export default router;
