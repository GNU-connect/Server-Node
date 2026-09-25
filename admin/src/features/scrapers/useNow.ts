import { useEffect, useState } from 'react';

/** intervalMs마다 현재 시각을 새로 준다. "3초 전 갱신" 같은 상대 시각 표시에 쓴다. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
