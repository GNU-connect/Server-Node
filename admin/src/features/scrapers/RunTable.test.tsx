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

  describe('대상 셀', () => {
    const cafeteriaMeta = [
      { label: '캠퍼스', value: '가좌캠퍼스' },
      { label: '식당', value: '교직원식당' },
    ];

    function renderTarget(overrides: Parameters<typeof makeRun>[0]) {
      render(<RunTable runs={[makeRun(overrides)]} now={NOW} caption="실행 기록" />);
      // 열 순서: 번호, 타입, 대상 — 오류 열도 '-'를 쓰므로 대상 셀로 범위를 좁힌다
      return within(within(screen.getAllByRole('row')[1]).getAllByRole('cell')[2]);
    }

    it('가장 구체적인 항목을 윗줄에, 나머지 맥락을 아랫줄에 보여 준다', () => {
      const row = renderTarget({
        type: 'cafeteria',
        target: '4',
        targetName: '교직원식당',
        targetMeta: cafeteriaMeta,
      });

      expect(row.getByText('교직원식당')).toHaveClass('ad-target-main');
      expect(row.getByText('가좌캠퍼스')).toHaveClass('ad-target-sub');
    });

    it('맥락 항목이 여럿이면 일반 → 구체 순서로 ·로 이어 보여 주고 title로 전체를 알려 준다', () => {
      const row = renderTarget({
        type: 'university-notice',
        target: '9',
        targetMeta: [
          { label: '학과', value: '컴퓨터과학부' },
          { label: '단과대', value: '공과대학' },
          { label: '게시판', value: '학부 공지사항' },
        ],
      });

      expect(row.getByText('학부 공지사항')).toHaveClass('ad-target-main');
      expect(row.getByText('컴퓨터과학부 · 공과대학')).toHaveAttribute(
        'title',
        '컴퓨터과학부 · 공과대학',
      );
    });

    it('항목이 하나뿐이면 아랫줄 없이 윗줄만 보여 준다', () => {
      const row = renderTarget({
        type: 'university-notice',
        target: '3',
        targetMeta: [{ label: '게시판', value: '일반공지' }],
      });

      expect(row.getByText('일반공지')).toHaveClass('ad-target-main');
      expect(row.getByText('일반공지').parentElement?.querySelector('.ad-target-sub')).toBeNull();
    });

    it('메타데이터를 찾지 못한 대상은 대상 id를 보여 준다', () => {
      const row = renderTarget({ type: 'cafeteria', target: '99', targetMeta: [] });

      expect(row.getByText('99')).toHaveClass('ad-target-main');
    });

    it('대상이 없는 타입은 -를 보여 준다', () => {
      const row = renderTarget({ type: 'shuttle', target: null, targetMeta: [] });

      expect(row.getByText('-')).toBeInTheDocument();
    });
  });
});
