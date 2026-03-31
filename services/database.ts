
import { AppState, User, MonthlyData } from '../types';
import { db, auth, doc, setDoc, getDoc, collection, onSnapshot, query, where, updateDoc, deleteDoc, getDocs, getDocFromServer } from '../firebase';

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
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  diagnoseConnection: async (): Promise<{ status: 'CONNECTED' | 'BLOCKED' | 'SERVER_ERROR' | 'OFFLINE', message?: string }> => {
    try {
      await getDocFromServer(doc(db, 'state', 'global'));
      return { status: 'CONNECTED' };
    } catch (error: any) {
      if (error.message?.includes('the client is offline')) {
        return { status: 'OFFLINE', message: 'Sem conexão com o servidor.' };
      }
      if (error.code === 'permission-denied') {
        return { status: 'BLOCKED', message: 'Acesso negado pelas políticas de segurança.' };
      }
      return { status: 'SERVER_ERROR', message: error.message };
    }
  },

  saveState: async (state: AppState): Promise<{ success: boolean; error?: string }> => {
    try {
      const { team, ...globalData } = state;
      
      // Save global state (clients, tasks, etc)
      await setDoc(doc(db, 'state', 'global'), globalData);
      
      // Save users individually for better querying and presence
      for (const user of team) {
        await setDoc(doc(db, 'users', user.id), user);
      }
      
      return { success: true };
    } catch (e: any) {
      console.error("Erro ao salvar no Firestore:", e.message);
      return { success: false, error: e.message };
    }
  },

  loadState: async (): Promise<AppState | null> => {
    try {
      const stateDoc = await getDoc(doc(db, 'state', 'global'));
      const teamSnapshot = await getDocs(collection(db, 'users'));
      
      if (stateDoc.exists()) {
        const globalData = stateDoc.data() as Omit<AppState, 'team'>;
        const team = teamSnapshot.docs.map(d => d.data() as User);
        return { ...globalData, team } as AppState;
      }
    } catch (e) {
      console.warn("Falha ao carregar Firestore:", e);
    }
    return null;
  },

  subscribeToGlobalState: (callback: (data: any) => void) => {
    return onSnapshot(doc(db, 'state', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'state/global'));
  },

  subscribeToTeam: (callback: (users: User[]) => void) => {
    return onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(d => d.data() as User);
      callback(users);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));
  },

  updateUserPresence: async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastActive: new Date().toISOString()
      });
    } catch (e) {
      // Silent fail for presence
    }
  },

  logActivity: async (userId: string, userName: string, action: string) => {
    try {
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
    // Get last 20 activities
    const q = query(collection(db, 'activity')); // Simplified, usually you'd order by timestamp
    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs
        .map(d => d.data())
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);
      callback(activities);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'activity'));
  },

  fetchGlobalTeam: async (): Promise<User[] | null> => {
    try {
      const teamSnapshot = await getDocs(collection(db, 'users'));
      return teamSnapshot.docs.map(d => d.data() as User);
    } catch (e) {
      return null;
    }
  }
};
