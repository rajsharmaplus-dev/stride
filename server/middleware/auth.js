// RBAC Authorization Middleware
// Reads the signed session cookie set by cookieParser in index.js.
export function authorize(allowedRoles = []) {
    return (req, res, next) => {
        const sessionStr = req.signedCookies.stride_session;
        const session    = sessionStr ? JSON.parse(sessionStr) : null;

        if (!session || !session.id || !session.role) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
            return res.status(403).json({ error: 'Permission denied: Insufficient privileges' });
        }

        req.user = session;
        next();
    };
}
