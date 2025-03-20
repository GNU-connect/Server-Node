import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ClientExtraDto } from 'src/modules/common/dtos/requests';

export class ListCollegesRequestDto extends ClientExtraDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '캠퍼스 ID', example: 1 })
  campusId: number;

  @IsOptional()
  @ApiProperty({ description: '페이지 번호', example: 1 })
  @IsNumber()
  page?: number = 1;
}