import { Component, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { Task, TaskStatus } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { TaskUtils } from '../../utils/task.utils';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  selectedStatus: string = 'all';
  sortOrder: 'none' | 'asc' | 'desc' = 'none';
  loading$ = this.taskService.loading$;
  online$ = this.taskService.online$;
  error: string | null = null;
  showForm: boolean = false;
  editingTask: Task | null = null;

  private destroy$ = new Subject<void>();

  constructor(private taskService: TaskService) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all tasks
   */
  loadTasks(): void {
    this.error = null;
    this.taskService.getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
          this.applyFilter();
        },
        error: (error) => {
          this.error = error.message;
          console.error('Error loading tasks:', error);
        }
      });
  }

  /**
   * Apply status filter
   */
  applyFilter(): void {
    if (this.selectedStatus === 'all') {
      this.filteredTasks = [...this.tasks];
    } else {
      this.filteredTasks = this.tasks.filter(task => task.status === this.selectedStatus);
    }
    this.applySorting();
  }

  /**
   * Handle filter change
   */
  onFilterChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilter();
  }

  /**
   * Handle sort order change
   */
  onSortChange(order: 'none' | 'asc' | 'desc'): void {
    this.sortOrder = order;
    this.applySorting();
  }

  /**
   * Apply sorting to filtered tasks
   * Tasks with no due date appear at the bottom
   * Sorting logic:
   * - 'asc': Nearest due date first
   * - 'desc': Farthest due date first
   * - 'none': No sorting applied (original order)
   */
  applySorting(): void {
    if (this.sortOrder === 'none') {
      return;
    }

    this.filteredTasks.sort((a, b) => {
      const aHasDueDate = !!a.dueDate;
      const bHasDueDate = !!b.dueDate;

      // Tasks without due date always go to the bottom
      if (!aHasDueDate && !bHasDueDate) return 0;
      if (!aHasDueDate) return 1;
      if (!bHasDueDate) return -1;

      // Both have due dates, compare them
      const aDate = new Date(a.dueDate!).getTime();
      const bDate = new Date(b.dueDate!).getTime();

      if (this.sortOrder === 'asc') {
        return aDate - bDate; // Nearest first
      } else {
        return bDate - aDate; // Farthest first
      }
    });
  }

  /**
   * Show create task form
   */
  onCreateTask(): void {
    this.editingTask = null;
    this.showForm = true;
  }

  /**
   * Show edit task form (with validation for completed tasks)
   */
  onEditTask(task: Task): void {
    // Prevent editing completed tasks
    if (TaskUtils.isTaskCompleted(task)) {
      this.error = 'Completed tasks cannot be edited. Please change the status first if you need to make changes.';
      // Clear error after 5 seconds
      setTimeout(() => {
        if (this.error === 'Completed tasks cannot be edited. Please change the status first if you need to make changes.') {
          this.error = null;
        }
      }, 5000);
      return;
    }
    
    this.editingTask = task;
    this.showForm = true;
  }

  /**
   * Handle task saved (created or updated)
   */
  onTaskSaved(): void {
    this.showForm = false;
    this.editingTask = null;
    this.loadTasks();
  }

  /**
   * Handle form cancelled
   */
  onFormCancelled(): void {
    this.showForm = false;
    this.editingTask = null;
  }

  /**
   * Delete a task
   */
  onDeleteTask(task: Task): void {
    if (!task.id) return;

    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.error = null;
      this.taskService.deleteTask(task.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadTasks();
          },
          error: (error) => {
            this.error = error.message;
            console.error('Error deleting task:', error);
          }
        });
    }
  }

  /**
   * Update task status
   */
  onStatusChange(task: Task, newStatus: string): void {
    if (!task.id) return;

    this.error = null;
    this.taskService.patchTask(task.id, { status: newStatus as TaskStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (error) => {
          this.error = error.message;
          console.error('Error updating task status:', error);
        }
      });
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
      console.log(status);
      
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
   * Get all available statuses
   */
  getAvailableStatuses(): TaskStatus[] {
    return [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
  }

  /**
   * TrackBy function for ngFor optimization
   */
  trackByTaskId(index: number, task: Task): string {
    return task.id || index.toString();
  }

  /**
   * Handle drag and drop reordering
   */
  onTaskDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // Update the filtered tasks array for immediate UI feedback
    moveItemInArray(this.filteredTasks, event.previousIndex, event.currentIndex);

    // If we're viewing all tasks, update the main tasks array too
    if (this.selectedStatus === 'all') {
      this.tasks = [...this.filteredTasks];
      
      // Persist the new order to the backend
      this.taskService.updateTaskOrder(this.tasks)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedTasks) => {
            this.tasks = updatedTasks;
            this.applyFilter();
          },
          error: (error) => {
            this.error = 'Failed to update task order. Changes may not be saved.';
            console.error('Error updating task order:', error);
            // Reload tasks to get the correct order from server
            this.loadTasks();
          }
        });
    } else {
      // If filtered view, just show a message that reordering only works in "All Tasks" view
      this.error = 'Task reordering is only available in "All Tasks" view.';
      // Revert the change
      moveItemInArray(this.filteredTasks, event.currentIndex, event.previousIndex);
    }
  }
}
