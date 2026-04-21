import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campus } from 'src/type-orm/entities/campuses/campus.entity';
import { CampusesRepository } from 'src/type-orm/entities/campuses/campuses.repository';
import { CampusesNativeController } from './campuses-native.controller';
import { CampusesService } from './campuses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Campus])],
  controllers: [CampusesNativeController],
  providers: [CampusesService, CampusesRepository],
  exports: [CampusesService],
})
export class CampusesModule {}
