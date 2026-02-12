
import { AppState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';
const SUPABASE_URL = 'https://chzkslqbpmlpepvydacu.supabase.co';

export const dbService = {
  // Detecta se o problema é bloqueio de navegador ou erro de servidor
  diagnoseConnection: async (): Promise<{ status: 'CONNECTED' | 'BLOCKED' | 'SERVER_ERROR' | 'OFFLINE', message?: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: { 'apikey': 'ping' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return { status: 'CONNECTED' };
    } catch (e: any) {
      if (e.name === 'AbortError') return { status: 'OFFLINE', message: 'Tempo de conexão esgotado.' };
      if (e.message.includes('fetch') || e.name === 'TypeError') {
        return { 
          status: 'BLOCKED', 
          message: 'Conexão bloqueada pelo navegador. Provavelmente um AdBlocker ou extensão de segurança.' 
        };
      }
      return { status: 'SERVER_ERROR', message: e.message };
    }
  },

  saveState: async (state: AppState): Promise<{ success: boolean; error?: string; isNetworkBlock?: boolean }> => {
    // Sempre salvar local primeiro
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (!supabase) return { success: false, error: "Supabase não configurado." };

    try {
      const { error } = await supabase
        .from('omega_store')
        .upsert({ id: 1, state: state }, { onConflict: 'id' });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      const isBlock = e.message?.includes('fetch') || e.name === 'TypeError';
      return { 
        success: false, 
        error: isBlock ? "Bloqueio de Navegador (AdBlock?)" : e.message,
        isNetworkBlock: isBlock
      };
    }
  },

  loadState: async (): Promise<AppState | null> => {
    const localData = localStorage.getItem(STORAGE_KEY);
    let localParsed: AppState | null = null;
    
    if (localData) {
      try { localParsed = JSON.parse(localData); } catch (e) {}
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('omega_store')
          .select('state')
          .eq('id', 1)
          .maybeSingle();

        if (!error && data?.state) return data.state as AppState;
      } catch (e) {}
    }

    return localParsed;
  },
};
