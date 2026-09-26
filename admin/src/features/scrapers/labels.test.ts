import { makeRun } from '../../test/fixtures';
import { makeStatus } from '../../test/fixtures';
import {
  NO_RUN_VIEW,
  STATUS_VIEWS,
  TYPE_LABELS,
  failedTargets,
  isFailing,
  isInProgress,
  isStatusInProgress,
  overallView,
  summarizeTargets,
} from './labels';

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

  describe('대상이 있는 타입의 전체 상태', () => {
    const target = (id: string, status: 'succeeded' | 'failed' | 'running' | null) => ({
      target: id,
      targetName: `식당${id}`,
      latestRun: status
        ? makeRun({ id: Number(id), type: 'cafeteria', target: id, status, ...(status === 'running' ? { finishedAt: null } : {}) })
        : null,
      lastSucceededRun: null,
    });
    // 타입 전체의 최근 run(가장 큰 id)은 성공이지만 한 대상은 실패한 상태
    const mixed = () =>
      makeStatus('cafeteria', makeRun({ id: 99, type: 'cafeteria', status: 'succeeded' }), null, [
        target('1', 'failed'),
        target('2', 'succeeded'),
      ]);

    it('한 대상이라도 실패했으면 타입 전체 최근 run이 성공이어도 실패로 본다', () => {
      expect(isFailing(mixed())).toBe(true);
      expect(failedTargets(mixed()).map(item => item.target)).toEqual(['1']);
      expect(overallView(mixed())).toEqual(STATUS_VIEWS.failed);
    });

    it('실패가 없고 진행 중인 대상이 있으면 수집 중으로 본다', () => {
      const status = makeStatus('cafeteria', makeRun({ type: 'cafeteria' }), null, [
        target('1', 'succeeded'),
        target('2', 'running'),
      ]);

      expect(isFailing(status)).toBe(false);
      expect(isStatusInProgress(status)).toBe(true);
      expect(overallView(status)).toEqual(STATUS_VIEWS.running);
    });

    it('모든 대상이 기록 없음이면 기록 없음, 모두 성공이면 성공이다', () => {
      const none = makeStatus('cafeteria', null, null, [target('1', null)]);
      const all = makeStatus('cafeteria', makeRun({ type: 'cafeteria' }), null, [target('1', 'succeeded')]);

      expect(overallView(none)).toEqual(NO_RUN_VIEW);
      expect(overallView(all)).toEqual(STATUS_VIEWS.succeeded);
    });

    it('대상 없는 타입은 타입 전체 최근 run으로 판단한다', () => {
      const failed = makeStatus('shuttle', makeRun({ status: 'failed' }));

      expect(isFailing(failed)).toBe(true);
      expect(overallView(failed)).toEqual(STATUS_VIEWS.failed);
      expect(isStatusInProgress(makeStatus('shuttle', makeRun({ status: 'running', finishedAt: null })))).toBe(true);
    });
  });
});
