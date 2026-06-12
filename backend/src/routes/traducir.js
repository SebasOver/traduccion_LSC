import { Router } from 'express';
import { traducirTexto } from '../controllers/traducirController.js';

const router = Router();

router.post('/', traducirTexto);

export default router;
