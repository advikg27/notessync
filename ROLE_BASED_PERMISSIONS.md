# 🔐 Role-Based Permissions System

## ✅ Complete Permission System Implemented!

### **Three Roles:**

1. **👑 OWNER** - Course creator (full control)
2. **🛡️ ADMIN** - Trusted members (can manage content & members)
3. **👥 MEMBER** - Regular students (view-only)

---

## 🎯 Role Permissions

### 👑 **OWNER** (Purple Badge)
**Full Control:**
- ✅ Create, edit, and delete modules
- ✅ Manage ALL members (promote to admin, demote to member)
- ✅ See and share course ID
- ✅ Delete the course
- ✅ Cannot lose ownership (OWNER role is permanent)

### 🛡️ **ADMIN** (Blue Badge)
**Content & Member Management:**
- ✅ Create, edit, and delete modules
- ✅ Manage members (except other admins)
- ✅ See and share course ID
- ❌ Cannot manage other admins (only OWNER can)
- ❌ Cannot delete the course

### 👥 **MEMBER** (Gray Badge)
**View-Only Access:**
- ✅ View modules
- ✅ View compiled textbooks
- ❌ **Cannot** create or edit modules
- ❌ **Cannot** see course ID
- ❌ **Cannot** share course with others
- ❌ **Cannot** manage members

---

## 🔒 Security Rules

### **Course ID Visibility:**
- ✅ **OWNER & ADMIN:** Can see and copy course ID
- ❌ **MEMBER:** Course ID is hidden (prevents unauthorized sharing)

### **Module Creation:**
- ✅ **OWNER & ADMIN:** Can create modules
- ❌ **MEMBER:** Gets error: "Only course owners and admins can create modules"

### **Role Management:**
- **OWNER** can:
  - Promote members to ADMIN
  - Demote ADMIN to MEMBER
  - Manage anyone
  
- **ADMIN** can:
  - Promote members to ADMIN
  - Demote members (but NOT other admins)
  
- **OWNER role cannot be changed or transferred**

---

## 🎨 UI Features

### **Course Cards:**
- Role badge next to course name (purple/blue/gray)
- "Manage Members" button (OWNER & ADMIN only)
- Course ID section (OWNER & ADMIN only)
- Copy button with visual feedback

### **Members Page:**
- Shows all course members with avatars
- Role dropdown for OWNER/ADMIN to change roles
- Real-time role updates
- Permission info panel
- Visual feedback for role changes

### **Module Editor:**
- Shows error toast if MEMBER tries to create module
- Disables create button based on role

---

## 📡 API Endpoints

### **Get Course Members**
```
GET /courses/:id/members
```
Response:
```json
{
  "members": [
    {
      "id": "membership-id",
      "role": "OWNER",
      "user": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2025-11-16T00:00:00Z"
    }
  ],
  "currentUserRole": "OWNER"
}
```

### **Update Member Role**
```
PATCH /courses/:courseId/members/:memberId/role
Body: { "role": "ADMIN" | "MEMBER" }
```
Response:
```json
{
  "member": { ... },
  "message": "John Doe is now ADMIN"
}
```

**Validation:**
- ✅ Only OWNER and ADMIN can call this
- ✅ Cannot change OWNER role
- ✅ ADMIN cannot change other ADMIN roles
- ✅ Role must be "ADMIN" or "MEMBER"

### **Create Module** (Updated)
```
POST /modules/
Body: { "courseId": "...", "title": "...", ... }
```
**Permission Check:**
- Verifies user is OWNER or ADMIN
- Returns 403 if user is MEMBER

---

## 📊 Database Schema

### **New Enum:**
```prisma
enum CourseRole {
  OWNER
  ADMIN
  MEMBER
}
```

### **Updated CourseMembership:**
```prisma
model CourseMembership {
  id        String     @id @default(cuid())
  userId    String
  courseId  String
  role      CourseRole @default(MEMBER)  // NEW FIELD
  createdAt DateTime   @default(now())

  user   User   @relation(...)
  course Course @relation(...)

  @@unique([userId, courseId])
}
```

**Migration:** `20251116025808_add_course_roles`

---

## 🧪 How to Test

### **Test 1: Create Course & Check Role**
1. Login and create a course
2. You should see purple "Owner" badge
3. Course ID should be visible
4. "Manage Members" button should appear

### **Test 2: Invite Member**
1. As OWNER, copy course ID
2. Share with another user
3. Other user joins → becomes MEMBER (gray badge)
4. MEMBER should NOT see course ID
5. MEMBER should NOT see "Manage Members"

### **Test 3: Promote to Admin**
1. As OWNER, click "Manage Members"
2. Find the MEMBER user
3. Change role to "ADMIN"
4. Success toast appears
5. User's badge changes to blue
6. Admin can now see course ID

### **Test 4: Module Creation**
1. As MEMBER, try to create a module
2. Should get error: "Only course owners and admins can create modules"
3. Switch to ADMIN role
4. Can now create modules ✅

### **Test 5: Role Management**
1. As OWNER, promote someone to ADMIN
2. Login as that ADMIN
3. Try to change another ADMIN's role
4. Should fail: "Only the owner can change admin roles"
5. Can change MEMBER roles ✅

---

## 🎯 Use Cases

### **Classroom Setting:**
- **OWNER:** Professor
- **ADMIN:** Teaching Assistants
- **MEMBER:** Students

**Workflow:**
1. Professor creates course
2. Professor shares ID with TAs → promotes to ADMIN
3. TAs share ID with students → join as MEMBERS
4. Professor & TAs create modules
5. Students view and study
6. Only professor and TAs can share course ID (prevents spam)

### **Study Group:**
- **OWNER:** Group organizer
- **ADMIN:** Core contributors
- **MEMBER:** Participants

**Workflow:**
1. Organizer creates course
2. Promotes active contributors to ADMIN
3. ADMINs help create study materials
4. All members benefit from shared resources
5. Only organizer & admins can invite new members

---

## 📝 Files Modified

### Backend:
- ✅ `apps/api/prisma/schema.prisma` - Added CourseRole enum & role field
- ✅ `apps/api/src/routes/courses.ts` - Added role management endpoints
- ✅ `apps/api/src/routes/modules.ts` - Added permission check for module creation

### Frontend:
- ✅ `apps/web/src/utils/api.ts` - Added members & updateMemberRole APIs
- ✅ `apps/web/src/pages/CoursesPage.tsx` - Role badges, conditional UI
- ✅ `apps/web/src/pages/CourseMembersPage.tsx` - NEW members management page
- ✅ `apps/web/src/App.tsx` - Added members page route

---

## 🚀 What's New

### **Visual Indicators:**
- 👑 Purple badge for OWNER
- 🛡️ Blue badge for ADMIN
- 👥 Gray badge for MEMBER

### **Smart UI:**
- Course ID hidden from MEMBERS
- "Manage Members" button for OWNER/ADMIN only
- Role dropdowns with permission-based disabling
- Real-time role updates with toast notifications

### **Backend Security:**
- Module creation requires ADMIN+ role
- Role changes validated by current user's role
- OWNER role is immutable
- ADMIN cannot manage other ADMIN roles

---

## 🎊 Summary

**You now have a complete role-based permission system!**

✅ **OWNER:** Full control (course creator)  
✅ **ADMIN:** Can create modules & manage members  
✅ **MEMBER:** View-only access  

✅ Only OWNER/ADMIN can see & share course ID  
✅ Only OWNER/ADMIN can create modules  
✅ Role badges show at a glance  
✅ "Manage Members" page for role management  

**Try it now:**
1. Create a course → You're OWNER
2. Share ID with someone → They're MEMBER
3. Promote them to ADMIN
4. They can now create modules!

**Both servers running:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

🎉 **Role-based permissions are fully operational!**

