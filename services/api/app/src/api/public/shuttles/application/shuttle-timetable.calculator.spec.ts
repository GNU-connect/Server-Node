import { ShuttleTimetableCalculator } from 'src/api/public/shuttles/application/shuttle-timetable.calculator';

describe('ShuttleTimetableCalculator', () => {
  const calculator = new ShuttleTimetableCalculator();

  it('현재 KST 기준 다음 버스와 시간 상태를 계산한다', () => {
    const result = calculator.calculate(
      {
        오전: ['08:30', '09:00'],
        오후: ['13:00(금요일 미운행)'],
      },
      new Date('2026-05-04T00:45:00.000Z'), // KST 09:45, Monday
    );

    expect(result.nextBus).toEqual({ time: '13:00', minutesUntil: 195 });
    expect(result.sections).toEqual([
      {
        label: '오전',
        times: [
          { time: '08:30', memo: null, status: 'past' },
          { time: '09:00', memo: null, status: 'past' },
        ],
      },
      {
        label: '오후',
        times: [{ time: '13:00', memo: '금요일 미운행', status: 'next' }],
      },
    ]);
  });

  it('금요일에는 금요일 미운행 버스를 다음 버스 후보에서 제외한다', () => {
    const result = calculator.calculate(
      {
        오전: ['09:00(금요일 미운행)', '09:30'],
      },
      new Date('2026-05-01T00:45:00.000Z'), // KST 09:45, Friday
    );

    expect(result.nextBus).toBeNull();
    expect(result.sections[0].times).toEqual([
      { time: '09:00', memo: '금요일 미운행', status: 'past' },
      { time: '09:30', memo: null, status: 'past' },
    ]);
  });

  it('남은 버스가 없으면 다음 버스를 null로 반환한다', () => {
    const result = calculator.calculate(
      {
        오전: ['08:30', '09:00'],
      },
      new Date('2026-05-04T01:00:00.000Z'), // KST 10:00
    );

    expect(result.nextBus).toBeNull();
    expect(result.sections[0].times).toEqual([
      { time: '08:30', memo: null, status: 'past' },
      { time: '09:00', memo: null, status: 'past' },
    ]);
  });
});
