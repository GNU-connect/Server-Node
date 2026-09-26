import { useEffect, useRef } from 'react';

/**
 * fn을 intervalMs 간격으로 부른다. 이전 호출이 끝난 뒤에야 다음 간격을 센다.
 * 탭이 숨겨지면 멈추고 다시 보이면 즉시 한 번 부른다. fn의 에러 표시는 fn이 맡는다.
 */
export function usePolling(fn: () => Promise<unknown>, intervalMs: number, enabled = true): void {
  const fnRef = useRef(fn);
  const inFlight = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (!enabled) {
      started.current = false;
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      clearTimeout(timer);
      if (active && !document.hidden) timer = setTimeout(tick, intervalMs);
    };

    const tick = async () => {
      if (!active || document.hidden) return;
      // 이전 effect에서 시작한 호출이 아직 진행 중이면 겹치지 않게 다음 간격으로 미룬다
      if (inFlight.current) {
        schedule();
        return;
      }
      inFlight.current = true;
      try {
        await fnRef.current();
      } catch {
        // 에러 표시는 fn이 맡는다
      } finally {
        inFlight.current = false;
      }
      schedule();
    };

    const onVisibilityChange = () => {
      if (document.hidden) clearTimeout(timer);
      else void tick();
    };

    if (started.current) {
      schedule();
    } else {
      started.current = true;
      void tick();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
