import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quotesRouter from "./quotes";
import projectsRouter from "./projects";
import productsRouter from "./products";
import testimonialsRouter from "./testimonials";
import settingsRouter from "./settings";
import servicesRouter from "./services";
import adminRouter from "./admin";
import landingPagesRouter from "./landing-pages";
import promoCodesRouter from "./promo-codes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quotesRouter);
router.use(projectsRouter);
router.use(productsRouter);
router.use(testimonialsRouter);
router.use(settingsRouter);
router.use(servicesRouter);
router.use(adminRouter);
router.use(landingPagesRouter);
router.use(promoCodesRouter);

export default router;
