import React, { useEffect, useMemo, useState } from 'react'
import { BoardsAPI, ClassesAPI, SubjectsAPI, QuestionsAPI } from '../../api/ah'
import { toast } from 'react-toastify'

// Simple enter animation helper to animate modals
const useEnterAnimation = (open) => {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (open) {
      setShow(false)
      const id = requestAnimationFrame(() => setShow(true))
      return () => cancelAnimationFrame(id)
    } else {
      setShow(false)
    }
  }, [open])
  return show
}

// Create QuestionSetsAPI for the new backend route
const QuestionSetsAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.boardId) q.set('boardId', params.boardId);
    if (params.classId) q.set('classId', params.classId);
    if (params.subjectId) q.set('subjectId', params.subjectId);
    if (params.q) q.set('q', params.q);
    const qs = q.toString();
    return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/question-sets${qs ? `?${qs}` : ''}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
  },
  create: (data) => fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/question-sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }),
  get: (id) => fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/question-sets/${id}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
};

const GeneratedSets = () => {
  const [boards, setBoards] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  
  // Filters
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [marksFilter, setMarksFilter] = useState('')
  const [search, setSearch] = useState('')
  
  // Generated sets data
  const [generatedSets, setGeneratedSets] = useState([])
  const [loading, setLoading] = useState(false)
  
  // UI state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState('newest')
  
  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // View modal
  const [viewId, setViewId] = useState(null)
  const [viewSet, setViewSet] = useState(null)
  const [viewQuestions, setViewQuestions] = useState([])
  const [loadingView, setLoadingView] = useState(false)
  
  // Generate form data
  const [generateForm, setGenerateForm] = useState({
    boardId: '',
    classId: '',
    subjectId: '',
    examName: '',
    examDate: '',
    examTime: '',
    questionGroups: []
  })
  
  // Available questions by marks
  const [availableQuestions, setAvailableQuestions] = useState([])
  
  // Load boards on mount
  useEffect(() => {
    const loadBoards = async () => {
      try {
        const list = await BoardsAPI.list()
        setBoards(Array.isArray(list) ? list : [])
      } catch (e) {
        setBoards([])
      }
    }
    loadBoards()
  }, [])
  
  // Load classes when board changes
  useEffect(() => {
    if (!selectedBoardId) { 
      setClasses([]); 
      setSelectedClassId(''); 
      return 
    }
    const load = async () => {
      try {
        const list = await ClassesAPI.list({ boardId: selectedBoardId })
        setClasses(Array.isArray(list) ? list : [])
        if (Array.isArray(list) && list.length) setSelectedClassId(list[0]._id || list[0].id)
        else setSelectedClassId('')
      } catch (e) {
        setClasses([]); setSelectedClassId('')
      }
    }
    load()
  }, [selectedBoardId])
  
  // Load subjects when class changes
  useEffect(() => {
    if (!selectedBoardId || !selectedClassId) { 
      setSubjects([]); 
      setSelectedSubjectId(''); 
      return 
    }
    const load = async () => {
      try {
        const list = await SubjectsAPI.list({ boardId: selectedBoardId, classId: selectedClassId })
        setSubjects(Array.isArray(list) ? list : [])
        if (Array.isArray(list) && list.length) setSelectedSubjectId(list[0]._id || list[0].id)
        else setSelectedSubjectId('')
      } catch (e) {
        setSubjects([]); setSelectedSubjectId('')
      }
    }
    load()
  }, [selectedBoardId, selectedClassId])

  // Load generated sets from API
  useEffect(() => {
    const loadGeneratedSets = async () => {
      setLoading(true)
      try {
        const params = {}
        if (selectedBoardId) params.boardId = selectedBoardId
        if (selectedClassId) params.classId = selectedClassId
        if (selectedSubjectId) params.subjectId = selectedSubjectId
        if (search) params.q = search
        
        const list = await QuestionSetsAPI.list(params)
        setGeneratedSets(Array.isArray(list) ? list : [])
      } catch (e) {
        setGeneratedSets([])
        toast.error('Failed to load question sets')
      } finally {
        setLoading(false)
      }
    }
    
    const debounceTimer = setTimeout(loadGeneratedSets, 300)
    return () => clearTimeout(debounceTimer)
  }, [selectedBoardId, selectedClassId, selectedSubjectId, search])

  // Load available questions when generating
  useEffect(() => {
    if (!showGenerateModal || !generateForm.boardId || !generateForm.classId || !generateForm.subjectId) {
      setAvailableQuestions([])
      return
    }
    
    const loadAvailableQuestions = async () => {
      try {
        const params = {
          boardId: generateForm.boardId,
          classId: generateForm.classId,
          subjectId: generateForm.subjectId,
          status: 1 // Only approved questions
        }
        
        const questions = await QuestionsAPI.list(params)
        
        // Group questions by marks
        const grouped = questions.reduce((acc, q) => {
          const marks = q.marks
          if (!acc[marks]) {
            acc[marks] = {
              marks,
              total: 0,
              byDifficulty: { easy: 0, medium: 0, hard: 0 }
            }
          }
          acc[marks].total++
          acc[marks].byDifficulty[q.difficulty] = (acc[marks].byDifficulty[q.difficulty] || 0) + 1
          return acc
        }, {})
        
        const sortedGroups = Object.values(grouped).sort((a, b) => a.marks - b.marks)
        setAvailableQuestions(sortedGroups)
        
        // Initialize question groups in form
        const initialGroups = sortedGroups.map(group => ({
          marks: group.marks,
          totalQuestions: 0,
          difficulty: {
            easy: 0,
            medium: 0,
            hard: 0
          }
        }))
        
        setGenerateForm(prev => ({
          ...prev,
          questionGroups: initialGroups
        }))
      } catch (e) {
        setAvailableQuestions([])
        toast.error('Failed to load available questions')
      }
    }
    
    loadAvailableQuestions()
  }, [showGenerateModal, generateForm.boardId, generateForm.classId, generateForm.subjectId])
  
  // Filtered and sorted sets
  const filteredSets = useMemo(() => {
    let filtered = [...generatedSets]
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      return a.examName.localeCompare(b.examName)
    })
    
    return filtered
  }, [generatedSets, sortBy])
  
  // Pagination
  const totalPages = Math.ceil(filteredSets.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const pageItems = filteredSets.slice(startIndex, startIndex + pageSize)
  
  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))
  
  // Animations
  const modalEnter = useEnterAnimation(showGenerateModal)
  const viewModalEnter = useEnterAnimation(!!viewId)
  
  // Update question group
  const updateQuestionGroup = (index, field, value) => {
    const updatedGroups = [...generateForm.questionGroups]
    if (field === 'totalQuestions') {
      updatedGroups[index][field] = parseInt(value) || 0
    } else {
      // Update difficulty counts
      updatedGroups[index].difficulty[field] = parseInt(value) || 0
    }
    setGenerateForm(prev => ({
      ...prev,
      questionGroups: updatedGroups
    }))
  }
  
  // Handle view
  const handleView = async (set) => {
    setViewId(set._id || set.id)
    setViewSet(set)
    setLoadingView(true)
    
    try {
      // Load the question set details including questions
      const setDetails = await QuestionSetsAPI.get(set._id || set.id)
      setViewSet(setDetails)
      
      // If questions are not populated, we might need to load them separately
      // For now, assuming the backend populates questions
      setViewQuestions(setDetails.questions || [])
    } catch (error) {
      toast.error('Failed to load question set details')
      setViewId(null)
      setViewSet(null)
    } finally {
      setLoadingView(false)
    }
  }
  
  const closeView = () => {
    setViewId(null)
    setViewSet(null)
    setViewQuestions([])
  }
  
  // Handle generate
  const handleGenerate = async () => {
    if (!generateForm.examName || !generateForm.examDate || !generateForm.examTime) {
      toast.error('Please fill in all required fields')
      return
    }
    
    // Validate that at least one question is selected
    const totalSelected = generateForm.questionGroups.reduce((sum, group) => sum + group.totalQuestions, 0)
    if (totalSelected === 0) {
      toast.error('Please select at least one question')
      return
    }
    
    setGenerating(true)
    try {
      // Prepare the data for the backend
      const questionSetData = {
        examName: generateForm.examName,
        boardId: generateForm.boardId,
        classId: generateForm.classId,
        subjectId: generateForm.subjectId,
        examDate: generateForm.examDate,
        examTime: generateForm.examTime,
        questionGroups: generateForm.questionGroups,
        totalQuestions: totalSelected
      }
      
      // Save to database
      const savedSet = await QuestionSetsAPI.create(questionSetData)
      
      // Add to the list
      setGeneratedSets(prev => [savedSet, ...prev])
      
      toast.success(`Question set "${generateForm.examName}" generated and saved successfully!`)
      
      // Reset form and close modal
      setGenerateForm({
        boardId: '',
        classId: '',
        subjectId: '',
        examName: '',
        examDate: '',
        examTime: '',
        questionGroups: []
      })
      setShowGenerateModal(false)
      
    } catch (error) {
      toast.error('Failed to generate question set')
    } finally {
      setGenerating(false)
    }
  }
  
  // Reset generate form
  const resetGenerateForm = () => {
    setGenerateForm({
      boardId: '',
      classId: '',
      subjectId: '',
      examName: '',
      examDate: '',
      examTime: '',
      questionGroups: []
    })
    setAvailableQuestions([])
  }
  
  // Helper to render question options
  const renderOptions = (question) => {
    if (!question.options || !Array.isArray(question.options)) return null
    
    // Check if this is a true/false question
    const isTrueFalse = question.options.length === 2 && 
      ((question.options[0].toLowerCase() === 'true' && question.options[1].toLowerCase() === 'false') ||
       (question.options[0].toLowerCase() === 'false' && question.options[1].toLowerCase() === 'true'))
    
    return (
      <div className="space-y-2 mt-3">
        {question.options.map((option, index) => {
          // Case-insensitive comparison for correct answer
          const isCorrect = question.correctAnswer && 
            question.correctAnswer.toLowerCase() === option.toLowerCase()
          
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 transition-all ${
                isCorrect
                  ? "border-green-500 bg-green-50 shadow-sm"
                  : isTrueFalse
                  ? "border-blue-200 bg-blue-50 hover:border-blue-300"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <span className={`font-medium text-lg mr-3 ${
                  isCorrect ? 'text-green-700' : isTrueFalse ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className={`text-base ${
                  isCorrect ? 'text-green-800 font-semibold' : isTrueFalse ? 'text-blue-800' : 'text-gray-800'
                }`}>
                  {option}
                </span>
                {isCorrect && (
                  <span className="ml-auto">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Generated Question Sets</h1>
        <div className="text-sm text-gray-600">
          Total Sets: <span className="font-semibold text-blue-600">{generatedSets.length}</span>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Board</label>
          <select 
            value={selectedBoardId} 
            onChange={e => setSelectedBoardId(e.target.value)} 
            className="rounded-md border-gray-300"
          >
            <option value="">All Boards</option>
            {boards.map(b => (
              <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Class</label>
          <select 
            value={selectedClassId} 
            onChange={e => setSelectedClassId(e.target.value)} 
            className="rounded-md border-gray-300"
            disabled={!selectedBoardId}
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Subject</label>
          <select 
            value={selectedSubjectId} 
            onChange={e => setSelectedSubjectId(e.target.value)} 
            className="rounded-md border-gray-300"
            disabled={!selectedClassId}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Difficulty</label>
          <select 
            value={difficulty} 
            onChange={e => setDifficulty(e.target.value)} 
            className="rounded-md border-gray-300"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Marks</label>
          <select 
            value={marksFilter} 
            onChange={e => setMarksFilter(e.target.value)} 
            className="rounded-md border-gray-300"
          >
            <option value="">All Marks</option>
            <option value="1">1 Mark</option>
            <option value="2">2 Marks</option>
            <option value="5">5 Marks</option>
            <option value="10">10 Marks</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Search</label>
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search sets..." 
            className="rounded-md border-gray-300" 
          />
        </div>
      </div>
      
      {/* Generate Button */}
      <div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Generate New Set
        </button>
      </div>
      
      {/* Stats and controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Showing {pageItems.length} of {filteredSets.length} question sets
          {selectedBoardId && ` • Board: ${boards.find(b => (b._id || b.id) === selectedBoardId)?.name || '—'}`}
          {selectedClassId && ` • Class: ${classes.find(c => (c._id || c.id) === selectedClassId)?.name || '—'}`}
          {selectedSubjectId && ` • Subject: ${subjects.find(s => (s._id || s.id) === selectedSubjectId)?.name || '—'}`}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort</span>
          <select className="rounded-md border-gray-300" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A–Z</option>
          </select>
          
          <span className="text-sm text-gray-600">Page size</span>
          <select className="rounded-md border-gray-300" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-hidden rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exam Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Board
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Questions
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exam Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-16">
                  <div className="flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin" />
                  </div>
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {generatedSets.length === 0 ? 'No question sets generated yet' : 'No question sets match your filters'}
                </td>
              </tr>
            ) : (
              pageItems.map((set) => (
                <tr key={set._id || set.id}>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-gray-900" title={set.examName}>
                      {set.examName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {set.board?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {set.class?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {set.subject?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{set.totalQuestions}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {set.examDate} at {set.examTime}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(set.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(set)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-700">
                          <path d="M12 5c-7.633 0-11 6.5-11 7s3.367 7 11 7 11-6.5 11-7-3.367-7-11-7zm0 12c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z" />
                        </svg>
                        View
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0015 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button 
            onClick={goPrev} 
            disabled={page === 1} 
            className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <button 
            onClick={goNext} 
            disabled={page === totalPages} 
            className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* View Modal */}
      {viewId && viewSet && (
        <div className="fixed inset-0 z-40">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
              viewModalEnter ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeView}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${
                viewModalEnter
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-2"
              }`}
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {viewSet.examName} - Question Set Details
                </h3>
                <button
                  onClick={closeView}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {loadingView ? (
                <div className="px-5 py-16 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin" />
                </div>
              ) : (
                <div className="px-5 py-5 space-y-6">
                  {/* Set Information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-md p-4">
                      <p className="text-xs uppercase text-gray-500">Board</p>
                      <p className="text-base font-semibold text-gray-900">
                        {viewSet.board?.name || 'Unknown'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4">
                      <p className="text-xs uppercase text-gray-500">Class</p>
                      <p className="text-base font-semibold text-gray-900">
                        {viewSet.class?.name || 'Unknown'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4">
                      <p className="text-xs uppercase text-gray-500">Subject</p>
                      <p className="text-base font-semibold text-gray-900">
                        {viewSet.subject?.name || 'Unknown'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4">
                      <p className="text-xs uppercase text-gray-500">Total Questions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {viewSet.totalQuestions}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4">
                      <p className="text-xs uppercase text-gray-500">Exam Date</p>
                      <p className="text-base font-semibold text-gray-900">
                        {viewSet.examDate}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4">
                      <p className="text-xs uppercase text-gray-500">Exam Time</p>
                      <p className="text-base font-semibold text-gray-900">
                        {viewSet.examTime}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4 md:col-span-2">
                      <p className="text-xs uppercase text-gray-500">Created</p>
                      <p className="text-base font-semibold text-gray-900">
                        {new Date(viewSet.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Question Groups Summary */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Question Groups</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {viewSet.questionGroups?.map((group, index) => (
                        <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h5 className="font-medium text-blue-900 mb-2">
                            {group.marks} Mark Questions
                          </h5>
                          <div className="space-y-1 text-sm">
                            <p className="text-blue-800">Total: {group.totalQuestions}</p>
                            <div className="text-blue-700">
                              <p>Easy: {group.difficulty?.easy || 0}</p>
                              <p>Medium: {group.difficulty?.medium || 0}</p>
                              <p>Hard: {group.difficulty?.hard || 0}</p>
                            </div>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 col-span-full">No question groups information available</p>
                      )}
                    </div>
                  </div>

                  {/* Questions List */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Questions</h4>
                    {viewQuestions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No questions loaded for this set
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {viewQuestions.map((question, index) => (
                          <div key={question._id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                  Q{index + 1}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {question.marks} mark • {question.difficulty}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-gray-800 font-medium mb-2">{question.questionText}</p>
                            </div>
                            
                            {/* Options */}
                            {question.options && question.options.length > 0 && renderOptions(question)}
                            
                            {!question.options || question.options.length === 0 ? (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600">Answer:</p>
                                <p className="text-green-800 font-medium">{question.correctAnswer}</p>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end">
                <button
                  onClick={closeView}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
              modalEnter ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setShowGenerateModal(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${
                modalEnter
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-2"
              }`}
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Generate Question Set
                </h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 py-5 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Board <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={generateForm.boardId}
                      onChange={(e) => {
                        const newBoardId = e.target.value;
                        setGenerateForm(prev => ({
                          ...prev,
                          boardId: newBoardId,
                          classId: '', // Reset dependent fields
                          subjectId: '',
                          questionGroups: []
                        }));
                      }}
                      className="rounded-md border-gray-300"
                      required
                    >
                      <option value="">Select Board</option>
                      {boards.map((b) => (
                        <option key={b._id || b.id} value={b._id || b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={generateForm.classId}
                      onChange={(e) => {
                        const newClassId = e.target.value;
                        setGenerateForm(prev => ({
                          ...prev,
                          classId: newClassId,
                          subjectId: '', // Reset dependent fields
                          questionGroups: []
                        }));
                      }}
                      className="rounded-md border-gray-300"
                      disabled={!generateForm.boardId}
                      required
                    >
                      <option value="">
                        {!generateForm.boardId ? "Select board first" : "Select Class"}
                      </option>
                      {classes
                        .filter(c => generateForm.boardId && (c.boardId === generateForm.boardId || c.board?._id === generateForm.boardId || c.board === generateForm.boardId))
                        .map((c) => (
                        <option key={c._id || c.id} value={c._id || c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={generateForm.subjectId}
                      onChange={(e) => {
                        const newSubjectId = e.target.value;
                        setGenerateForm(prev => ({
                          ...prev,
                          subjectId: newSubjectId,
                          questionGroups: [] // Reset groups when subject changes
                        }));
                      }}
                      className="rounded-md border-gray-300"
                      disabled={!generateForm.classId}
                      required
                    >
                      <option value="">
                        {!generateForm.classId ? "Select class first" : "Select Subject"}
                      </option>
                      {subjects
                        .filter(s => generateForm.classId && (s.classId === generateForm.classId || s.class?._id === generateForm.classId || s.class === generateForm.classId))
                        .map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Exam Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={generateForm.examName}
                      onChange={(e) =>
                        setGenerateForm(prev => ({
                          ...prev,
                          examName: e.target.value
                        }))
                      }
                      className="rounded-md border-gray-300"
                      placeholder="e.g., Mathematics Mid-term Exam"
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Exam Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={generateForm.examDate}
                      onChange={(e) =>
                        setGenerateForm(prev => ({
                          ...prev,
                          examDate: e.target.value
                        }))
                      }
                      className="rounded-md border-gray-300"
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Exam Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={generateForm.examTime}
                      onChange={(e) =>
                        setGenerateForm(prev => ({
                          ...prev,
                          examTime: e.target.value
                        }))
                      }
                      className="rounded-md border-gray-300"
                      required
                    />
                  </div>
                </div>

                {/* Question Pattern */}
                {generateForm.boardId && generateForm.classId && generateForm.subjectId && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Question Pattern</h4>
                    
                    {availableQuestions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Loading available questions...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availableQuestions.map((group, index) => (
                          <div key={group.marks} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-900">
                                Group {index + 1}: {group.marks} Mark Questions ({group.total} available)
                              </h5>
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Select:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={group.total}
                                  value={generateForm.questionGroups[index]?.totalQuestions || 0}
                                  onChange={(e) => updateQuestionGroup(index, 'totalQuestions', e.target.value)}
                                  className="w-20 rounded-md border-gray-300 text-center"
                                />
                              </div>
                            </div>
                            
                            {generateForm.questionGroups[index]?.totalQuestions > 0 && (
                              <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col">
                                  <label className="text-xs text-gray-600 mb-1">Easy ({group.byDifficulty.easy})</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={group.byDifficulty.easy}
                                    value={generateForm.questionGroups[index]?.difficulty.easy || 0}
                                    onChange={(e) => updateQuestionGroup(index, 'easy', e.target.value)}
                                    className="rounded-md border-gray-300"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <label className="text-xs text-gray-600 mb-1">Medium ({group.byDifficulty.medium})</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={group.byDifficulty.medium}
                                    value={generateForm.questionGroups[index]?.difficulty.medium || 0}
                                    onChange={(e) => updateQuestionGroup(index, 'medium', e.target.value)}
                                    className="rounded-md border-gray-300"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <label className="text-xs text-gray-600 mb-1">Hard ({group.byDifficulty.hard})</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={group.byDifficulty.hard}
                                    value={generateForm.questionGroups[index]?.difficulty.hard || 0}
                                    onChange={(e) => updateQuestionGroup(index, 'hard', e.target.value)}
                                    className="rounded-md border-gray-300"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    resetGenerateForm();
                  }}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generating && (
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {generating ? "Generating..." : "Generate Question Set"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GeneratedSets