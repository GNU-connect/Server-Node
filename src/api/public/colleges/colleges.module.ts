import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollegeMessagesService } from 'src/api/public/message-templates/college-messages.service';
import { College } from 'src/type-orm/entities/colleges/college.entity';
import { CollegesRepository } from 'src/type-orm/entities/colleges/colleges.repository';
import { CollegesService } from './colleges.service';

@Module({
  imports: [TypeOrmModule.forFeature([College])],
  providers: [CollegesService, CollegesRepository, CollegeMessagesService],
  exports: [CollegesService],
})
export class CollegesModule {}
