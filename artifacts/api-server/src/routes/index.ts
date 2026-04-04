import { Router, type IRouter } from "express";
import healthRouter from "./health";
import merchantsRouter from "./merchants";

const router: IRouter = Router();

router.use(healthRouter);
router.use(merchantsRouter);

export default router;
