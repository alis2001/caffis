const { createUser } = require('../services/authService');

async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const user = await createUser({ name, email, password });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { registerUser };
