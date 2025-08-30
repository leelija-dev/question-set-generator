import express from 'express';
import Board from '../models/Board.js';
import ClassModel from '../models/Class.js';
import Subject from '../models/Subject.js';
import Question from '../models/Question.js';

const router = express.Router();

// GET all boards
router.get('/', async (req, res) => {
  try {
    const boards = await Board.find().sort({ createdAt: -1 });
    res.json(boards);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch boards' });
  }
});

// GET board metrics (classes, subjects counts)
router.get('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const exists = await Board.findById(id).select('_id');
    if (!exists) return res.status(404).json({ message: 'Board not found' });
    const [classes, subjects] = await Promise.all([
      ClassModel.countDocuments({ boardId: id }),
      Subject.countDocuments({ boardId: id }),
    ]);
    res.json({ classes, subjects });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch board metrics' });
  }
});

// Create board
router.post('/', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const exists = await Board.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (exists) return res.status(409).json({ message: 'Board already exists' });
    const code = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6) || name.toUpperCase().slice(0, 6);
    const status = [0, 1].includes(Number(req.body.status)) ? Number(req.body.status) : 1;
    const board = await Board.create({ name, code, status });
    res.status(201).json(board);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create board' });
  }
});

// Update board
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name?.trim();
    const update = {};
    if (name) {
      const exists = await Board.findOne({ _id: { $ne: id }, name: new RegExp(`^${name}$`, 'i') });
      if (exists) return res.status(409).json({ message: 'Board with same name exists' });
      update.name = name;
      update.code = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6);
    }
    if (typeof req.body.status !== 'undefined') {
      const s = Number(req.body.status);
      update.status = s === 1 ? 1 : 0;
    }
    const board = await Board.findByIdAndUpdate(id, update, { new: true });
    if (!board) return res.status(404).json({ message: 'Board not found' });
    res.json(board);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update board' });
  }
});

// Delete board
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check exists first
    const board = await Board.findById(id);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    // Cascade: delete subjects under this board, then classes, then the board
    await Subject.deleteMany({ board: id });
    await ClassModel.deleteMany({ board: id });
    await Question.deleteMany({ board: id });
    await Board.findByIdAndDelete(id);
    res.json({ ok: true, cascaded: { subjects: true, classes: true, questions: true } });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete board' });
  }
});

export default router;
