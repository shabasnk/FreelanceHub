
const updateProfileValidation = (req, res, next) => {
  const { firstName, lastName } = req.body;

  if (firstName === undefined && lastName === undefined) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (firstName or lastName) is required',
    });
  }

  if (firstName !== undefined) {
    if (
      typeof firstName !== 'string' ||
      firstName.trim().length < 2 ||
      firstName.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: 'First name must be between 2 and 50 characters',
      });
    }
  }

  if (lastName !== undefined) {
    if (
      typeof lastName !== 'string' ||
      lastName.trim().length < 2 ||
      lastName.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be between 2 and 50 characters',
      });
    }
  }

  next();
};

const userValidation = {
  updateProfileValidation,
};

export default userValidation;
