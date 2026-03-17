import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { ClientExtraDto } from 'src/api/common/dtos/requests';

export class ListCafeteriaRequestDto extends ClientExtraDto {
  @IsOptional()
  @IsNumber()
  @IsIn([-1, 1, 2, 3, 4])
  @ApiProperty({
    description: '캠퍼스 ID',
    default: 1,
  })
  campusId?: number;
}
