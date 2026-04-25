import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { Catch, ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import * as fs from 'fs';

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
      message = exception.message;
    }

    const logStr = `\n\n[GLOBAL ERROR] Date: ${new Date().toISOString()}\nPath: ${request.url}\nStatus: ${status}\nMessage: ${message}\nException: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}\n`;

    try {
      fs.appendFileSync('c:/Users/user/OneDrive/Escritorio/nexopos.cl/apps/api/nest_error.log', logStr);
    } catch (e) {
      console.error('Failed to write to log file:', e);
    }

    console.error(logStr);

    response.status(status).json({
      statusCode: status,
      message: message,
      path: request.url,
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:3000',
      /^http:\/\/localhost:517[0-9]$/, // Allow Vite ports 5170-5179
    ],
    credentials: true,
  });

  // Enable validation globally
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

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('NexoPOS CL API')
    .setDescription('Documentación de la API para el ecosistema NexoPOS CL (SaaS + POS)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📄 Documentation available on http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap();
