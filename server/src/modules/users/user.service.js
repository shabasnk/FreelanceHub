
import userRepository from './user.repository.js';

const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
};

const updateProfile = async (userId, updateData) => {
  const allowedFields = ['firstName', 'lastName'];

  const filteredData = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  }

  if (Object.keys(filteredData).length === 0) {
    const error = new Error('No valid profile fields provided');
    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await userRepository.updateById(
    userId,
    filteredData
  );

  if (!updatedUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    id: updatedUser._id,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    email: updatedUser.email,
    role: updatedUser.role,
  };
};

const userService = {
  getProfile,
  updateProfile,
};

export default userService;
