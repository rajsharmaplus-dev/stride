# IT Configuration Request — Stride Application
**Requested by**: Raj Sharma  
**Application**: Stride — Internal Project Governance Tool  
**Target URL**: `http://tardis.globallogic.com/stride`  
**VM**: `del1-vm-knwldgraph-new`

---

## Request 1 — Create Google OAuth 2.0 Credential *(IT Action Required)*

### What is needed
Create a new **OAuth 2.0 Client ID** in a GlobalLogic GCP project for the Stride application and share the credential details with the requester.

### Steps for IT
1. Go to Google Cloud Console → Select a GlobalLogic GCP project
2. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
3. Set **Application type**: `Web application`
4. Set **Name**: `Stride`
5. Under **Authorized JavaScript origins** → Add:
   ```
   http://tardis.globallogic.com
   ```
6. Under **Authorized redirect URIs** → Add:
   ```
   http://tardis.globallogic.com
   ```
7. Click **Create**
8. **Share the generated Client ID** with Raj Sharma (the Client ID looks like: `xxxxxxxxx.apps.googleusercontent.com`)

### Justification
Stride is an internal productivity tool for project governance, deployed on the GlobalLogic VM `del1-vm-knwldgraph-new`. It uses **Google Sign-In** so employees can authenticate with their existing `@globallogic.com` Google accounts — no separate password management required.

Google's security policy requires the application's origin (`http://tardis.globallogic.com`) to be explicitly registered against a credential. Without this, employees will see **"Error 400: origin_mismatch"** and cannot log in.

Creating the credential under a **GlobalLogic GCP project** (rather than a personal account) ensures:
- The organisation owns and controls the credential
- The credential persists even if the individual leaves
- It can be managed centrally by IT
- Google Workspace policies apply correctly, preventing any "blocked by organization" errors for `@globallogic.com` employees

### What this credential accesses
Only the user's **name** and **email address** — the minimum required for authentication. No access to Drive, Gmail, Calendar or any other Google service.

---

## Request 2 — Apache Reverse Proxy Config *(Optional — Owner can self-serve with sudo)*

If IT prefers to manage Apache config centrally, add the following 2 lines to  
`/etc/apache2/sites-enabled/000-default.conf` inside `<VirtualHost *:80>`,  
after the existing `/rag-1/` entry:

```apache
# Stride App
ProxyPass /stride/ http://127.0.0.1:9090/
ProxyPassReverse /stride/ http://127.0.0.1:9090/
```

Then reload Apache (zero downtime — no restart):
```bash
sudo systemctl reload apache2
```

**If IT is comfortable, Raj Sharma can make this change himself using his existing `sudo` access.**

---

## Impact Summary

| Component | Change | Risk |
|---|---|---|
| Apache (port 80) | 2 lines added | None — existing rules untouched, uses `reload` not `restart` |
| Tomcat / Java app (port 443) | No changes | None |
| `/tomcat/` and `/rag-1/` paths | No changes | None |
| Existing PostgreSQL databases | No changes | None — new `stride_db` only |
| GCP firewall rules | No changes | None — port 9090 internal only |
| Google OAuth | New credential created | None — new credential, no existing systems affected |

---

## What Happens After IT Provides the Client ID

1. Requester adds the new Client ID to the app's environment config on the VM
2. Docker container is rebuilt (takes ~3 minutes)
3. App is live at `http://tardis.globallogic.com/stride`

No further IT involvement required after this point.
