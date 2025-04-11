import mongoose from 'mongoose';
import type { IUser } from './User';

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: 'New Chat',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastMessage: {
    type: String,
    default: '',
  },
});

// Update the updatedAt timestamp before saving
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export interface IChat extends Document {
  _id: string;
  userId: IUser['_id'];
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage: string;
}

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema);
