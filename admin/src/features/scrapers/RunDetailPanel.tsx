import { useCallback, useEffect, useState } from 'react';
import { getScrapeRun } from '../../api/adminClient';
import { ApiError, UnauthorizedError, errorText } from '../../api/errors';
import type { ScrapeRun } from '../../api/types';
import { useApiKey, useAuth } from '../../auth/AuthContext';
import { Badge, Icon, Notice } from '../../design/components';
import { formatDateTime, formatDuration } from './format';
import { STATUS_VIEWS, TRIGGER_LABELS, TYPE_LABELS, isInProgress } from './labels';
import { useNow } from './useNow';
import { usePolling } from './usePolling';

const ACTIVE_INTERVAL_MS = 3000;

interface RunDetailPanelProps {
  runId: number;
  onClose(): void;
}

/** 실행 한 건의 전 필드. 진행 중이면 3초마다 새로 불러온다. 호출 측은 key={runId}로 쓴다. */
export function RunDetailPanel({ runId, onClose }: RunDetailPanelProps) {
  const apiKey = useApiKey();
  const { logout } = useAuth();
  const now = useNow();
  const [run, setRun] = useState<ScrapeRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRun(await getScrapeRun(apiKey, runId));
      setError(null);
    } catch (err) {
      if (err instanceof UnauthorizedError) logout();
      // 404처럼 서버가 이유를 말해 주면 그대로 보여 준다
      else setError(err instanceof ApiError ? err.message : errorText(err));
    }
  }, [apiKey, runId, logout]);

  // 처음 한 번 불러오고, 진행 중인 동안만 이어서 부른다. 오류가 나면 멈춘다.
  usePolling(load, ACTIVE_INTERVAL_MS, error === null && (run === null || isInProgress(run)));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const title = `실행 #${runId}`;
  const view = run ? STATUS_VIEWS[run.status] : null;

  return (
    <aside className="ad-panel" aria-label={title}>
      <div className="ad-panel-head">
        <h2 className="ad-section-title">{title}</h2>
        <button type="button" className="ad-icon-btn" aria-label="닫기" onClick={onClose}>
          <Icon name="x" />
        </button>
      </div>
      {error && (
        <div className="ad-panel-body">
          <Notice tone="danger">{error}</Notice>
        </div>
      )}
      {run && view && (
        <table className="ad-form-table">
          <tbody>
            <tr>
              <th scope="row">타입</th>
              <td>{TYPE_LABELS[run.type]}</td>
            </tr>
            <tr>
              <th scope="row">트리거</th>
              <td>{TRIGGER_LABELS[run.trigger]}</td>
            </tr>
            <tr>
              <th scope="row">상태</th>
              <td>
                <Badge tone={view.tone} icon={view.icon}>
                  {view.label}
                </Badge>
              </td>
            </tr>
            <tr>
              <th scope="row">요청</th>
              <td>{formatDateTime(run.createdAt, now)}</td>
            </tr>
            <tr>
              <th scope="row">시작</th>
              <td>{run.startedAt ? formatDateTime(run.startedAt, now) : '-'}</td>
            </tr>
            <tr>
              <th scope="row">종료</th>
              <td>{run.finishedAt ? formatDateTime(run.finishedAt, now) : '-'}</td>
            </tr>
            <tr>
              <th scope="row">소요</th>
              <td>{formatDuration(run.startedAt, run.finishedAt)}</td>
            </tr>
            <tr>
              <th scope="row">오류</th>
              <td>{run.errorMessage ? <pre className="ad-pre">{run.errorMessage}</pre> : '-'}</td>
            </tr>
          </tbody>
        </table>
      )}
    </aside>
  );
}
