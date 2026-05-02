"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const app_module_1 = require("./app.module");
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = 500;
        let message = 'Internal server error';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            message = exception.message;
        }
        console.error(`[GLOBAL ERROR] ${new Date().toISOString()} | ${request.url} | ${status} | ${message}`, exception instanceof Error ? exception.stack : exception);
        response.status(status).json({
            statusCode: status,
            message: message,
            path: request.url,
        });
    }
};
AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const uploadsPath = (0, path_1.join)(process.cwd(), '..', '..', 'uploads');
    app.useStaticAssets(uploadsPath, { prefix: '/api/static' });
    app.enableCors({
        origin: [
            'http://localhost:3000',
            /^http:\/\/localhost:517[0-9]$/,
        ],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new AllExceptionsFilter());
    if (process.env.NODE_ENV !== 'production') {
        const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
        const config = new DocumentBuilder()
            .setTitle('NexoPOS CL API')
            .setDescription('Documentación de la API para el ecosistema NexoPOS CL (SaaS + POS)')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
        console.log(`📄 Docs: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
    }
    await app.listen(process.env.PORT ?? 3000);
    console.log(`🚀 Server running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
//# sourceMappingURL=main.js.map