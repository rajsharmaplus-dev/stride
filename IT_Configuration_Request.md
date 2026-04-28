# Technical Request: Stride Application Deployment Configuration

**Project**: Stride Organizational Rollout
**Requester**: Raj Sharma
**Target Environment**: GlobalLogic VM — `del1-vm-knwldgraph-new`
**App URL**: `http://34.87.58.85:9090`

---

## 1. Network: Firewall Rule

**Action**: Create an Ingress firewall rule for the VM instance `del1-vm-knwldgraph-new`.
- **Port**: `9090` (TCP)
- **Protocol**: TCP
- **Source Filter**: `0.0.0.0/0` (or restrict to organizational IP range)
- **Target**: Apply to the specific VM instance

**Justification**: Stride runs in a Docker container on port 9090. This rule is required for employees to access the application from their browsers. No existing services use port 9090.

---

## 2. Identity: OAuth 2.0 Credentials

**Action**: Add the following to the existing OAuth 2.0 Client ID for the `stride-app-492704` GCP project.

**Client ID**: `801131875690-fb46e9k4i8qd6h6apqtvmpjfl6aae6hg.apps.googleusercontent.com`

- **Authorized JavaScript Origins** — Add:
  ```
  http://34.87.58.85:9090
  ```
- **Authorized Redirect URIs** — Add:
  ```
  http://34.87.58.85:9090
  ```

**Justification**: The application uses Google OAuth for employee authentication. Google's security policy requires the application's origin to be explicitly registered. Without this, the "Login with Google" button will show an `origin_mismatch` error.

**Console link**:
```
https://console.cloud.google.com/apis/credentials/oauthclient/801131875690-fb46e9k4i8qd6h6apqtvmpjfl6aae6hg.apps.googleusercontent.com?project=stride-app-492704
```

---

## 3. Summary of Impact

- Port 9090 is not used by any existing service on the VM
- The Docker container is completely isolated from Tomcat, Apache, and all other running services
- No changes to existing Apache config, Tomcat, or any other app
- No changes to existing PostgreSQL databases (Stride uses a separate `stride_db` database with a dedicated `stride_user`)
