"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
const UPLOAD_DIR = (0, path_1.join)(process.cwd(), '..', '..', 'uploads', 'products');
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
function ensureDir(dir) {
    if (!(0, fs_1.existsSync)(dir))
        (0, fs_1.mkdirSync)(dir, { recursive: true });
}
let UploadsController = class UploadsController {
    uploadImage(file) {
        if (!file)
            throw new common_1.BadRequestException('No se recibió ningún archivo');
        const url = `/api/static/products/${file.filename}`;
        return { url, filename: file.filename, size: file.size };
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)('image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: MAX_SIZE },
        storage: (0, multer_1.diskStorage)({
            destination: (_req, _file, cb) => {
                ensureDir(UPLOAD_DIR);
                cb(null, UPLOAD_DIR);
            },
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
                cb(null, `${unique}${(0, path_1.extname)(file.originalname).toLowerCase()}`);
            },
        }),
        fileFilter: (_req, file, cb) => {
            const ext = (0, path_1.extname)(file.originalname).toLowerCase();
            if (!ALLOWED.includes(ext)) {
                return cb(new common_1.BadRequestException(`Formato no permitido: ${ext}. Usa JPG, PNG o WebP.`), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "uploadImage", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads')
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map