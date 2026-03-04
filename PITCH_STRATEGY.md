# LenguaHub: Enterprise-Ready Pitch Strategy

## 📊 Business Model

### Pricing Tiers
1. **Personal Plan** - £9.99/month
   - Use the app individually
   - Freemium option available (limited features)
   - Word bank, study, practice modules
   - No team management

2. **Tutor Plan Lite** - £50/month
   - Manage up to 10 students
   - Access to all student progress
   - Lesson tracking & analytics
   - Personal account included

3. **Tutor Plan Pro** - £100/month
   - Manage unlimited students
   - Team admin dashboard
   - Advanced analytics
   - Priority support
   - Personal account included

4. **School Plan** - £5 per student/month (billed monthly)
   - Unlimited teachers (each gets admin view)
   - Bulk student management
   - Class organization
   - GDPR-compliant reporting
   - SSO/Integration ready

---

## 🎯 Core Problem Solved

**For Tutors**: Managing multiple students' progress, assignments, and learning is fragmented and time-consuming.

**For Schools**: Students need a unified platform for Spanish learning across curriculum with teacher oversight.

**For LenguaHub**: Need to support both personal use AND team management within the same app ecosystem.

---

## 🏗️ Technical Architecture Changes

### 1. **Workspace/Organization Model** (CRITICAL)
```
User Account (uid)
├── Personal Workspace (default)
│   └── Personal word bank, study data
└── Team Workspaces (created/invited)
    ├── Organization (org_id)
    │   ├── Name, type (tutor/school)
    │   ├── Subscription tier
    │   └── Seats used/available
    ├── Users in Org (with roles)
    │   ├── tutor (can manage students)
    │   ├── teacher (school leader, can manage classes)
    │   ├── student (belongs to tutor/class)
    │   └── admin (org owner)
    └── Data in Org
        └── Students' progress, lessons, word banks
```

### 2. **Account Model Changes**
- User can be multiple things simultaneously:
  - Personal user (individual learner)
  - Tutor (manages 1-unlimited students)
  - School teacher/admin (manages classes)
- Simplified onboarding: "Continue as personal user" or "Invite to team"

### 3. **Data Structure**
```
/organizations
  /{org_id}
    - tier: "tutor-lite" | "tutor-pro" | "school"
    - seats_used: number
    - seats_limit: number | null (null for unlimited)
    - created_at
    - stripe_subscription_id
    - created_by: uid (owner)

/organization-users/{org_id}
  /{uid}
    - role: "admin" | "teacher" | "tutor" | "student"
    - joined_at
    - email

/organization-data/{org_id}
  /students/{uid}
    - All student progress/words
  /lessons/{lesson_id}
    - Assigned lessons to students

/invitations
  /{invitation_id}
    - org_id
    - email
    - role
    - expires_at
    - used_at (null if unused)
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Priority 1 - MVP for pitching)
- [ ] Create workspace/org selection UI
- [ ] Build org creation flow (tutor creates org, school admin invited)
- [ ] Build student invitation system
- [ ] Show org selector on login/dashboard
- [ ] Update Firestore rules for org-scoped data
- [ ] Update TeacherDashboard to work within org context

### Phase 2: Subscription Tier System
- [ ] Stripe integration for subscriptions
- [ ] Tier validation (enforce seat limits)
- [ ] Upgrade flow UI
- [ ] Subscription management dashboard

### Phase 3: Institutional Features
- [ ] Class/group management for schools
- [ ] Bulk student import for schools
- [ ] Advanced analytics dashboards
- [ ] GDPR compliance module
- [ ] SSO/OAuth integration support

### Phase 4: Polish & Go-to-Market
- [ ] Public landing page with pricing
- [ ] Institutional marketing materials
- [ ] Demo environment
- [ ] API documentation

---

## 💡 Key Design Decisions

1. **Personal workspace is ALWAYS included** - regardless of tier
2. **Team data is org-scoped** - no data leakage between orgs
3. **Teachers/Admins see only their students** - privacy-first
4. **Invite-based access** - for schools and tutor teams
5. **Flexible pricing** - support multiple billing models simultaneously

---

## 🎤 Pitch Narrative

> *"LenguaHub is the all-in-one Spanish learning platform built by tutors, for tutors and schools. Unlike scattered tools, LenguaHub gives teachers instant visibility into every student's progress—from vocabulary mastery to speaking confidence. 
>
> For tutors managing 5-50 students, it's £50-100/month. For schools, it's just £5 per student—often cheaper than a single SaaS tool per class. Students get a platform they love, teachers get insights they need."*

---

## 📋 Go-Live Checklist

- [ ] Workspace model fully functional
- [ ] Student invitation system tested
- [ ] TeacherDashboard updated for teams
- [ ] Basic Stripe integration
- [ ] Demo video showing tutor workflow
- [ ] Pricing page live
- [ ] Terms of Service updated
- [ ] GDPR privacy policy
- [ ] Email templates for invites
- [ ] Initial customer onboarding docs
