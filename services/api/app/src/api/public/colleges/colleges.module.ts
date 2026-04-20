import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { College } from 'src/type-orm/entities/colleges/college.entity';
import { CollegesRepository } from 'src/type-orm/entities/colleges/colleges.repository';
import { CollegesService } from './colleges.service';

@Module({
  imports: [TypeOrmModule.forFeature([College])],
  providers: [CollegesService, CollegesRepository],
  exports: [CollegesService],
})
export class CollegesModule {}
