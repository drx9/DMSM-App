require('dotenv').config();
const server = require('./app');
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required! Set it in Railway backend variables.');
} 