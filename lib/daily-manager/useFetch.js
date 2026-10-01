// lib/daily-manager/useFetch.js
'use client';
import { useEffect, useState } from 'react';
import { api } from './api';
import { useDM } from './context';

export function useFetch(url) {
  const { refreshKey } = useDM();
  const [state, setState] = useState({ data: null, error: null, url: null });
  useEffect(() => {
    let live = true;
    api(url)
      .then((d) => live && setState({ data: d, error: null, url }))
      .catch((e) => live && setState({ data: null, error: e.message, url }));
    return () => { live = false; };
  }, [url, refreshKey]);
  const stale = state.url !== url;
  return {
    data: stale ? null : state.data,
    error: stale ? null : state.error,
    loading: stale || (!state.data && !state.error),
    setData: (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })),
  };
}
