import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campus } from 'src/api/public/campuses/domain/entities/campus.entity';
import { CampusesRepository } from 'src/api/public/campuses/infrastructure/campuses.repository';
import { CampusesNativeController } from 'src/api/public/campuses/presentation/campuses-native.controller';
import { CampusesService } from 'src/api/public/campuses/application/campuses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Campus])],
  controllers: [CampusesNativeController],
  providers: [CampusesService, CampusesRepository],
  exports: [CampusesService],
})
export class CampusesModule {}
