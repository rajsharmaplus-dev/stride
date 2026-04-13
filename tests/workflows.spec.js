import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('End-to-End Initiative Lifecycle', () => {
  
  test('Submitter creates, Manager approves, and Submitter closes project', async ({ page }) => {
    // 1. Submit as Employee
    await loginAs(page, 'Employee');
    await expect(page.getByText('Portfolio Overview')).toBeVisible();
    
    // Click Launch New Initiative
    await page.getByRole('button', { name: /Launch New Initiative/i }).click();
    await expect(page.getByText('Submitter Details')).toBeVisible();

    const testTitle = `Functional Test Project ${Date.now()}`;
    await page.getByPlaceholder(/Project Name/i).fill(testTitle);
    await page.getByPlaceholder(/Problem Statement/i).fill('This is a test summary for functional verification.');
    await page.getByLabel(/Estimated Value/i).fill('75000');
    
    // Select dropdowns
    await page.locator('select').first().selectOption('Finance'); // Process
    await page.locator('select').nth(1).selectOption('Cost Reduction'); // Category
    
    await page.getByRole('button', { name: /Submit for Baseline/i }).click();

    // Verify it appeared in the dashboard
    await expect(page.getByText(testTitle)).toBeVisible();
    await expect(page.getByText('Pending Approval')).first().toBeVisible();

    // 2. Approve as Manager
    await loginAs(page, 'Manager');
    await page.getByRole('link', { name: /Review Queue/i }).click();
    
    // Find the test project row
    const projectRow = page.getByRole('row', { name: testTitle });
    await expect(projectRow).toBeVisible();
    await projectRow.click();

    // Approve cycle
    await page.getByPlaceholder(/Add your feedback/i).fill('Looks good for testing.');
    await page.getByRole('button', { name: /Approve Baseline/i }).click();

    // Verify status changed on dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await expect(page.getByRole('row', { name: testTitle }).getByText('Active')).toBeVisible();

    // 3. Finalize/Close as Employee
    await loginAs(page, 'Employee');
    const activeRow = page.getByRole('row', { name: testTitle });
    await activeRow.click();

    // Close project
    await page.getByPlaceholder('0').first().fill('15000'); // Investment
    await page.getByPlaceholder('0').nth(1).fill('90000'); // Realized ROI
    await page.getByRole('button', { name: /Finalize Record/i }).click();

    // Final verification on dashboard
    await expect(page.getByRole('row', { name: testTitle }).getByText('Closed')).toBeVisible();
  });
});
