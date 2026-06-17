// Shared helpers for the E2E suite.
export const API = 'http://localhost:5000/api';

/** A unique user per test run so register/login never collide. */
export function uniqueUser() {
  const n = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return { username: `e2e_${n}`, email: `e2e_${n}@test.com`, password: 'secret123' };
}

/**
 * Register + login a user through the API and inject the resulting token into
 * localStorage (via addInitScript), so the React app boots already
 * authenticated on the next navigation. Returns the login response body.
 */
export async function registerAndLogin(page, request, user) {
  await request.post(`${API}/auth/register`, { data: user });
  const resp = await request.post(`${API}/auth/login`, {
    data: { username: user.username, password: user.password },
  });
  const body = await resp.json();
  await page.addInitScript(({ token, u }) => {
    localStorage.setItem('wastedhours_token', token);
    localStorage.setItem('wastedhours_user', JSON.stringify(u));
  }, { token: body.token, u: body.user });
  return body;
}

/** Id of the first game in the catalog (the DB is pre-populated). */
export async function firstGameId(request) {
  const resp = await request.get(`${API}/games?limit=1`);
  const body = await resp.json();
  return body.data[0].id;
}

/** Best-effort cleanup so test users don't accumulate in the database. */
export async function deleteAccount(request, token) {
  if (token) {
    await request.delete(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
