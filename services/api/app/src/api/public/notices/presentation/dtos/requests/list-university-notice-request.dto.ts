import { ApiProperty } from '@nestjs/swagger';
import { ClientExtraDto } from 'src/api/common/dtos/requests';

export class ListUniversityNoticeRequestDto extends ClientExtraDto {
  @ApiProperty({
    description: '학교 공지사항 조회 (department_id=117)',
    default: {},
  })
  extra?: Record<string, any>;
}
