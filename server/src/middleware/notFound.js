//This middleware handles requests to API routes that don't exist.
// For example, if someone visits:

// http://localhost:4000/api/v1/unknown

// They receive a 404 response.

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export default notFound;