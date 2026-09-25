import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UnauthorizedError, errorText } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Icon, Notice, TextField } from '../design/components';

export function LoginPage() {
  const { apiKey, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/scrapers';

  const [key, setKey] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (apiKey) return <Navigate to={from} replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!key.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(key);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof UnauthorizedError ? '키가 맞지 않아요. 다시 확인해 주세요.' : errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="ad-login">
      <Card as="main">
        <div className="ad-login-head">
          <img className="ad-login-icon" src="/jinu-app-icon.webp" alt="" />
          <h1 className="ad-login-title">운영자 확인이 필요해요</h1>
          <p className="ad-login-desc">ADMIN_API_KEY를 입력하면 수집 상태를 볼 수 있어요.</p>
        </div>
        <form className="ad-login-form" onSubmit={handleSubmit}>
          <TextField
            id="admin-api-key"
            label="어드민 API 키"
            type={revealed ? 'text' : 'password'}
            autoComplete="current-password"
            autoFocus
            value={key}
            onChange={e => setKey(e.target.value)}
            trailing={
              <button
                type="button"
                className="ad-icon-btn"
                aria-label={revealed ? '키 숨기기' : '키 보기'}
                onClick={() => setRevealed(r => !r)}
              >
                <Icon name={revealed ? 'eye-off' : 'eye'} />
              </button>
            }
          />
          {error && <Notice tone="danger">{error}</Notice>}
          <Button type="submit" size="lg" block disabled={!key.trim() || submitting}>
            {submitting ? '확인하는 중…' : '들어가기'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
