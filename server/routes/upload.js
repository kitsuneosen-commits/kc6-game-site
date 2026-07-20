import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB
});

export default function uploadRouter() {
  const router = Router();

  router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '没有文件' });
    res.json({ url: `/uploads/${req.file.filename}`, originalName: req.file.originalname, size: req.file.size });
  });

  router.post('/multiple', upload.array('files', 10), (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: '没有文件' });
    res.json(req.files.map(f => ({ url: `/uploads/${f.filename}`, originalName: f.originalname, size: f.size })));
  });

  return router;
}
