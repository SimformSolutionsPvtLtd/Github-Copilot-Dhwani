# Quick Start Guide - Task Management System

## Prerequisites
- Node.js (v18.13.0 or compatible)
- npm

## Step-by-Step Setup

### 1. Start the Mock API Server

Open a terminal and run:

```bash
cd /home/dhwani/Desktop/team-project/CopilotTest/mock-api
npm install
npm start
```

You should see:
```
Resources
  http://localhost:3001/tasks

Home
  http://localhost:3001
```

**Leave this terminal running!**

### 2. Start the Frontend Application

Open a **new terminal** and run:

```bash
cd /home/dhwani/Desktop/team-project/CopilotTest/frontend
npm install
npm start
```

The Angular app will compile and open at: `http://localhost:4200`

### 3. Access the Application

Open your browser to: **http://localhost:4200**

Click on **"Tasks"** in the navigation to access the task management system.

## What You Can Do

### ✅ Create Tasks
1. Click "+ Add Task" button
2. Fill in the form (all fields required)
3. Click "Create Task"

### ✏️ Edit Tasks
1. Click the edit icon (✏️) on any task
2. Modify fields
3. Click "Update Task"

### 🔄 Change Status
Use the dropdown on each task card to change status:
- To Do
- In Progress
- Done

### 🗑️ Delete Tasks
1. Click delete icon (🗑️)
2. Confirm deletion

### 🔍 Filter Tasks
Use the "Filter by status" dropdown to view:
- All Tasks
- Only To Do
- Only In Progress
- Only Done

## Troubleshooting

### Mock API not starting?
```bash
cd mock-api
npm install
npm start
```

### Frontend not starting?
```bash
cd frontend
npm install
npm start
```

### Port already in use?
- Mock API (3001): Kill the process using port 3001
- Frontend (4200): Kill the process using port 4200

### Tasks not loading?
1. Check mock API is running: `curl http://localhost:3001/tasks`
2. Check browser console for errors
3. Ensure both servers are running

## Testing the API Directly

You can test the mock API with curl:

```bash
# Get all tasks
curl http://localhost:3001/tasks

# Create a task
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "status": "todo",
    "createdAt": "2026-02-20T12:00:00.000Z"
  }'

# Update a task (replace :id with actual task id)
curl -X PUT http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "title": "Updated Task",
    "description": "Updated description",
    "status": "in-progress",
    "createdAt": "2026-02-20T12:00:00.000Z"
  }'

# Delete a task
curl -X DELETE http://localhost:3001/tasks/1
```

## Features Implemented

✅ Task CRUD operations (Create, Read, Update, Delete)
✅ Reactive forms with validation
✅ Loading states for all async operations
✅ Comprehensive error handling
✅ Filter tasks by status
✅ User-friendly interface
✅ TypeScript interfaces for type safety
✅ Service layer for API calls

## File Changes Made

### New Files Created:
- `frontend/src/app/models/task.model.ts`
- `frontend/src/app/services/task.service.ts`
- `frontend/src/app/components/task-list/` (component files)
- `frontend/src/app/components/task-form/` (component files)

### Modified Files:
- `frontend/src/app/app.module.ts` - Added modules and components
- `frontend/src/app/app-routing.module.ts` - Added tasks route
- `frontend/src/app/app.component.html` - Added Tasks link
- `frontend/src/app/components/home/home.component.html` - Updated welcome page

## Next Steps

1. Navigate to http://localhost:4200
2. Click "Tasks" in the navigation
3. Try creating, editing, and deleting tasks
4. Test the filter functionality
5. Check loading states and error handling

Enjoy managing your tasks! 🚀
