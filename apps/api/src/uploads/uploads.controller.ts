import {
  Controller, Post, UploadedFile, UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), '..', '..', 'uploads', 'products');
const MAX_SIZE   = 25 * 1024 * 1024; // 25 MB
const ALLOWED    = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm'];

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

@Controller('uploads')
export class UploadsController {

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits:  { fileSize: MAX_SIZE },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureDir(UPLOAD_DIR);
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED.includes(ext)) {
          return cb(new BadRequestException(`Formato no permitido: ${ext}. Usa JPG, PNG, WebP, MP4 o WEBM.`), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const url = `/api/static/products/${file.filename}`;
    return { url, filename: file.filename, size: file.size };
  }
}
