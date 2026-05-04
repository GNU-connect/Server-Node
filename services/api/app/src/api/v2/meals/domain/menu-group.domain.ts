import { MenuItem } from './menu-item.domain';

export class MenuGroup {
  constructor(public readonly categoryName: string, public readonly items: MenuItem[]) {}
}
