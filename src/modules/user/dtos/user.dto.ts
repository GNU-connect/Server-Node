import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class GetCollegeDto {
  @IsNumber()
  campusId: number;

  @IsOptional()
  @Transform(({ value, obj }) => {
    console.log('value:', value);
    console.log('obj:', obj);
    return value ?? obj?.action?.clientExtra?.page;
  })
  @IsNumber()
  @ApiProperty({
    description: '페이지 번호',
    default: 1
  })
  page?: number = 1;
}

export class GetDepartmentDto {
  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.campusId)
  @ApiProperty({
    description: '캠퍼스 ID',
    default: 1
  })
  campusId: number;

  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.collegeId)
  @ApiProperty({
    description: '단과대학 ID',
    default: 1
  })
  collegeId: number;

  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.page)
  @ApiProperty({
    description: '페이지 번호',
    default: 1
  })
  page: number;
}

export class GetProfileDto {
  @IsString()
  userId: string;
}

export class UpdateDepartmentDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.campusId)
  @ApiProperty({
    description: '캠퍼스 ID',
    default: 1
  })
  campusId: number;

  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.departmentId)
  @ApiProperty({
    description: '학과 ID',
    default: 1
  })
  departmentId: number;
}