import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { College } from 'src/api/public/colleges/entities/college.entity';
import { CollegesRepository } from 'src/api/public/colleges/colleges.repository';
import { CollegesService } from './colleges.service';

@Module({
  imports: [TypeOrmModule.forFeature([College])],
  providers: [CollegesService, CollegesRepository],
  exports: [CollegesService],
})
export class CollegesModule {}
