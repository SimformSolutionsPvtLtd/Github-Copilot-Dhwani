// API Response Model - matches backend contract exactly
export interface ApiTask {
  id?: string;
  title: string;
  description: string;
  status: TaskStatus;
  order?: number;
  createdAt: string;
  updatedAt?: string;
}

// Frontend UI Model - includes frontend-only fields
export interface Task extends ApiTask {
  priority: TaskPriority;  // Frontend-only field
  dueDate?: string;         // Frontend-only field (ISO date string)
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
}
