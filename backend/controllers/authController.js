const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Super Admin portal: only role "admin" (not legacy staff "user")
    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'Super Admin access only. Use Vendor or User login for other accounts.',
      });
    }

    const token = signToken({
      id: user.id,
      type: 'staff',
      role: 'admin',
      portal: 'super_admin',
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin',
        roleLabel: 'Super Admin',
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { login };
