const jwt = require('jsonwebtoken');

/**
 * Requires a valid "Authorization: Bearer <token>" header.
 * On success, attaches the decoded payload ({ sub, username }) as req.user.
 * Used only on write routes (create/update/delete) — GET routes stay public
 * so the map remains browsable without an account.
 */
module.exports = function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Login required for this action.' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Session expired or invalid — please log in again.' });
    }
};