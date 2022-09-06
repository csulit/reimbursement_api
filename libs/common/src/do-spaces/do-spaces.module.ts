import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DoSpacesService } from './do-spaces.service';
import { DoSpacesServiceProvider } from './lib/aws-s3';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
  ],
  providers: [DoSpacesServiceProvider, DoSpacesService],
  exports: [DoSpacesService],
})
export class DoSpacesModule {}
