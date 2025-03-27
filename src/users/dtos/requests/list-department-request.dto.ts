import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ClientExtraDto } from 'src/common/dtos/requests';

export class ListDepartmentsRequestDto extends ClientExtraDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '캠퍼스 ID', example: 1 })
  campusId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '단과대학 ID',
    default: 1,
  })
  collegeId: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '페이지 번호', example: 1 })
  page?: number = 1;
}
