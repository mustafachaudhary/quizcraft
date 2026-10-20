import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

/**
 * Loads a GET endpoint and keeps the last good data while a reload is in
 * flight. Pages decide how much of that state to show.
 */
export function useApi(path) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: Boolean(path),
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) {
      setState({ data: null, error: null, loading: false });
      return undefined;
    }

    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    api
      .get(path)
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (active) setState({ data: null, error, loading: false });
      });

    return () => {
      active = false;
    };
  }, [path, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  return { ...state, reload };
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | QuizCraft` : 'QuizCraft';
  }, [title]);
}
