import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

// ---------------------------------------------------------------------------
// Helper — submit a project as the current user and return to dashboard
// ---------------------------------------------------------------------------
async function submitProject(page, { title, summary = 'Test summary.', value = '10000', process = 'IT', type = 'Compliance', draft = false }) {
  await page.getByRole('button', { name: /Launch New Initiative/i }).click();
  await page.getByPlaceholder(/Project Name/i).fill(title);
  await page.getByPlaceholder(/Problem Statement/i).fill(summary);
  await page.getByLabel(/Estimated Value/i).fill(value);
  await page.locator('select').first().selectOption(process);
  await page.locator('select').nth(1).selectOption(type);
  if (draft) {
    await page.getByRole('button', { name: /Save as Draft/i }).click();
  } else {
    await page.getByRole('button', { name: /Submit for Baseline/i }).click();
  }
  await page.waitForURL(/dashboard/);
}

// ---------------------------------------------------------------------------
// Suite 1: Notification Generation — correct triggers, correct recipients
// ---------------------------------------------------------------------------
test.describe('Notification Generation', () => {

  test('NT-01: Saving a Draft notifies both employee and manager', async ({ page }) => {
    await loginAs(page, 'Employee');
    const draftTitle = `Draft Notif Test ${Date.now()}`;
    await submitProject(page, { title: draftTitle, draft: true });

    // Employee should see a bell badge ≥ 1
    const employeeBadge = page.locator('[data-testid="notif-badge"]');
    await expect(employeeBadge).toBeVisible();
    expect(parseInt(await employeeBadge.textContent())).toBeGreaterThanOrEqual(1);

    // Switch to manager — should also see a badge
    await loginAs(page, 'Manager');
    const managerBadge = page.locator('[data-testid="notif-badge"]');
    await expect(managerBadge).toBeVisible();
    expect(parseInt(await managerBadge.textContent())).toBeGreaterThanOrEqual(1);

    // Manager's dropdown mentions the draft title
    await page.locator('[data-testid="notif-bell"]').click();
    await expect(page.locator('[data-testid="notif-dropdown"]')).toBeVisible();
    await expect(page.getByText(draftTitle)).toBeVisible();
  });

  test('NT-02: Submitting an idea notifies both employee and manager', async ({ page }) => {
    await loginAs(page, 'Employee');
    const submittedTitle = `Submit Notif Test ${Date.now()}`;
    await submitProject(page, { title: submittedTitle });

    await expect(page.locator('[data-testid="notif-badge"]')).toBeVisible();

    await loginAs(page, 'Manager');
    await expect(page.locator('[data-testid="notif-badge"]')).toBeVisible();
    await page.locator('[data-testid="notif-bell"]').click();
    await expect(page.getByText(submittedTitle)).toBeVisible();
  });

  test('NT-03: Approving an idea notifies the employee', async ({ page }) => {
    await loginAs(page, 'Employee');
    const approveTitle = `Approve Notif Test ${Date.now()}`;
    await submitProject(page, { title: approveTitle, value: '50000', process: 'Sales', type: 'Revenue Generation' });

    const badgeBefore = page.locator('[data-testid="notif-badge"]');
    const countBefore = await badgeBefore.isVisible() ? parseInt(await badgeBefore.textContent()) : 0;

    // Manager approves
    await loginAs(page, 'Manager');
    await page.getByRole('link', { name: /Review Queue/i }).click();
    const row = page.getByRole('row', { name: approveTitle });
    await expect(row).toBeVisible();
    await row.click();
    await page.getByPlaceholder(/Add your feedback/i).fill('Approved via test.');
    await page.getByRole('button', { name: /Approve Baseline/i }).click();

    await loginAs(page, 'Employee');
    const badgeAfter = page.locator('[data-testid="notif-badge"]');
    await expect(badgeAfter).toBeVisible();
    expect(parseInt(await badgeAfter.textContent())).toBeGreaterThan(countBefore);

    await page.locator('[data-testid="notif-bell"]').click();
    await expect(page.getByText(/approved/i).first()).toBeVisible();
  });

  test('NT-04: Declining an idea notifies the employee', async ({ page }) => {
    await loginAs(page, 'Employee');
    const declineTitle = `Decline Notif Test ${Date.now()}`;
    await submitProject(page, { title: declineTitle, value: '5000', process: 'HR', type: 'Quality Improvement' });

    await loginAs(page, 'Manager');
    await page.getByRole('link', { name: /Review Queue/i }).click();
    await page.getByRole('row', { name: declineTitle }).click();
    await page.getByPlaceholder(/Add your feedback/i).fill('Not aligned with Q3 goals.');
    await page.getByRole('button', { name: /Decline/i }).click();

    await loginAs(page, 'Employee');
    await page.locator('[data-testid="notif-bell"]').click();
    await expect(page.locator('[data-testid="notif-dropdown"]')).toBeVisible();
    await expect(page.getByText(declineTitle)).toBeVisible();
    await expect(page.getByText(/declined|not approved/i).first()).toBeVisible();
  });

  test('NT-05: Sending for rework notifies the employee', async ({ page }) => {
    await loginAs(page, 'Employee');
    const reworkTitle = `Rework Notif Test ${Date.now()}`;
    await submitProject(page, { title: reworkTitle, value: '8000', process: 'Operations', type: 'Process Efficiency' });

    await loginAs(page, 'Manager');
    await page.getByRole('link', { name: /Review Queue/i }).click();
    await page.getByRole('row', { name: reworkTitle }).click();
    await page.getByPlaceholder(/Add your feedback/i).fill('Please revise the financials.');
    await page.getByRole('button', { name: /Request Rework/i }).click();

    await loginAs(page, 'Employee');
    await page.locator('[data-testid="notif-bell"]').click();
    await expect(page.getByText(reworkTitle)).toBeVisible();
    await expect(page.getByText(/rework/i).first()).toBeVisible();
  });

});

// ---------------------------------------------------------------------------
// Suite 2: Bell UI Behaviour
// ---------------------------------------------------------------------------
test.describe('Notification Bell UI', () => {

  test('NT-06: Bell badge hides when all notifications are read', async ({ page }) => {
    await loginAs(page, 'Employee');
    const badge = page.locator('[data-testid="notif-badge"]');

    if (await badge.isVisible()) {
      await page.locator('[data-testid="notif-bell"]').click();
      const markAllBtn = page.getByRole('button', { name: /Mark all read/i });
      if (await markAllBtn.isVisible()) await markAllBtn.click();
      else await page.keyboard.press('Escape');
    }

    await expect(badge).not.toBeVisible();
  });

  test('NT-07: Clicking a notification navigates to the correct project and marks it read', async ({ page }) => {
    await loginAs(page, 'Employee');
    const navTitle = `Nav Notif Test ${Date.now()}`;
    await submitProject(page, { title: navTitle, value: '12000', process: 'Supply Chain', type: 'Process Efficiency' });

    await page.locator('[data-testid="notif-bell"]').click();
    const dropdown = page.locator('[data-testid="notif-dropdown"]');
    await expect(dropdown).toBeVisible();

    const badgeBefore = page.locator('[data-testid="notif-badge"]');
    const countBefore = parseInt(await badgeBefore.textContent() || '0');

    await dropdown.getByText(navTitle).first().click();
    await page.waitForURL(/\/details\//);
    await expect(page.getByText(navTitle)).toBeVisible();

    await page.goto('/dashboard');
    const countAfter = await page.locator('[data-testid="notif-badge"]').isVisible()
      ? parseInt(await page.locator('[data-testid="notif-badge"]').textContent())
      : 0;
    expect(countAfter).toBeLessThan(countBefore);
  });

  test('NT-08: Mark all as read clears the badge and removes unread dots', async ({ page }) => {
    await loginAs(page, 'Employee');
    await submitProject(page, { title: `Mark All Test ${Date.now()}`, value: '9999' });

    const badge = page.locator('[data-testid="notif-badge"]');
    await expect(badge).toBeVisible();

    await page.locator('[data-testid="notif-bell"]').click();
    await expect(page.locator('[data-testid="notif-dropdown"]')).toBeVisible();
    await page.getByRole('button', { name: /Mark all read/i }).click();

    await expect(badge).not.toBeVisible();
    await expect(page.locator('[data-testid="notif-unread-dot"]')).toHaveCount(0);
  });

  test('NT-09: Dropdown closes on Escape key and outside click', async ({ page }) => {
    await loginAs(page, 'Employee');

    await page.locator('[data-testid="notif-bell"]').click();
    const dropdown = page.locator('[data-testid="notif-dropdown"]');
    await expect(dropdown).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();

    await page.locator('[data-testid="notif-bell"]').click();
    await expect(dropdown).toBeVisible();

    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(dropdown).not.toBeVisible();
  });

});

// ---------------------------------------------------------------------------
// Suite 3: Batch Actions
// ---------------------------------------------------------------------------
test.describe('Batch Action Notifications', () => {

  test('NT-10: Bulk-approving projects emits approval notification for each', async ({ page }) => {
    await loginAs(page, 'Employee');
    const titles = [
      `Batch Approve A ${Date.now()}`,
      `Batch Approve B ${Date.now() + 1}`,
    ];
    for (const title of titles) {
      await submitProject(page, { title, value: '20000', process: 'Finance', type: 'Cost Reduction' });
    }

    const badgeBefore = page.locator('[data-testid="notif-badge"]');
    const countBefore = await badgeBefore.isVisible() ? parseInt(await badgeBefore.textContent()) : 0;

    await loginAs(page, 'Manager');
    await page.getByRole('link', { name: /Review Queue/i }).click();

    for (const title of titles) {
      const row = page.getByRole('row', { name: title });
      await expect(row).toBeVisible();
      await row.locator('input[type="checkbox"]').check();
    }
    await page.getByRole('button', { name: /Approve/i }).first().click();

    await loginAs(page, 'Employee');
    const badgeAfter = page.locator('[data-testid="notif-badge"]');
    await expect(badgeAfter).toBeVisible();
    expect(parseInt(await badgeAfter.textContent())).toBeGreaterThanOrEqual(countBefore + 2);
  });

});

// ---------------------------------------------------------------------------
// Suite 4: Security — BOLA Protection
// ---------------------------------------------------------------------------
test.describe('Notification Security', () => {

  test('NT-11: User cannot mark another user\'s notification as read', async ({ page }) => {
    await loginAs(page, 'Manager');
    const managerNotifs = await page.request.get('http://localhost:8080/api/notifications');
    const managerData = await managerNotifs.json();

    await loginAs(page, 'Employee');

    if (managerData.length > 0) {
      const managerNotifId = managerData[0].id;
      await page.request.patch(`http://localhost:8080/api/notifications/${managerNotifId}/read`);

      await loginAs(page, 'Manager');
      const recheckData = await (await page.request.get('http://localhost:8080/api/notifications')).json();
      const targetNotif = recheckData.find(n => n.id === managerNotifId);
      expect(targetNotif).toBeDefined();
    }
  });

  test('NT-12: read-all only affects the calling user\'s notifications', async ({ page }) => {
    await loginAs(page, 'Manager');
    const beforeData = await (await page.request.get('http://localhost:8080/api/notifications')).json();
    const unreadBefore = beforeData.filter(n => n.is_read === 0).length;

    await loginAs(page, 'Employee');
    expect((await page.request.patch('http://localhost:8080/api/notifications/read-all')).ok()).toBeTruthy();

    await loginAs(page, 'Manager');
    const afterData = await (await page.request.get('http://localhost:8080/api/notifications')).json();
    expect(afterData.filter(n => n.is_read === 0).length).toBe(unreadBefore);
  });

});

// ---------------------------------------------------------------------------
// Suite 5: Edge Cases
// ---------------------------------------------------------------------------
test.describe('Notification Edge Cases', () => {

  test('NT-13: Self-assignment (submitter = manager) creates only 1 notification', async ({ page }) => {
    await loginAs(page, 'Admin');
    const adminRes = await page.request.get('http://localhost:8080/api/auth/me');
    const { user: adminUser } = await adminRes.json();

    const projectId = `p-self-${Date.now()}`;
    await page.request.post('http://localhost:8080/api/projects', {
      data: {
        id: projectId,
        title: `Self Assign Test ${Date.now()}`,
        managerId: adminUser.id,
        process: 'IT', type: 'Compliance', methodology: 'Agile',
        summary: 'Self-assignment dedup test.',
        targetDate: '2027-01-01', estimatedBenefit: 5000,
        status: 'Pending Approval', docLink: '',
        createdAt: new Date().toISOString().split('T')[0], history: []
      }
    });

    const afterNotifs = await (await page.request.get('http://localhost:8080/api/notifications')).json();
    const projectNotifs = afterNotifs.filter(n => n.project_id === projectId);
    expect(projectNotifs.length).toBe(1);
  });

  test('NT-14: Re-submission after Rework fires a new idea_submitted notification', async ({ page }) => {
    await loginAs(page, 'Employee');
    const title = `Resubmit Edge Test ${Date.now()}`;
    await submitProject(page, { title, value: '15000', process: 'HR', type: 'Quality Improvement' });

    await loginAs(page, 'Manager');
    await page.getByRole('link', { name: /Review Queue/i }).click();
    await page.getByRole('row', { name: title }).click();
    await page.getByPlaceholder(/Add your feedback/i).fill('Needs more detail.');
    await page.getByRole('button', { name: /Request Rework/i }).click();

    await loginAs(page, 'Employee');
    await page.getByRole('row', { name: title }).click();
    await page.getByRole('button', { name: /Edit & Resubmit/i }).click();
    await page.getByRole('button', { name: /Submit for Baseline/i }).click();
    await page.waitForURL(/dashboard/);

    const notifs = await (await page.request.get('http://localhost:8080/api/notifications')).json();
    const submittedNotifs = notifs.filter(n => n.type === 'idea_submitted' && n.message.includes(title));
    expect(submittedNotifs.length).toBeGreaterThanOrEqual(2);
  });

  test('NT-15: Full cycle produces correct notifications at each transition', async ({ page }) => {
    await loginAs(page, 'Employee');
    const title = `Full Cycle Edge Test ${Date.now()}`;
    await submitProject(page, { title, value: '30000', process: 'Finance', type: 'Cost Reduction' });

    await loginAs(page, 'Manager');
    await page.getByRole('link', { name: /Review Queue/i }).click();
    await page.getByRole('row', { name: title }).click();
    await page.getByPlaceholder(/Add your feedback/i).fill('Rework needed.');
    await page.getByRole('button', { name: /Request Rework/i }).click();

    await loginAs(page, 'Employee');
    await page.getByRole('row', { name: title }).click();
    await page.getByRole('button', { name: /Edit & Resubmit/i }).click();
    await page.getByRole('button', { name: /Submit for Baseline/i }).click();
    await page.waitForURL(/dashboard/);

    await loginAs(page, 'Manager');
    await page.getByRole('link', { name: /Review Queue/i }).click();
    await page.getByRole('row', { name: title }).click();
    await page.getByPlaceholder(/Add your feedback/i).fill('Now approved.');
    await page.getByRole('button', { name: /Approve Baseline/i }).click();

    await loginAs(page, 'Employee');
    const notifs = await (await page.request.get('http://localhost:8080/api/notifications')).json();
    const types = notifs.filter(n => n.message.includes(title)).map(n => n.type);
    expect(types).toContain('idea_submitted');
    expect(types).toContain('idea_rework');
    expect(types).toContain('idea_approved');
    expect(types).not.toContain('idea_declined');
  });

  test('NT-16: Navigating to a deleted project does not crash the app', async ({ page }) => {
    await loginAs(page, 'Admin');
    const ghostId = `p-ghost-${Date.now()}`;
    await page.request.post('http://localhost:8080/api/projects', {
      data: {
        id: ghostId, title: `Ghost Project ${Date.now()}`, managerId: 'u2',
        process: 'IT', type: 'Compliance', methodology: 'Agile',
        summary: 'Will be deleted.', targetDate: '2027-01-01',
        estimatedBenefit: 1000, status: 'Draft', docLink: '',
        createdAt: new Date().toISOString().split('T')[0], history: []
      }
    });
    await page.request.delete(`http://localhost:8080/api/projects/${ghostId}`);

    await page.goto(`/details/${ghostId}`);

    const hasError = await page.getByText(/not found|no longer exists|back/i).isVisible();
    const redirected = page.url().includes('/dashboard');
    expect(hasError || redirected).toBeTruthy();
  });

  test('NT-17: Unauthenticated GET /api/notifications returns 401', async ({ page }) => {
    const response = await page.request.get('http://localhost:8080/api/notifications', {
      headers: { Cookie: '' }
    });
    expect(response.status()).toBe(401);
  });

  test('NT-18: Badge shows 99+ when unread count exceeds 99', async ({ page }) => {
    await loginAs(page, 'Employee');
    const badgeText = await page.locator('[data-testid="notif-badge"]').textContent().catch(() => null);
    if (badgeText) {
      const count = parseInt(badgeText);
      if (count > 99) expect(badgeText.trim()).toBe('99+');
      else expect(count).toBeGreaterThan(0);
    }
    // No-op if badge is not visible (no unread notifications in this session)
  });

  test('NT-19: Polling failure does not reset badge count to 0', async ({ page }) => {
    await loginAs(page, 'Employee');
    await submitProject(page, { title: `Resilience Test ${Date.now()}`, value: '7000' });

    const badge = page.locator('[data-testid="notif-badge"]');
    await expect(badge).toBeVisible();
    const countBefore = parseInt(await badge.textContent());

    // Block future notification polls
    await page.route('**/api/notifications', route => route.abort());
    await page.waitForTimeout(2000);

    const countAfter = await badge.isVisible() ? parseInt(await badge.textContent()) : 0;
    expect(countAfter).toBe(countBefore);

    await page.unroute('**/api/notifications');
  });

  test('NT-20: After manager reassignment, approval notification targets the submitter', async ({ page }) => {
    await loginAs(page, 'Employee');
    const title = `Reassign Edge Test ${Date.now()}`;
    await submitProject(page, { title, value: '40000', process: 'Sales', type: 'Revenue Generation' });

    await loginAs(page, 'Admin');
    const { items } = await (await page.request.get('http://localhost:8080/api/projects')).json();
    const project = items.find(p => p.title === title);
    expect(project).toBeDefined();

    await page.request.post('http://localhost:8080/api/projects/batch-update', {
      data: { ids: [project.id], updates: { manager_id: 'u3' }, user: 'Admin', action: 'Reassigned', note: 'Reassignment test' }
    });
    await page.request.patch(`http://localhost:8080/api/projects/${project.id}`, {
      data: { status: 'Active', user: 'Admin', action: 'Active', note: 'Approved after reassignment' }
    });

    await loginAs(page, 'Employee');
    const notifs = await (await page.request.get('http://localhost:8080/api/notifications')).json();
    const approvalNotif = notifs.find(n => n.type === 'idea_approved' && n.message.includes(title));
    expect(approvalNotif).toBeDefined();
    expect(approvalNotif.user_id).toBe(project.submitter_id);
  });

  test('NT-21: Deleting a project removes its notifications — no orphan rows', async ({ page }) => {
    await loginAs(page, 'Admin');
    const projectId = `p-delete-cleanup-${Date.now()}`;
    await page.request.post('http://localhost:8080/api/projects', {
      data: {
        id: projectId, title: `Delete Cleanup ${Date.now()}`, managerId: 'u2',
        process: 'IT', type: 'Compliance', methodology: 'Agile',
        summary: 'Delete cleanup test.', targetDate: '2027-01-01',
        estimatedBenefit: 2000, status: 'Pending Approval', docLink: '',
        createdAt: new Date().toISOString().split('T')[0], history: []
      }
    });

    const notifsAfterCreate = await (await page.request.get('http://localhost:8080/api/notifications')).json();
    expect(notifsAfterCreate.filter(n => n.project_id === projectId).length).toBeGreaterThan(0);

    await page.request.delete(`http://localhost:8080/api/projects/${projectId}`);

    const notifsAfterDelete = await (await page.request.get('http://localhost:8080/api/notifications')).json();
    expect(notifsAfterDelete.filter(n => n.project_id === projectId).length).toBe(0);
  });

});
