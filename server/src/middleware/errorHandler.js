//This handles errors that happen while processing requests.

const errorHandler = (err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
  });
};

export default errorHandler;
