import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { DoSpacesService } from './do-spaces.service';
import { DoSpacesServiceProvider } from './lib/aws-s3';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        SPACES_ENDPOINT: Joi.string().required(),
        SPACES_ACCESS_KEY: Joi.string().required(),
        SPACES_SECRET_KEY: Joi.string().required(),
        SPACES_BASE_URL: Joi.string().required(),
      }),
      envFilePath: ['../../.env']
    }),
  ],
  providers: [DoSpacesServiceProvider, DoSpacesService],
  exports: [DoSpacesService],
})
export class DoSpacesModule {}
