import { ApiProperty, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ClientExtraDto } from 'src/common/dto/request';

export class GetCollegeDto extends ClientExtraDto {
  @ApiProperty({ description: '캠퍼스 ID', example: 1 })
  @IsNumber()
  campusId: number;

  @IsOptional()
  @ApiProperty({ description: '페이지 번호', example: 1 })
  @IsNumber()
  page?: number = 1;
}

export class GetDepartmentDto {
  @IsOptional()
  @ApiProperty({ description: '캠퍼스 ID', example: 1 })
  @IsNumber()
  campusId: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: '단과대학 ID',
    default: 1
  })
  collegeId: number;
  
  @IsOptional()
  @ApiProperty({ description: '페이지 번호', example: 1 })
  @IsNumber()
  page?: number = 1;
}

export class UpdateDepartmentDto {
  @IsNumber()
  @ApiProperty({
    description: '캠퍼스 ID',
    default: 1
  })
  campusId: number;

  @IsNumber()
  @ApiProperty({
    description: '학과 ID',
    default: 1
  })
  departmentId: number;
}