import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_BET_CONFIG, validateBetConfig, type BetConfig } from '../core/betting';
import type { Rules } from '../core/rules';
import type { SessionRecord } from '../core/session';
import { getItem, setItem } from './db';

export interface TableProfile { name: string; rules: Rules; bet: BetConfig; }

const CONFIG_KEY = 'betConfig.v1';
const PROFILES_KEY = 'profiles.v1';
const RECORDS_KEY = 'sessionRecords.v1';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch (error) {
    console.warn(`No se pudo leer ${key}`, error);
    return fallback;
  }
}

/** Configuración de apuestas, perfiles de mesa e historial de sesiones, guardados en el dispositivo. */
export function useBetConfig() {
  const [config, setConfig] = useState<BetConfig>({ ...DEFAULT_BET_CONFIG, ramp: [...DEFAULT_BET_CONFIG.ramp] });
  const [profiles, setProfiles] = useState<TableProfile[]>([]);
  const [records, setRecords] = useState<SessionRecord[]>([]);

  useEffect(() => {
    let alive = true;
    void Promise.all([
      readJson<Partial<BetConfig>>(CONFIG_KEY, {}),
      readJson<TableProfile[]>(PROFILES_KEY, []),
      readJson<SessionRecord[]>(RECORDS_KEY, []),
    ]).then(([saved, savedProfiles, savedRecords]) => {
      if (!alive) return;
      try {
        // Campos nuevos que falten se toman de los valores por defecto.
        setConfig(validateBetConfig({ ...DEFAULT_BET_CONFIG, ...saved } as BetConfig));
      } catch (error) {
        console.warn('Configuración guardada inválida', error);
      }
      setProfiles(Array.isArray(savedProfiles) ? savedProfiles : []);
      setRecords(Array.isArray(savedRecords) ? savedRecords : []);
    });
    return () => { alive = false; };
  }, []);

  const save = useCallback((key: string, value: unknown) => {
    void setItem(key, JSON.stringify(value)).catch((error) => console.warn(`No se pudo guardar ${key}`, error));
  }, []);

  /** Lanza error si la configuración es inválida; así la pantalla puede mostrarlo. */
  const updateConfig = useCallback((next: BetConfig) => {
    const valid = validateBetConfig(next);
    setConfig(valid);
    save(CONFIG_KEY, valid);
  }, [save]);

  const saveProfiles = useCallback((next: TableProfile[]) => {
    setProfiles(next);
    save(PROFILES_KEY, next);
  }, [save]);

  const addRecord = useCallback((record: SessionRecord) => {
    setRecords((current) => {
      const next = [record, ...current];
      save(RECORDS_KEY, next);
      return next;
    });
  }, [save]);

  return { config, updateConfig, profiles, saveProfiles, records, addRecord };
}
