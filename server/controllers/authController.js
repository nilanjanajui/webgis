const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
    return jwt.sign(
        { sub: user._id.toString(), username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const existing = await User.findOne({ username: username.trim() });
        if (existing) {
            return res.status(409).json({ error: 'That username is already taken.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ username: username.trim(), passwordHash });

        const token = signToken(user);
        res.status(201).json({ token, user: { id: user._id, username: user.username } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const user = await User.findOne({ username: username.trim() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const token = signToken(user);
        res.json({ token, user: { id: user._id, username: user.username } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Returns the currently authenticated user, based on the JWT — lets the
// frontend restore a session on page load without re-sending credentials.
exports.me = async (req, res) => {
    res.json({ user: { id: req.user.sub, username: req.user.username } });
};