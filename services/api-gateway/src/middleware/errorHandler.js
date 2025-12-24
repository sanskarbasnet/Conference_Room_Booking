/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Gateway Error:', err.message);

  // Proxy errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'The requested service is currently unavailable. Please try again later.'
    });
  }

  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    return res.status(504).json({
      success: false,
      error: 'Gateway Timeout',
      message: 'The service took too long to respond. Please try again.'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Gateway Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

