
import userService from './user.service.js';

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.userId);

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(
      req.user.userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const userController = {
  getProfile,
  updateProfile,
};

export default userController;
