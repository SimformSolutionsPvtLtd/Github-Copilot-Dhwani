import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Task, TaskFormData, TaskStatus, TaskPriority } from '../../models/task.model';
import { TaskService } from '../../services/task.service';import { TaskUtils } from '../../utils/task.utils';
@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;
  @Output() taskSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  taskForm!: FormGroup;
  isEditMode: boolean = false;
  isTaskCompleted: boolean = false;
  loading$ = this.taskService.loading$;
  error: string | null = null;
  taskStatuses = [
    { value: TaskStatus.TODO, label: 'To Do' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TaskStatus.DONE, label: 'Done' }
  ];

  priorities = [
    { value: TaskPriority.LOW, label: 'Low Priority', icon: '🟢' },
    { value: TaskPriority.MEDIUM, label: 'Medium Priority', icon: '🟡' },
    { value: TaskPriority.HIGH, label: 'High Priority', icon: '🔴' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService
  ) { }

  ngOnInit(): void {
    this.isEditMode = !!this.task;
    this.isTaskCompleted = TaskUtils.isTaskCompleted(this.task);
    this.initializeForm();
    
    // If task is completed, disable all form controls and show error
    if (this.isTaskCompleted) {
      this.taskForm.disable();
      this.error = 'This task is completed and cannot be edited.';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.taskForm = this.fb.group({
      title: [
        this.task?.title || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
      ],
      description: [
        this.task?.description || '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(500)]
      ],
      status: [
        this.task?.status || TaskStatus.TODO,
        [Validators.required]
      ],
      priority: [
        this.task?.priority || TaskPriority.MEDIUM,
        [Validators.required]
      ],
      dueDate: [
        this.task?.dueDate || ''
      ]
    }, { validators: this.highPriorityValidator });
  }

  /**
   * Custom validator for high-priority tasks
   * High-priority tasks must have a due date within 7 days
   */
  private highPriorityValidator(form: FormGroup): { [key: string]: any } | null {
    const priority = form.get('priority')?.value;
    const dueDate = form.get('dueDate')?.value;

    if (priority === TaskPriority.HIGH) {
      if (!dueDate) {
        return { highPriorityRequiresDueDate: true };
      }

      const due = new Date(dueDate);
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      if (due > sevenDaysFromNow) {
        return { highPriorityDueDateTooFar: true };
      }
    }

    return null;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Prevent submission if task is completed
    if (this.isTaskCompleted) {
      this.error = 'Completed tasks cannot be edited. Please change the status first.';
      return;
    }
    
    if (this.taskForm.invalid) {
      this.markFormGroupTouched(this.taskForm);
      return;
    }

    this.error = null;
    const formData: TaskFormData = this.taskForm.value;

    const request = this.isEditMode && this.task?.id
      ? this.taskService.updateTask(this.task.id, formData)
      : this.taskService.createTask(formData);

    request
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.taskSaved.emit();
          this.taskForm.reset();
        },
        error: (error) => {
          this.error = error.message;
          console.error('Error saving task:', error);
        }
      });
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    this.taskForm.reset();
    this.cancelled.emit();
  }

  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if a form field has an error and has been touched
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.taskForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.touched || field.dirty);
    }
    return field.invalid && (field.touched || field.dirty);
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must not exceed ${maxLength} characters`;
    }
    return '';
  }

  /**
   * Get form-level validation errors (high-priority validation)
   */
  getFormErrorMessage(): string | null {
    if (this.taskForm.hasError('highPriorityRequiresDueDate')) {
      return 'High-priority tasks must have a due date';
    }
    if (this.taskForm.hasError('highPriorityDueDateTooFar')) {
      return 'High-priority tasks must be due within 7 days';
    }
    return null;
  }

  /**
   * Get user-friendly field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      dueDate: 'Due Date'
    };
    return labels[fieldName] || fieldName;
  }
}
