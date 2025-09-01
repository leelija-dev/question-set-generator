import express from 'express';
import QuestionSet from '../models/QuestionSet.js';
import Question from '../models/Question.js';
import Board from '../models/Board.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

const router = express.Router();

// Helper function to select questions based on configuration
async function selectQuestions(boardId, classId, subjectId, questionGroups) {
  const selectedQuestions = [];
  
  for (const group of questionGroups) {
    if (group.totalQuestions === 0) continue;
    
    const { marks, totalQuestions, difficulty } = group;
    
    // Build difficulty filter
    const difficultyFilter = [];
    if (difficulty.easy > 0) difficultyFilter.push({ difficulty: 'easy' });
    if (difficulty.medium > 0) difficultyFilter.push({ difficulty: 'medium' });
    if (difficulty.hard > 0) difficultyFilter.push({ difficulty: 'hard' });
    
    if (difficultyFilter.length === 0) continue;
    
    // Find available questions
    const availableQuestions = await Question.find({
      board: boardId,
      class: classId,
      subject: subjectId,
      marks: marks,
      status: 1, // Only approved questions
      $or: difficultyFilter
    });
    
    if (availableQuestions.length === 0) continue;
    
    // Group questions by difficulty
    const questionsByDifficulty = {
      easy: availableQuestions.filter(q => q.difficulty === 'easy'),
      medium: availableQuestions.filter(q => q.difficulty === 'medium'),
      hard: availableQuestions.filter(q => q.difficulty === 'hard')
    };
    
    // Select questions based on difficulty distribution
    let selectedFromGroup = [];
    
    // Select easy questions
    if (difficulty.easy > 0 && questionsByDifficulty.easy.length > 0) {
      const count = Math.min(difficulty.easy, questionsByDifficulty.easy.length);
      const shuffled = questionsByDifficulty.easy.sort(() => 0.5 - Math.random());
      selectedFromGroup.push(...shuffled.slice(0, count));
    }
    
    // Select medium questions
    if (difficulty.medium > 0 && questionsByDifficulty.medium.length > 0) {
      const count = Math.min(difficulty.medium, questionsByDifficulty.medium.length);
      const shuffled = questionsByDifficulty.medium.sort(() => 0.5 - Math.random());
      selectedFromGroup.push(...shuffled.slice(0, count));
    }
    
    // Select hard questions
    if (difficulty.hard > 0 && questionsByDifficulty.hard.length > 0) {
      const count = Math.min(difficulty.hard, questionsByDifficulty.hard.length);
      const shuffled = questionsByDifficulty.hard.sort(() => 0.5 - Math.random());
      selectedFromGroup.push(...shuffled.slice(0, count));
    }
    
    // If we don't have enough questions, fill with available ones
    if (selectedFromGroup.length < totalQuestions) {
      const remaining = totalQuestions - selectedFromGroup.length;
      const remainingQuestions = availableQuestions.filter(q => 
        !selectedFromGroup.some(sq => sq._id.toString() === q._id.toString())
      );
      
      if (remainingQuestions.length > 0) {
        const shuffled = remainingQuestions.sort(() => 0.5 - Math.random());
        selectedFromGroup.push(...shuffled.slice(0, Math.min(remaining, remainingQuestions.length)));
      }
    }
    
    selectedQuestions.push(...selectedFromGroup);
  }
  
  return selectedQuestions;
}

// Create Question Set
router.post('/', async (req, res) => {
  try {
    const { examName, boardId, classId, subjectId, examDate, examTime, questionGroups } = req.body;

    // Validation
    if (!examName || !boardId || !classId || !subjectId || !examDate || !examTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!questionGroups || !Array.isArray(questionGroups) || questionGroups.length === 0) {
      return res.status(400).json({ message: 'At least one question group is required' });
    }

    // Verify references exist
    const [board, classDoc, subject] = await Promise.all([
      Board.findById(boardId),
      Class.findById(classId),
      Subject.findById(subjectId)
    ]);

    if (!board) return res.status(404).json({ message: 'Board not found' });
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    // Calculate total questions
    const totalQuestions = questionGroups.reduce((sum, group) => sum + group.totalQuestions, 0);

    if (totalQuestions === 0) {
      return res.status(400).json({ message: 'At least one question must be selected' });
    }

    // Select questions based on configuration
    const selectedQuestions = await selectQuestions(boardId, classId, subjectId, questionGroups);

    if (selectedQuestions.length === 0) {
      return res.status(400).json({ message: 'No questions available matching the criteria' });
    }

    // Create question set
    const questionSet = new QuestionSet({
      examName: examName.trim(),
      board: boardId,
      class: classId,
      subject: subjectId,
      examDate,
      examTime,
      questionGroups,
      questions: selectedQuestions.map(q => q._id),
      totalQuestions: selectedQuestions.length,
      status: 1 // Published by default
    });

    const savedSet = await questionSet.save();

    // Populate and return
    const populatedSet = await QuestionSet.findById(savedSet._id)
      .populate('board', 'name')
      .populate('class', 'name')
      .populate('subject', 'name');

    res.status(201).json(populatedSet);
  } catch (error) {
    console.error('Error creating question set:', error);
    res.status(500).json({ message: 'Failed to create question set' });
  }
});

// Get all question sets with filtering
router.get('/', async (req, res) => {
  try {
    const { boardId, classId, subjectId, q } = req.query;
    const filter = {};

    if (boardId) filter.board = boardId;
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;
    if (q) filter.examName = { $regex: q, $options: 'i' };

    const questionSets = await QuestionSet.find(filter)
      .populate('board', 'name')
      .populate('class', 'name')
      .populate('subject', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(questionSets);
  } catch (error) {
    console.error('Error fetching question sets:', error);
    res.status(500).json({ message: 'Failed to fetch question sets' });
  }
});

// Get question set by ID with full questions
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const questionSet = await QuestionSet.findById(id)
      .populate('board', 'name')
      .populate('class', 'name')
      .populate('subject', 'name')
      .populate({
        path: 'questions',
        select: 'questionText options correctAnswer difficulty marks',
        options: { sort: { difficulty: 1, createdAt: 1 } }
      });

    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    res.status(200).json(questionSet);
  } catch (error) {
    console.error('Error fetching question set:', error);
    res.status(500).json({ message: 'Failed to fetch question set' });
  }
});

// Update question set
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedSet = await QuestionSet.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true
    })
      .populate('board', 'name')
      .populate('class', 'name')
      .populate('subject', 'name');

    if (!updatedSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    res.status(200).json(updatedSet);
  } catch (error) {
    console.error('Error updating question set:', error);
    res.status(500).json({ message: 'Failed to update question set' });
  }
});

// Delete question set
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedSet = await QuestionSet.findByIdAndDelete(id);
    
    if (!deletedSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    res.status(200).json({ message: 'Question set deleted successfully' });
  } catch (error) {
    console.error('Error deleting question set:', error);
    res.status(500).json({ message: 'Failed to delete question set' });
  }
});

export default router;