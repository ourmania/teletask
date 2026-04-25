export const Colors = {
  background: '#0A1628',
  surface: '#111D33',
  surfaceLight: '#1A2A44',
  primary: '#1E6FD9',
  primaryDark: '#1455A0',
  accent: '#3B9AFF',
  textPrimary: '#E8EDF4',
  textSecondary: '#8A9BBF',
  textMuted: '#5A6B8A',
  border: '#1E3050',
  statusNew: '#3B9AFF',
  statusAccepted: '#F5A623',
  statusEnRoute: '#A855F7',
  statusInProgress: '#F97316',
  statusDone: '#34C759',
  danger: '#FF3B30',
  tabActive: '#3B9AFF',
  tabInactive: '#5A6B8A',
};

export const StatusLabels: Record<string, string> = {
  new: 'Новая',
  accepted: 'Принята',
  en_route: 'В пути',
  in_progress: 'В работе',
  done: 'Выполнена',
};

export const StatusColors: Record<string, string> = {
  new: Colors.statusNew,
  accepted: Colors.statusAccepted,
  en_route: Colors.statusEnRoute,
  in_progress: Colors.statusInProgress,
  done: Colors.statusDone,
};

export const NextStatus: Record<string, string> = {
  new: 'accepted',
  accepted: 'en_route',
  en_route: 'in_progress',
  in_progress: 'done',
};

export const StatusButtonLabels: Record<string, string> = {
  new: 'Принять в работу',
  accepted: 'Отметить выезд',
  en_route: 'Начать работы',
  in_progress: 'Завершить',
};

export type TaskStatus = 'new' | 'accepted' | 'en_route' | 'in_progress' | 'done';

export type Task = {
  id: string;
  address: string;
  task_type: string;
  client_phone: string;
  status: TaskStatus;
  assigned_to: string | null;
  photos: string[];
  created_at: string;
};
