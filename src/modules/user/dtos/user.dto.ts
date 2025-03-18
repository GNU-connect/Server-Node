import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNumber } from 'class-validator';

export class GetCollegeDto {
  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.campusId)
  @ApiProperty({
    description: '캠퍼스 ID'
  })
  campusId: number;

  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.page)
  @ApiProperty({
    description: '페이지 번호'
  })
  page: number;
}

export class GetDepartmentDto {
  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.campusId)
  @ApiProperty({
    description: '캠퍼스 ID'
  })
  campusId: number;

  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.collegeId)
  @ApiProperty({
    description: '단과대학 ID'
  })
  collegeId: number;

  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.page)
  @ApiProperty({
    description: '페이지 번호'
  })
  page: number;
}

export class GetProfileDto {
  @IsString()
  @Transform(({ obj }) => obj.userRequest.user?.id)
  @ApiProperty({
    description: '사용자 ID'
  })
  userId: string;
}

export class UpdateDepartmentDto {
  @IsString()
  @Transform(({ obj }) => obj.userRequest.user?.id)
  @ApiProperty({
    description: '사용자 ID'
  })
  userId: string;

  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.campusId)
  @ApiProperty({
    description: '캠퍼스 ID'
  })
  campusId: number;

  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.departmentId)
  @ApiProperty({
    description: '학과 ID'
  })
  departmentId: number;
}