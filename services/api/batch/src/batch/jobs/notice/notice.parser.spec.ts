import { NoticeParser } from './notice.parser';

const HEADERS = `
  <thead><tr>
    <th scope="col" class="BD_tm_none">번호</th>
    <th scope="col" class="BD_tm_none">구분</th>
    <th scope="col">제목</th>
    <th scope="col" class="BD_tm_none">부서명</th>
    <th scope="col widS15">등록일</th>
  </tr></thead>`;

const row = (
  id: string,
  title: string,
  date: string,
  pinned = false,
): string => `
  <tr>
    <td class="BD_tm_none">${pinned ? '<b class="btn_S btn_default">공지</b>' : id}</td>
    <td class="BD_tm_none">경상국립대</td>
    <td class="ta_l">
      <a href="javascript:" data-id="${id}" class="nttInfoBtn">
        ${title}
      </a>
    </td>
    <td class="BD_tm_none">학사지원과</td>
    <td>${date}</td>
  </tr>`;

const table = (...rows: string[]): string =>
  `<table>${HEADERS}<tbody>${rows.join('')}</tbody></table>`;

describe('NoticeParser', () => {
  const parser = new NoticeParser();

  it('게시글 번호·제목·등록일을 뽑는다', () => {
    const raw = table(
      row(
        '8610403',
        '2026학년도 2학기 수강신청확인원 제출 안내',
        '2026.09.21',
        true,
      ),
      row('8610100', '장학금 신청 안내', '2026.09.18'),
    );

    expect(parser.parse(raw)).toEqual([
      {
        nttSn: 8610403,
        title: '2026학년도 2학기 수강신청확인원 제출 안내',
        createdAt: '2026-09-21',
      },
      { nttSn: 8610100, title: '장학금 신청 안내', createdAt: '2026-09-18' },
    ]);
  });

  it('제목 안의 여러 공백과 줄바꿈을 정리하고 아이콘 태그의 글자는 섞지 않는다', () => {
    const raw = table(
      row('1', '제목  앞뒤\n   공백 <span class="new">N</span>', '2026.09.01'),
    );

    expect(parser.parse(raw)[0].title).toBe('제목 앞뒤 공백');
  });

  it('번호나 날짜를 읽을 수 없는 행은 건너뛴다', () => {
    const raw = table(
      row('abc', '깨진 번호', '2026.09.01'),
      row('5', '깨진 날짜', '어제'),
      row('6', '정상', '2026.09.02'),
    );

    expect(parser.parse(raw)).toEqual([
      { nttSn: 6, title: '정상', createdAt: '2026-09-02' },
    ]);
  });

  it('게시글이 없는 게시판은 빈 배열이다', () => {
    const raw = `<table>${HEADERS}<tbody><tr><td colspan="5">등록된 게시물이 없습니다.</td></tr></tbody></table>`;

    expect(parser.parse(raw)).toEqual([]);
  });

  it('게시글 링크는 있는데 하나도 해석하지 못하면 구조가 바뀐 것으로 보고 에러를 던진다', () => {
    const raw = table(row('abc', '깨진 번호', '2026.09.01'));

    expect(() => parser.parse(raw)).toThrow(
      '공지 목록 행을 해석할 수 없습니다.',
    );
  });

  it('등록일 열이 있는 게시판 표가 아니면 에러를 던진다', () => {
    expect(() => parser.parse('<html><body>점검 중</body></html>')).toThrow(
      '공지 목록 표를 찾을 수 없습니다.',
    );
    expect(() =>
      parser.parse(
        '<table><thead><tr><th>일</th><th>월</th></tr></thead><tbody></tbody></table>',
      ),
    ).toThrow('공지 목록 표를 찾을 수 없습니다.');
  });
});
