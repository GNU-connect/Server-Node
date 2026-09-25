import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeRun } from '../../test/fixtures';
import { RunTable } from './RunTable';

const NOW = new Date('2026-09-25T06:00:00.000Z');

describe('RunTable', () => {
  const runs = [
    makeRun({ id: 12, type: 'cafeteria', trigger: 'manual', status: 'failed', errorMessage: 'HTTP 500 from dorm' }),
    makeRun({ id: 11 }),
  ];

  it('실행마다 번호·타입·트리거·상태·요청 시각·소요·오류를 한 줄에 보여 준다', () => {
    render(<RunTable runs={runs} now={NOW} caption="최근 실행" />);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    const first = within(rows[1]);
    expect(first.getByText('12')).toBeInTheDocument();
    expect(first.getByText('학식')).toBeInTheDocument();
    expect(first.getByText('수동')).toBeInTheDocument();
    expect(first.getByText('실패')).toHaveClass('jn-badge-danger');
    expect(first.getByText('오늘 14:20')).toBeInTheDocument();
    expect(first.getByText('1분 12초')).toBeInTheDocument();
    expect(first.getByText('HTTP 500 from dorm')).toHaveAttribute('title', 'HTTP 500 from dorm');
  });

  it('행을 누르거나 Enter를 치면 onSelect로 넘기고, 선택된 행을 표시한다', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RunTable runs={runs} now={NOW} caption="실행 기록" selectedId={11} onSelect={onSelect} />);

    const rows = screen.getAllByRole('row');
    expect(rows[2]).toHaveAttribute('aria-selected', 'true');
    await user.click(rows[1]);
    expect(onSelect).toHaveBeenLastCalledWith(runs[0]);

    rows[2].focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(runs[1]);
  });

  it('onSelect가 없으면 행에 포커스가 가지 않는다', () => {
    render(<RunTable runs={runs} now={NOW} caption="최근 실행" />);

    expect(screen.getAllByRole('row')[1]).not.toHaveAttribute('tabindex');
  });
});
