# Stride Development Guidelines

To ensure stability in this development environment, follow these practices:

### 1. Module & Cache Management
- If you see a **Blank Screen** with `Invalid Hook Call`, perform a **Module Reset**:
    1. Rename the affected component (e.g., `App.jsx` -> `AppContext.jsx`).
    2. Add a version query string to the import in `main.jsx`.
    3. Restart the server.

### 2. API Authorization
- The server requires `X-User-Role` and `X-User-Id` for all protected routes.
- **Initial Load Pattern:**
    ```javascript
    // Correct
    const users = await fetchUsers();
    if (users) {
        setIdentity(users[0]);
        const data = await fetchProtectedData(users[0]);
    }
    ```

### 3. Server Management
- Use `fuser -k 5173/tcp` if the Vite server hangs or starts on an unexpected port.
