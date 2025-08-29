import express from 'express';
import Request from '../models/Request.js';
import Board from '../models/Board.js';
import ClassModel from '../models/Class.js';
import Subject from '../models/Subject.js';

const router = express.Router();

// List requests with optional filters: type, status
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    const items = await Request.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// Create a new request
router.post('/', async (req, res) => {
  try {
    const { type, payload, customer } = req.body || {};
    if (!type || !['board', 'class', 'subject'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }
    const item = await Request.create({ type, payload: payload || {}, customer: customer || {} });
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create request' });
  }
});

// Approve a request (creates the entity if not duplicate)
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const note = (req.body?.note || '').trim();
    const r = await Request.findById(id);
    if (!r) return res.status(404).json({ message: 'Request not found' });

    const stamp = new Date();
    let createdEntity = null;

    if (r.type === 'board') {
      const name = (r.payload?.name || '').trim();
      if (!name) return res.status(400).json({ message: 'Invalid board name' });
      const dup = await Board.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (!dup) {
        const code = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6) || name.toUpperCase().slice(0, 6);
        createdEntity = await Board.create({ name, code });
      }
    }

    if (r.type === 'class') {
      const className = (r.payload?.name || '').trim();
      let boardId = r.payload?.boardId;
      if (!boardId && r.payload?.boardName) {
        const b = await Board.findOne({ name: new RegExp(`^${r.payload.boardName}$`, 'i') });
        if (b) boardId = b._id;
      }
      if (!className || !boardId) return res.status(400).json({ message: 'Invalid class or board' });
      const dup = await ClassModel.findOne({ boardId, name: new RegExp(`^${className}$`, 'i') });
      if (!dup) {
        createdEntity = await ClassModel.create({ name: className, boardId });
      }
    }

    if (r.type === 'subject') {
      const name = (r.payload?.name || '').trim();
      let boardId = r.payload?.boardId;
      let classId = r.payload?.classId;
      if (!boardId && r.payload?.boardName) {
        const b = await Board.findOne({ name: new RegExp(`^${r.payload.boardName}$`, 'i') });
        if (b) boardId = b._id;
      }
      if (!classId && r.payload?.className && boardId) {
        const c = await ClassModel.findOne({ boardId, name: new RegExp(`^${r.payload.className}$`, 'i') });
        if (c) classId = c._id;
      }
      if (!name || !boardId || !classId) return res.status(400).json({ message: 'Invalid subject/board/class' });
      const dup = await Subject.findOne({ boardId, classId, name: new RegExp(`^${name}$`, 'i') });
      if (!dup) {
        const code = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6) || name.toUpperCase().slice(0, 6);
        createdEntity = await Subject.create({ name, code, boardId, classId, easyQuestions: 0, mediumQuestions: 0, hardQuestions: 0 });
      }
    }

    r.status = 'approved';
    r.decisionAt = stamp;
    if (note) r.note = note;
    await r.save();

    res.json({ request: r, created: createdEntity });
  } catch (e) {
    res.status(500).json({ message: 'Failed to approve request' });
  }
});

// Reject a request
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const note = (req.body?.note || '').trim();
    const r = await Request.findById(id);
    if (!r) return res.status(404).json({ message: 'Request not found' });
    r.status = 'rejected';
    r.decisionAt = new Date();
    if (note) r.note = note;
    await r.save();
    res.json({ request: r });
  } catch (e) {
    res.status(500).json({ message: 'Failed to reject request' });
  }
});

export default router;
