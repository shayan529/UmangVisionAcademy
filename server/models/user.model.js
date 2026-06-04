import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model, Types } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    roles: {
      type: [String],
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    enrolledCourses: [
      {
        type: Types.ObjectId,
        ref: 'Course',
      },
    ],
    teachingCourses: [
      {
        type: Types.ObjectId,
        ref: 'Course',
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

const User = model('User', userSchema);

export default User;
