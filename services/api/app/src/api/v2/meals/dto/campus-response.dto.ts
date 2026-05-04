import { ApiProperty } from '@nestjs/swagger';
import { Campus } from '../../campus/domain/campus.domain';

export class V2CampusResponseDto {
  @ApiProperty({ description: '캠퍼스 ID' })
  id: number;

  @ApiProperty({ description: '캠퍼스 이름' })
  name: string;

  @ApiProperty({ description: '캠퍼스 썸네일 URL' })
  thumbnailUrl: string;

  static from(campus: Campus): V2CampusResponseDto {
    return {
      id: campus.id,
      name: campus.name,
      thumbnailUrl: campus.thumbnailUrl,
    };
  }
}
