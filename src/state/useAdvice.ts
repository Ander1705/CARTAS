import { useEffect, useMemo, useState } from 'react';
import { fullAdvice, quickAdvice, turnInfo, type FullAdvice, type TurnInfo } from '../core/advice';
import type { TableSession } from '../core/session';

export function useAdvice(session: TableSession) {
  const info = useMemo(() => turnInfo(session), [session]);
  const quick = useMemo(() => quickAdvice(session, info), [session, info]);
  const dependency = `${session.round?.log.length ?? -1}:${JSON.stringify(session.round?.target)}:${session.mySeat}`;
  const [result, setResult] = useState<{
    key: string;
    full: FullAdvice | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!info.myTurn) return () => { cancelled = true; };
    const timer = setTimeout(() => {
      try {
        const result = fullAdvice(session, info);
        if (!cancelled) setResult({ key: dependency, full: result, error: null });
      } catch (cause) {
        if (!cancelled) setResult({
          key: dependency,
          full: null,
          error: cause instanceof Error ? cause.message : String(cause),
        });
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // dependency tracks the current decision after each card, hand, or seat change.
  }, [dependency, info.myTurn, session, info]);

  const current = result?.key === dependency ? result : null;
  return {
    info: info as TurnInfo,
    quick,
    full: current?.full ?? null,
    computing: info.myTurn && current === null,
    error: current?.error ?? null,
  };
}
