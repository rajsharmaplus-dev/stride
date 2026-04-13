/**
 * Helper to simulate role-based logins for Playwright tests
 */
export async function loginAs(page, role = 'Employee') {
  // Hit the backend directly to establish the session cookie
  const response = await page.request.get(`http://localhost:8080/api/test/login?role=${role}`);
  
  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(`Failed to login as ${role} (Status ${response.status()}): ${errorBody}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Failed to login as ${role}: ${JSON.stringify(data)}`);
  }

  // Navigate to the dashboard and wait for the redirect/load to finish
  await page.goto('/');
  // The app should automatically route to /dashboard after a successful session is detected
  await page.waitForURL(url => url.pathname.includes('/dashboard') || url.pathname === '/', { timeout: 10000 });
}
