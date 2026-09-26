import { makeRun } from '../../test/fixtures';
import { NO_RUN_VIEW, STATUS_VIEWS, TYPE_LABELS, isInProgress, summarizeTargets } from './labels';

describe('labels', () => {
  it('타입과 상태를 한글 라벨로 바꾼다', () => {
    expect(TYPE_LABELS['academic-calendar']).toBe('학사 일정');
    expect(STATUS_VIEWS.failed).toEqual({ label: '실패', tone: 'danger', icon: 'alert' });
    expect(STATUS_VIEWS.running.label).toBe('수집 중');
    expect(NO_RUN_VIEW.label).toBe('기록 없음');
  });

  it('pending과 running만 진행 중으로 본다', () => {
    expect(isInProgress(makeRun({ status: 'pending' }))).toBe(true);
    expect(isInProgress(makeRun({ status: 'running' }))).toBe(true);
    expect(isInProgress(makeRun({ status: 'failed' }))).toBe(false);
    expect(isInProgress(null)).toBe(false);
  });

  it('학교 공지는 university-notice 타입의 라벨이다', () => {
    expect(TYPE_LABELS['university-notice']).toBe('학교 공지');
  });

  it('대상별 상태를 한 줄로 요약한다', () => {
    const target = (id: string, run: ReturnType<typeof makeRun> | null) => ({
      target: id,
      targetName: `식당${id}`,
      latestRun: run,
      lastSucceededRun: null,
    });

    expect(
      summarizeTargets([
        target('1', makeRun({ status: 'succeeded' })),
        target('2', makeRun({ status: 'succeeded' })),
        target('3', makeRun({ status: 'failed' })),
        target('4', makeRun({ status: 'running' })),
        target('5', null),
      ]),
    ).toBe('성공 2 · 실패 1 · 진행 중 1 · 기록 없음 1');
    expect(summarizeTargets([target('1', makeRun({ status: 'succeeded' }))])).toBe('성공 1 · 실패 0');
  });
});
