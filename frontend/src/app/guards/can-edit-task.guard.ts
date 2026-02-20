import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TaskService } from '../services/task.service';
import { TaskUtils } from '../utils/task.utils';
import { map, catchError, of } from 'rxjs';

/**
 * Route guard to prevent editing of completed tasks
 * This guard checks if the task exists and is not completed before allowing navigation
 */
export const canEditTaskGuard: CanActivateFn = (route, state) => {
  const taskService = inject(TaskService);
  const router = inject(Router);
  
  const taskId = route.paramMap.get('id');
  
  if (!taskId) {
    // No task ID provided, allow navigation (for create mode)
    return true;
  }

  // Check if the task exists and is not completed
  return taskService.getTasks().pipe(
    map(tasks => {
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        // Task not found, redirect to task list
        router.navigate(['/tasks']);
        return false;
      }
      
      if (TaskUtils.isTaskCompleted(task)) {
        // Task is completed, prevent editing
        console.warn(`Cannot edit completed task: ${task.title}`);
        router.navigate(['/tasks']);
        return false;
      }
      
      return true;
    }),
    catchError(error => {
      console.error('Error checking task status:', error);
      router.navigate(['/tasks']);
      return of(false);
    })
  );
};
