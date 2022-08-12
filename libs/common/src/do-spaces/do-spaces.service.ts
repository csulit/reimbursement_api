import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { useTryAsync } from 'no-try';
import { DoSpacesServiceLib, UploadedMulterFileI } from './lib/aws-s3';

@Injectable()
export class DoSpacesService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(DoSpacesServiceLib) private readonly s3: AWS.S3,
  ) {}

  async uploadFile(file: UploadedMulterFileI, folder?: string) {
    if (!file) {
      throw new BadRequestException('No file attachment!');
    }

    const fileName = `${Date.now()}-${file.originalname}`;

    const [error, record] = await useTryAsync(async () =>
      this.s3.putObject({
        Bucket: folder ? `kmc-finance/${folder}` : 'kmc-finance',
        Key: fileName,
        Body: file.buffer,
        ACL: 'public-read',
      }),
    );

    if (error.message) {
      throw new BadRequestException(error.message);
    }

    if (record) {
      return {
        message: 'Success',
        file_url: `${this.configService.get('SPACES_BASE_URL')}/${
          folder ? folder + '/' : ''
        }${fileName}`,
        file_name: fileName,
      };
    }
  }

  async deleteFile(folder: string, key: string) {
    const [error, record] = await useTryAsync(async () =>
      this.s3.deleteObject({
        Bucket: folder ? `kmc-finance/${folder}` : 'kmc-finance',
        Key: key,
      }),
    );

    if (error.message) {
      throw new BadRequestException(error.message);
    }

    if (record) {
      return {
        message: 'Success',
        file_url: null,
        file_name: key,
      };
    }
  }
}
