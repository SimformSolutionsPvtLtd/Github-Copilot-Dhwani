import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';
import { TaskUtils } from '../../utils/task.utils';


@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css']
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() availableStatuses: TaskStatus[] = [];
  
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() statusChange = new EventEmitter<{ task: Task; newStatus: string }>();

  /**
   * Emit edit event
   */
  onEdit(): void {
    this.edit.emit(this.task);
  }

  /**
   * Emit delete event
   */
  onDelete(): void {
    this.delete.emit(this.task);
  }

  /**
   * Emit status change event
   */
  onStatusChange(newStatus: string): void {
    this.statusChange.emit({ task: this.task, newStatus });
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'status-todo';
      case TaskStatus.IN_PROGRESS:
        return 'status-in-progress';
      case TaskStatus.DONE:
        return 'status-done';
      default:
        return '';
    }
  }

  /**
   * Get status display text
   */
  getStatusText(status: TaskStatus | string): string {
    switch (status) {
      case TaskStatus.TODO:
      case 'todo':
        return 'To Do';
      case TaskStatus.IN_PROGRESS:
      case 'in-progress':
        return 'In Progress';
      case TaskStatus.DONE:
      case 'done':
        return 'Done';
      default:
        return status;
    }
  }

  /**
   * Check if task is completed
   */
  isCompleted(): boolean {
    return TaskUtils.isTaskCompleted(this.task);
  }

  /**
   * Check if task can be edited (not completed)
   */
  canEdit(): boolean {
    return TaskUtils.canEditTask(this.task);
  }

  /**
   * Get priority icon
   */
  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return '🟢';
      case TaskPriority.MEDIUM:
        return '🟡';
      case TaskPriority.HIGH:
        return '🔴';
      default:
        return '⚪';
    }
  }

  /**
   * Get priority display text
   */
  getPriorityText(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return 'Low';
      case TaskPriority.MEDIUM:
        return 'Medium';
      case TaskPriority.HIGH:
        return 'High';
      default:
        return priority;
    }
  }

  /**
   * Check if task is due soon (within 3 days)
   */
  isDueSoon(): boolean {
    if (!this.task.dueDate) return false;
    
    const dueDate = new Date(this.task.dueDate);
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    return dueDate <= threeDaysFromNow && dueDate >= today;
  }
}
