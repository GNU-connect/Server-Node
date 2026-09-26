import { act, renderHook } from '@testing-library/react';
import { usePolling } from './usePolling';

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    setHidden(false);
  });

  it('마운트 즉시 한 번 부르고, 끝난 뒤 간격마다 다시 부른다', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    renderHook(() => usePolling(fn, 1000));

    expect(fn).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(999));
    expect(fn).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('이전 호출이 끝나기 전에는 다음 호출을 하지 않는다', async () => {
    let resolve!: () => void;
    const fn = vi.fn(() => new Promise<void>(r => (resolve = r)));
    renderHook(() => usePolling(fn, 1000));

    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(fn).toHaveBeenCalledTimes(1);

    await act(async () => resolve());
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('간격이 바뀌면 즉시 부르지 않고 새 간격으로 다시 건다', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(({ ms }) => usePolling(fn, ms), {
      initialProps: { ms: 30_000 },
    });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(fn).toHaveBeenCalledTimes(1);

    rerender({ ms: 3000 });
    expect(fn).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('호출 중에 간격이 바뀌어도 겹쳐 부르지 않고 폴링이 이어진다', async () => {
    let resolve!: () => void;
    const fn = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>(r => (resolve = r)))
      .mockResolvedValue(undefined);
    const { rerender } = renderHook(({ ms }) => usePolling(fn, ms), {
      initialProps: { ms: 30_000 },
    });

    rerender({ ms: 3000 });
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(fn).toHaveBeenCalledTimes(1);

    await act(async () => resolve());
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('fn이 실패해도 다음 호출을 이어 간다', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    renderHook(() => usePolling(fn, 1000));

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('enabled가 false면 부르지 않는다', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    renderHook(() => usePolling(fn, 1000, false));

    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(fn).not.toHaveBeenCalled();
  });

  it('탭이 숨겨지면 멈추고, 다시 보이면 즉시 한 번 부른다', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    renderHook(() => usePolling(fn, 1000));
    await act(() => vi.advanceTimersByTimeAsync(0));

    act(() => setHidden(true));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => setHidden(false));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('언마운트하면 더 부르지 않는다', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => usePolling(fn, 1000));
    await act(() => vi.advanceTimersByTimeAsync(0));

    unmount();
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('항상 최신 fn을 부른다', async () => {
    const first = vi.fn().mockResolvedValue(undefined);
    const second = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(({ fn }) => usePolling(fn, 1000), {
      initialProps: { fn: first },
    });
    await act(() => vi.advanceTimersByTimeAsync(0));

    rerender({ fn: second });
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
