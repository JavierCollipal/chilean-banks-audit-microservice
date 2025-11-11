import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware (helmet)
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for educational purposes
  app.enableCors();

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Chilean Banks Audit Microservice')
    .setDescription(
      'Educational microservice for auditing Chilean bank login security features. ' +
        'ETHICAL USE ONLY: University cybersecurity course - Authorized research. ' +
        'Defensive security analysis: SSL, headers, CSRF, authentication methods. ' +
        'NO credential testing, NO unauthorized access attempts.',
    )
    .setVersion('1.0')
    .addTag('audit', 'Bank security audit endpoints')
    .addTag('health', 'Service health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🐾✨ Neko-Arc Banks Audit Service running on http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  console.log(`⚠️  ETHICAL USE ONLY - Educational cybersecurity research`);
}

bootstrap();
