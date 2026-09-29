import type { ScrapeRun } from '../../api/types';

/** 대상 셀. 가장 구체적인 항목(마지막)이 윗줄, 나머지 맥락이 아랫줄이다. */
export function TargetCell({ run }: { run: ScrapeRun }) {
  const values = run.targetMeta.map(item => item.value);
  const main = values.length > 0 ? values[values.length - 1] : run.target;
  if (main === null) return <>-</>;

  const context = values.slice(0, -1).join(' · ');
  return (
    <>
      <span className="ad-target-main" title={main}>
        {main}
      </span>
      {context && (
        <span className="ad-target-sub" title={context}>
          {context}
        </span>
      )}
    </>
  );
}
