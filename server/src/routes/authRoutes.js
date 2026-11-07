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
// import authorizeRole from '../middleware/authorizeRole.js';

// const router = express.Router();

// router.post('/register', authController.register);
// router.post('/login', authController.login);

// // Temporary route for testing role authorization
// router.get(
//   '/test-client-access',
//   authenticate,
//   authorizeRole('client'),
//   (req, res) => {
//     res.status(200).json({
//       success: true,
//       message: 'Client access granted',
//       user: req.user,
//     });
//   }
// );

// export default router;