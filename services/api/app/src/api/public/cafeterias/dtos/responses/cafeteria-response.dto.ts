import { ApiProperty } from '@nestjs/swagger';
import { CampusResponseDto } from 'src/api/public/campuses/dtos/campus-response.dto';

export class CafeteriaResponseDto {
  @ApiProperty({ description: '식당 ID' })
  id: number;

  @ApiProperty({ description: '식당 이름' })
  name: string;

  @ApiProperty({ description: '식당 썸네일 URL' })
  thumbnailUrl: string;

  @ApiProperty({ description: '소속 캠퍼스', type: CampusResponseDto })
  campus: CampusResponseDto;
}
