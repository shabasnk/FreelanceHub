import authTokens from '../modules/auth/auth.tokens.js';

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check whether Authorization header exists
    if (!authHeader) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    // Expected format: Bearer <token>
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      const error = new Error('Invalid authorization format');
      error.statusCode = 401;
      throw error;
    }

    // Verify JWT
    const decoded = authTokens.verifyAccessToken(token);

    // Attach authenticated user information to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    error.statusCode = 401;
    next(error);
  }
};

export default authenticate;