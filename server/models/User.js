import mongoose from 'mongoose';
import crypto from 'crypto';

export const USER_ROLES = ['Developer', 'Student', 'Instructor', 'Admin'];
export const USER_LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'other'];

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [60, 'Name cannot exceed 60 characters']
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: {
      values: USER_ROLES,
      message: '{VALUE} is not a valid user role'
    },
    default: 'Developer'
  },
  primaryLanguage: {
    type: String,
    enum: {
      values: USER_LANGUAGES,
      message: '{VALUE} is not a valid language'
    },
    default: 'javascript'
  },
  avatar: {
    type: String,
    default: ''
  },
  savedErrors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ErrorCase'
  }],
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.passwordHash;
      return ret;
    }
  }
});

/**
 * Utility to hash password securely using Node built-in crypto (pbkdf2)
 */
UserSchema.statics.hashPassword = function (password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Utility to verify hashed password
 */
UserSchema.methods.verifyPassword = function (password) {
  if (!this.passwordHash || !this.passwordHash.includes(':')) return false;
  const [salt, originalHash] = this.passwordHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return originalHash === verifyHash;
};

export const User = mongoose.model('User', UserSchema);

