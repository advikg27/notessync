# 📚 Course Sharing Guide

## ✅ Course Joining is Now Fixed!

Students can now join courses using the Course ID. Here's how it works:

---

## 🎓 For Instructors (Course Creators)

### Step 1: Create a Course
1. Go to **Courses** page
2. Click **"New Course"** button
3. Enter course name (e.g., "Calculus I - Fall 2024")
4. Click **"Create Course"**

### Step 2: Share the Course ID
Each course has a unique ID that looks like this: `clxxxxxxxxxxxxx` (starts with "cl")

**To share your Course ID:**
- Go to your Courses page
- Find your course card
- Look at the bottom section: **"Share this ID with students"**
- Click the **"Copy"** button (it will turn green and say "Copied!")
- Share this ID with your students via:
  - Email
  - Learning Management System (Canvas, Blackboard, etc.)
  - Class announcement
  - Syllabus

**Example Course ID:**
```
clm7x8y9z0a1b2c3d4e5f
```

---

## 🎒 For Students (Joining a Course)

### Step 1: Get the Course ID
Ask your instructor for the Course ID. It looks like `clxxxxxxxxxxxxx`.

### Step 2: Join the Course
1. Go to **Courses** page
2. Click **"Join Course"** button
3. Paste the Course ID into the text field
4. Click **"Join Course"**

**What happens next:**
- ✅ You'll see a success message with the course name
- ✅ The course will appear in your courses list
- ✅ You can now view modules and collaborate!

---

## 🔧 Technical Details

### API Endpoints

#### Create a Course
**POST** `/courses`
```json
{
  "name": "Course Name"
}
```

#### Join a Course (Method 1 - Body)
**POST** `/courses/join`
```json
{
  "courseId": "clxxxxxxxxxxxxx"
}
```

Response:
```json
{
  "membership": { ... },
  "message": "Successfully joined \"Course Name\"!",
  "course": {
    "id": "clxxxxxxxxxxxxx",
    "name": "Course Name"
  }
}
```

#### Join a Course (Method 2 - URL)
**POST** `/courses/:courseId/enroll`

Both methods work! The frontend uses Method 1.

### Error Handling

The join endpoint provides helpful error messages:

- **Course not found:** "Course not found. Please check the course ID."
- **Already enrolled:** "You are already enrolled in this course"
- **Missing ID:** "Course ID is required"

All errors are displayed as toast notifications in the UI.

---

## 🎨 UI Features

### Course Card Display
Each course card shows:
- **Course name**
- **Owner name** (who created it)
- **Module count**
- **Member count**
- **Full Course ID** (with copy button)
- **Action buttons:**
  - View Modules
  - Build Textbook

### Copy Button Feedback
When you click the copy button:
- Icon changes from 📋 to ✅
- Button turns green
- Toast notification appears: "Course ID copied to clipboard!"
- Auto-reverts after 2 seconds

### Join Modal
The "Join Course" modal includes:
- Clear instructions
- Input validation
- Loading spinner during join
- Helpful tip about what Course IDs look like
- Auto-clears input on success

---

## 🧪 Testing the Feature

### Test as Instructor:
1. Login as User A
2. Go to Courses
3. Create a new course "Test Course"
4. Copy the Course ID from the course card
5. Share it (send to yourself)

### Test as Student:
1. Logout
2. Register/Login as User B
3. Go to Courses
4. Click "Join Course"
5. Paste the Course ID
6. Click "Join Course"
7. Verify:
   - Success message shows course name
   - Course appears in your list
   - You see the same module count

### Test Error Cases:
1. Try joining with an invalid ID → See "Course not found" error
2. Try joining the same course twice → See "Already enrolled" error
3. Try joining with empty ID → Validation prevents submission

---

## 📊 Database Structure

### CourseMembership Table
When a student joins:
```sql
INSERT INTO CourseMembership (userId, courseId)
VALUES ('user-id', 'course-id');
```

Unique constraint ensures no duplicate enrollments:
```prisma
@@unique([userId, courseId])
```

---

## 🎯 Summary

**What was fixed:**
- ✅ Added `/courses/join` endpoint (accepts courseId in body)
- ✅ Enhanced error messages
- ✅ Added toast notifications for success/error
- ✅ Improved course card UI with full ID display
- ✅ Added visual feedback for copy button
- ✅ Better join modal with instructions
- ✅ Loading states and error handling

**How to use:**
1. **Instructor:** Create course → Copy ID → Share with students
2. **Student:** Get ID → Click "Join Course" → Paste ID → Done!

**Try it now:**
- Frontend: http://localhost:5173/courses
- Backend API: http://localhost:3000

---

## 🐛 Troubleshooting

### "Course not found" error
- Double-check the Course ID (should start with "cl")
- Make sure you copied the entire ID
- Course IDs are case-sensitive

### Toast notifications not showing
- Make sure react-hot-toast is initialized in App.tsx
- Check browser console for errors

### Copy button not working
- Some browsers require HTTPS for clipboard API
- In development (localhost), it should work fine
- Check if clipboard permissions are blocked

---

## 📝 Files Modified

- `/apps/api/src/routes/courses.ts` - Added `/courses/join` endpoint
- `/apps/web/src/utils/api.ts` - Added `join()` method to courseApi
- `/apps/web/src/pages/CoursesPage.tsx` - Enhanced UI and error handling

---

**Status: ✅ Ready to use!**

Students can now successfully join courses using the Course ID. Both servers are running and the feature is fully functional!

