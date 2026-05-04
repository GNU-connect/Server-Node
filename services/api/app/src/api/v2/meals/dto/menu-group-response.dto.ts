import { ApiProperty } from '@nestjs/swagger';
import { MenuGroup } from '../domain/menu-group.domain';
import { MenuItemResponseDto } from './menu-item-response.dto';

export class MenuGroupResponseDto {
  @ApiProperty({ description: '카테고리명' })
  categoryName: string;

  @ApiProperty({ description: '카테고리 메뉴 목록', type: [MenuItemResponseDto] })
  items: MenuItemResponseDto[];

  static from(group: MenuGroup): MenuGroupResponseDto {
    return {
      categoryName: group.categoryName,
      items: group.items.map(item => MenuItemResponseDto.from(item)),
    };
  }
}
