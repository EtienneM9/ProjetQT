import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password should be at least 6 characters long'],
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  methods: {
    async comparePassword(candidatePassword: string): Promise<boolean> {
      try {
        return await bcrypt.compare(candidatePassword, this.password);
      } catch (error) {
        return false;
      }
    },
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

export type IUser = {
  _id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
