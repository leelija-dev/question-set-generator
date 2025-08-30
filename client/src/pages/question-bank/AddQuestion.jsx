import React, { useEffect, useState, useMemo } from 'react'
import { BoardsAPI, ClassesAPI, SubjectsAPI, QuestionsAPI } from '../../api/ah'

const AddQuestion = () => {
  // data sources
  const [boards, setBoards] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])

  // selections
  const [boardId, setBoardId] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')

  // form fields
  const [marks, setMarks] = useState('')
  const [difficulty, setDifficulty] = useState('medium') // easy | medium | hard
  const [question, setQuestion] = useState('')
  const [questionType, setQuestionType] = useState('plain') // plain | mcq | fib | true_false
  const [answer, setAnswer] = useState('') // used for plain and FIB
  const [tfAnswer, setTfAnswer] = useState('') // 'true' | 'false'
  const [mcqOptions, setMcqOptions] = useState(['', '', '', ''])
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState(-1) // optional

  // loading flags
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Load boards on mount
  useEffect(() => {
    const load = async () => {
      setLoadingBoards(true)
      try {
        const list = await BoardsAPI.list({ status: 1 })
        setBoards(Array.isArray(list) ? list : [])
        if (Array.isArray(list) && list.length) setBoardId(list[0]._id || list[0].id)
      } catch (_) {
        setBoards([])
      } finally {
        setLoadingBoards(false)
      }
    }
    load()
  }, [])

  // Load classes when board changes
  useEffect(() => {
    if (!boardId) { setClasses([]); setClassId(''); setSubjects([]); setSubjectId(''); return }
    const load = async () => {
      setLoadingClasses(true)
      try {
        const list = await ClassesAPI.list({ boardId, status: 1 })
        setClasses(Array.isArray(list) ? list : [])
        if (Array.isArray(list) && list.length) setClassId(list[0]._id || list[0].id)
        else { setClassId(''); setSubjects([]); setSubjectId('') }
      } catch (_) {
        setClasses([]); setClassId(''); setSubjects([]); setSubjectId('')
      } finally {
        setLoadingClasses(false)
      }
    }
    load()
  }, [boardId])

  // Load subjects when class changes
  useEffect(() => {
    if (!boardId || !classId) { setSubjects([]); setSubjectId(''); return }
    const load = async () => {
      setLoadingSubjects(true)
      try {
        const list = await SubjectsAPI.list({ boardId, classId, status: 1 })
        setSubjects(Array.isArray(list) ? list : [])
        if (Array.isArray(list) && list.length) setSubjectId(list[0]._id || list[0].id)
        else setSubjectId('')
      } catch (_) {
        setSubjects([]); setSubjectId('')
      } finally {
        setLoadingSubjects(false)
      }
    }
    load()
  }, [boardId, classId])

  const canSubmit = useMemo(() => {
    if (!(boardId && classId && subjectId && question.trim() && String(marks).trim())) return false
    if (questionType === 'mcq') {
      const filledOptions = mcqOptions.filter(o => o.trim() !== '').length
      return filledOptions >= 2 && mcqCorrectIndex !== -1 && mcqOptions[mcqCorrectIndex]?.trim() !== ''
    }
    return true
  }, [boardId, classId, subjectId, question, marks, questionType, mcqOptions, mcqCorrectIndex])

  const resetForm = () => {
    // Keep current selections for board, class, and subject
    setMarks('')
    setQuestion('')
    // Keep difficulty as user set it
    setMessage('')
    setAnswer('')
    setTfAnswer('')
    setMcqOptions(['', '', '', ''])
    setMcqCorrectIndex(-1)
    // keep questionType as user last used
  }

  const renderAnswerSection = () => {
    if (questionType === 'plain') {
      return (
        <div className="mt-4">
          <label className="text-sm text-gray-600 mb-1 block">Answer (optional)</label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={3}
            className="w-full rounded-md border-gray-300"
            placeholder="Provide an answer if applicable..."
          />
        </div>
      )
    }
    if (questionType === 'fib') {
      return (
        <div className="mt-4">
          <label className="text-sm text-gray-600 mb-1 block">Correct value for blank (optional)</label>
          <input
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="w-full rounded-md border-gray-300"
            placeholder="Type the expected answer..."
          />
        </div>
      )
    }
    if (questionType === 'true_false') {
      return (
        <div className="mt-4">
          <label className="text-sm text-gray-600 mb-1 block">Correct answer (optional)</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="tf" value="true" checked={tfAnswer === 'true'} onChange={() => setTfAnswer('true')} />
              <span>True</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="tf" value="false" checked={tfAnswer === 'false'} onChange={() => setTfAnswer('false')} />
              <span>False</span>
            </label>
            {tfAnswer && (
              <button type="button" className="text-xs text-gray-500 underline" onClick={() => setTfAnswer('')}>Clear</button>
            )}
          </div>
        </div>
      )
    }
    if (questionType === 'mcq') {
      const updateOption = (idx, val) => {
        const arr = [...mcqOptions]
        arr[idx] = val
        setMcqOptions(arr)
      }
      const addOption = () => setMcqOptions(prev => [...prev, ''])
      const removeOption = (idx) => {
        const arr = mcqOptions.filter((_, i) => i !== idx)
        setMcqOptions(arr)
        if (mcqCorrectIndex === idx) setMcqCorrectIndex(-1)
        if (mcqCorrectIndex > idx) setMcqCorrectIndex(mcqCorrectIndex - 1)
      }
      return (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-gray-600">Options (optional)</label>
            <button type="button" onClick={addOption} className="text-xs text-indigo-600">+ Add option</button>
          </div>
          <div className="space-y-2">
            {mcqOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mcqCorrect"
                  checked={mcqCorrectIndex === idx}
                  onChange={() => setMcqCorrectIndex(idx)}
                  title="Mark as correct (optional)"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={e => updateOption(idx, e.target.value)}
                  className="flex-1 rounded-md border-gray-300"
                  placeholder={`Option ${idx + 1}`}
                />
                <button type="button" onClick={() => removeOption(idx)} className="text-xs text-gray-500 underline">Remove</button>
              </div>
            ))}
          </div>
          {mcqCorrectIndex >= 0 && mcqOptions[mcqCorrectIndex]?.trim() === '' && (
            <p className="text-xs text-amber-600 mt-1">Marked correct option is empty.</p>
          )}
        </div>
      )
    }
    return null
  }

  const handleSave = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setMessage('')
    try {
      const payload = {
        boardId,
        classId,
        subjectId,
        questionText: question.trim(),
        marks: Number(marks),
        difficulty,
      };

      // Handle options based on questionType
      if (questionType === 'mcq') {
        payload.options = mcqOptions.map(s => s.trim()).filter(Boolean);
      } else {
        payload.options = []; // Always send an empty array for non-MCQ types
      }

      // Handle correctAnswer based on questionType
      if (questionType === 'plain' || questionType === 'fib') {
        payload.correctAnswer = answer.trim();
      } else if (questionType === 'true_false') {
        payload.correctAnswer = tfAnswer;
      } else if (questionType === 'mcq' && mcqCorrectIndex >= 0 && mcqOptions[mcqCorrectIndex]) {
        payload.correctAnswer = mcqOptions[mcqCorrectIndex].trim();
      } else {
        payload.correctAnswer = ''; // Default to empty string if no specific correct answer is set
      }

      await QuestionsAPI.create(payload)
      setMessage('Question saved successfully')
      resetForm()
    } catch (e) {
      setMessage(typeof e?.message === 'string' ? e.message : 'Failed to save question')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Add New Question</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Board</label>
            <select
              value={boardId}
              onChange={e => setBoardId(e.target.value)}
              className="rounded-md border-gray-300"
              disabled={loadingBoards}
            >
              {loadingBoards && <option value="">Loading Boards...</option>}
              {!loadingBoards && boards.length === 0 && <option value="">No boards available</option>}
              {boards.map(b => (
                <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
              ))}
            </select>
            {loadingBoards && <span className="text-xs text-gray-500 mt-1">Loading boards…</span>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Class</label>
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="rounded-md border-gray-300"
              disabled={!boardId || loadingClasses}
            >
              {!boardId && <option value="">Select board first</option>}
              {boardId && loadingClasses && <option value="">Loading Classes...</option>}
              {boardId && !loadingClasses && classes.length === 0 && <option value="">No classes available</option>}
              {classes.map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
              ))}
            </select>
            {loadingClasses && <span className="text-xs text-gray-500 mt-1">Loading classes…</span>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              className="rounded-md border-gray-300"
              disabled={!classId || loadingSubjects}
            >
              {(!classId) && <option value="">Select class first</option>}
              {classId && loadingSubjects && <option value="">Loading Subjects...</option>}
              {classId && !loadingSubjects && subjects.length === 0 && <option value="">No subjects available</option>}
              {subjects.map(s => (
                <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
              ))}
            </select>
            {loadingSubjects && <span className="text-xs text-gray-500 mt-1">Loading subjects…</span>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Question Type</label>
            <select
              value={questionType}
              onChange={e => setQuestionType(e.target.value)}
              className="rounded-md border-gray-300"
            >
              <option value="plain">Plain (Q & optional Answer)</option>
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="fib">Fill in the Blanks</option>
              <option value="true_false">True / False</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Marks</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={marks}
              onChange={e => setMarks(e.target.value)}
              className="rounded-md border-gray-300"
              placeholder="e.g., 1, 2, 5"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="rounded-md border-gray-300"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-600 mb-1 block">Question</label>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            rows={5}
            className="w-full rounded-md border-gray-300"
            placeholder="Write the question here..."
          />
        </div>

        {renderAnswerSection()}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            disabled={!canSubmit || submitting}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
            onClick={handleSave}
            title={!canSubmit ? 'Select board, class, subject and fill question + marks' : (submitting ? 'Saving…' : 'Save question')}
          >
            {submitting ? 'Saving…' : 'Save Question'}
          </button>
          <button type="button" className="px-4 py-2 rounded-md border border-gray-300" onClick={resetForm}>Reset</button>
          {message && <span className="text-sm text-gray-600">{message}</span>}
        </div>
      </div>
    </div>
  )
}

export default AddQuestion
