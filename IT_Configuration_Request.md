# Technical Request: Stride Application Deployment Configuration

**Project**: Stride Organizational Rollout
**Requester**: Raj Sharma
**Target Environment**: GCP VM (Internal Preview)

---

## 1. Network: Ingress Firewall Rule
**Action**: Create an Ingress firewall rule for the target VM instance.
- **Port**: `8080` (TCP)
- **Source Filter**: `0.0.0.0/0` (or specify your organizational IP range for enhanced security)
- **Target Tags**: Apply to the specific VM instance tags.

**Justification**: This is required to allow authorized personnel to access the application UI and API via their web browsers. Port 8080 is the designated port for the containerized Stride application.

---

## 2. Identity: OAuth 2.0 Credentials
**Action**: Create or update an OAuth 2.0 Client ID for a **Web Application**.
- **New Authorized JavaScript Origins**:
  - `http://<VM_PUBLIC_IP>:8080`
- **Authorized Redirect URIs**:
  - `http://<VM_PUBLIC_IP>:8080`

**Justification**: The application utilizes Google OAuth for secure, identity-based employee authentication. Google’s security policies strictly block login requests from unauthorized or unknown origins. **Registering the VM's Public IP address is mandatory** for the "Login with Google" button to function correctly. 

---

## 3. Infrastructure: Static External IP (Optional but Recommended)
**Action**: Promote the VM's ephemeral external IP address to a **Static External IP**.

**Justification**: If the VM restarts and the ephemeral IP changes, it will mismatch the registered OAuth Google origins, causing login failures. A static IP ensures consistent accessibility and configuration stability.

---

## Summary of Impact
These changes are targeted specifically to the Stride VM instance. They do not introduce broader network vulnerabilities or affect other existing project infrastructure.
