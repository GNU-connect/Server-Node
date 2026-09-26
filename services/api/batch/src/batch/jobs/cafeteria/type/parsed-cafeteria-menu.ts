export interface ParsedCafeteriaDish {
  /** YYYY-MM-DD */
  date: string;
  /** 월~일 */
  day: string;
  /** 아침, 점심, 저녁 */
  time: string;
  /** form_type 2 식당의 구분(주식, 국류, 찬류, 후식). 그 외 null */
  dishType: string | null;
  /** 코스/카테고리 이름(예: A코스/한식) */
  dishCategory: string | null;
  dishName: string;
}

export interface ParsedCafeteriaMenu {
  startDate: string;
  endDate: string;
  dishes: ParsedCafeteriaDish[];
}
