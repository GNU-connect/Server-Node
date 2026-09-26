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
  props: Partial<{ requesting: boolean; notice: string | null; onRequest: () => void }> = {},
) {
  const onRequest = props.onRequest ?? vi.fn();
  render(
    <MemoryRouter future={ROUTER_FUTURE}>
      <ScraperCard
        status={status}
        now={NOW}
        requesting={props.requesting ?? false}
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
    renderCard(makeStatus('notice', makeRun({ type: 'notice', status, finishedAt: null })));

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
});
