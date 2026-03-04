# LenguaHub: Technical Implementation Guide

## 📚 Firestore Data Schema

### Root Collections

#### `/users/{uid}`
User profile - shared across all workspaces
```firestore
{
  uid: string (Firebase uid)
  email: string
  displayName: string
  photoURL: string (optional)
  createdAt: timestamp
  lastLogin: timestamp
  
  // Preferences
  language: string (default: "en")
  defaultWorkspace: string (org_id or "personal")
}
```

#### `/organizations/{org_id}`
Team/org metadata
```firestore
{
  org_id: string (auto-generated or slug)
  type: "personal" | "tutor-lite" | "tutor-pro" | "school"
  name: string
  description: string (optional)
  owner_uid: string (who created it)
  
  // Subscription
  tier: "tutor-lite" | "tutor-pro" | "school"
  stripe_subscription_id: string (optional)
  stripe_customer_id: string (optional)
  
  // Limits
  seats_used: number
  seats_limit: number | null (null = unlimited)
  
  // Metadata
  createdAt: timestamp
  updatedAt: timestamp
  status: "active" | "paused" | "canceled"
  
  // Contact info (for schools)
  contact_email: string (optional)
  contact_phone: string (optional)
  school_name: string (for school type)
  country: string (optional)
}
```

#### `/organization-members/{org_id}/{uid}`
User's role in an org
```firestore
{
  uid: string
  org_id: string
  role: "owner" | "admin" | "teacher" | "tutor" | "student"
  joined_at: timestamp
  invited_by: string (uid of who invited them)
  
  // Permissions summary
  can_manage_students: boolean
  can_view_analytics: boolean
  can_invite_users: boolean
}
```

#### `/invitations/{invitation_id}`
Invite links for orgs
```firestore
{
  invitation_id: string (auto-generated)
  org_id: string
  email: string
  role: "teacher" | "tutor" | "student"
  invited_by: string (uid)
  created_at: timestamp
  expires_at: timestamp (7 days from creation)
  used_at: timestamp | null
  used_by: string | null (uid of who accepted)
  
  // Optional restrictions
  max_uses: number | null
  uses: number (started at 0)
}
```

---

### Org-Scoped Subcollections

**Note**: These live under `/organizations/{org_id}`

#### `/organizations/{org_id}/students`
All students in this org with their progress
```firestore
{
  uid: string
  displayName: string
  email: string
  photoURL: string
  
  // Progress summary
  total_words: number
  streak_days: number
  level: number
  last_activity: timestamp
  
  // Assigned to (for tutors)
  assigned_to_uid: string (tutor's uid)
}
```

#### `/organizations/{org_id}/classes` (SCHOOL ONLY)
Schools can organize students into classes
```firestore
{
  class_id: string (auto-generated)
  name: string (e.g., "Spanish 101")
  teacher_uid: string
  grade: string (optional)
  period: string (optional, e.g., "Period 3")
  academic_year: string (e.g., "2025-2026")
  
  // Roster
  student_uids: array<string>
  
  // Timing
  createdAt: timestamp
  start_date: timestamp
  end_date: timestamp
}
```

#### `/organizations/{org_id}/lessons`
Lessons assigned to students
```firestore
{
  lesson_id: string (auto-generated)
  type: "vocabulary" | "grammar" | "conversation" | "custom"
  title: string
  description: string
  content: object (lesson data)
  
  // Assignment
  assigned_to: array<uid>
  assigned_by: string (teacher/tutor uid)
  assigned_at: timestamp
  
  // Metadata
  due_date: timestamp (optional)
  status: "draft" | "assigned" | "completed"
}
```

#### `/organizations/{org_id}/progress`
Student progress on lessons
```firestore
{
  student_uid: string
  lesson_id: string
  
  status: "assigned" | "in_progress" | "completed"
  started_at: timestamp
  completed_at: timestamp | null
  score: number (out of 100)
  notes: string (optional feedback from tutor)
  tutor_feedback: array<{
    added_by: uid
    text: string
    created_at: timestamp
  }>
}
```

---

## 🔐 Firestore Security Rules (Key Rules)

```javascript
// Users can only read/write their own profile
match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
}

// Organizations
match /organizations/{org_id} {
  // Anyone can read org metadata
  allow read: if true;
  
  // Only owner can update
  allow write: if isOrgOwner(org_id);
  
  // Subcollections scoped by membership
  match /students/{student_uid} {
    allow read: if isMemberOfOrg(org_id) && hasPermission(org_id, 'view_students');
    allow write: if isOrgAdmin(org_id);
  }
  
  match /lessons/{lesson_id} {
    allow read: if hasRoleInOrg(org_id, ['teacher', 'tutor', 'student']);
    allow write: if hasPermission(org_id, 'manage_lessons');
  }
  
  match /progress/{progress_id} {
    // Students see their own progress
    // Teachers/tutors see assigned students' progress
    allow read: if isProgressOwner(student_uid) || 
                   canViewStudent(org_id, student_uid);
    allow write: if canManageProgress(org_id, student_uid);
  }
}

// Organization members
match /organization-members/{org_id}/{uid} {
  allow read: if isMemberOfOrg(org_id);
  allow write: if isOrgAdmin(org_id);
}

// Invitations
match /invitations/{inv_id} {
  allow read: if matchesEmail(resource.data.email) || 
                 isOrgAdmin(resource.data.org_id);
  allow create: if isOrgAdmin(resource.data.org_id);
}
```

---

## 🛠️ Code Architecture

### New Utilities (`src/lib/`)

#### `workspaceManager.js`
```javascript
// Core workspace switching logic
export const useCurrentWorkspace = () => {
  // Hook to get/set current org context
}

export const switchWorkspace = (org_id) => {
  // Update context and reload data
}

export const getUserWorkspaces = (uid) => {
  // Fetch all orgs user belongs to
}

export const createOrganization = (name, type, owner_uid) => {
  // Create new org
}
```

#### `organizationManager.js`
```javascript
// Org-specific operations
export const inviteStudentToOrg = (org_id, email, role) => {
  // Create invitation
}

export const addStudentToOrg = (org_id, uid, role) => {
  // Accept invitation or direct add
}

export const removeStudentFromOrg = (org_id, uid) => {
  // Remove student and clean up data
}

export const getOrgStudents = (org_id) => {
  // Fetch all students in org
}

export const checkSeatLimits = (org_id) => {
  // Verify org hasn't exceeded seats
}
```

#### `subscriptionManager.js`
```javascript
// Stripe integration & tier validation
export const getOrgTier = (org_id) => {
  // Return tier and limits
}

export const enforceFeatures = (org_id, feature) => {
  // Check if feature available in tier
}

export const createStripeSubscription = (org_id, tier) => {
  // Create Stripe subscription
}
```

### Updated Components

#### `src/components/WorkspaceSelector.jsx` (NEW)
- Dropdown showing all user's workspaces
- "Create new workspace" option
- Quick switch between personal & teams

#### `src/modules/dashboard/TeacherDashboard.jsx` (UPDATED)
- Update to use workspace context
- Fetch students from current org
- Show org-specific data

#### `src/modules/dashboard/Dashboard.jsx` (UPDATED)
- Check if personal or team workspace
- Filter data by workspace
- Show different UI for team leads

#### `src/modules/auth/Onboarding.jsx` (UPDATED)
- First login: "Continue as personal user" vs "Join team"
- If team: show org/role assignment

---

## 📊 Component Structure

```
src/
├── contexts/
│   └── WorkspaceContext.jsx (NEW)
│       └── Provides current org_id, user role in org
│
├── lib/
│   ├── workspaceManager.js (NEW)
│   ├── organizationManager.js (NEW)
│   ├── subscriptionManager.js (NEW)
│   └── [existing files...]
│
├── modules/
│   ├── dashboard/
│   │   ├── Dashboard.jsx (UPDATED - multi-workspace)
│   │   ├── TeacherDashboard.jsx (UPDATED - org context)
│   │   └── AdminDashboard.jsx (UPDATED - org analytics)
│   │
│   ├── organizations/ (NEW MODULE)
│   │   ├── CreateOrganization.jsx
│   │   ├── OrganizationSettings.jsx
│   │   ├── InviteStudents.jsx
│   │   └── TeamAnalytics.jsx
│   │
│   ├── billing/ (NEW MODULE)
│   │   ├── PricingPlans.jsx
│   │   ├── UpgradeModal.jsx
│   │   └── BillingPortal.jsx
│   │
│   └── [existing modules...]
│
└── components/
    ├── WorkspaceSelector.jsx (NEW)
    └── [existing components...]
```

---

## 🔄 Data Migration Path

### Step 1: Non-Breaking Changes
1. Add workspace/org fields to existing data
2. Create `/organizations/{default_org}` for each existing user
3. Migrate existing lesson/word data to org context

### Step 2: Firestore Rules Update
- Update rules to accept org-scoped queries
- Grandfather in old data access patterns

### Step 3: UI Transition
- Add workspace selector to sidebar
- Update dashboard to show org context
- Keep personal workspace as default

### Step 4: New Features
- Enable room for team invitations
- Roll out school management
- Release subscription tier system

---

## ✅ MVP Launch Checklist

**Week 1: Foundation**
- [ ] Create Firestore schema
- [ ] Update security rules
- [ ] Create WorkspaceContext
- [ ] Build WorkspaceSelector component
- [ ] Update onboarding flow

**Week 2: Team Management**
- [ ] Invite system (email-based)
- [ ] Student roster UI
- [ ] Update TeacherDashboard for orgs
- [ ] Basic org settings

**Week 3: Testing & Polish**
- [ ] Firestore rule testing
- [ ] E2E testing with multiple accounts
- [ ] Data migration for existing users
- [ ] Deploy to staging

**Week 4: Go-Live**
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Customer support docs
- [ ] Begin initial pitching
