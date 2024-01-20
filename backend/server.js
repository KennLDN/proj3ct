const express = require('express');
const app = express();

const port = process.env.PORT || 3001;

app.use('/api', (req, res, next) => {
  console.log(`Request received ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/ping', (req, res) => {
  res.send('pong');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
