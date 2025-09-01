
import express from 'express';
import Question from '../models/Question.js';
import Board from '../models/Board.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

const router = express.Router();


// Create Question
router.post('/', async (req, res) => {
  try {
    const { boardId, classId, subjectId, questionText, options, correctAnswer, difficulty, marks, status } = req.body;

    if (!boardId || !classId || !subjectId || !questionText || !options || !difficulty || marks === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const board = await Board.findById(boardId);
    const classObj = await Class.findById(classId);
    const subject = await Subject.findById(subjectId);

    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!classObj) return res.status(404).json({ message: 'Class not found' });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const newQuestion = new Question({
      board: boardId,
      class: classId,
      subject: subjectId,
      questionText,
      options,
      correctAnswer,
      difficulty,
      marks,
      status: status !== undefined ? status : 1, // Use provided status or default to 1 (approved) // Use provided status or default to 0 (pending)
    });

    const savedQuestion = await newQuestion.save();
    res.status(201).json(savedQuestion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List Questions
router.get('/', async (req, res) => {
  try {
    const { boardId, classId, subjectId, difficulty, status, q } = req.query;
    const filter = {};

    if (boardId) filter.board = boardId;
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    if (q) filter.questionText = { $regex: q, $options: 'i' };

    const questions = await Question.find(filter)
      .populate('board', 'name')
      .populate('class', 'name')
      .populate('subject', 'name');

    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Question
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedQuestion = await Question.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedQuestion) return res.status(404).json({ message: 'Question not found' });
    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Question
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQuestion = await Question.findByIdAndDelete(id);
    if (!deletedQuestion) return res.status(404).json({ message: 'Question not found' });
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
