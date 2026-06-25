export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'professional' | 'client';
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  backup_email?: string;
  last_login?: string;
  created_at: string;
}

export interface Client {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  location?: string;
  type: string;
  revenue: number;
  status: 'Active' | 'Paused' | 'Completed';
  assigned_professional_id?: string;
  assigned_professional_name?: string;
  industry?: string;
  notes?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  client_id?: string;
  client_name?: string;
  deal_name: string;
  value: number;
  stage: string;
  close_date?: string;
  assigned_closer_id?: string;
  assigned_closer_name?: string;
  probability: number;
  notes?: string;
  created_at: string;
}

export interface AccountingEntry {
  id: string;
  client_id?: string;
  client_name?: string;
  description: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: string;
  category?: string;
  receipt_url?: string;
  created_at: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  client_id?: string;
  client_name?: string;
  date: string;
  location?: string;
  status: string;
  description?: string;
  assigned_professionals?: Array<{id: string; name: string}>;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  assigned_professional_id?: string;
  assigned_professional_name?: string;
  created_by?: string;
  deadline?: string;
  status: string;
  priority: string;
  parent_task_id?: string;
  revision_round: number;
  estimated_hours?: number;
  actual_hours?: number;
  dependencies?: Array<{id: string; title: string}>;
  created_at: string;
}

export interface Attendance {
  id: string;
  professional_id: string;
  professional_name?: string;
  date: string;
  status: string;
  check_in?: string;
  check_out?: string;
  notes?: string;
}

export interface DailyReport {
  id: string;
  professional_id: string;
  professional_name?: string;
  date: string;
  report_text: string;
  hours_worked?: number;
  tasks_completed?: string;
  created_at: string;
}

export interface ClientReport {
  id: string;
  client_id: string;
  client_name?: string;
  title: string;
  content: string;
  report_type: string;
  attachment_url?: string;
  created_by?: string;
  created_by_name?: string;
  is_published: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_clients?: number;
  active_projects?: number;
  total_revenue?: number;
  pending_tasks?: number;
  my_tasks?: number;
  completed_tasks?: number;
  hours_this_week?: number;
  punched_in_today?: boolean;
  total_reports?: number;
}
