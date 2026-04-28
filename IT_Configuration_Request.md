# Stride — VM Deployment Configuration Notes

**Project**: Stride Organizational Rollout  
**Target Environment**: `del1-vm-knwldgraph-new`  
**App URL**: `http://tardis.globallogic.com/stride`  
**Deployment Owner**: Raj Sharma

---

## Deployment Overview

Stride runs as a Docker container on port `9090` (internal only).  
Traffic is routed via the existing Apache2 reverse proxy on port 80.  
No new firewall rules are needed. No existing services are affected.

---

## What the Deployment Owner Does

### 1. PostgreSQL — Isolated Database
Create a dedicated database and user on the VM's existing PostgreSQL instance.  
No existing databases are touched.

```sql
CREATE DATABASE stride_db;
CREATE USER stride_user WITH PASSWORD 'StrideVm2024!';
GRANT ALL PRIVILEGES ON DATABASE stride_db TO stride_user;
\c stride_db
GRANT ALL ON SCHEMA public TO stride_user;
```

### 2. Apache Config — 2 Lines Added
Add the following to `/etc/apache2/sites-enabled/000-default.conf`  
inside the existing `<VirtualHost *:80>` block, after the `/rag-1/` entry:

```apache
# Stride App
ProxyPass /stride/ http://127.0.0.1:9090/
ProxyPassReverse /stride/ http://127.0.0.1:9090/
```

Then reload Apache (zero downtime):
```bash
sudo systemctl reload apache2
```

### 3. Google OAuth — Add New Origin
The OAuth credential is managed under a personal GCP project.  
Add `http://tardis.globallogic.com` to the authorized origins:

1. Go to: `https://console.cloud.google.com/apis/credentials?project=stride-app-492704`
2. Sign in with the account that owns the project
3. Click the Stride OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins** → add: `http://tardis.globallogic.com`
5. Under **Authorized redirect URIs** → add: `http://tardis.globallogic.com`
6. Click **Save**

### 4. Docker Deployment
```bash
cd ~/stride
git clone https://github.com/rajsharmaplus-dev/stride.git
# Create .env from .env.vm.example, fill in SESSION_SECRET
docker compose up --build -d
```

---

## Contingency: If Employees Cannot Sign In

If colleagues using `@globallogic.com` accounts see **"This app is blocked by your organization"**, this means GlobalLogic's Google Workspace admin has restricted third-party OAuth apps.

**Resolution**: Ask the Google Workspace admin to whitelist the OAuth Client ID:

> Please whitelist the following OAuth 2.0 Client ID in Google Workspace Admin Console  
> (`Admin Console → Security → API Controls → App Access Control`):  
>
> **App name**: Stride  
> **Client ID**: `801131875690-fb46e9k4i8qd6h6apqtvmpjfl6aae6hg.apps.googleusercontent.com`  
>
> This is an internal productivity tool used for project governance.  
> It only requests access to the user's name and email address for authentication.

---

## Impact Summary

| Component | Status |
|---|---|
| Apache (port 80) | 2 lines added — existing rules untouched |
| Tomcat / Java app (port 443) | No changes |
| `/tomcat/` and `/rag-1/` apps | No changes |
| Existing PostgreSQL databases | No changes — new `stride_db` only |
| GCP firewall rules | No changes — port 9090 is internal only |
| Port 9090 | Internal localhost only, not publicly exposed |
