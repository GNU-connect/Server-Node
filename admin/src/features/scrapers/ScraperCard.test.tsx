import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ROUTER_FUTURE } from '../../App';
import type { ScraperStatus } from '../../api/types';
import { makeRun, makeStatus } from '../../test/fixtures';
import { ScraperCard } from './ScraperCard';

const NOW = new Date('2026-09-25T06:00:00.000Z');

function renderCard(
  status: ScraperStatus,
  props: Partial<{
    requesting: boolean;
    requestingTarget: string | null;
    notice: string | null;
    onRequest: () => void;
  }> = {},
) {
  const onRequest = props.onRequest ?? vi.fn();
  render(
    <MemoryRouter future={ROUTER_FUTURE}>
      <ScraperCard
        status={status}
        now={NOW}
        requesting={props.requesting ?? false}
        requestingTarget={props.requestingTarget ?? null}
        notice={props.notice ?? null}
        onRequest={onRequest}
      />
    </MemoryRouter>,
  );
  return { onRequest };
}

describe('ScraperCard', () => {
  it('성공한 수집의 최근 실행·소요·마지막 성공을 보여 준다', () => {
    renderCard(makeStatus('shuttle', makeRun()));

    expect(screen.getByRole('heading', { name: '셔틀' })).toBeInTheDocument();
    expect(screen.getByText('성공')).toHaveClass('jn-badge-success');
    expect(screen.getByText('오늘 14:20 · 자동')).toBeInTheDocument();
    expect(screen.getByText('1분 12초')).toBeInTheDocument();
    expect(screen.getByText('오늘 14:21')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '지금 수집' })).toBeEnabled();
  });

  it('지금 수집을 누르면 타입을 넘긴다', async () => {
    const user = userEvent.setup();
    const { onRequest } = renderCard(makeStatus('cafeteria', makeRun({ type: 'cafeteria' })));

    await user.click(screen.getByRole('button', { name: '지금 수집' }));

    expect(onRequest).toHaveBeenCalledWith('cafeteria');
  });

  it.each([
    ['pending', '대기 중'],
    ['running', '수집 중'],
  ] as const)('%s이면 버튼을 막고 수집 중으로 표시한다', (status, label) => {
    renderCard(makeStatus('university-notice', makeRun({ type: 'university-notice', status, finishedAt: null })));

    expect(screen.getByText(label, { selector: '.jn-badge' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수집 중…' })).toBeDisabled();
    expect(screen.getByText('진행 중')).toBeInTheDocument();
  });

  it('요청을 보내는 동안에는 버튼을 막는다', () => {
    renderCard(makeStatus('shuttle', makeRun()), { requesting: true });

    expect(screen.getByRole('button', { name: '요청하는 중…' })).toBeDisabled();
  });

  it('실패하면 오류 메시지와 실행 기록 링크를 보여 준다', () => {
    const failed = makeRun({ id: 9, type: 'cafeteria', status: 'failed', errorMessage: 'TimeoutError: 30000ms' });
    renderCard(makeStatus('cafeteria', failed, makeRun({ type: 'cafeteria' })));

    expect(screen.getByText('실패')).toHaveClass('jn-badge-danger');
    expect(screen.getByRole('alert')).toHaveTextContent('TimeoutError: 30000ms');
    expect(screen.getByRole('link', { name: '실행 기록에서 전체 보기' })).toHaveAttribute(
      'href',
      '/scrape-runs?type=cafeteria&run=9',
    );
  });

  it('오류 메시지가 비어 있으면 그렇다고 알려 준다', () => {
    renderCard(makeStatus('shuttle', makeRun({ status: 'failed', errorMessage: null }), null));

    expect(screen.getByRole('alert')).toHaveTextContent('오류 메시지가 없어요.');
    expect(screen.getByText('아직 없어요')).toBeInTheDocument();
  });

  it('실행 기록이 없으면 기록 없음으로 표시하고 수집할 수 있다', () => {
    renderCard(makeStatus('academic-calendar', null));

    expect(screen.getByText('기록 없음')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '지금 수집' })).toBeEnabled();
  });

  it('409 안내 문구를 카드 안에 보여 준다', () => {
    renderCard(makeStatus('shuttle', makeRun()), { notice: '이미 수집이 대기 중이거나 실행 중이에요.' });

    expect(screen.getByRole('status')).toHaveTextContent('이미 수집이 대기 중이거나 실행 중이에요.');
  });

  describe('대상이 있는 타입', () => {
    const target = (id: string, name: string, status: 'succeeded' | 'failed' | 'running' | null) => ({
      target: id,
      targetName: name,
      latestRun: status
        ? makeRun({
            id: Number(id),
            type: 'cafeteria',
            target: id,
            targetName: name,
            status,
            ...(status === 'running' ? { finishedAt: null } : {}),
          })
        : null,
      lastSucceededRun: null,
    });
    const cafeteriaStatus = () =>
      makeStatus('cafeteria', makeRun({ type: 'cafeteria' }), null, [
        target('1', '아람관', 'succeeded'),
        target('2', '교육문화식당', 'failed'),
        target('3', '가좌식당', 'running'),
      ]);

    it('대상별 상태 요약을 보여 주고 버튼 이름을 전체 수집으로 바꾼다', () => {
      renderCard(cafeteriaStatus());

      expect(screen.getByText('성공 1 · 실패 1 · 진행 중 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '전체 수집' })).toBeEnabled();
    });

    it('대상마다 이름 링크·상태·수집 버튼을 보여 주고 대상별 실행 기록으로 연결한다', () => {
      renderCard(cafeteriaStatus());

      expect(screen.getByRole('link', { name: '아람관' })).toHaveAttribute(
        'href',
        '/scrape-runs?type=cafeteria&target=1',
      );
      expect(screen.getByRole('button', { name: '아람관 수집' })).toBeEnabled();
      expect(screen.getByRole('button', { name: '가좌식당 수집' })).toBeDisabled();
    });

    it('대상의 수집 버튼을 누르면 타입과 대상을 넘긴다', async () => {
      const user = userEvent.setup();
      const { onRequest } = renderCard(cafeteriaStatus());

      await user.click(screen.getByRole('button', { name: '교육문화식당 수집' }));

      expect(onRequest).toHaveBeenCalledWith('cafeteria', '2');
    });

    it('전체 수집을 누르면 타입만 넘긴다', async () => {
      const user = userEvent.setup();
      const { onRequest } = renderCard(cafeteriaStatus());

      await user.click(screen.getByRole('button', { name: '전체 수집' }));

      expect(onRequest).toHaveBeenCalledWith('cafeteria');
    });

    it('모든 대상이 진행 중이면 전체 수집을 막는다', () => {
      renderCard(
        makeStatus('cafeteria', makeRun({ type: 'cafeteria', status: 'running', finishedAt: null }), null, [
          target('1', '아람관', 'running'),
        ]),
      );

      expect(screen.getByRole('button', { name: '수집 중…' })).toBeDisabled();
    });

    it('한 대상의 요청을 보내는 동안 그 대상 버튼만 막는다', () => {
      renderCard(cafeteriaStatus(), { requestingTarget: '2' });

      expect(screen.getByRole('button', { name: '교육문화식당 수집' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '아람관 수집' })).toBeEnabled();
    });

    it('타입 전체 최근 run이 성공이어도 실패한 대상이 있으면 실패로 표시하고 대상 이름과 오류를 알려 준다', () => {
      const failed = makeRun({
        id: 40,
        type: 'cafeteria',
        target: '2',
        targetName: '교육문화식당',
        status: 'failed',
        errorMessage: '식단 표를 찾을 수 없습니다.',
      });
      renderCard(
        makeStatus('cafeteria', makeRun({ id: 99, type: 'cafeteria', status: 'succeeded' }), null, [
          target('1', '아람관', 'succeeded'),
          { target: '2', targetName: '교육문화식당', latestRun: failed, lastSucceededRun: null },
        ]),
      );

      // 첫 배지가 카드 머리의 전체 상태이고, 이어지는 배지는 대상별 상태다
      const [headerBadge] = screen.getAllByText('실패', { selector: '.jn-badge' });
      expect(headerBadge).toHaveClass('jn-badge-danger');
      expect(screen.getByRole('alert')).toHaveTextContent('교육문화식당');
      expect(screen.getByRole('alert')).toHaveTextContent('식단 표를 찾을 수 없습니다.');
      expect(screen.getByRole('link', { name: '실행 기록에서 전체 보기' })).toHaveAttribute(
        'href',
        '/scrape-runs?type=cafeteria&target=2&run=40',
      );
    });

    it('마지막 성공은 모든 대상 중 가장 오래된 성공 시각이고, 성공 기록이 없는 대상이 있으면 아직 없다고 한다', () => {
      const success = (id: number, finishedAt: string) =>
        makeRun({ id, type: 'cafeteria', target: String(id), finishedAt });
      const withSuccess = (id: string, name: string, finishedAt: string) => ({
        target: id,
        targetName: name,
        latestRun: success(Number(id), finishedAt),
        lastSucceededRun: success(Number(id), finishedAt),
      });

      renderCard(
        makeStatus('cafeteria', success(2, '2026-09-25T05:21:13.000Z'), null, [
          withSuccess('1', '아람관', '2026-09-25T03:00:00.000Z'),
          withSuccess('2', '교육문화식당', '2026-09-25T05:21:13.000Z'),
        ]),
      );

      // 가장 오래된 성공(12:00 KST)이지 가장 최근(14:21)이 아니다
      expect(screen.getByText('오늘 12:00')).toBeInTheDocument();
      expect(screen.queryByText('오늘 14:21')).not.toBeInTheDocument();
    });

    it('성공 기록이 없는 대상이 있으면 마지막 성공을 아직 없다고 한다', () => {
      renderCard(cafeteriaStatus());

      expect(screen.getByText('아직 없어요')).toBeInTheDocument();
    });
  });
});
