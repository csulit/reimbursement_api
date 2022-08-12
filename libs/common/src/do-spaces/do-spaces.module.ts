import { Module } from '@nestjs/common';
import { DoSpacesService } from './do-spaces.service';
import { DoSpacesServiceProvider } from './lib/aws-s3';

@Module({
  providers: [DoSpacesServiceProvider, DoSpacesService],
  exports: [DoSpacesService],
})
export class DoSpacesModule {}
