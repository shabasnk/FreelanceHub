const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check whether the user is authenticated
    if (!req.user) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    // Check whether the user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error('You do not have permission to perform this action');
      error.statusCode = 403;
      return next(error);
    }

    // User has permission
    next();
  };
};

export default authorizeRole;