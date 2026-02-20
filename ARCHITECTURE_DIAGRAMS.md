# Feature Architecture Diagrams

## Drag-and-Drop Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER ACTION                          │
│              User drags task from pos 2 to pos 0            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    TaskList Component                       │
│  onTaskDrop(event: CdkDragDrop<Task[]>)                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1. moveItemInArray(tasks, 2, 0)                       │ │
│  │    ⟶ [Task3, Task1, Task2] (instant UI update)       │ │
│  │                                                        │ │
│  │ 2. Call TaskService.updateTaskOrder(tasks)            │ │
│  └───────────────┬───────────────────────────────────────┘ │
└──────────────────┼─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     TaskService                             │
│  updateTaskOrder(tasks: Task[])                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1. Assign order: [0, 1, 2]                           │ │
│  │ 2. Cache to localStorage (instant)                    │ │
│  │ 3. PATCH each task with new order                     │ │
│  └───────────────┬───────────────────────────────────────┘ │
└──────────────────┼─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Mock API)                       │
│  Updates each task.order field                             │
│  Returns updated tasks                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Offline Support Flow

### Scenario 1: Online - Normal Operation

```
┌─────────────┐
│    USER     │
│ Loads Tasks │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│   TaskService.getTasks()│
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐     ┌──────────────────┐
│   HTTP GET /tasks       │────▶│   Mock API       │
└──────┬──────────────────┘     │   (localhost:3001)│
       │                        └──────────────────┘
       │ ✅ Success: [Task1, Task2, Task3]
       │
       ▼
┌─────────────────────────┐
│  Cache to localStorage  │
│  Key: 'tasks_cache'     │
│  Value: [Task1, Task2]  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│    Return tasks to UI   │
└─────────────────────────┘
```

### Scenario 2: Offline - Fallback to Cache

```
┌─────────────┐
│    USER     │
│ Loads Tasks │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│   TaskService.getTasks()│
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐     ┌──────────────────┐
│   HTTP GET /tasks       │──X─▶│   Mock API       │
└──────┬──────────────────┘     │   (UNREACHABLE)  │
       │                        └──────────────────┘
       │ ❌ Error: Connection Failed
       │
       ▼
┌─────────────────────────┐
│   catchError Handler    │
│   Check localStorage    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Load from cache        │
│  Key: 'tasks_cache'     │
│  ✅ Return cached tasks │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Show tasks in UI       │
│  + "Offline" indicator  │
└─────────────────────────┘
```

---

## Component Architecture

```
┌────────────────────────────────────────────────────────┐
│                    TaskListComponent                   │
│                   (Smart Container)                     │
│                                                         │
│  Responsibilities:                                      │
│  • Manages state (tasks, filteredTasks)               │
│  • Handles drag-drop events                            │
│  • Subscribes to online$ observable                    │
│  • Coordinates with TaskService                        │
│                                                         │
│  Data Flow:                                            │
│  TaskService ──▶ tasks[] ──▶ filteredTasks[]          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Template Structure                  │  │
│  │                                                  │  │
│  │  • Header (with online/offline indicator)       │  │
│  │  • Filter section                               │  │
│  │  • cdkDropList container                        │  │
│  │    └─▶ TaskCard components                      │  │
│  │         (with cdkDrag directive)                │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                         │
                         │ @Input: task
                         │ @Output: edit, delete, statusChange
                         ▼
┌────────────────────────────────────────────────────────┐
│                   TaskCardComponent                    │
│                  (Presentational)                       │
│                                                         │
│  Responsibilities:                                      │
│  • Display task data                                   │
│  • Emit user actions                                   │
│  • No drag logic (handled by parent)                   │
│  • No service dependencies                             │
│                                                         │
│  Props:                                                │
│  @Input() task: Task                                   │
│  @Input() availableStatuses: TaskStatus[]             │
│  @Output() edit: EventEmitter<Task>                   │
│  @Output() delete: EventEmitter<Task>                 │
│  @Output() statusChange: EventEmitter                 │
└────────────────────────────────────────────────────────┘
```

---

## Service Layer Architecture

```
┌────────────────────────────────────────────────────────┐
│                     TaskService                        │
│                                                         │
│  State Management:                                      │
│  • loadingSubject: BehaviorSubject<boolean>           │
│  • onlineSubject: BehaviorSubject<boolean>            │
│                                                         │
│  Public Observables:                                   │
│  • loading$: Observable<boolean>                       │
│  • online$: Observable<boolean>                        │
│                                                         │
│  CRUD Methods:                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │ getTasks()           → GET /tasks             │    │
│  │   └─▶ Cache on success                       │    │
│  │   └─▶ Load from cache on failure             │    │
│  │                                                │    │
│  │ createTask(data)     → POST /tasks            │    │
│  │   └─▶ Update cache after success             │    │
│  │                                                │    │
│  │ patchTask(id, data)  → PATCH /tasks/:id       │    │
│  │   └─▶ Update cache after success             │    │
│  │                                                │    │
│  │ deleteTask(id)       → DELETE /tasks/:id      │    │
│  │   └─▶ Remove from cache after success        │    │
│  │                                                │    │
│  │ updateTaskOrder(tasks)                        │    │
│  │   └─▶ Cache immediately                       │    │
│  │   └─▶ PATCH each task.order                   │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  Dependencies:                                          │
│  • HttpClient (Angular)                                │
│  • LocalStorageService                                 │
└───────────────────────┬────────────────────────────────┘
                        │
                        │ uses
                        ▼
┌────────────────────────────────────────────────────────┐
│                LocalStorageService                     │
│                                                         │
│  Generic utility for localStorage operations           │
│                                                         │
│  Methods:                                              │
│  • set<T>(key: string, value: T): void                │
│  • get<T>(key: string): T | null                      │
│  • remove(key: string): void                          │
│  • clear(): void                                       │
│  • has(key: string): boolean                          │
│                                                         │
│  Features:                                             │
│  ✅ Type-safe with generics                           │
│  ✅ JSON serialization                                │
│  ✅ Error handling                                     │
│  ✅ Simple API                                         │
└────────────────────────────────────────────────────────┘
```

---

## Online/Offline Detection Flow

```
┌──────────────────────────────────────────────────────┐
│             Browser Events                           │
└───────────────────┬──────────────────────────────────┘
                    │
      ┌─────────────┴─────────────┐
      │                           │
      ▼                           ▼
┌───────────┐              ┌───────────┐
│  'online' │              │ 'offline' │
│   event   │              │   event   │
└─────┬─────┘              └─────┬─────┘
      │                          │
      │                          │
      └──────────┬───────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│           TaskService Constructor                      │
│                                                         │
│  window.addEventListener('online', () => {             │
│    this.onlineSubject.next(true);                     │
│  });                                                   │
│                                                         │
│  window.addEventListener('offline', () => {            │
│    this.onlineSubject.next(false);                    │
│  });                                                   │
└────────────────┬───────────────────────────────────────┘
                 │
                 │ emits
                 ▼
┌────────────────────────────────────────────────────────┐
│    onlineSubject: BehaviorSubject<boolean>            │
│    online$: Observable<boolean>                        │
└────────────────┬───────────────────────────────────────┘
                 │
                 │ subscribed by
                 ▼
┌────────────────────────────────────────────────────────┐
│           TaskList Template                            │
│                                                         │
│  <div class="connection-status"                       │
│       [class.online]="online$ | async"                │
│       [class.offline]="!(online$ | async)">           │
│    <span class="status-dot"></span>                   │
│    <span>{{ (online$ | async) ? 'Online' : 'Offline' }}</span>│
│  </div>                                                │
└────────────────────────────────────────────────────────┘
```

---

## Data Persistence Flow

### Create Task Flow with Caching

```
User clicks "Create Task"
       │
       ▼
┌───────────────────────┐
│   Fill form & submit  │
└──────────┬────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  TaskService.createTask(formData)     │
│                                        │
│  1. Get cached tasks for order calc   │
│  2. Add order field                   │
│  3. POST to API                        │
└──────────┬─────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│         API Response                   │
│  Returns created task with ID          │
└──────────┬─────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│    tap() - Update Cache                │
│                                        │
│  1. Get cached tasks                   │
│  2. Add new task to array              │
│  3. Save back to localStorage          │
└──────────┬─────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│    Component subscribes                │
│    Reloads tasks                       │
│    UI updates                          │
└────────────────────────────────────────┘
```

---

## Summary

**Key Architectural Decisions:**

1. **Drag-Drop Logic in Container**
   - Keeps TaskCard purely presentational
   - Logic stays with state management
   - Easier to test and maintain

2. **Optimistic UI Updates**
   - Update UI immediately
   - Persist in background
   - Revert on error

3. **Cache After Every Success**
   - Consistent caching strategy
   - Always have latest data cached
   - Reliable offline fallback

4. **Observable-Based Online/Offline**
   - Reactive approach
   - Automatic UI updates
   - Easy to subscribe anywhere

5. **Type-Safe Services**
   - Generic LocalStorageService
   - Full TypeScript support
   - Compile-time safety
