# LenguaHub: Integration Implementation Guide

## 🎯 Quick Start (Next 2 Weeks)

Follow this guide to integrate the new workspace/organization system into your existing app.

---

## Phase 1: Setup (Day 1-2)

### Step 1: Update Firebase Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Firestore Database
3. Click "Rules" tab
4. Replace all content with the content from `/firestore.rules`
5. Click "Publish" and verify in staging first

### Step 2: Update App Root Component

Wrap your app with `WorkspaceProvider`:

**File**: `src/App.jsx`

```jsx
import { WorkspaceProvider } from './contexts/WorkspaceContext'

function MainContent() {
  // ... existing code ...

  return (
    <WorkspaceProvider user={user}>
      <Routes>
        {/* your existing routes */}
      </Routes>
    </WorkspaceProvider>
  )
}
```

### Step 3: Add Workspace Selector to Sidebar

**File**: `src/components/layout/Sidebar.jsx`

Add the WorkspaceSelector to your sidebar:

```jsx
import WorkspaceSelector from './WorkspaceSelector'

export default function Sidebar({ user, logout }) {
  return (
    <div className="sidebar">
      {/* Add this near the top */}
      <WorkspaceSelector user={user} />
      
      {/* existing sidebar content */}
    </div>
  )
}
```

---

## Phase 2: Update Existing Components (Day 3-5)

### Step 1: Update Dashboard Component

**File**: `src/modules/dashboard/Dashboard.jsx`

Add workspace context usage:

```jsx
import { useWorkspace } from '../../contexts/WorkspaceContext'

export default function Dashboard({ user, words = [], events = [], isPremium, dailyUsage, trackUsage, onUpgrade }) {
  const { currentWorkspace } = useWorkspace()
  
  // Your existing code...
  
  // When fetching words, now filter by workspace (if needed)
  // For "personal" workspace: use existing logic
  // For team workspaces: fetch from org-scoped data
  
  return (
    <div>
      {currentWorkspace?.name === 'Personal' ? (
        // Show personal dashboard
      ) : (
        // Show team dashboard
      )}
    </div>
  )
}
```

### Step 2: Update TeacherDashboard Component

**File**: `src/modules/dashboard/TeacherDashboard.jsx`

Add workspace awareness:

```jsx
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { getOrganizationStudents } from '../../lib/organizationManager'

export default function TeacherDashboard({ user, logout, role }) {
  const { currentWorkspace } = useWorkspace()
  const [students, setStudents] = useState([])

  useEffect(() => {
    if (currentWorkspace?.org_id && currentWorkspace.org_id !== 'personal') {
      loadStudents()
    }
  }, [currentWorkspace?.org_id])

  const loadStudents = async () => {
    const students = await getOrganizationStudents(currentWorkspace.org_id)
    setStudents(students)
  }

  // Rest of your existing code
}
```

### Step 3: Create New Routes for Organization Management

**File**: `src/App.jsx`

Add these routes inside the protected `<Routes>` section:

```jsx
import CreateOrganization from './modules/organizations/CreateOrganization'
import InviteStudents from './modules/organizations/InviteStudents'
import PricingPlans from './modules/billing/PricingPlans'

// Inside the protected routes section:
<Route path="/create-team" element={<CreateOrganization currentUserUid={user?.uid} />} />
<Route path="/teams/:org_id/invite" element={<InviteStudents />} />
<Route path="/pricing" element={<PricingPlans user={user} />} />
```

---

## Phase 3: Data Migration (Day 6-10)

### Important: Backward Compatibility

For existing users, automatically create a "personal" workspace for them:

**File**: `src/lib/workspaceManager.js`

Create a function to initialize default org:

```javascript
export const initializePersonalWorkspace = async (uid, email) => {
  try {
    const personalRef = doc(db, 'organization-members', 'personal', uid)
    const snap = await getDoc(personalRef)
    
    if (!snap.exists()) {
      // First time seeing this user, create personal workspace entry
      await setDoc(personalRef, {
        uid,
        org_id: 'personal',
        role: 'owner',
        joined_at: serverTimestamp(),
        can_manage_students: false,
        can_view_analytics: false,
        can_invite_users: false,
      })
    }
  } catch (err) {
    console.error('Failed to initialize personal workspace:', err)
  }
}
```

Call this in `App.jsx` when user first logs in:

```jsx
useEffect(() => {
  if (user?.uid && !isGuest) {
    initializePersonalWorkspace(user.uid, user.email)
  }
}, [user?.uid, isGuest])
```

---

## Phase 4: New Organization Features (Day 11-14)

### Add Organization Settings Page

**New File**: `src/modules/organizations/OrganizationSettings.jsx`

```jsx
import React, { useState, useEffect } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { 
  getOrganizationMembers, 
  removeUserFromOrganization,
  changeUserRole 
} from '../../lib/organizationManager'

export default function OrganizationSettings({ currentUserUid }) {
  const { currentWorkspace } = useWorkspace()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentWorkspace?.org_id !== 'personal') {
      loadMembers()
    }
  }, [currentWorkspace?.org_id])

  const loadMembers = async () => {
    const data = await getOrganizationMembers(currentWorkspace.org_id)
    setMembers(data)
    setLoading(false)
  }

  const handleRemoveUser = async (uid) => {
    if (confirm('Remove this user from the team?')) {
      await removeUserFromOrganization(
        currentWorkspace.org_id,
        uid,
        currentUserUid
      )
      loadMembers()
    }
  }

  // Render team members list with management controls
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Team Members</h2>
      
      <div className="space-y-4">
        {members.map(member => (
          <div key={member.uid} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{member.uid}</p>
              <p className="text-sm text-slate-500 capitalize">{member.role}</p>
            </div>
            <button
              onClick={() => handleRemoveUser(member.uid)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Add route:
```jsx
<Route path="/teams/:org_id/settings" element={<OrganizationSettings currentUserUid={user?.uid} />} />
```

---

## Testing Checklist

- [ ] Can create multiple workspaces
- [ ] Workspace selector shows all teams
- [ ] Can switch between workspaces
- [ ] Personal workspace is always available
- [ ] Can invite students to team
- [ ] Can view only team members' data
- [ ] Firestore rules prevent unauthorized access
- [ ] Existing users auto-get personal workspace
- [ ] New routes accessible to authorized users

---

## Deployment Steps

### 1. Test in Staging

```bash
# Deploy to staging first
firebase deploy --only firestore:rules --project lenguahub-staging
```

### 2. Deploy Firestore Rules (Production)

```bash
firebase deploy --only firestore:rules
```

### 3. Build & Deploy App

```bash
npm run build
# Deploy to Vercel or your hosting
```

### 4. Monitor

- Check Firestore rules violations in console
- Monitor authentication failures
- Check that existing users can still access data

---

## Feature Flags (Optional)

If you want to gradually roll out team features, use environment variables:

```javascript
const TEAM_FEATURES_ENABLED = import.meta.env.VITE_ENABLE_TEAMS === 'true'

// Then conditionally show/hide:
{TEAM_FEATURES_ENABLED && <InviteStudents />}
```

Set in `.env`:
```
VITE_ENABLE_TEAMS=true
```

---

## Next Steps After MVP

1. **Subscription Integration** (Week 3)
   - Integrate Stripe for billing
   - Add subscription validation
   - Create billing portal

2. **Advanced Analytics** (Week 4)
   - Build tutor/teacher dashboards
   - Add progress reports
   - Create class analytics

3. **Institutional Features** (Week 5)
   - Bulk student import
   - Class management UI
   - GDPR compliance module
   - API endpoints

4. **Marketing** (Week 6)
   - Update landing page with pricing
   - Create case studies
   - Prepare pitch deck
   - Outreach to schools

---

## Support & Questions

- Have issues? Check Firestore rule syntax with the [validator](https://firebase.google.com/docs/firestore/security/rules-syntax)
- Context not working? Ensure WorkspaceProvider wraps entire app
- Data not showing? Check org_id matches in queries
