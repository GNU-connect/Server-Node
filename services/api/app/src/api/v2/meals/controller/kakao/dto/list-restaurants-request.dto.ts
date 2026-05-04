import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { ClientExtraDto } from 'src/api/common/dtos/requests';

export class ListRestaurantsRequestDto extends ClientExtraDto {
  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    description: '캠퍼스 ID. -1이면 캠퍼스 선택 카드를 반환합니다.',
    example: 1,
  })
  campusId?: number;
}
