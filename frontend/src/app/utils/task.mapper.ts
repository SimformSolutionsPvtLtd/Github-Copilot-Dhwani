import { ApiTask, Task, TaskPriority } from '../models/task.model';

/**
 * Task Mapper Utility
 * 
 * Transforms between API response format and frontend UI format.
 * This layer abstracts API limitations from UI components.
 */
export class TaskMapper {
  
  /**
   * Converts API task to frontend UI task
   * Applies default priority and merges with stored frontend-only data
   * 
   * @param apiTask - Task from backend API
   * @param storedMetadata - Frontend-only data from localStorage (priority, dueDate)
   * @returns Complete Task object for UI consumption
   */
  static toUiTask(
    apiTask: ApiTask, 
    storedMetadata?: { priority?: TaskPriority; dueDate?: string }
  ): Task {
    return {
      ...apiTask,
      priority: storedMetadata?.priority ?? TaskPriority.MEDIUM, // Default priority
      dueDate: storedMetadata?.dueDate ?? undefined
    };
  }

  /**
   * Converts frontend UI task to API task
   * Strips frontend-only fields (priority, dueDate) before API calls
   * 
   * @param uiTask - Task from frontend UI
   * @returns API-compatible task object (only backend fields)
   */
  static toApiTask(uiTask: Task): ApiTask {
    const { priority, dueDate, ...apiTask } = uiTask;
    return apiTask;
  }

  /**
   * Extracts frontend-only metadata from UI task
   * Used for storing priority and dueDate separately
   * 
   * @param uiTask - Task from frontend UI
   * @returns Frontend-only fields for separate storage
   */
  static extractMetadata(uiTask: Task): { priority: TaskPriority; dueDate?: string } {
    return {
      priority: uiTask.priority,
      dueDate: uiTask.dueDate
    };
  }

  /**
   * Batch convert API tasks to UI tasks
   * Merges API data with stored frontend metadata
   * 
   * @param apiTasks - Array of tasks from backend
   * @param metadataMap - Map of task IDs to their frontend metadata
   * @returns Array of complete UI tasks
   */
  static toUiTasks(
    apiTasks: ApiTask[], 
    metadataMap: Map<string, { priority?: TaskPriority; dueDate?: string }>
  ): Task[] {
    return apiTasks.map(apiTask => {
      const metadata = apiTask.id ? metadataMap.get(apiTask.id) : undefined;
      return TaskMapper.toUiTask(apiTask, metadata);
    });
  }
}
