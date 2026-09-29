import { scheduleResponse } from './__fixtures__/schedule-response';
import { AcademicCalendarClient } from './academic-calendar.client';
import { AcademicCalendarJob } from './academic-calendar.job';
import { AcademicCalendarParser } from './academic-calendar.parser';
import { AcademicCalendarRepository } from './academic-calendar.repository';

describe('AcademicCalendarJob', () => {
  let fetchYear: jest.Mock;
  let replaceAll: jest.Mock;
  let job: AcademicCalendarJob;

  beforeEach(() => {
    // 2026-09-26 12:00 KST
    jest.useFakeTimers().setSystemTime(new Date('2026-09-26T03:00:00Z'));
    fetchYear = jest.fn();
    replaceAll = jest.fn().mockResolvedValue(undefined);
    job = new AcademicCalendarJob(
      { fetchYear } as unknown as AcademicCalendarClient,
      new AcademicCalendarParser(),
      { replaceAll } as unknown as AcademicCalendarRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('올해와 내년을 수집해 하나로 합쳐 저장한다', async () => {
    fetchYear.mockImplementation((year: number) =>
      Promise.resolve(
        year === 2026
          ? scheduleResponse([['2026/10/20', '2026/10/24', '[학부] 중간고사']])
          : scheduleResponse([['2027/03/02', '2027/03/02', '[학부] 개강']]),
      ),
    );

    await job.run();

    expect(fetchYear).toHaveBeenNthCalledWith(1, 2026);
    expect(fetchYear).toHaveBeenNthCalledWith(2, 2027);
    expect(replaceAll).toHaveBeenCalledWith([
      {
        calendarType: 1,
        startDate: '2026-10-20',
        endDate: '2026-10-24',
        content: '중간고사',
      },
      {
        calendarType: 1,
        startDate: '2027-03-02',
        endDate: '2027-03-02',
        content: '개강',
      },
    ]);
  });

  it('종료일이 오늘 이전인 일정은 저장하지 않는다', async () => {
    fetchYear.mockResolvedValue(
      scheduleResponse([
        ['2026/09/01', '2026/09/25', '[학부] 어제 끝난 일정'],
        ['2026/09/20', '2026/09/26', '[학부] 오늘 끝나는 일정'],
      ]),
    );

    await job.run();

    expect(replaceAll).toHaveBeenCalledWith([
      {
        calendarType: 1,
        startDate: '2026-09-20',
        endDate: '2026-09-26',
        content: '오늘 끝나는 일정',
      },
    ]);
  });

  it('두 해의 응답에 겹쳐 나온 일정과 같은 (분류, 내용, 시작일) 일정은 한 번만 저장한다', async () => {
    fetchYear.mockResolvedValue(
      scheduleResponse([
        ['2026/12/22', '2027/02/28', '[학부] 2학기 동계방학'],
        ['2026/12/22', '2027/03/01', '[학부] 2학기 동계방학'],
      ]),
    );

    await job.run();

    expect(replaceAll).toHaveBeenCalledTimes(1);
    expect(replaceAll).toHaveBeenCalledWith([
      {
        calendarType: 1,
        startDate: '2026-12-22',
        endDate: '2027-02-28',
        content: '2학기 동계방학',
      },
    ]);
  });

  it('저장할 일정이 없으면 기존 데이터를 지우지 않고 에러를 던진다', async () => {
    fetchYear.mockResolvedValue(scheduleResponse([]));

    await expect(job.run()).rejects.toThrow('학사일정 데이터가 없습니다.');
    expect(replaceAll).not.toHaveBeenCalled();
  });

  it('응답 형식이 이상하면 저장하지 않고 에러를 던진다', async () => {
    fetchYear.mockResolvedValue('<html>점검 중</html>');

    await expect(job.run()).rejects.toThrow();
    expect(replaceAll).not.toHaveBeenCalled();
  });
});
