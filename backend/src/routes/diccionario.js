import { Router } from 'express';
import { listarDiccionario } from '../controllers/traducirController.js';

const router = Router();

router.get('/', listarDiccionario);

export default router;
