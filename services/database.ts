
import { AppState, User } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';
const SUPABASE_URL = 'https://chzkslqbplmpepvydacu.supabase.co';
const ANON_KEY = 'sb_publishable_34RidSlAX-HkuuxY73BcQg_lSGNlriO';

export const dbService = {
  diagnoseConnection: async (): Promise<{ status: 'CONNECTED' | 'BLOCKED' | 'SERVER_ERROR' | 'OFFLINE', message?: string }> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/omega_store?select=id&id=eq.1`, {
        method: 'GET',
        headers: { 
          'apikey': ANON_KEY, 
          'Content-Type': 'application/json',
          'X-Client-Info': 'omega-v2'
        }
      });
      
      if (response.status === 404) return { status: 'SERVER_ERROR', message: 'Estrutura não encontrada.' };
      if (response.status === 401 || response.status === 403) return { status: 'BLOCKED', message: 'Acesso negado pelas políticas RLS.' };

      return { status: 'CONNECTED' };
    } catch (e: any) {
      return { status: 'OFFLINE', message: 'Sem conexão com o servidor.' };
    }
  },

  saveState: async (state: AppState): Promise<{ success: boolean; error?: string; isNetworkBlock?: boolean }> => {
    // 1. Persistência Local (Segurança em primeiro lugar)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    if (!supabase) return { success: false, error: "Supabase offline", isNetworkBlock: true };

    try {
      // Usamos UPSERT mas as políticas RLS agora garantem que só o ID 1 seja afetado
      const { error } = await supabase
        .from('omega_store')
        .upsert({ 
          id: 1, 
          state: state,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });

      if (error) {
        if (error.code === '42501') throw new Error("Violação de Segurança: RLS bloqueou a gravação.");
        throw error;
      }
      return { success: true };
    } catch (e: any) {
      console.error("Erro ao salvar na nuvem:", e.message);
      const isBlock = e.message?.includes('fetch') || e.name === 'TypeError' || e.message?.includes('RLS');
      return { 
        success: false, 
        error: e.message,
        isNetworkBlock: isBlock
      };
    }
  },

  loadState: async (): Promise<AppState | null> => {
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
        console.warn("Falha ao carregar nuvem, usando cache local.");
      }
    }

    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      try { return JSON.parse(localData); } catch (e) { return null; }
    }
    return null;
  },

  // Fix: Added missing fetchGlobalTeam method used in Auth component to retrieve the team list from the cloud state
  fetchGlobalTeam: async (): Promise<User[] | null> => {
    const state = await dbService.loadState();
    return state ? state.team : null;
  }
};
