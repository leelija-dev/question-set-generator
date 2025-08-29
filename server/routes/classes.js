import express from 'express';
import ClassModel from '../models/Class.js';
import Subject from '../models/Subject.js';

const router = express.Router();

// GET classes (optionally by boardId)
router.get('/', async (req, res) => {
  try {
    const { boardId } = req.query;
    const filter = {};
    if (boardId) filter.boardId = boardId;
    const classes = await ClassModel.find(filter).sort({ createdAt: -1 });
    res.json(classes);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
});

// Create class
router.post('/', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const boardId = req.body.boardId;
    if (!name || !boardId) return res.status(400).json({ message: 'name and boardId are required' });
    const exists = await ClassModel.findOne({ boardId, name: new RegExp(`^${name}$`, 'i') });
    if (exists) return res.status(409).json({ message: 'Class already exists for this board' });
    const status = [0, 1].includes(Number(req.body.status)) ? Number(req.body.status) : 1;
    const cls = await ClassModel.create({ name, boardId, status });
    res.status(201).json(cls);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create class' });
  }
});

// Update class
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name?.trim();
    const update = {};
    if (name) {
      // Need boardId to ensure unique within board; fetch current
      const current = await ClassModel.findById(id);
      if (!current) return res.status(404).json({ message: 'Class not found' });
      const exists = await ClassModel.findOne({ _id: { $ne: id }, boardId: current.boardId, name: new RegExp(`^${name}$`, 'i') });
      if (exists) return res.status(409).json({ message: 'Another class with same name exists in this board' });
      update.name = name;
    }
    if (typeof req.body.status !== 'undefined') {
      const s = Number(req.body.status);
      update.status = s === 1 ? 1 : 0;
    }
    const cls = await ClassModel.findByIdAndUpdate(id, update, { new: true });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update class' });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check exists first
    const cls = await ClassModel.findById(id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    // Cascade delete subjects under this class
    await Subject.deleteMany({ classId: id });
    await ClassModel.findByIdAndDelete(id);
    res.json({ ok: true, cascaded: { subjects: true } });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete class' });
  }
});

export default router;
