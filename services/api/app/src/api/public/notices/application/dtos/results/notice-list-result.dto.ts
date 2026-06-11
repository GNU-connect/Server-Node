export interface NoticeItemResult {
  title: string;
  nttSn: number;
  createdAt: Date;
}

export interface NoticeCategoryResult {
  category: string;
  mi: number;
  bbsId: number;
  departmentName?: string;
  departmentEn?: string;
  notices: NoticeItemResult[];
}

export interface NoticeListResult {
  categories: NoticeCategoryResult[];
}
