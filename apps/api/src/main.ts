import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Catch, ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      message = typeof resp === 'string' ? resp : (resp as any)?.message || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    console.error(
      `[ERROR] ${new Date().toISOString()} | ${request.method} ${request.url} | ${status} | ${exception instanceof Error ? exception.constructor.name : 'Unknown'}: ${exception instanceof Error ? exception.message : exception}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
    });
  }
}


async function bootstrap() {
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  // Disable ETags so browsers never get 304 on dynamic API data
  app.set('etag', false);

  // Prevent any proxy/cPanel/Cloudflare cache from caching API requests
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Servir archivos subidos como estáticos en /api/static/
  const uploadsPath = join(process.cwd(), '..', '..', 'uploads');
  app.useStaticAssets(uploadsPath, { prefix: '/api/static' });

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : [
      'http://localhost:3000',
      'http://localhost:5173',
    ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

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

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`🚀 Server running on port ${process.env.PORT ?? 3000} (0.0.0.0)`);
}
bootstrap();
