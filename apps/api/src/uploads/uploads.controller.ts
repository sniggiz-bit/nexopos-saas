import {
  Controller, Post, UploadedFile, UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR    = join(process.cwd(), '..', '..', 'uploads', 'products');
const LOGO_UPLOAD_DIR = join(process.cwd(), '..', '..', 'uploads', 'logos');
const MAX_SIZE      = 25 * 1024 * 1024; // 25 MB
const ALLOWED       = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm'];
const IMG_ONLY      = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

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

  @Post('logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB max for logos
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureDir(LOGO_UPLOAD_DIR);
          cb(null, LOGO_UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!IMG_ONLY.includes(ext)) {
          return cb(new BadRequestException(`Formato no permitido. Usa JPG, PNG, WebP o SVG.`), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const url = `/api/static/logos/${file.filename}`;
    return { url, filename: file.filename, size: file.size };
  }
}
