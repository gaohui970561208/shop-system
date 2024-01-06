import express from 'express';   //使用express框架
import apiRouter from './api';

const router = express.Router();
router.use('/api', apiRouter);

export default router;