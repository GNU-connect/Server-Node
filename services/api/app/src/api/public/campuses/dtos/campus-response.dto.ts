import { ApiProperty } from '@nestjs/swagger';

export class CampusResponseDto {
  @ApiProperty({ description: '캠퍼스 ID' })
  id: number;

  @ApiProperty({ description: '캠퍼스 이름' })
  name: string;

  @ApiProperty({ description: '캠퍼스 썸네일 URL' })
  thumbnailUrl: string;
}
