# Stride — User Guide & Governance Manual

Welcome to **Stride**, your platform for documenting, submitting, and approving project initiatives. This guide outlines the core workflows for Employees, Managers, and Admins.

---

## 1. Getting Started
To access the platform during the demo:
1. Open the repository in **GitHub Codespaces**.
2. Run `npm install` and `npm run dev` in the terminal.
3. Use the **Switch Session** button in the bottom-left corner to cycle through different user roles (**Submitter**, **Manager**, **Admin**).

---

## 2. User Roles & Permissions

### 👤 Employee (Submitter)
- **Dashboard**: View your own submitted initiatives and their current status.
*   **New Submission**: Use the "Launch New Initiative" button to draft a project baseline.
*   **Rework**: If an initiative is sent back for rework, go to the "Closure" or "Project Details" view to edit and resubmit.
*   **Finalization**: Once a project is marked **Active**, you are responsible for recording the final investment and realized ROI to close the record.

### 👥 Manager (Reviewer)
*   **Review Queue**: View all initiatives submitted by your direct reports.
*   **Decision Making**: For each pending initiative, you can:
    *   **Approve**: Validates the project scope and sets it to "Active".
    *   **Rework**: Returns the project to the owner for adjustments.
    *   **Decline**: Rejects the initiative (read-only final status).

### 🔑 Admin (Portfolio Lead)
*   **Portfolio Dashboard**: View all projects across all departments and owners.
*   **Governance Audit**: Monitor the end-to-end lifecycle of every initiative for reporting.

---

## 3. The Initiative Lifecycle

| Status | Meaning | Action Required |
| :--- | :--- | :--- |
| **Draft** | Saved but not yet submitted. | Owner to click "Submit for Baseline". |
| **Pending Approval** | Awaiting Manager review. | Manager to Approve/Rework/Decline. |
| **Active** | Approved and in execution phase. | Owner to track results. |
| **Pending Rework** | Submission requires changes. | Owner to "Edit & Resubmit". |
| **Closed** | Execution finished, ROI recorded. | None (Completed). |

---

## 4. Key Features for the Demo

### ✨ Strategic Tagging
Every initiative is categorized by **Process** (e.g., IT, Finance), **Category** (e.g., Cost Reduction), and **Methodology** (e.g., Lean, Agile). This ensures data-driven portfolio management.

### 💰 ROI Tracking
Stride differentiates between **Estimated Benefit** (at submission) and **Realized ROI** (at closure). The dashboard summary cards automatically aggregate "Realized ROI" from all closed projects.

### 📜 Digital Audit Trail
Every decision is logged in the "System Governance Log" at the bottom of the Project Details page, providing a transparent history of approvals and rework notes.

---

## 5. Troubleshooting in Codespaces
*   **Node Version**: Ensure you are using Node 22 (`nvm use 22`).
*   **Port Visibility**: If the app doesn't open, go to the **Ports** tab in Codespaces and ensure port `5173` is set to "Public".
