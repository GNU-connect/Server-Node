import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { ClientExtraDto } from 'src/common/dtos/requests';

export class UpsertDepartmentRequestDto extends ClientExtraDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '캠퍼스 ID',
    default: 1,
  })
  campusId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '학과 ID',
    default: 1,
  })
  departmentId: number;
}
