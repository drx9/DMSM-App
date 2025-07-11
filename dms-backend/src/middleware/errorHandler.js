const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle UUID validation errors
  if (err.message && err.message.includes('invalid input syntax for type uuid')) {
    return res.status(400).json({
      message: 'Invalid ID format. Expected UUID format.',
      error: 'UUID_VALIDATION_ERROR'
    });
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Duplicate entry',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    });
  }

  // Handle custom errors
  if (err.status) {
    return res.status(err.status).json({
      message: err.message
    });
  }

  // Default error
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = { errorHandler }; 