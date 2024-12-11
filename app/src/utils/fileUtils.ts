import multer from 'multer';
import path from 'path';

// Check file type
export function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
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