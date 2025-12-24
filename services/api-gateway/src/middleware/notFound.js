/**
 * 404 Not Found middleware
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    message: 'The requested endpoint does not exist on this API Gateway'
  });
};

module.exports = notFound;

