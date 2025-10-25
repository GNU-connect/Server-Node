import { ClientExtraDto } from 'src/api/common/dtos/requests';

export type DietDate = '오늘' | '내일';
export type DietTime = '아침' | '점심' | '저녁';

export class ListCafeteriaDietExtraRequestDto extends ClientExtraDto {
  cafeteriaId: number;
  date: DietDate;
  time?: DietTime;
}
