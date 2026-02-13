
import { AppState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';
const SUPABASE_URL = 'https://chzkslqbplmpepvydacu.supabase.co';

export const dbService = {
  diagnoseConnection: async (): Promise<{ status: 'CONNECTED' | 'BLOCKED' | 'SERVER_ERROR' | 'OFFLINE', message?: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      // Ping para verificar se a rede do usuário permite acesso ao Supabase
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: { 
          'apikey': 'sb_publishable_34RidSlAX-HkuuxY73BcQg_lSGNlriO', 
          'Content-Type': 'application/json',
          'X-Client-Info': 'omega-v2'
        },
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return { status: 'CONNECTED' };
    } catch (e: any) {
      if (e.name === 'AbortError') return { status: 'OFFLINE', message: 'Conexão lenta.' };
      if (e.message?.includes('fetch') || e.name === 'TypeError' || e.status === 0) {
        return { 
          status: 'BLOCKED', 
          message: 'Bloqueio de rede detectado (AdBlock ou Firewall).' 
        };
      }
      return { status: 'SERVER_ERROR', message: e.message };
    }
  },

  saveState: async (state: AppState): Promise<{ success: boolean; error?: string; isNetworkBlock?: boolean }> => {
    // 1. Sempre persiste localmente primeiro para segurança do usuário
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    if (!supabase) return { success: false, error: "Supabase not initialized", isNetworkBlock: true };

    try {
      // O modelo assume uma tabela 'omega_store' com colunas 'id' (int4) e 'state' (jsonb)
      const { error } = await supabase
        .from('omega_store')
        .upsert({ id: 1, state: state }, { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      const isBlock = e.message?.includes('fetch') || e.name === 'TypeError';
      return { 
        success: false, 
        error: isBlock ? "Network Blocked" : e.message,
        isNetworkBlock: isBlock
      };
    }
  },

  loadState: async (): Promise<AppState | null> => {
    // Tenta Nuvem primeiro (Verdade Única)
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
        console.warn("Cloud load failed, using local fallback");
      }
    }

    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      try { return JSON.parse(localData); } catch (e) { return null; }
    }
    return null;
  },

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
    } catch (e) {
      console.error("Global team fetch failed:", e);
    }
    return null;
  }
};
