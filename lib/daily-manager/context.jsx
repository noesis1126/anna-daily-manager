// lib/daily-manager/context.jsx
'use client';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { todayYmd } from './dates';

const Ctx = createContext(null);

export function DMProvider({ children }) {
  const [date, setDate] = useState(() => todayYmd());
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(null);
  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);
  const openForm = useCallback((type, data = null) => setForm({ type, data }), []);
  const closeForm = useCallback(() => setForm(null), []);
  const value = useMemo(
    () => ({ date, setDate, refreshKey, bump, form, openForm, closeForm }),
    [date, refreshKey, form, bump, openForm, closeForm]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useDM = () => useContext(Ctx);
