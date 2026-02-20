import { Injectable } from '@angular/core';
import { TaskPriority } from '../models/task.model';
import { LocalStorageService } from './local-storage.service';

/**
 * Task Metadata Storage Service
 * 
 * Handles persistence of frontend-only task fields (priority, dueDate)
 * that are not supported by the backend API.
 * 
 * Strategy: Store metadata separately from cached API data to maintain
 * clean separation between API contract and frontend enhancements.
 */
@Injectable({
  providedIn: 'root'
})
export class TaskMetadataService {
  private readonly METADATA_KEY = 'task_metadata';

  constructor(private localStorageService: LocalStorageService) {}

  /**
   * Get all stored task metadata
   * @returns Map of task IDs to their metadata
   */
  getAllMetadata(): Map<string, TaskMetadata> {
    const stored = this.localStorageService.get<Record<string, TaskMetadata>>(this.METADATA_KEY);
    return stored ? new Map(Object.entries(stored)) : new Map();
  }

  /**
   * Get metadata for a specific task
   * @param taskId - The task ID
   * @returns Metadata object or undefined if not found
   */
  getMetadata(taskId: string): TaskMetadata | undefined {
    const allMetadata = this.getAllMetadata();
    return allMetadata.get(taskId);
  }

  /**
   * Store metadata for a specific task
   * @param taskId - The task ID
   * @param metadata - The metadata to store
   */
  setMetadata(taskId: string, metadata: TaskMetadata): void {
    const allMetadata = this.getAllMetadata();
    allMetadata.set(taskId, metadata);
    this.saveAllMetadata(allMetadata);
  }

  /**
   * Update metadata for multiple tasks at once
   * @param metadataMap - Map of task IDs to metadata
   */
  setMultipleMetadata(metadataMap: Map<string, TaskMetadata>): void {
    const existing = this.getAllMetadata();
    metadataMap.forEach((metadata, taskId) => {
      existing.set(taskId, metadata);
    });
    this.saveAllMetadata(existing);
  }

  /**
   * Remove metadata for a specific task
   * @param taskId - The task ID to remove
   */
  removeMetadata(taskId: string): void {
    const allMetadata = this.getAllMetadata();
    allMetadata.delete(taskId);
    this.saveAllMetadata(allMetadata);
  }

  /**
   * Clear all stored metadata
   */
  clearAllMetadata(): void {
    this.localStorageService.remove(this.METADATA_KEY);
  }

  /**
   * Check if metadata exists for a task
   * @param taskId - The task ID
   * @returns true if metadata exists
   */
  hasMetadata(taskId: string): boolean {
    return this.getAllMetadata().has(taskId);
  }

  /**
   * Private helper to save all metadata to localStorage
   * Converts Map to plain object for JSON serialization
   */
  private saveAllMetadata(metadataMap: Map<string, TaskMetadata>): void {
    const obj = Object.fromEntries(metadataMap);
    this.localStorageService.set(this.METADATA_KEY, obj);
  }
}

/**
 * Frontend-only task metadata interface
 * Contains fields that don't exist in the backend API
 */
export interface TaskMetadata {
  priority: TaskPriority;
  dueDate?: string; // ISO date string
}
