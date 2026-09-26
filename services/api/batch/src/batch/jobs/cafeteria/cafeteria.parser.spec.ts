import { CafeteriaParser } from './cafeteria.parser';

const HEADER = `
  <thead><tr>
    <th scope="col">구분</th>
    <th scope="col">월 <br>2026-09-21</th>
    <th scope="col">화 <br>2026-09-22</th>
  </tr></thead>`;

const cell = (...divs: Array<{ category?: string; menu: string }>): string =>
  `<td>${divs
    .map(
      ({ category, menu }) =>
        `<div>${category ? `<p class="fm_tit_p mgt15">${category}</p>` : ''}<p class="">${menu}</p></div>`,
    )
    .join('')}</td>`;

const table = (rows: string[]): string =>
  `<table>${HEADER}<tbody>${rows.map((row) => `<tr><th scope="row">행</th>${row}</tr>`).join('')}</tbody></table>`;

describe('CafeteriaParser', () => {
  const parser = new CafeteriaParser();

  it('시간대·카테고리·메뉴를 날짜별로 뽑고 <br>로 메뉴를 나눈다', () => {
    const raw = table([
      cell(
        { category: 'A코스/한식', menu: '쌀밥<br/>콩나물국<br/>' },
        { category: 'B코스/베이커리', menu: '식빵' },
      ) + cell({ category: 'A코스/한식', menu: '잡곡밥' }),
      cell({ category: '한그릇', menu: '카레라이스' }) +
        cell({ category: '한그릇', menu: '쫄면' }),
    ]);

    const menu = parser.parse(raw, { name: '아람관', formType: 1 });

    expect(menu.startDate).toBe('2026-09-21');
    expect(menu.endDate).toBe('2026-09-22');
    expect(menu.dishes).toEqual([
      {
        date: '2026-09-21',
        day: '월',
        time: '아침',
        dishType: null,
        dishCategory: 'A코스/한식',
        dishName: '쌀밥',
      },
      {
        date: '2026-09-21',
        day: '월',
        time: '아침',
        dishType: null,
        dishCategory: 'A코스/한식',
        dishName: '콩나물국',
      },
      {
        date: '2026-09-21',
        day: '월',
        time: '아침',
        dishType: null,
        dishCategory: 'B코스/베이커리',
        dishName: '식빵',
      },
      {
        date: '2026-09-22',
        day: '화',
        time: '아침',
        dishType: null,
        dishCategory: 'A코스/한식',
        dishName: '잡곡밥',
      },
      {
        date: '2026-09-21',
        day: '월',
        time: '점심',
        dishType: null,
        dishCategory: '한그릇',
        dishName: '카레라이스',
      },
      {
        date: '2026-09-22',
        day: '화',
        time: '점심',
        dishType: null,
        dishCategory: '한그릇',
        dishName: '쫄면',
      },
    ]);
  });

  it('form_type 2는 행을 주식·국류 같은 구분으로 보고 시간대는 점심으로 고정한다', () => {
    const raw = table([
      cell({ menu: '쌀밥' }) + cell({ menu: '현미밥' }),
      cell({ menu: '된장국' }) + cell({ menu: '미역국' }),
    ]);

    const menu = parser.parse(raw, { name: '가좌식당', formType: 2 });

    expect(
      menu.dishes.map((dish) => [
        dish.date,
        dish.time,
        dish.dishType,
        dish.dishName,
      ]),
    ).toEqual([
      ['2026-09-21', '점심', '주식', '쌀밥'],
      ['2026-09-22', '점심', '주식', '현미밥'],
      ['2026-09-21', '점심', '국류', '된장국'],
      ['2026-09-22', '점심', '국류', '미역국'],
    ]);
  });

  it('교육문화식당은 시간대를 점심으로 고정한다', () => {
    const raw = table([cell({ menu: '비빔밥' }) + cell({ menu: '' })]);

    const menu = parser.parse(raw, { name: '교육문화식당', formType: 1 });

    expect(menu.dishes).toEqual([
      {
        date: '2026-09-21',
        day: '월',
        time: '점심',
        dishType: null,
        dishCategory: null,
        dishName: '비빔밥',
      },
    ]);
  });

  it('메뉴가 모두 비어 있으면 날짜 범위만 있고 dishes는 빈 배열이다', () => {
    const raw = table([cell({ menu: '' }) + cell({ menu: '<br/><br/>' })]);

    const menu = parser.parse(raw, { name: '아람관', formType: 1 });

    expect(menu).toEqual({
      startDate: '2026-09-21',
      endDate: '2026-09-22',
      dishes: [],
    });
  });

  it('식단 표를 찾을 수 없으면 에러를 던진다', () => {
    expect(() =>
      parser.parse('<html><body>점검 중</body></html>', {
        name: '아람관',
        formType: 1,
      }),
    ).toThrow('식단 표를 찾을 수 없습니다.');
  });
});
