import { AppState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';

export const dbService = {
  saveState: async (state: AppState): Promise<boolean> => {
    // 1. Sempre salva no LocalStorage como segurança absoluta (Backup local)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('omega_store')
        .upsert({ id: 1, state: state });

      if (error) {
        // Log silenciado para evitar poluição visual em caso de erro de rede comum
        return false;
      }
      return true;
    } catch (e) {
      // Captura o "Failed to fetch" (CORS, Adblock, etc)
      return false;
    }
  },

  loadState: async (): Promise<AppState | null> => {
    // Tenta carregar do LocalStorage primeiro para velocidade
    const localData = localStorage.getItem(STORAGE_KEY);
    let localParsed: AppState | null = null;
    if (localData) {
      localParsed = JSON.parse(localData);
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('omega_store')
          .select('state')
          .eq('id', 1)
          .single();

        if (data && data.state && Object.keys(data.state).length > 0) {
          console.log('✅ Nuvem Ômega Sincronizada');
          return data.state as AppState;
        }
      } catch (e) {
        // Ignora erro de rede e usa o local
      }
    }

    if (localParsed) {
      console.log('📂 Cache local carregado');
      return localParsed;
    }
    
    return null;
  },
};
