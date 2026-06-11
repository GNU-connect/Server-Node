import { ApiProperty } from '@nestjs/swagger';
import { ClientExtraDto } from 'src/api/common/dtos/requests';

export class ListDepartmentNoticeRequestDto extends ClientExtraDto {
  @ApiProperty({
    description: '학과 공지사항 조회',
    default: {},
  })
  extra?: Record<string, any>;
}
