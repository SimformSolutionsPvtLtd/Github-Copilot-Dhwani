# Task Management System - Testing Checklist

## Pre-Flight Checks ✈️

### 1. Servers Running
- [ ] Mock API running on http://localhost:3001
- [ ] Frontend running on http://localhost:4200
- [ ] No console errors on startup

### 2. Navigation
- [ ] Home page loads
- [ ] Tasks link visible in navigation
- [ ] Tasks page accessible via /tasks route
- [ ] Health page still works

## Feature Testing 🧪

### Create Task Feature
- [ ] Click "+ Add Task" button
- [ ] Form appears with all fields
- [ ] Try submitting empty form → validation errors appear
- [ ] Enter title < 3 characters → error shown
- [ ] Enter description < 10 characters → error shown
- [ ] Fill valid data (title: "Test Task", description: "This is a test task description")
- [ ] Click "Create Task"
- [ ] See loading state ("Saving..." text)
- [ ] Form closes after success
- [ ] New task appears in the list
- [ ] Task has correct title, description, and status

### Read/Display Tasks Feature
- [ ] Tasks display in card layout
- [ ] Each card shows:
  - [ ] Title
  - [ ] Description
  - [ ] Status badge (color coded)
  - [ ] Created timestamp
  - [ ] Edit button (✏️)
  - [ ] Delete button (🗑️)
  - [ ] Status dropdown

### Edit Task Feature
- [ ] Click edit button (✏️) on a task
- [ ] Form appears with task data pre-filled
- [ ] Modify title
- [ ] Modify description
- [ ] Change status
- [ ] Click "Update Task"
- [ ] See loading state
- [ ] Form closes
- [ ] Task updates in list with new data

### Delete Task Feature
- [ ] Click delete button (🗑️)
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" → task remains
- [ ] Click delete button again
- [ ] Click "OK" in confirmation
- [ ] Task disappears from list

### Status Change Feature
- [ ] Create a task with "To Do" status
- [ ] Use status dropdown on task card
- [ ] Change to "In Progress"
- [ ] Task badge color changes
- [ ] Change to "Done"
- [ ] Task badge color changes again

### Filter Feature
- [ ] Create multiple tasks with different statuses
- [ ] Select "To Do" from filter dropdown
- [ ] Only "To Do" tasks visible
- [ ] Select "In Progress"
- [ ] Only "In Progress" tasks visible
- [ ] Select "Done"
- [ ] Only "Done" tasks visible
- [ ] Select "All Tasks"
- [ ] All tasks visible again

### Loading States
- [ ] Loading spinner shows when fetching tasks
- [ ] "Saving..." appears during create
- [ ] "Saving..." appears during update
- [ ] Buttons disabled during operations

### Error Handling
- [ ] Stop mock API server
- [ ] Try to load tasks page
- [ ] Error message appears: "Unable to connect to the server..."
- [ ] Try to create a task
- [ ] Error message appears in form
- [ ] Restart mock API
- [ ] Refresh page
- [ ] Tasks load successfully

### Validation Testing
- [ ] **Title Validation:**
  - [ ] Empty title → "Title is required"
  - [ ] "ab" (2 chars) → "Title must be at least 3 characters"
  - [ ] Very long title (>100 chars) → "Title must not exceed 100 characters"
  
- [ ] **Description Validation:**
  - [ ] Empty description → "Description is required"
  - [ ] "short" (5 chars) → "Description must be at least 10 characters"
  - [ ] Very long description (>500 chars) → "Description must not exceed 500 characters"

- [ ] **Status Validation:**
  - [ ] Status is required (pre-selected, can't be empty)

### Responsive Design
- [ ] Resize browser to mobile width
- [ ] Cards stack vertically
- [ ] Form is usable on small screen
- [ ] Buttons are touch-friendly
- [ ] Navigation works on mobile

### Edge Cases
- [ ] Create task with special characters in title
- [ ] Create task with line breaks in description
- [ ] Create multiple tasks quickly
- [ ] Edit task immediately after creating
- [ ] Delete all tasks → "No tasks yet" message appears
- [ ] Filter when no tasks match → appropriate message

## API Integration Testing 🔌

### Direct API Tests (Optional)
```bash
# Test 1: Get all tasks
curl http://localhost:3001/tasks

# Test 2: Create a task
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Task",
    "description": "Created via curl",
    "status": "todo",
    "createdAt": "2026-02-20T12:00:00.000Z"
  }'

# Test 3: Filter by status
curl http://localhost:3001/tasks?status=todo

# Test 4: Update task (use ID from created task)
curl -X PATCH http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'

# Test 5: Delete task
curl -X DELETE http://localhost:3001/tasks/1
```

## Performance Checks ⚡

- [ ] Tasks load quickly (< 1 second)
- [ ] Form submission is responsive
- [ ] No lag when filtering
- [ ] Smooth animations and transitions
- [ ] No memory leaks (check browser DevTools)

## Browser Console Checks 🔍

- [ ] Open browser DevTools (F12)
- [ ] Check Console tab
- [ ] No errors in console
- [ ] No warnings (or only expected Angular warnings)
- [ ] Network tab shows successful API calls

## Code Quality Checks ✨

- [ ] No TypeScript compilation errors
- [ ] All imports resolved
- [ ] No linting warnings
- [ ] Clean code structure
- [ ] Proper file organization

## Documentation Checks 📚

- [ ] README files created
- [ ] QUICK_START.md exists
- [ ] TASK_MANAGEMENT_GUIDE.md exists
- [ ] IMPLEMENTATION_SUMMARY.md exists
- [ ] All documentation is clear and accurate

## Final Verification ✅

### Before Demo
1. [ ] Restart both servers
2. [ ] Clear browser cache
3. [ ] Test all main features
4. [ ] Prepare some sample tasks
5. [ ] Have mock-api terminal visible
6. [ ] Have frontend terminal visible
7. [ ] Have browser DevTools ready

### Demo Flow
1. [ ] Show home page
2. [ ] Navigate to Tasks
3. [ ] Create a new task
4. [ ] Edit the task
5. [ ] Change task status
6. [ ] Filter tasks
7. [ ] Delete a task
8. [ ] Show error handling (stop API)
9. [ ] Show loading states

## Troubleshooting Common Issues 🔧

### Issue: Tasks not loading
**Solution:**
- Check if mock API is running: `curl http://localhost:3001/tasks`
- Check browser console for errors
- Restart mock API server

### Issue: Form validation not working
**Solution:**
- Check browser console for errors
- Verify ReactiveFormsModule is imported
- Check form control names match

### Issue: Styling looks broken
**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard reload (Ctrl+Shift+R)
- Check if CSS files exist

### Issue: Port already in use
**Solution:**
```bash
# Kill process on port 3001 (mock API)
lsof -ti:3001 | xargs kill -9

# Kill process on port 4200 (frontend)
lsof -ti:4200 | xargs kill -9
```

## Success Criteria ✨

All features should:
- ✅ Work without errors
- ✅ Have proper validation
- ✅ Show loading states
- ✅ Handle errors gracefully
- ✅ Be user-friendly
- ✅ Be responsive
- ✅ Match requirements

## Notes Section 📝

Use this space to note any issues found:

```
Issue 1: 
Solution:

Issue 2:
Solution:

Issue 3:
Solution:
```

---

## Sign-Off ✍️

- [ ] All features tested and working
- [ ] No critical bugs found
- [ ] Documentation reviewed
- [ ] Ready for demonstration
- [ ] Ready for deployment

**Tested by:** ________________  
**Date:** ________________  
**Status:** ✅ PASSED / ❌ FAILED  
**Notes:** ________________

---

**Happy Testing! 🚀**
