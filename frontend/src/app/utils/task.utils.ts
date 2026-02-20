import { Task, TaskStatus } from '../models/task.model';

/**
 * Utility functions for task operations
 */
export class TaskUtils {
  /**
   * Check if a task is completed (status is DONE)
   * @param task The task to check
   * @returns true if task is completed, false otherwise
   */
  static isTaskCompleted(task: Task | null | undefined): boolean {
    if (!task) {
      return false;
    }
    return task.status === TaskStatus.DONE;
  }

  /**
   * Check if a task can be edited
   * @param task The task to check
   * @returns true if task can be edited, false otherwise
   */
  static canEditTask(task: Task | null | undefined): boolean {
    return !TaskUtils.isTaskCompleted(task);
  }
}
