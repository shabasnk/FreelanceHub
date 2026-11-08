
import express from 'express';
import userController from '../modules/users/user.controller.js';
import userValidation from '../modules/users/user.validation.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

// Get logged-in user's profile
router.get('/profile', authenticate, userController.getProfile);

// Update logged-in user's profile
router.patch(
  '/profile',
  authenticate,
  userValidation.updateProfileValidation,
  userController.updateProfile
);

export default router;
