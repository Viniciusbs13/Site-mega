
import { AppState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';
const SUPABASE_URL = 'https://chzkslqbpmlpepvydacu.supabase.co';

export const dbService = {
  diagnoseConnection: async (): Promise<{ status: 'CONNECTED' | 'BLOCKED' | 'SERVER_ERROR' | 'OFFLINE', message?: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      // Teste real de ping no endpoint do Supabase
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: { 'apikey': 'ping' },
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return { status: 'CONNECTED' };
    } catch (e: any) {
      if (e.name === 'AbortError') return { status: 'OFFLINE', message: 'Conexão lenta.' };
      if (e.message?.includes('fetch') || e.name === 'TypeError' || e.status === 0) {
        return { 
          status: 'BLOCKED', 
          message: 'O Navegador bloqueou a conexão com o Banco de Dados (AdBlock/VPN ativo).' 
        };
      }
      return { status: 'SERVER_ERROR', message: e.message };
    }
  },

  saveState: async (state: AppState): Promise<{ success: boolean; error?: string; isNetworkBlock?: boolean }> => {
    // 1. Salva local para não perder o trabalho atual
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Falha no LocalStorage", e);
    }

    // 2. Tenta enviar para a nuvem
    if (!supabase) return { success: false, error: "Cloud não configurada.", isNetworkBlock: true };

    try {
      const { error } = await supabase
        .from('omega_store')
        .upsert({ id: 1, state: state }, { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      const isBlock = e.message?.includes('fetch') || e.name === 'TypeError' || e.status === 0;
      return { 
        success: false, 
        error: isBlock ? "Bloqueado por Extensão" : e.message,
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

    // Tenta puxar a versão da nuvem para atualizar o local
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('omega_store')
          .select('state')
          .eq('id', 1)
          .maybeSingle();

        if (!error && data?.state) {
          // Atualiza o localstorage com o que veio da nuvem
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.state));
          return data.state as AppState;
        }
      } catch (e) {
        console.warn("Usando backup local (Nuvem inacessível)");
      }
    }

    return localParsed;
  },
};
