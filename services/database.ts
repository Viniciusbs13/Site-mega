
import { AppState, User, MonthlyData } from '../types';
import { db, auth, doc, setDoc, getDoc, collection, onSnapshot, query, where, updateDoc, deleteDoc, getDocs, getDocFromServer, signInAnonymously } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Don't throw for permission errors during subscriptions, just log them
  if (errInfo.error.includes('Missing or insufficient permissions')) {
    return;
  }
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  ensureAuth: async () => {
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (e: any) {
        if (e.code === 'auth/admin-restricted-operation') {
          console.warn("Aviso: Autenticação Anônima está desativada no Console Firebase. Algumas funções podem exigir login explícito.");
        } else {
          console.error("Erro ao autenticar anonimamente:", e);
        }
      }
    }
  },

  diagnoseConnection: async (): Promise<{ status: 'CONNECTED' | 'BLOCKED' | 'SERVER_ERROR' | 'OFFLINE', message?: string }> => {
    try {
      await dbService.ensureAuth();
      await getDocFromServer(doc(db, 'state', 'global'));
      return { status: 'CONNECTED' };
    } catch (error: any) {
      if (error.message?.includes('the client is offline')) {
        return { status: 'OFFLINE', message: 'Sem conexão com o servidor.' };
      }
      if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
        return { status: 'BLOCKED', message: 'Acesso negado pelas políticas de segurança.' };
      }
      return { status: 'SERVER_ERROR', message: error.message };
    }
  },

  saveGlobalState: async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      await dbService.ensureAuth();
      await setDoc(doc(db, 'state', 'global'), data, { merge: true });
      return { success: true };
    } catch (e: any) {
      console.error("Erro ao salvar estado global:", e.message);
      return { success: false, error: e.message };
    }
  },

  saveMonthData: async (monthKey: string, data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      await dbService.ensureAuth();
      await setDoc(doc(db, 'months', monthKey), data, { merge: true });
      return { success: true };
    } catch (e: any) {
      console.error(`Erro ao salvar mês ${monthKey}:`, e.message);
      return { success: false, error: e.message };
    }
  },

  saveUser: async (user: User): Promise<{ success: boolean; error?: string }> => {
    try {
      await dbService.ensureAuth();
      await setDoc(doc(db, 'users', user.id), user);
      return { success: true };
    } catch (e: any) {
      console.error(`Erro ao salvar usuário ${user.id}:`, e.message);
      return { success: false, error: e.message };
    }
  },

  deleteUser: async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await dbService.ensureAuth();
      await deleteDoc(doc(db, 'users', userId));
      return { success: true };
    } catch (e: any) {
      console.error(`Erro ao excluir usuário ${userId}:`, e.message);
      return { success: false, error: e.message };
    }
  },

  loadState: async (): Promise<AppState | null> => {
    try {
      await dbService.ensureAuth();
      const stateDoc = await getDoc(doc(db, 'state', 'global'));
      const teamSnapshot = await getDocs(collection(db, 'users'));
      const monthsSnapshot = await getDocs(collection(db, 'months'));
      
      const globalData = stateDoc.exists() ? (stateDoc.data() as any) : {};
      const team = teamSnapshot.docs.map(d => d.data() as User);
      const dbObj: MonthlyData = {};
      monthsSnapshot.docs.forEach(d => {
        dbObj[d.id] = d.data() as MonthlyData[string];
      });
      
      return { 
        availableRoles: globalData.availableRoles || [],
        team, 
        db: dbObj 
      } as AppState;
    } catch (e) {
      console.warn("Falha ao carregar Firestore:", e);
    }
    return null;
  },

  subscribeToGlobalState: (callback: (data: any) => void) => {
    let unsub: (() => void) | null = null;
    let isCancelled = false;

    dbService.ensureAuth().then(() => {
      if (isCancelled) return;
      unsub = onSnapshot(doc(db, 'state', 'global'), (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'state/global'));
    });

    return () => {
      isCancelled = true;
      if (unsub) unsub();
    };
  },

  subscribeToMonth: (monthKey: string, callback: (data: MonthlyData[string]) => void) => {
    let unsub: (() => void) | null = null;
    let isCancelled = false;

    dbService.ensureAuth().then(() => {
      if (isCancelled) return;
      unsub = onSnapshot(doc(db, 'months', monthKey), (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as MonthlyData[string]);
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `months/${monthKey}`));
    });

    return () => {
      isCancelled = true;
      if (unsub) unsub();
    };
  },

  subscribeToTeam: (callback: (users: User[]) => void) => {
    let unsub: (() => void) | null = null;
    let isCancelled = false;

    dbService.ensureAuth().then(() => {
      if (isCancelled) return;
      unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(d => d.data() as User);
        callback(users);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));
    });

    return () => {
      isCancelled = true;
      if (unsub) unsub();
    };
  },

  updateUserPresence: async (userId: string) => {
    try {
      await dbService.ensureAuth();
      await updateDoc(doc(db, 'users', userId), {
        lastActive: new Date().toISOString()
      });
    } catch (e) {
      // Silent fail for presence
    }
  },

  logActivity: async (userId: string, userName: string, action: string) => {
    try {
      await dbService.ensureAuth();
      const id = Date.now().toString();
      await setDoc(doc(db, 'activity', id), {
        id,
        userId,
        userName,
        action,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Silent fail for activity log
    }
  },

  subscribeToActivity: (callback: (activities: any[]) => void) => {
    let unsub = () => {};
    dbService.ensureAuth().then(() => {
      const q = query(collection(db, 'activity'));
      unsub = onSnapshot(q, (snapshot) => {
        const activities = snapshot.docs
          .map(d => d.data())
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20);
        callback(activities);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'activity'));
    });
    return () => unsub();
  },

  getUserById: async (id: string): Promise<User | null> => {
    try {
      await dbService.ensureAuth();
      const userDoc = await getDoc(doc(db, 'users', id.toLowerCase()));
      return userDoc.exists() ? (userDoc.data() as User) : null;
    } catch (e) {
      return null;
    }
  },

  fetchGlobalTeam: async (): Promise<User[] | null> => {
    try {
      await dbService.ensureAuth();
      const teamSnapshot = await getDocs(collection(db, 'users'));
      return teamSnapshot.docs.map(d => d.data() as User);
    } catch (e) {
      return null;
    }
  },

  triggerCelebration: async (name: string, value: number) => {
    try {
      await dbService.ensureAuth();
      const id = Date.now().toString();
      await setDoc(doc(db, 'celebrations', 'latest'), {
        id,
        name,
        value,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Erro ao disparar celebração:", e);
    }
  },

  subscribeToCelebrations: (callback: (data: { name: string; value: number; id: string } | null) => void) => {
    let unsub: (() => void) | null = null;
    let isCancelled = false;

    dbService.ensureAuth().then(() => {
      if (isCancelled) return;
      unsub = onSnapshot(doc(db, 'celebrations', 'latest'), (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as any);
        } else {
          callback(null);
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'celebrations/latest'));
    });

    return () => {
      isCancelled = true;
      if (unsub) unsub();
    };
  }
};
