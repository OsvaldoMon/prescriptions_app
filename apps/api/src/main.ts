import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configureApp, configureSwagger } from './config/app-bootstrap';
import { resolveCorsOrigins } from './config/cors.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors({
    origin: resolveCorsOrigins(configService.get<string>('FRONTEND_URL')),
    credentials: true,
  });
  configureApp(app);
  configureSwagger(app);

  const port = Number(
    process.env.PORT ?? configService.get<string>('API_PORT', '3000'),
  );
  await app.listen(port, '0.0.0.0');
}
bootstrap();
