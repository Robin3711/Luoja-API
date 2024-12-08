import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Set storage engine for Multer
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const id = req.body.id; // Assurez-vous que l'ID est fourni dans le corps de la requête
    cb(null, `${id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Initialize Multer upload
export const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('file'); // Accept a single file with the field name 'file'

// Check file type
function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const filetypes = /jpeg|mp3|mpeg|jpg|png|wav/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
}

export function determineFileType(filePath: string | null): string {
    if (!filePath) return "text";
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".jpeg" || ext === ".jpg" || ext === ".png") {
        return "image";
    } else if (ext === ".mp3" || ext === ".wav") {
        return "audio";
    } else {
        return "text";
    }
}
export function uploadFile(req: Request, res: Response) {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: err.message });
        } else if (err) {
          return res.status(400).json({ error: err.message });
        }
    
        // Si le fichier est téléchargé avec succès
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        return res.status(200).json({ message: 'File uploaded successfully', filePath: req.file.path });
      });
     };
