import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, errorText } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Icon, Notice, TextField } from '../design/components';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/scrapers';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={from} replace />;

  const canSubmit = email.trim() !== '' && password !== '' && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // 서버가 계정 오류(401)와 잠금(429)을 이미 해요체 문장으로 알려 준다
      setError(err instanceof ApiError ? err.message : errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="ad-login">
      <Card as="main">
        <div className="ad-login-head">
          <img className="ad-login-icon" src="/jinu-app-icon.webp" alt="" />
          <h1 className="ad-login-title">운영자 확인이 필요해요</h1>
          <p className="ad-login-desc">운영자 계정으로 로그인해 주세요.</p>
        </div>
        <form className="ad-login-form" onSubmit={handleSubmit}>
          <TextField
            id="admin-email"
            label="이메일"
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            id="admin-password"
            label="비밀번호"
            type={revealed ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            trailing={
              <button
                type="button"
                className="ad-icon-btn"
                aria-label={revealed ? '비밀번호 숨기기' : '비밀번호 보기'}
                onClick={() => setRevealed(r => !r)}
              >
                <Icon name={revealed ? 'eye-off' : 'eye'} />
              </button>
            }
          />
          {error && <Notice tone="danger">{error}</Notice>}
          <Button type="submit" size="lg" block disabled={!canSubmit}>
            {submitting ? '확인하는 중…' : '들어가기'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
