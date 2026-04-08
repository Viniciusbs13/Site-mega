
export enum DefaultUserRole {
  CEO = 'CEO',
  MANAGER = 'GESTOR_TRAFEGO',
  ACCOUNT = 'ACCOUNT_MANAGER',
  SALES = 'VENDEDOR',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EDITOR = 'EDITOR_VIDEO',
  CAPTADOR = 'CAPTADOR'
}

export type UserRole = DefaultUserRole | string;

export enum ClientHealth {
  EXCELLENT = 'Excelente',
  STABLE = 'Estável',
  AT_RISK = 'Em Risco',
  CRITICAL = 'Crítico'
}

export type ClientStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface DriveItem {
  id: string;
  name: string;
  type: 'FILE' | 'FOLDER';
  content?: string;
  parentId: string | null;
  ownerId: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  customPermissions?: string[]; // e.g. ['service-requests', 'commercial']
  avatar?: string;
  salesCount?: number;
  salesVolume?: number;
  personalGoal?: number;
  superGoal?: number;
  lastActive?: string;
}

export interface ClientFolder {
  briefing?: string;
  accessLinks?: string;
  operationalHistory?: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  health: ClientHealth | string;
  progress: number;
  managerId: string;
  salesId?: string;
  closingNotes?: string;
  contractValue: number;
  notes?: string;
  statusFlag: ClientStatus;
  folder?: ClientFolder;
  isPaused?: boolean;
  planName?: string;
  services?: string[]; // e.g. ['META_ADS', 'EDICAO', 'CAPTACAO']
  onboardingDate?: string;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  status: 'PENDING' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  type: 'ONCE' | 'WEEKLY';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SalesGoal {
  monthlyTarget: number;
  monthlySuperTarget: number;
  currentValue: number;
  totalSales: number;
  contractFormUrl: string;
  salesNotes?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  requesterId: string;
  requesterName: string;
  type: 'EDICAO' | 'CAPTACAO';
  description: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  createdAt: string;
  completedAt?: string;
}

export interface MonthlyData {
  [monthYear: string]: {
    clients: Client[];
    tasks: Task[];
    salesGoal: SalesGoal;
    chatMessages?: ChatMessage[];
    drive?: DriveItem[];
    wiki?: DriveItem[];
    notices?: Notice[];
    serviceRequests?: ServiceRequest[];
  };
}

export interface AppState {
  team: User[];
  availableRoles: string[];
  db: MonthlyData;
}
