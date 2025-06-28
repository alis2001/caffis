// server/app.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Caffis backend is running!');
});

app.listen(process.env.PORT || 5000, () => {
  console.log('Server running on port 5000');
});
