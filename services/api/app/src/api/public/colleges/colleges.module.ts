import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { College } from 'src/api/public/colleges/domain/entities/college.entity';
import { CollegesRepository } from 'src/api/public/colleges/infrastructure/colleges.repository';
import { CollegesService } from 'src/api/public/colleges/application/colleges.service';

@Module({
  imports: [TypeOrmModule.forFeature([College])],
  providers: [CollegesService, CollegesRepository],
  exports: [CollegesService],
})
export class CollegesModule {}
