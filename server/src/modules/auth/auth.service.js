
import bcrypt from 'bcryptjs';

import userRepository from '../users/user.repository.js';
import authTokens from './auth.tokens.js';

const SALT_ROUNDS = 12;

const register = async (userData) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
  } = userData;

  // 1. Check whether the email is already registered
  const existingUser = await userRepository.emailExists(email);

  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  // 2. Hash the password before saving it
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Create the user
  const user = await userRepository.createUser({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
  });

  // 4. Return safe user data (never return the password)
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
};

const login = async ({ email, password }) => {
  // 1. Find user by email (repository selects the password)
  const user = await userRepository.findByEmail(email);

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 2. Check account status
  if (user.status !== 'active') {
    const error = new Error('Your account is not active');
    error.statusCode = 403;
    throw error;
  }

  // 3. Compare entered password with stored hash
  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }


  // Update last login
  await userRepository.updateLastLogin(user._id);

  // Generate access token
 const accessToken = authTokens.generateAccessToken(user);

  // 6. Return token and safe user data
  return {
    accessToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  };
};

const authService = {
  register,
  login,
};

export default authService;
