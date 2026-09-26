import { render, screen } from '@testing-library/react';
import { Badge, Button, Card, Chip, EmptyState, Icon, Notice } from '.';

describe('디자인 시스템 컴포넌트', () => {
  it('Icon은 label이 없으면 스크린리더에서 숨기고, 있으면 이미지로 읽힌다', () => {
    const { container } = render(<Icon name="bus" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    render(<Icon name="bus" label="셔틀" />);
    expect(screen.getByRole('img', { name: '셔틀' })).toBeInTheDocument();
  });

  it('Button은 variant·size·block 클래스를 붙이고 기본 type은 button이다', () => {
    render(
      <Button variant="soft" size="sm" block icon="refresh">
        지금 수집
      </Button>,
    );
    const button = screen.getByRole('button', { name: '지금 수집' });
    expect(button).toHaveClass('jn-btn', 'jn-btn-soft', 'jn-btn-sm', 'jn-btn-block');
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('Button 기본값은 primary, md 크기 클래스 없음', () => {
    render(<Button>들어가기</Button>);
    const button = screen.getByRole('button', { name: '들어가기' });
    expect(button).toHaveClass('jn-btn-primary');
    expect(button).not.toHaveClass('jn-btn-md');
  });

  it('Chip은 selected를 aria-pressed로 나타낸다', () => {
    render(
      <>
        <Chip selected>전체</Chip>
        <Chip>셔틀</Chip>
      </>,
    );
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '셔틀' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('Badge는 tone 클래스를 붙이고 neutral이면 붙이지 않는다', () => {
    render(
      <>
        <Badge tone="danger" icon="alert">
          실패
        </Badge>
        <Badge>기록 없음</Badge>
      </>,
    );
    expect(screen.getByText('실패')).toHaveClass('jn-badge', 'jn-badge-danger');
    expect(screen.getByText('기록 없음').className).toBe('jn-badge');
  });

  it('Card는 제목·메타·액션과 본문을 그린다', () => {
    render(
      <Card title="셔틀" meta="14:20" action={<span>배지</span>}>
        <p>본문</p>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: '셔틀', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('14:20')).toHaveClass('jn-card-meta');
    expect(screen.getByText('배지')).toBeInTheDocument();
    expect(screen.getByText('본문').parentElement).toHaveClass('jn-card-body');
  });

  it('Notice는 danger면 alert, info면 status 역할이다', () => {
    render(
      <>
        <Notice tone="danger" title="수집 실패">
          오류
        </Notice>
        <Notice>안내</Notice>
      </>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('수집 실패오류');
    expect(screen.getByRole('status')).toHaveTextContent('안내');
  });

  it('EmptyState는 제목과 설명, 액션을 그린다', () => {
    render(
      <EmptyState
        title="기록이 없어요"
        description="조건을 바꿔 보세요."
        action={<Button variant="soft">필터 초기화</Button>}
      />,
    );
    expect(screen.getByRole('heading', { name: '기록이 없어요' })).toBeInTheDocument();
    expect(screen.getByText('조건을 바꿔 보세요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '필터 초기화' })).toBeInTheDocument();
  });
});
