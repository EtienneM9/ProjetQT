import mongoose from 'mongoose';
import type { IChat } from './Chat';

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'bot'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the chat's lastMessage when a new message is saved
messageSchema.post('save', async function(doc) {
  const Chat = mongoose.model('Chat');
  await Chat.findByIdAndUpdate(doc.chatId, {
    lastMessage: doc.content,
    updatedAt: new Date(),
  });
});

export interface IMessage extends Document {
  _id: string;
  chatId: IChat['_id'];
  role: 'user' | 'bot';
  content: string;
  explanation?: string;
  createdAt: Date;
}

export default mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
