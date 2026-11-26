import { useCallback, useEffect, useReducer, useState } from 'react';
import { canRedo, canUndo } from '../core/history';
import { DEFAULT_RULES } from '../core/rules';
import { createSession } from '../core/session';
import { initialSessionState, sessionReducer } from './sessionReducer';
import { loadSession, saveSession } from './sessionStorage';

type HydrateAction = {
  type: 'hydrate';
  session: ReturnType<typeof createSession>;
};

type SessionAction = Parameters<typeof sessionReducer>[1] | HydrateAction;

export function useTableSession() {
  const [state, rawDispatch] = useReducer(
    (current: ReturnType<typeof initialSessionState>, action: SessionAction) =>
      action.type === 'hydrate'
        ? initialSessionState(action.session)
        : sessionReducer(current, action),
    null,
    () => initialSessionState(createSession(DEFAULT_RULES)),
  );
  const dispatch = useCallback(
    (action: Parameters<typeof sessionReducer>[1]) => rawDispatch(action),
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    void loadSession()
      .catch((error) => {
        console.warn(error);
        return null;
      })
      .then((session) => {
        if (!alive) return;
        if (session) rawDispatch({ type: 'hydrate', session });
        setLoaded(true);
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void saveSession(state.history.present).catch((error) =>
      console.warn('No se pudo guardar la sesión', error),
    );
  }, [state.history.present, loaded]);

  return {
    loading,
    session: state.history.present,
    error: state.error,
    dispatch,
    canUndo: canUndo(state.history),
    canRedo: canRedo(state.history),
  };
}
