import multer from 'multer';
import path from 'path';
import e, { Request, Response, NextFunction } from 'express';
import fs from 'fs';

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
  limits: { fileSize: 2 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
})

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
    upload.single('file')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: err.message });
        } else if (err) {
          return res.status(400).json({ error: err.message });
        }
    
        // Si le fichier est téléchargé avec succès
        if (!req.file) {
          return res.status(400).json({ error: 'fichier non uploader' });
        }
        return res.status(200).json({ message: 'fichier enregistrer avec succès', filePath: req.file.path });
      });
     };


export function downloadFile(req: Request, res: Response) {
  const id = req.params.id;
  const directoryPath = path.join(__dirname, '../../uploads');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const file = files.find(file => file.startsWith(id));
    if (!file) {
      return res.status(404).json({ error: 'fichier non trouvé' });
    }

    const filePath = path.join(directoryPath, file);
    res.sendFile(filePath);
  });
}