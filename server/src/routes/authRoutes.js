import express from 'express';
import authController from '../modules/auth/auth.controller.js';

const router = express.Router();

// Register a new user
router.post('/register', authController.register);

// Login an existing user
router.post('/login', authController.login);

export default router;





// import express from 'express';
// import authController from '../modules/auth/auth.controller.js';
// import authenticate from '../middleware/authenticate.js';

// const router = express.Router();

// router.post('/register', authController.register);
// router.post('/login', authController.login);

// // Temporary protected route for testing authentication
// router.get('/test-auth', authenticate, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Authentication middleware is working',
//     user: req.user,
//   });
// });

// export default router;