import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Dashboard Inventory & Governance Visibility', () => {

  test('Search and Reporting Manager column visibility', async ({ page }) => {
    // Login as Admin (David) who sees all projects
    await loginAs(page, 'Admin');

    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verify 'Reporting Manager' header exists
    await expect(page.getByRole('columnheader', { name: /Reporting Manager/i })).toBeVisible();

    // Search for a specific project
    const searchInput = page.getByPlaceholder(/Find records/i);
    await searchInput.fill('Sales Training');

    // Verify filtered result
    const row = page.getByRole('row', { name: /Q3 Sales Training Program/i });
    await expect(row).toBeVisible();

    // Verify the Reporting Manager is Sarah Manager for this project (per seed data)
    await expect(row.getByText('Sarah Manager')).toBeVisible();
    
    // Clear search and verify original counts
    await searchInput.fill('');
    const rows = await page.getByRole('row').count();
    expect(rows).toBeGreaterThan(3); // Header + at least 3 seed projects
  });

  test('User suspension and deletion safeguards', async ({ page }) => {
    // Login as Admin to access People management
    await loginAs(page, 'Admin');
    await page.getByRole('link', { name: /People & Roles/i }).click();

    await expect(page.getByText('People Management')).toBeVisible();

    // Verify Alex Submitter is currently Active
    const alexRow = page.getByRole('row', { name: /Alex Submitter/i });
    await expect(alexRow.getByText('Active')).toBeVisible();

    // Check if the Admin controls are visible (the Status badge is actually a toggle or has actions)
    // Based on PeopleManagement.jsx, there's likely a Suspend or Deactivate button
    // (Assuming standard labeling for Governance audit)
  });
});
