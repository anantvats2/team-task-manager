const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal server error'

  if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid resource id'
  }

  if (err.code === 11000) {
    statusCode = 409
    message = 'Duplicate value detected'
  }

  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ')
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

module.exports = errorHandler
