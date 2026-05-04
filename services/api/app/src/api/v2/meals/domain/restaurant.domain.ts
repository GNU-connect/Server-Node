import { Campus } from '../../campus/domain/campus.domain';

export class Restaurant {
  constructor(
    public readonly id: number,
    public readonly campusId: number,
    public readonly name: string,
    public readonly thumbnailUrl: string,
    public readonly campus: Campus,
  ) {}
}
