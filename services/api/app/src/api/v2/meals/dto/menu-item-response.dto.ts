import { ApiProperty } from '@nestjs/swagger';
import { MenuItem } from '../domain/menu-item.domain';

export class MenuItemResponseDto {
  @ApiProperty({ description: '메뉴 이름' })
  name: string;

  @ApiProperty({ description: '메뉴 설명' })
  description: string;

  static from(item: MenuItem): MenuItemResponseDto {
    return {
      name: item.name,
      description: item.description,
    };
  }
}
