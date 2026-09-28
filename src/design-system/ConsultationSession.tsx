import { createContext, useContext, useState, type ReactNode } from 'react';

const Session = createContext<{ values: Record<string, string>; set: (key: string, value: string) => void } | null>(null);
/** Memory only: survives panel re-entry, never writes customer text to persistent storage. */
export function ConsultationSession({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Record<string, string>>({});
  return <Session.Provider value={{ values, set: (key, value) => setValues(previous => ({ ...previous, [key]: value })) }}>{children}</Session.Provider>;
}
export function useConsultationValue(key: string, fallback: string) {
  const session = useContext(Session);
  const [local, setLocal] = useState(fallback);
  return [session?.values[key] ?? local, (value: string) => session ? session.set(key, value) : setLocal(value)] as const;
}
