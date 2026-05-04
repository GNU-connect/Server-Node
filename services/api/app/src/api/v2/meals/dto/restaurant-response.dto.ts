import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from '../domain/restaurant.domain';
import { V2CampusResponseDto } from './campus-response.dto';

export class RestaurantResponseDto {
  @ApiProperty({ description: '식당 ID' })
  id: number;

  @ApiProperty({ description: '캠퍼스 ID' })
  campusId: number;

  @ApiProperty({ description: '식당 이름' })
  name: string;

  @ApiProperty({ description: '썸네일 URL' })
  thumbnailUrl: string;

  @ApiProperty({ description: '소속 캠퍼스', type: V2CampusResponseDto })
  campus: V2CampusResponseDto;

  static from(restaurant: Restaurant): RestaurantResponseDto {
    return {
      id: restaurant.id,
      campusId: restaurant.campusId,
      name: restaurant.name,
      thumbnailUrl: restaurant.thumbnailUrl,
      campus: restaurant.campus ? V2CampusResponseDto.from(restaurant.campus) : undefined,
    };
  }
}
