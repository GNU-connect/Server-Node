export interface ParsedNotice {
  /** 게시글 번호(게시판 안에서 증가) */
  nttSn: number;
  title: string;
  /** 등록일, YYYY-MM-DD */
  createdAt: string;
}
