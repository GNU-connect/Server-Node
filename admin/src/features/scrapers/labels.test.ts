import { makeRun } from '../../test/fixtures';
import { NO_RUN_VIEW, STATUS_VIEWS, TYPE_LABELS, isInProgress } from './labels';

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
});
