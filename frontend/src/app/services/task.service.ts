import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { Task, TaskFormData, ApiTask } from '../models/task.model';
import { LocalStorageService } from './local-storage.service';
import { TaskMetadataService } from './task-metadata.service';
import { TaskMapper } from '../utils/task.mapper';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:3001/tasks';
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private readonly TASKS_CACHE_KEY = 'tasks_cache';
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public online$ = this.onlineSubject.asObservable();

  constructor(
    private http: HttpClient,
    private localStorage: LocalStorageService,
    private metadataService: TaskMetadataService
  ) {
    // Listen for online/offline events
    window.addEventListener('online', () => this.onlineSubject.next(true));
    window.addEventListener('offline', () => this.onlineSubject.next(false));
  }

  /**
   * Get all tasks (with offline support)
   * Returns UI tasks with priority merged from metadata storage
   */
  getTasks(): Observable<Task[]> {
    this.loadingSubject.next(true);
    return this.http.get<ApiTask[]>(this.apiUrl).pipe(
      tap(apiTasks => {
        // Cache API response separately from metadata
        const sortedTasks = this.sortTasksByOrder(apiTasks);
        this.localStorage.set(this.TASKS_CACHE_KEY, sortedTasks);
      }),
      map(apiTasks => {
        // Transform API tasks to UI tasks with metadata
        const sortedApiTasks = this.sortTasksByOrder(apiTasks);
        const metadataMap = this.metadataService.getAllMetadata();
        return TaskMapper.toUiTasks(sortedApiTasks, metadataMap);
      }),
      catchError(error => {
        // Try to load from cache if offline
        const cachedApiTasks = this.localStorage.get<ApiTask[]>(this.TASKS_CACHE_KEY);
        if (cachedApiTasks && cachedApiTasks.length > 0) {
          console.log('Loading tasks from cache (offline mode)');
          const metadataMap = this.metadataService.getAllMetadata();
          return of(TaskMapper.toUiTasks(cachedApiTasks, metadataMap));
        }
        return this.handleError(error);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Get tasks filtered by status
   */
  getTasksByStatus(status: string): Observable<Task[]> {
    this.loadingSubject.next(true);
    return this.http.get<ApiTask[]>(`${this.apiUrl}?status=${status}`).pipe(
      map(apiTasks => {
        const metadataMap = this.metadataService.getAllMetadata();
        return TaskMapper.toUiTasks(apiTasks, metadataMap);
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Get a single task by ID
   */
  getTask(id: string): Observable<Task> {
    this.loadingSubject.next(true);
    return this.http.get<ApiTask>(`${this.apiUrl}/${id}`).pipe(
      map(apiTask => {
        const metadata = this.metadataService.getMetadata(id);
        return TaskMapper.toUiTask(apiTask, metadata);
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Create a new task
   * Separates frontend fields (priority, dueDate) from API payload
   */
  createTask(taskData: TaskFormData): Observable<Task> {
    this.loadingSubject.next(true);
    
    // Get current tasks to determine next order
    const cachedTasks = this.localStorage.get<ApiTask[]>(this.TASKS_CACHE_KEY) || [];
    const maxOrder = cachedTasks.length > 0 
      ? Math.max(...cachedTasks.map(t => t.order || 0)) 
      : 0;
    
    // Create API task (without priority/dueDate)
    const apiTaskData = {
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      order: maxOrder + 1,
      createdAt: new Date().toISOString()
    };
    
    return this.http.post<ApiTask>(this.apiUrl, apiTaskData).pipe(
      map(apiTask => {
        // Store metadata separately
        if (apiTask.id) {
          this.metadataService.setMetadata(apiTask.id, {
            priority: taskData.priority,
            dueDate: taskData.dueDate
          });
        }
        
        // Update cache with API response
        const updatedTasks = [...cachedTasks, apiTask];
        this.localStorage.set(this.TASKS_CACHE_KEY, updatedTasks);
        
        // Return UI task with metadata
        return TaskMapper.toUiTask(apiTask, {
          priority: taskData.priority,
          dueDate: taskData.dueDate
        });
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Update entire task (PUT)
   * Separates API fields from metadata
   */
  updateTask(id: string, taskData: TaskFormData): Observable<Task> {
    this.loadingSubject.next(true);
    
    const apiTaskData = {
      id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      updatedAt: new Date().toISOString()
    };
    
    return this.http.put<ApiTask>(`${this.apiUrl}/${id}`, apiTaskData).pipe(
      map(apiTask => {
        // Update metadata separately
        this.metadataService.setMetadata(id, {
          priority: taskData.priority,
          dueDate: taskData.dueDate
        });
        
        // Return UI task
        return TaskMapper.toUiTask(apiTask, {
          priority: taskData.priority,
          dueDate: taskData.dueDate
        });
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Partially update a task (PATCH)
   * Only sends API fields to backend, updates metadata separately
   */
  patchTask(id: string, updates: Partial<Task>): Observable<Task> {
    this.loadingSubject.next(true);
    
    // Extract and separate API fields from metadata
    const { priority, dueDate, ...apiUpdates } = updates;
    
    const data = {
      ...apiUpdates,
      updatedAt: new Date().toISOString()
    };
    
    return this.http.patch<ApiTask>(`${this.apiUrl}/${id}`, data).pipe(
      map(apiTask => {
        // Update metadata if priority or dueDate changed
        if (priority !== undefined || dueDate !== undefined) {
          const existingMetadata = this.metadataService.getMetadata(id);
          this.metadataService.setMetadata(id, {
            priority: priority ?? existingMetadata?.priority ?? 'medium' as any,
            dueDate: dueDate ?? existingMetadata?.dueDate
          });
        }
        
        // Update cache
        this.updateTaskInCache(apiTask);
        
        // Get current metadata and return UI task
        const metadata = this.metadataService.getMetadata(id);
        return TaskMapper.toUiTask(apiTask, metadata);
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): Observable<void> {
    this.loadingSubject.next(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove from cache after successful deletion
        const cachedTasks = this.localStorage.get<ApiTask[]>(this.TASKS_CACHE_KEY) || [];
        const updatedTasks = cachedTasks.filter(t => t.id !== id);
        this.localStorage.set(this.TASKS_CACHE_KEY, updatedTasks);
        
        // Remove metadata
        this.metadataService.removeMetadata(id);
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Update task order after drag-and-drop
   */
  updateTaskOrder(tasks: Task[]): Observable<Task[]> {
    // Convert UI tasks to API tasks
    const apiTasks = tasks.map(t => TaskMapper.toApiTask(t));
    
    // Update order field for all tasks
    const tasksWithOrder = apiTasks.map((task, index) => ({
      ...task,
      order: index,
      updatedAt: new Date().toISOString()
    }));

    // Cache the new order immediately for instant UI update
    this.localStorage.set(this.TASKS_CACHE_KEY, tasksWithOrder);

    // Update each task in the backend
    const updatePromises = tasksWithOrder.map(task => 
      task.id ? this.patchTask(task.id, { order: task.order }).toPromise() : Promise.resolve()
    );

    return new Observable<Task[]>(observer => {
      Promise.all(updatePromises)
        .then(() => {
          // Return UI tasks with metadata
          const metadataMap = this.metadataService.getAllMetadata();
          const uiTasks = TaskMapper.toUiTasks(tasksWithOrder, metadataMap);
          observer.next(uiTasks);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  /**
   * Sort tasks by order field
   */
  private sortTasksByOrder<T extends { order?: number }>(tasks: T[]): T[] {
    return [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Update a single task in cache
   */
  private updateTaskInCache(updatedTask: ApiTask): void {
    const cachedTasks = this.localStorage.get<ApiTask[]>(this.TASKS_CACHE_KEY) || [];
    const index = cachedTasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      cachedTasks[index] = updatedTask;
      this.localStorage.set(this.TASKS_CACHE_KEY, cachedTasks);
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Backend error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to the server. Please check if the API is running.';
          break;
        case 404:
          errorMessage = 'Task not found.';
          break;
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('TaskService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
