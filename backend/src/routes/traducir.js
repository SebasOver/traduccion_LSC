import { Router } from 'express';
import multer from 'multer';
import { traducirTexto, traducirAudio } from '../controllers/traducirController.js';

// El audio se mantiene en memoria (no se escribe a disco) y se reenvía a Whisper.
// 25 MB es el límite de la API de Whisper.
const subirAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, archivo, cb) => {
    cb(null, archivo.mimetype.startsWith('audio/') || archivo.mimetype.startsWith('video/webm'));
  },
});

const router = Router();

router.post('/', traducirTexto);
router.post('/audio', subirAudio.single('audio'), traducirAudio);

export default router;
