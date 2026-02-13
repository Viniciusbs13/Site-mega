
import { AppState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';
const SUPABASE_URL = 'https://chzkslqbpmlpepvydacu.supabase.co';

export const dbService = {
  diagnoseConnection: async (): Promise<{ status: 'CONNECTED' | 'BLOCKED' | 'SERVER_ERROR' | 'OFFLINE', message?: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: { 'apikey': 'ping', 'Content-Type': 'application/json' },
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return { status: 'CONNECTED' };
    } catch (e: any) {
      if (e.name === 'AbortError') return { status: 'OFFLINE', message: 'Timeout' };
      if (e.message?.includes('fetch') || e.name === 'TypeError' || e.status === 0) {
        return { status: 'BLOCKED', message: 'Extensão bloqueando rede.' };
      }
      return { status: 'SERVER_ERROR', message: e.message };
    }
  },

  saveState: async (state: AppState): Promise<{ success: boolean; error?: string; isNetworkBlock?: boolean }> => {
    // Backup local imediato
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}

    if (!supabase) return { success: false, error: "Supabase Down", isNetworkBlock: true };

    try {
      const { error } = await supabase
        .from('omega_store')
        .upsert({ id: 1, state: state }, { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      const isBlock = e.message?.includes('fetch') || e.name === 'TypeError';
      return { success: false, error: e.message, isNetworkBlock: isBlock };
    }
  },

  loadState: async (): Promise<AppState | null> => {
    // Tenta Nuvem primeiro (Prioridade máxima para multi-device)
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('omega_store')
          .select('state')
          .eq('id', 1)
          .maybeSingle();

        if (!error && data?.state) {
          const cloudState = data.state as AppState;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
          return cloudState;
        }
      } catch (e) {
        console.warn("Falha ao ler nuvem, tentando local...");
      }
    }

    // Fallback Local
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      try { return JSON.parse(localData); } catch (e) { return null; }
    }
    return null;
  },

  // Busca específica para o Login funcionar em qualquer lugar
  fetchGlobalTeam: async (): Promise<any[] | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('omega_store')
        .select('state')
        .eq('id', 1)
        .maybeSingle();
      
      if (!error && data?.state?.team) {
        return data.state.team;
      }
    } catch (e) {}
    return null;
  }
};
