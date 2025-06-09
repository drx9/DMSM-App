# DMS Mart

A full-stack application for DMS Mart with React Native frontend and Node.js backend.

## Project Structure

```
dms-mart/
├── dms-backend/         # Node.js backend
├── dms-consumer-side/   # React Native frontend
└── README.md
```

## Backend Setup

1. Navigate to backend directory:
```bash
cd dms-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
PORT=3000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=dms_mart
JWT_SECRET=your_jwt_secret
```

4. Start the server:
```bash
npm run dev
```

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd dms-consumer-side
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Development

- Backend runs on: http://localhost:3000
- Frontend runs on: http://localhost:19000

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

MIT 