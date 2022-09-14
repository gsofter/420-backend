import './utils/logger/tracing';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { logOptions } from './utils/logger/winston';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { readWalletPrivateKey } from './utils/onchain/sign';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger(logOptions)
  });

  const logger = new Logger('App');
  const port = app.get(ConfigService).get('api.port');
  const isProd = app.get(ConfigService).get('env.isProd');

  app.enableShutdownHooks();
  app.enableCors();

  if (isProd) {
    app.set('trust proxy', 1);
  }

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.listen(port);
  logger.log('Application started on port ' + port);

  console.log('issuerWalletPrivateKey', readWalletPrivateKey());
}
bootstrap();
