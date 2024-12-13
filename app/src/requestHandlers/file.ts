import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as fileUtils from "../utils/fileUtils";
import * as userUtils from "../utils/userUtils";

// Set storage engine for Multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const user = await userUtils.getUser(req);
    if (!user) {
      return cb(new Error('Utilisateur non authentifié'), '');
    }

    const userDir = `uploads/${user.userName}_${user.id}`;
    fs.mkdirSync(userDir, { recursive: true });

    if (!fileUtils.FileDirMaxSize(userDir)) {
      return cb(new Error('Limite de taille du répertoire atteinte'), '');
    }

    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const filename = `s${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Initialize Multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    fileUtils.checkFileType(file, cb);
  }
});

export async function uploadFile(req: Request, res: Response) {
  const user = await userUtils.getUser(req);

  if (!user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Si le fichier est téléchargé avec succès
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier non uploadé' });
    }

    // Extraire le nom du fichier à partir du chemin complet
    const filename = path.basename(req.file.path);

    return res.status(200).json({ message: 'Fichier enregistré avec succès', filePath: filename });
  });
}

export function downloadFile(req: Request, res: Response) {
  const id = req.params.id;
  const baseDirectoryPath = path.join(__dirname, '../../uploads');

  fs.readdir(baseDirectoryPath, (err, userDirs) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let fileFound = false;

    for (const userDir of userDirs) {
      const directoryPath = path.join(baseDirectoryPath, userDir);
      const files = fs.readdirSync(directoryPath);

      const file = files.find(file => file.startsWith(id));
      if (file) {
        const filePath = path.join(directoryPath, file);
        res.sendFile(filePath);
        fileFound = true;
        break;
      }
    }

    if (!fileFound) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
  });
}

export async function downloadAllFiles(req: Request, res: Response) {
  const user = await userUtils.getUser(req);

  if (!user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  const userDir = `uploads/${user.userName}_${user.id}`;

  if (!fs.existsSync(userDir)) {
    return res.status(404).json({ error: 'Aucun fichier trouvé pour cet utilisateur' });
  }

  const files = fs.readdirSync(userDir);
  const fileUrls = files.map(file => {
    return {
      fileName: file,
      url: `${req.protocol}://${req.get('host')}/download/${file}`
    };
  });

  return res.status(200).json({ files: fileUrls });
}

export async function deleteFile(req: Request, res: Response) {
  const user = await userUtils.getUser(req);

  if (!user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  const fileName = req.params.fileName;
  const userDir = `uploads/${user.userName}_${user.id}`;
  const filePath = path.join(userDir, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    return res.status(200).json({ message: 'Fichier supprimé avec succès' });
  });
}