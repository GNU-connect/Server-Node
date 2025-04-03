import { Module } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { College } from 'src/colleges/entities/college.entity';
import { CollegesRepository } from 'src/colleges/repositories/colleges.repository';
import { CollegeMessagesService } from 'src/message-templates/college-messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([College])],
  providers: [CollegesService, CollegesRepository, CollegeMessagesService],
  exports: [CollegesService],
})
export class CollegesModule {}
