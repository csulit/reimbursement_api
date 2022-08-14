import { DoSpacesService, JwtAuthGuard } from '@app/common';
import { UploadedMulterFileI } from '@app/common/do-spaces/lib/aws-s3';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'apps/auth/src/decorator/current-user.decorator';
import UserEntity from 'apps/auth/src/users/entity/user.entity';
import { Request } from 'express';
import { CreateParticularDTO } from './dto/create-particular.dto';
import { CreateReimbursementDTO } from './dto/create-reimbursement.dto';
import { GetAllReimbursementsFilterDTO } from './dto/get-all-reimbursements.dto';
import { UpdateParticularDTO } from './dto/update-particular.dto';
import { ParticularsService } from './services/particulars.service';
import { ReimbursementsService } from './services/reimbursements.service';

@ApiTags('Reimbursement')
@Controller('reimbursements')
@UseGuards(JwtAuthGuard)
export class ReimbursementsController {
  constructor(
    private readonly reimbursementsService: ReimbursementsService,
    private readonly particularsService: ParticularsService,
    private readonly doSpacesService: DoSpacesService,
  ) {}

  @Get()
  getAllReimbursement(
    @CurrentUser() user: UserEntity,
    @Query() query: GetAllReimbursementsFilterDTO,
  ) {
    return this.reimbursementsService.getAll(user, query);
  }

  @Post()
  createReimbursement(
    @CurrentUser() user: UserEntity,
    @Body() data: CreateReimbursementDTO,
  ) {
    return this.reimbursementsService.create(user.id, data);
  }

  @Post('particular')
  createParticular(@Req() req: Request, @Body() data: CreateParticularDTO) {
    return this.particularsService.create(data, req.cookies?.Authentication);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('file-upload')
  async uploadFile(@UploadedFile() file: UploadedMulterFileI) {
    const result = await this.doSpacesService.uploadFile(file, 'reimbursement');

    return result;
  }

  @Get('departments')
  getDepartments() {
    return this.reimbursementsService.getDepartments();
  }

  @Get('locations')
  getLocations() {
    return this.reimbursementsService.getLocations();
  }

  @Get('type-of-expenses')
  getTypeOfExpenses() {
    return this.reimbursementsService.getTypeOfExpenses();
  }

  @Get('particular/:particular_id')
  getOneParticular(
    @Param('particular_id', new ParseUUIDPipe()) particular_id: string,
  ) {
    return this.particularsService.getOne(particular_id);
  }

  @Patch('particular/:particular_id')
  updateParticular(
    @Req() req: Request,
    @Param('particular_id', new ParseUUIDPipe()) particular_id: string,
    @Body() data: UpdateParticularDTO,
  ) {
    return this.particularsService.update(
      particular_id,
      data,
      req.cookies?.Authentication,
    );
  }

  @Delete('particular/:particular_id')
  deleteParticular(
    @Req() req: Request,
    @Param('particular_id', new ParseUUIDPipe()) particular_id: string,
  ) {
    return this.particularsService.delete(
      particular_id,
      req.cookies?.Authentication,
    );
  }

  @Delete('particular/receipt/:key')
  deleteReceipt(@Param('key') key: string) {
    const result = this.doSpacesService.deleteFile('reimbursement', key);

    return result;
  }

  @Get(':reimbursement_id')
  getOneReimbursement(
    @Param('reimbursement_id', new ParseUUIDPipe()) reimbursement_id: string,
  ) {
    return this.reimbursementsService.getOne(reimbursement_id);
  }
}
