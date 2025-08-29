import express from 'express';
import Subject from '../models/Subject.js';

const router = express.Router();

// GET subjects (optionally filter by boardId and/or classId)
router.get('/', async (req, res) => {
  try {
    const { boardId, classId } = req.query;
    const filter = {};
    if (boardId) filter.boardId = boardId;
    if (classId) filter.classId = classId;
    const subjects = await Subject.find(filter).sort({ createdAt: -1 });
    res.json(subjects);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

// Create subject
router.post('/', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const boardId = req.body.boardId;
    const classId = req.body.classId;
    if (!name || !boardId || !classId) return res.status(400).json({ message: 'name, boardId and classId are required' });

    const exists = await Subject.findOne({ boardId, classId, name: new RegExp(`^${name}$`, 'i') });
    if (exists) return res.status(409).json({ message: 'Subject already exists in this class' });

    const code = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6) || name.toUpperCase().slice(0, 6);
    const subject = await Subject.create({
      name,
      code,
      boardId,
      classId,
      easyQuestions: req.body.easyQuestions || 0,
      mediumQuestions: req.body.mediumQuestions || 0,
      hardQuestions: req.body.hardQuestions || 0,
    });
    res.status(201).json(subject);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create subject' });
  }
});

// Update subject
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    if (typeof req.body.name === 'string') {
      const name = req.body.name.trim();
      if (name) {
        const current = await Subject.findById(id);
        if (!current) return res.status(404).json({ message: 'Subject not found' });
        const exists = await Subject.findOne({ _id: { $ne: id }, boardId: current.boardId, classId: current.classId, name: new RegExp(`^${name}$`, 'i') });
        if (exists) return res.status(409).json({ message: 'Another subject with same name exists in this class' });
        update.name = name;
        update.code = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6);
      }
    }
    ['easyQuestions', 'mediumQuestions', 'hardQuestions'].forEach(k => {
      if (typeof req.body[k] === 'number') update[k] = req.body[k];
    });

    const subj = await Subject.findByIdAndUpdate(id, update, { new: true });
    if (!subj) return res.status(404).json({ message: 'Subject not found' });
    res.json(subj);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update subject' });
  }
});

// Delete subject
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const del = await Subject.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: 'Subject not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete subject' });
  }
});

export default router;
