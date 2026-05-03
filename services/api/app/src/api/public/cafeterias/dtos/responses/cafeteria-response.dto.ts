import { ApiProperty } from '@nestjs/swagger';
import { CampusResponseDto } from 'src/api/public/campuses/dtos/campus-response.dto';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';

export class CafeteriaResponseDto {
  @ApiProperty({ description: '식당 ID' })
  id: number;

  @ApiProperty({ description: '식당 이름' })
  name: string;

  @ApiProperty({ description: '식당 썸네일 URL' })
  thumbnailUrl: string;

  @ApiProperty({ description: '소속 캠퍼스', type: CampusResponseDto })
  campus: CampusResponseDto;

  static from(cafeteria: Cafeteria): CafeteriaResponseDto {
    return {
      id: cafeteria.id,
      name: cafeteria.name,
      thumbnailUrl: cafeteria.thumbnailUrl,
      campus: cafeteria.campus,
    };
  }
}
