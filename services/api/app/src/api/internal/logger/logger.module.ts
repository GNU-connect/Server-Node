import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transports: [
          new winston.transports.Console({
            level:
              configService.get('NODE_ENV') === 'production'
                ? 'silly'
                : 'silly',
            format: winston.format.combine(
              winston.format.timestamp(),
              utilities.format.nestLike('connect-gnu', {
                prettyPrint: true,
              }),
            ),
          }),
        ],
      }),
    }),
  ],
})
export class LoggerModule {}
