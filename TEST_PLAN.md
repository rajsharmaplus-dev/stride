# Test Plan — Stride

**Version:** 1.0  
**Date:** 2026-02-11  
**Application:** Stride (Vite + React + Tailwind CSS v4)  
**Author:** AI-Assisted  

---

## Table of Contents

1. [Project Overview & Scope](#1-project-overview--scope)
2. [Architecture Summary](#2-architecture-summary)
3. [Module-Level Test Cases](#3-module-level-test-cases)
   - [3.1 useProjectData Hook (State Management)](#31-useprojectdata-hook)
   - [3.2 Sidebar & Navigation](#32-sidebar--navigation)
   - [3.3 Dashboard & StatCards](#33-dashboard--statcards)
   - [3.4 ProjectTable](#34-projecttable)
   - [3.5 SubmissionForm](#35-submissionform)
   - [3.6 ProjectDetails](#36-projectdetails)
   - [3.7 Common Components](#37-common-components)
4. [End-to-End Workflow Tests](#4-end-to-end-workflow-tests)
5. [Edge Cases & Boundary Tests](#5-edge-cases--boundary-tests)
6. [Bugs & Risks Identified During Review](#6-bugs--risks-identified-during-review)
7. [Non-Functional Tests](#7-non-functional-tests)

---

## 1. Project Overview & Scope

The application is **Stride**, a platform that allows:
- **Submitters** (Employees) to create project initiatives
- **Managers** to review, approve, rework, or decline initiatives
- **Admins** to see all projects across the portfolio
- **Owners** to close active projects with financial results

The app uses client-side React state only (no backend, no persistence).

### Roles Under Test

| User | ID | Role | Manager |
|---|---|---|---|
| Alex Submitter | `u1` | Employee | `u2` |
| Sarah Manager | `u2` | Manager | `u3` |
| David Business Head | `u3` | Admin | `null` |

---

## 2. Architecture Summary

```
src/
├── hooks/useProjectData.js       → Central state logic
├── constants/projectConstants.js → Enums & dropdown options
├── data/mockData.js              → Seed users & projects
├── components/
│   ├── Common/index.jsx          → StatusBadge, StatCard, NavItem, DetailItem
│   ├── Layout/Sidebar.jsx        → Navigation sidebar
│   ├── Dashboard/Dashboard.jsx   → KPI cards + ProjectTable
│   ├── Dashboard/ProjectTable.jsx→ Searchable/filterable table
│   ├── Forms/SubmissionForm.jsx  → Initiative creation form
│   └── Projects/ProjectDetails.jsx → Detail view + review/closure actions
└── App.jsx                       → Root routing & view switching
```

---

## 3. Module-Level Test Cases

---

### 3.1 `useProjectData` Hook

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| H-01 | Initial state loads correctly | Mount hook | `user` = Alex Submitter (`u1`), `projects` = 3 seed projects | High |
| H-02 | Stats computed for current user | Mount as `u1` | `total` = 3 (u1 owns all 3), `active` = 1, `pending` = 0 (u1 is not a manager), `roi` = 45000 | High |
| H-03 | Stats recompute on user switch | Switch to `u2` | `pending` = 1 (p2 is pending, manager is u2) | High |
| H-04 | Switch user cycles through all users | Click switch 3 times | u1 → u2 → u3 → u1 | Medium |
| H-05 | Add project as draft | `addProject(data, true)` | New project at index 0 with `status = 'Draft'` | High |
| H-06 | Add project for submission | `addProject(data, false)` | New project with `status = 'Pending Approval'` | High |
| H-07 | Add project inherits current user | Logged as u2, submit | `submitterId = 'u2'` | High |
| H-08 | Update project status | `updateProjectStatus('p2', 'Active', 'Looks good')` | p2.status = 'Active', history[0].action = 'Active' | High |
| H-09 | Close project sets financials | `closeProject('p1', '10000', '55000')` | p1.status = 'Closed', `actualInvestment = 10000`, `actualRoi = 55000` | High |
| H-10 | History is prepended (latest first) | Approve then close a project | `history[0]` is the Close entry, `history[1]` is the Approve entry | Medium |
| **H-11** | **EDGE: estimatedBenefit with non-numeric input** | Submit form with `estimatedBenefit = "abc"` | `parseFloat("abc")` returns `NaN`, then `|| 0` → stored as `0` | Medium |
| **H-12** | **EDGE: closeProject with negative values** | `closeProject('p1', '-5000', '-1000')` | `actualInvestment = -5000`, `actualRoi = -1000` — no validation exists | High |
| **H-13** | **EDGE: updateProjectStatus on non-existent ID** | `updateProjectStatus('p999', 'Active', '')` | No crash, no project modified | Medium |
| **H-14** | **EDGE: rapid double-submit** | Call `addProject` twice in <100ms | Two separate projects created with different `Date.now()` IDs | Low |

---

### 3.2 Sidebar & Navigation

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| N-01 | Sidebar shows on xl+ screens | Open at ≥1280px | Sidebar visible as fixed panel | High |
| N-02 | Sidebar hidden on small screens | Open at <1280px | Sidebar hidden, mobile header visible | High |
| N-03 | Active nav item highlighted | Click "Review Queue" | Item bg = primary-600 with white text | Medium |
| N-04 | Pending badge count on Review Queue | As Sarah (u2) with 1 pending | Badge shows `1` | High |
| N-05 | Pending badge hidden when 0 | As Alex (u1) | No badge on Review Queue | Medium |
| N-06 | User profile displays correct info | As Alex | Shows "A" avatar, "Alex Submitter", "Employee" | Medium |
| N-07 | Role indicator color differs | Manager vs Employee | Manager = amber dot, others = primary dot | Low |
| N-08 | Switch Session button works | Click button | Cycles to next user, sidebar updates | High |
| **N-09** | **EDGE: Governance/Settings nav items are no-ops** | Click "Governance" or "System Settings" | No crash, no view change | Medium |
| **N-10** | **EDGE: ChevronRight imported but unused** | Code review | `ChevronRight` is imported in Sidebar but never rendered — dead import | Low |

---

### 3.3 Dashboard & StatCards

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| D-01 | Dashboard renders 4 stat cards | Open Dashboard | Cards: Total Initiatives, Active Projects, Needs Review, Realized ROI | High |
| D-02 | User name badge displays | Open as Alex | Badge shows "ALEX SUBMITTER" | Medium |
| D-03 | "Launch New Initiative" navigates to form | Click the button | View switches to `'submit'` | High |
| D-04 | ROI card formats with $ and comma | ROI = 45000 | Displays "$45,000" | Medium |
| D-05 | Needs Review card highlights when > 0 | As Sarah with pending items | Card has `ring-2 ring-primary-500/50` | Medium |
| D-06 | Needs Review card normal when 0 | As Alex | No ring highlight | Medium |
| **D-07** | **EDGE: Trend percentages are hardcoded** | Inspect StatCards | "+12%", "+5%", "+28%" are static strings, not computed from data | Medium |
| **D-08** | **EDGE: ROI = 0 display** | No closed projects for user | Displays "$0" | Low |
| **D-09** | **EDGE: trend.startsWith('+') with neutral trend** | Pass `trend="0%"` | Falls into red styling (not starting with '+') — may be misleading | Low |

---

### 3.4 ProjectTable

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| T-01 | All relevant projects displayed | Open as Alex | 3 rows in table | High |
| T-02 | Search filters by title | Type "Invoice" | Only "Automated Invoice Processing" shown | High |
| T-03 | Search filters by process | Type "Sales" | Only "Q3 Sales Training Program" shown | High |
| T-04 | Search is case-insensitive | Type "legacy" | "Legacy System Upgrade" shown | Medium |
| T-05 | Clear search restores all rows | Clear input | All projects return | Medium |
| T-06 | Empty state shows when no results | Search "zzzzz" | "No records found" empty state with icon | High |
| T-07 | Click row selects project | Click any row | `onSelectProject` called, view → details | High |
| T-08 | "View Record" button visible per row | Inspect each row | Button with ChevronRight icon | Medium |
| T-09 | Estimated value formatted | Project with 50000 | Displays "$50,000" | Medium |
| **T-10** | **EDGE: Search with special regex chars** | Type `(` or `*` or `[` | Should not crash (uses `.includes()`, not regex) — safe | Medium |
| **T-11** | **EDGE: Project with estimatedBenefit = 0** | Add project with $0 benefit | Displays "$0" | Low |
| **T-12** | **EDGE: Very long project title** | Submit 200+ char title | Title should truncate or wrap gracefully | Medium |
| **T-13** | **EDGE: Filter/Download buttons are non-functional** | Click Filter or Download icons | No action occurs — buttons have no `onClick` | Low |
| **T-14** | **EDGE: Search does not filter by type, methodology, status** | Search "Lean" or "Active" | No results found — search only covers `title` and `process` | Medium |

---

### 3.5 SubmissionForm

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| F-01 | Form initializes with user data | Open form as Alex | Submitter = "Alex Submitter" (disabled), managerId pre-filled to `u2` | High |
| F-02 | All dropdowns populated | Check Process, Category, Methodology | All options from constants file appear | High |
| F-03 | Manager dropdown excludes Employees | Check Reporting Manager options | Only Sarah Manager and David Business Head shown | High |
| F-04 | Summary character counter works | Type 100 chars | Counter shows "100/500" | Medium |
| F-05 | Summary counter turns red at 450+ | Type 451 chars | Counter text becomes red | Medium |
| F-06 | Summary enforces 500 char maxLength | Type 501 chars | Input truncated at 500 | Medium |
| F-07 | "Save Draft" creates draft project | Fill form, click Save Draft | Project added with status "Draft" | High |
| F-08 | "Submit for Baseline" creates pending | Fill form, click Submit | Project added with status "Pending Approval" | High |
| F-09 | "Return to Dashboard" navigates back | Click back button | View → 'dashboard' | Medium |
| F-10 | Date picker allows date selection | Click target date field | Browser date picker opens | Medium |
| **F-11** | **EDGE: Submit completely empty form** | Click "Submit for Baseline" with all fields empty | Project created with empty title, empty summary, etc. — **no validation exists** | **Critical** |
| **F-12** | **EDGE: Negative estimated benefit** | Enter `-50000` | Stored as `-50000` — no validation | High |
| **F-13** | **EDGE: Extremely large estimated benefit** | Enter `999999999999999` | `parseFloat` handles it, but display may overflow card | Medium |
| **F-14** | **EDGE: HTML/script injection in title** | Enter `<script>alert('xss')</script>` in title | React escapes by default — should render as text, not execute | Medium |
| **F-15** | **EDGE: Form doesn't persist on navigation** | Start filling form → go to Dashboard → return | Form state resets completely (component unmounts) | Medium |
| **F-16** | **EDGE: Submit with managerId cleared** | Clear the manager select back to "Select Option" | Project created with `managerId: ""` — no validation | High |
| **F-17** | **EDGE: docLink field missing from form** | Inspect form | The `docLink` field exists in `formData` state but **no input field renders for it** — always submitted as `""` | Medium |

---

### 3.6 ProjectDetails

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| PD-01 | Renders project title & metadata | Open p1 details | Title "Automated Invoice Processing", submitter "Alex Submitter" | High |
| PD-02 | StatusBadge renders correct status | Open p1 (Active) | Green "Active" badge | High |
| PD-03 | Detail grid shows Process, Category, etc. | Open p1 | Finance, Cost Reduction, Lean, 2024-12-31 | High |
| PD-04 | Estimated benefit formatted | p1, benefit = 50000 | "$50,000" in dark card | Medium |
| PD-05 | "Read-Only Record" shown for locked statuses | Open p1 (Active) | Lock icon + "Read-Only Record" label | Medium |
| PD-06 | "Read-Only Record" hidden for Draft/Pending | Open p2 (Pending) | No lock label | Medium |
| PD-07 | Doc link shown when available | Open p1 (has docLink) | "Project Hub" link visible | Medium |
| PD-08 | Doc link hidden when empty | Open p2 (no docLink) | No footer section rendered | Medium |
| PD-09 | Audit trail renders history entries | Open p1 | 1 history entry: "Approved" by Sarah | High |
| PD-10 | Empty audit trail shows placeholder | Open p2 (empty history) | "Awaiting Governance Actions" placeholder | Medium |
| PD-11 | Governance log icons differ by action | Open p3 (Approved + Closed entries) | Emerald dot for Approved, Primary dot for Closed | Low |

#### Manager Review Actions (as Sarah on p2)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| PD-20 | Review panel shows for manager on pending | Log as Sarah, open p2 | Amber "Review Decision" panel visible | High |
| PD-21 | Review panel hidden for non-manager | Log as Alex, open p2 | No review panel | High |
| PD-22 | Approve with comment | Type comment, click Approve | p2.status = Active, history has comment | High |
| PD-23 | Approve without comment | Leave blank, click Approve | Default comment: "Baseline Approved" | Medium |
| PD-24 | Rework sends project back | Click Rework | p2.status = "Pending Rework" | High |
| PD-25 | Decline rejects project | Click Decline | p2.status = "Declined" | High |
| **PD-26** | **EDGE: Rework/Decline without comment** | Click Rework with empty textarea | `comment = undefined` stored in history — **note field will be undefined, not null** | Medium |
| **PD-27** | **EDGE: Review panel on already-approved project** | Approve p2, then navigate back to p2 | Panel should be hidden (status is no longer Pending) | High |

#### Closure Actions (as Alex on p1)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| PD-30 | Closure panel shown for owner of Active project | Log as Alex, open p1 | Blue "Record Results" panel visible | High |
| PD-31 | Closure panel hidden for non-owner | Log as Sarah, open p1 | No closure panel | High |
| PD-32 | "Finalize Record" disabled when fields empty | Open closure panel | Button has `disabled` state, 50% opacity | Medium |
| PD-33 | "Finalize Record" enabled when both filled | Enter investment + ROI | Button enabled | Medium |
| PD-34 | Close project stores financials | Enter 10000 / 55000, click Finalize | p1 closed, financials stored | High |
| **PD-35** | **EDGE: Enter 0 for investment & ROI** | Enter `0` and `0` | `!closureData.investment` → `!"0"` → `false` — button stays enabled. `parseFloat("0") = 0`. Works but edge case. | Medium |
| **PD-36** | **EDGE: Enter negative investment** | Enter `-5000` for investment | Accepted — no validation for negative values | Medium |
| **PD-37** | **EDGE: Enter non-numeric text in number field** | Type "abc" in investment | HTML `type="number"` prevents this in most browsers | Low |
| **PD-38** | **EDGE: Realized Value section on Active vs Closed** | Check Active project | Shows "Awaiting Execution Completion" animation | Medium |
| **PD-39** | **EDGE: Realized Value section on Closed project** | Check p3 | Shows Investment $12,000 + ROI $45,000 in emerald styling | Medium |

#### Null/Undefined Safety

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| **PD-50** | **EDGE: ProjectDetails with null project** | Set `selectedProject = null` | Returns `null` (early return line 26) — no crash | High |
| **PD-51** | **EDGE: Project with missing history array** | Create project without `history` property | `p.history.length` → **TypeError crash** | **Critical** |
| **PD-52** | **EDGE: submitterId not in MOCK_USERS** | Project with `submitterId = 'unknown'` | `MOCK_USERS.find(...)?.name` → `undefined` — displays nothing | Medium |

---

### 3.7 Common Components

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| C-01 | StatusBadge renders all 6 statuses | Pass each status string | Correct color scheme for each | High |
| C-02 | StatCard renders title, value, icon | Pass all props | All rendered correctly | High |
| C-03 | StatCard highlight ring when flagged | `highlight={true}` | Ring style applied | Medium |
| C-04 | NavItem active state | `active={true}` | Primary bg, white text | Medium |
| C-05 | NavItem count badge | `count={5}` | Badge shows "5" | Medium |
| C-06 | NavItem no badge when count = 0 | `count={0}` | No badge rendered | Medium |
| C-07 | DetailItem fallback for missing value | `value={undefined}` | Displays "Not Specified" | Medium |
| C-08 | DetailItem with icon | Pass `icon={Layers}` | Icon renders at 10px | Low |
| **C-09** | **EDGE: StatusBadge with unknown status** | `status="Unknown"` | `styles[status]` = `undefined` → renders with no color classes, just base styles | Medium |
| **C-10** | **EDGE: NavItem with negative count** | `count={-1}` | `-1 > 0` is false → badge hidden (correct) | Low |
| **C-11** | **EDGE: StatCard with trend not starting with + or -** | `trend="N/A"` | Falls into red styling — misleading | Low |

---

## 4. End-to-End Workflow Tests

### Workflow 1: Complete Submission → Approval → Closure Lifecycle

| Step | Action | User | Expected |
|---|---|---|---|
| 1 | Open Dashboard | Alex (u1) | Dashboard with 3 projects visible |
| 2 | Click "Launch New Initiative" | Alex | Form opens |
| 3 | Fill all fields and click "Submit for Baseline" | Alex | Redirected to dashboard, new project appears with "Pending Approval" |
| 4 | Switch to Sarah (u2) | — | Sidebar updates, "Needs Review" badge increments |
| 5 | Click "Review Queue" | Sarah | Filtered list shows pending projects |
| 6 | Click on the new project | Sarah | ProjectDetails with review panel |
| 7 | Type comment, click "Approve Baseline" | Sarah | Redirected to dashboard |
| 8 | Switch back to Alex (u1) | — | — |
| 9 | Open the now-Active project | Alex | Closure panel visible |
| 10 | Enter investment + ROI, click "Finalize Record" | Alex | Project status = Closed, ROI reflected in stat card |

### Workflow 2: Submission → Rework → Resubmit

| Step | Action | User | Expected |
|---|---|---|---|
| 1 | Submit new initiative | Alex | Status = Pending Approval |
| 2 | Switch to Sarah, open project | Sarah | Review panel shown |
| 3 | Click "Rework" with comment | Sarah | Status = "Pending Rework" |
| 4 | Switch to Alex, open project | Alex | Status shows "Pending Rework" |
| 5 | **⚠️ No mechanism exists to resubmit** | Alex | **BUG: There is no UI to edit and resubmit a reworked project** |

### Workflow 3: Submission → Decline

| Step | Action | User | Expected |
|---|---|---|---|
| 1 | Submit new initiative | Alex | Status = Pending Approval |
| 2 | Switch to Sarah, click Decline | Sarah | Status = Declined |
| 3 | Open declined project | Any | "Read-Only Record" lock shown, no action panels |

### Workflow 4: Role Cycling & Data Isolation

| Step | Action | Expected |
|---|---|---|
| 1 | Open as Alex (u1) | Sees projects where submitterId=u1 or managerId=u1 |
| 2 | Switch to Sarah (u2) | Sees projects where submitterId=u2 or managerId=u2 |
| 3 | Switch to David (u3) | Sees ALL projects (Admin role) |
| 4 | Switch again | Cycles back to Alex |

---

## 5. Edge Cases & Boundary Tests

### Data Integrity

| ID | Edge Case | Expected | Severity |
|---|---|---|---|
| E-01 | Submit form with every field empty | Project created — **no client-side validation** | 🔴 Critical |
| E-02 | `estimatedBenefit = ""` stored | `parseFloat("") || 0` → stored as `0` | Medium |
| E-03 | `estimatedBenefit = "0"` | `parseFloat("0") = 0`, but `0 || 0` → still `0` | Low |
| E-04 | Duplicate project IDs possible? | Uses `Date.now()` → extremely unlikely but not UUID | Low |
| E-05 | State lost on page refresh | All data in React state — full reset to seed data | 🟡 Expected (no backend) |

### Navigation & Routing

| ID | Edge Case | Expected | Severity |
|---|---|---|---|
| E-10 | Direct URL routing (e.g., `/details`) | Not supported — single-page with state-based views | 🟡 Expected |
| E-11 | Browser back button | Does nothing meaningful — no history API | Medium |
| E-12 | `selectedProject` stale after status update | Approve p2, then navigate → details view still shows old `selectedProject` object | 🔴 Bug |

### Display & Formatting

| ID | Edge Case | Expected | Severity |
|---|---|---|---|
| E-20 | `estimatedBenefit = NaN` from bad data | `$NaN` shown in detail card | 🔴 Bug |
| E-21 | `actualInvestment = null` on Closed project | `$${null?.toLocaleString()}` → `"$undefined"` | 🔴 Bug potential |
| E-22 | Extremely long summary (500 chars) | Should render in full in the detail view | Low |
| E-23 | Empty summary | Empty white box rendered | Low |

### User/Role Edge Cases

| ID | Edge Case | Expected | Severity |
|---|---|---|---|
| E-30 | User with `managerId = null` (David) | Form submitter field shows "David Business Head", manager dropdown defaults to `""` | Medium |
| E-31 | David submits project with no manager selected | `managerId = ""` — project has no reviewer, sits in limbo | 🔴 Critical |
| E-32 | Manager reviews own submission | Sarah submits project (managerId points to David), David can review | Expected |
| E-33 | Admin has no explicit review capability | David (Admin) can see all projects but has no review panel unless he's the `managerId` | 🟡 Design gap |

---

## 6. Bugs & Risks Identified During Review

| # | Issue | File | Line(s) | Severity | Description |
|---|---|---|---|---|---|
| B-01 | **No form validation** | `SubmissionForm.jsx` | 173, 182 | 🔴 Critical | Users can submit completely empty projects |
| B-02 | **No resubmit flow for Rework** | `App.jsx`, `ProjectDetails.jsx` | — | 🔴 Critical | Once a project is sent back for rework, there's no UI to edit and resubmit it |
| B-03 | **Stale selectedProject** | `App.jsx` | 36-38 | 🟡 Medium | After approving/closing, if user navigates to same project, the details view shows stale pre-update data |
| B-04 | **docLink field not exposed in form** | `SubmissionForm.jsx` | 17-27 | 🟡 Medium | `docLink` is in form state but no input field renders for it |
| B-05 | **Hardcoded trend percentages** | `Dashboard.jsx` | 31, 37, 49 | 🟡 Medium | "+12%", "+5%", "+28%" are static, not computed from data |
| B-06 | **Unused import: ChevronRight** | `Sidebar.jsx` | 11 | 🟢 Low | Imported but never used — dead code |
| B-07 | **Closure without re-review** | `ProjectDetails.jsx` | 244 | 🟡 Medium | Project owner can close directly without manager sign-off |
| B-08 | **No negative value protection** | `useProjectData.js` | 64-65 | 🟡 Medium | Closure financials accept negative numbers |
| B-09 | **Admin can't review** | `ProjectDetails.jsx` | 159 | 🟢 Low | Admin role has no special governance capabilities — can only view |
| B-10 | **No data persistence** | `useProjectData.js` | 7 | 🟡 Expected | All state is lost on refresh — acceptable for MVP |

---

## 7. Non-Functional Tests

### Responsiveness

| ID | Screen Size | Element | Expected |
|---|---|---|---|
| R-01 | ≥1280px (xl) | Sidebar | Visible, fixed left |
| R-02 | <1280px | Sidebar | Hidden, mobile header shown |
| R-03 | <768px (mobile) | StatCards | Stack to single column |
| R-04 | <768px | ProjectTable | Horizontally scrollable |
| R-05 | <768px | SubmissionForm | Single-column layout |
| R-06 | <768px | ProjectDetails grid | Stacks to single column |

### Performance

| ID | Test | Expected |
|---|---|---|
| P-01 | Initial page load | <2s on standard connection |
| P-02 | View switch latency | Instant (<100ms) — all client-side |
| P-03 | 100+ projects in table | No significant lag; table should scroll smoothly |
| P-04 | Search responsiveness | Filter updates on each keystroke without delay |

### Accessibility (Basic)

| ID | Test | Expected |
|---|---|---|
| A-01 | Keyboard navigation | Tab through sidebar, form fields | 
| A-02 | Form labels associated with inputs | Labels use `htmlFor` or wrapping — **currently labels don't use `htmlFor`** |
| A-03 | Color contrast on badge text | All badge variants meet WCAG AA |
| A-04 | Screen reader nav | Semantic HTML used (nav, header, main, aside, table) — ✅ |

---

> **Recommendation:** Start by addressing **B-01 (form validation)** and **B-02 (rework resubmit flow)** as they are critical functional gaps. Then address **B-03 (stale state)** before any production deployment.
