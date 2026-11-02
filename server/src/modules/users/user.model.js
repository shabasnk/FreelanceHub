
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // User's basic information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },

    // User role
    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      required: true,
      default: 'freelancer',
    },

    // Profile information
    avatar: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    bio: {
      type: String,
      maxlength: 1000,
      default: '',
    },

    // Account status
    status: {
      type: String,
      enum: ['active', 'suspended', 'deactivated'],
      default: 'active',
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Last login information
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
