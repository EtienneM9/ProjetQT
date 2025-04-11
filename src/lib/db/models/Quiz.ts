import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
  fromChatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: false, // Not required as some questions will be newly generated
  },
  isUserQuestion: {
    type: Boolean,
    default: false,
  },
});

const quizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questions: [questionSchema],
  score: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

quizSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);

export default Quiz;
