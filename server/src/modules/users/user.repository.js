import User from './user.model.js';

const createUser = async (userData) => {
  return await User.create(userData);
};

const findByEmail = async (email) => {
  return await User.findOne({
    email: email.toLowerCase().trim(),
  }).select('+password');
};

const findById = async (userId) => {
  return await User.findById(userId);
};

const updateById = async (userId, updateData) => {
  return await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  );
};

const findByIdWithPassword = async (userId) => {
  return await User.findById(userId).select('+password');
};

const emailExists = async (email) => {
  const user = await User.exists({
    email: email.toLowerCase().trim(),
  });

  return Boolean(user);
};

const updateLastLogin = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    { lastLoginAt: new Date() },
    { new: true },
  );
};

const userRepository = {
  createUser,
  findByEmail,
  findById,
  findByIdWithPassword,
  emailExists,
  updateLastLogin,
  updateById,
};

export default userRepository;
