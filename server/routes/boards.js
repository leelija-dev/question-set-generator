import express from 'express';
import Board from '../models/Board.js';

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

// Create board
router.post('/', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const exists = await Board.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (exists) return res.status(409).json({ message: 'Board already exists' });
    const code = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6) || name.toUpperCase().slice(0, 6);
    const board = await Board.create({ name, code });
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
    const del = await Board.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: 'Board not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete board' });
  }
});

export default router;
