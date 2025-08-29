import React, { useEffect, useMemo, useState } from 'react'
import { BoardsAPI, ClassesAPI, SubjectsAPI } from '../../api/ah'

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

const ManageSubjects = () => {
  const [boards, setBoards] = useState([])
  const [selectedBoardId, setSelectedBoardId] = useState('')

  // classes for selected board
  const [classes, setClasses] = useState([])

  // subjects for selected board+class
  const [subjects, setSubjects] = useState([])

  // UI state
  const [selectedClassId, setSelectedClassId] = useState('')
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const [deleteId, setDeleteId] = useState(null)
  const [deleteName, setDeleteName] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Overview state
  const [overviewId, setOverviewId] = useState(null)
  const openOverview = (s) => setOverviewId(s._id || s.id)
  const closeOverview = () => setOverviewId(null)
  const overviewSubject = useMemo(() => subjects.find(s => (s._id || s.id) === overviewId) || null, [subjects, overviewId])

  // Load boards on mount
  useEffect(() => {
    const loadBoards = async () => {
      try {
        const list = await BoardsAPI.list()
        setBoards(Array.isArray(list) ? list : [])
        if (Array.isArray(list) && list.length) setSelectedBoardId(list[0]._id || list[0].id)
      } catch (e) {
        setBoards([])
      }
    }
    loadBoards()
  }, [])

  // Load classes when selected board changes
  useEffect(() => {
    if (!selectedBoardId) { setClasses([]); setSelectedClassId(''); return }
    const load = async () => {
      try {
        const list = await ClassesAPI.list(selectedBoardId)
        setClasses(Array.isArray(list) ? list : [])
        if (Array.isArray(list) && list.length) setSelectedClassId(list[0]._id || list[0].id)
        else setSelectedClassId('')
      } catch (e) {
        setClasses([]); setSelectedClassId('')
      }
    }
    load()
  }, [selectedBoardId])

  // Load subjects when board or class changes
  useEffect(() => {
    if (!selectedBoardId || !selectedClassId) { setSubjects([]); return }
    const load = async () => {
      try {
        const list = await SubjectsAPI.list({ boardId: selectedBoardId, classId: selectedClassId })
        setSubjects(Array.isArray(list) ? list : [])
      } catch (e) {
        setSubjects([])
      }
    }
    load()
  }, [selectedBoardId, selectedClassId])

  // Derived
  const currentSubjects = useMemo(() => {
    const list = subjects || []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(s => (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q))
  }, [subjects, search])

  const totalPages = Math.max(1, Math.ceil(currentSubjects.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIdx = (currentPage - 1) * pageSize
  const endIdx = startIdx + pageSize
  const pageItems = currentSubjects.slice(startIdx, endIdx)

  useEffect(() => { setPage(1) }, [selectedBoardId, selectedClassId, search, pageSize])

  // Actions
  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    const trimmed = name.trim()
    if (!trimmed) { setError('Subject name is required'); return }
    try {
      const created = await SubjectsAPI.create({ name: trimmed, boardId: selectedBoardId, classId: selectedClassId })
      setSubjects(prev => [created, ...prev])
      setName('')
    } catch (err) {
      setError('Subject already exists in this class or failed to create')
    }
  }

  const startEdit = (s) => { setEditingId(s._id || s.id); setEditingName(s.name); setError('') }
  const cancelEdit = () => { setEditingId(null); setEditingName(''); setError('') }
  const saveEdit = async () => {
    const trimmed = editingName.trim()
    if (!trimmed) { setError('Subject name is required'); return }
    try {
      const updated = await SubjectsAPI.update(editingId, { name: trimmed })
      setSubjects(prev => prev.map(s => ((s._id || s.id) === editingId ? updated : s)))
      setEditingId(null); setEditingName(''); setError('')
    } catch (err) {
      setError('Another subject with this name already exists or update failed')
    }
  }

  const askDelete = (s) => { setDeleteId(s._id || s.id); setDeleteName(s.name) }
  const cancelDelete = () => { setDeleteId(null); setDeleteName('') }
  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await SubjectsAPI.remove(deleteId)
      setSubjects(prev => prev.filter(s => (s._id || s.id) !== deleteId))
    } catch (_) {}
    setDeleteId(null); setDeleteName('')
  }

  // Animations
  const editEnter = useEnterAnimation(!!editingId)
  const deleteEnter = useEnterAnimation(!!deleteId)
  const overviewEnter = useEnterAnimation(!!overviewId)

  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Subjects</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Board</label>
          <select value={selectedBoardId} onChange={e => setSelectedBoardId(e.target.value)} className="rounded-md border-gray-300">
            {boards.map(b => (
              <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Class</label>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="rounded-md border-gray-300">
            {classes.map(c => (
              <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Search</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects..." className="rounded-md border-gray-300" />
        </div>
      </div>

      {/* Add subject */}
      <form onSubmit={handleAdd} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 mb-1">New Subject Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border-gray-300" placeholder="e.g., Mathematics" />
        </div>
        <div>
          <label className="block text-sm text-transparent mb-1">.</label>
          <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Add Subject</button>
        </div>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Stats and page size */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Board: <span className="font-medium text-gray-800">{boards.find(b => (b._id || b.id) === selectedBoardId)?.name || '—'}</span>
          {' '}· Class: <span className="font-medium text-gray-800">{classes.find(c => (c._id || c.id) === selectedClassId)?.name || '—'}</span>
          {' '}· Total Subjects: <span className="font-medium text-gray-800">{currentSubjects.length}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Page size</span>
          <select className="rounded-md border-gray-300" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qs</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overview</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No subjects found</td>
              </tr>
            ) : (
              pageItems.map(s => (
                <tr key={s._id || s.id}>
                  <td className="px-4 py-3 text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-700">{(s.easyQuestions ?? 0) + (s.mediumQuestions ?? 0) + (s.hardQuestions ?? 0)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openOverview(s)}
                      title="View overview"
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-700">
                        <path d="M12 5c-7.633 0-11 6.5-11 7s3.367 7 11 7 11-6.5 11-7-3.367-7-11-7zm0 12c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z" />
                      </svg>
                      <span>View</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => startEdit(s)}
                      title="Edit"
                      aria-label="Edit"
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 p-1.5 text-gray-700 hover:bg-gray-50 hover:text-indigo-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5.5v-.42l8.6-8.6.42.42-8.6 8.6zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.82 1.82 3.75 3.75 1.82-1.82z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => askDelete(s)}
                      title="Delete"
                      aria-label="Delete"
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 p-1.5 text-gray-700 hover:bg-red-50 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M6 7h12v2H6V7zm1 3h10l-1 10H8L7 10zm3-5h4l1 1H9l1-1z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-40">
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${editEnter ? 'opacity-100' : 'opacity-0'}`} onClick={cancelEdit} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={`w-full max-w-lg rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${editEnter ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Subject</h3>
                <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700" aria-label="Close">✕</button>
              </div>
              <div className="px-5 py-5 space-y-3">
                <label className="block">
                  <span className="text-sm text-gray-600">Subject Name</span>
                  <input value={editingName} onChange={e => setEditingName(e.target.value)} className="mt-1 w-full rounded-md border-gray-300" />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button onClick={cancelEdit} className="px-4 py-2 text-sm rounded-md border border-gray-300">Cancel</button>
                <button onClick={saveEdit} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-40">
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${deleteEnter ? 'opacity-100' : 'opacity-0'}`} onClick={cancelDelete} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${deleteEnter ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Delete Subject</h3>
                <button onClick={cancelDelete} className="text-gray-500 hover:text-gray-700" aria-label="Close">✕</button>
              </div>
              <div className="px-5 py-5">
                <p className="text-gray-700">Are you sure you want to delete <span className="font-semibold">{deleteName}</span>?</p>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button onClick={cancelDelete} className="px-4 py-2 text-sm rounded-md border border-gray-300">Cancel</button>
                <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Modal */}
      {overviewSubject && (
        <div className="fixed inset-0 z-40">
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${overviewEnter ? 'opacity-100' : 'opacity-0'}`} onClick={closeOverview} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${overviewEnter ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Subject Overview</h3>
                <button onClick={closeOverview} className="text-gray-500 hover:text-gray-700" aria-label="Close">✕</button>
              </div>
              <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Board</p>
                  <p className="text-base font-semibold text-gray-900">{boards.find(b => (b._id || b.id) === selectedBoardId)?.name || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Class</p>
                  <p className="text-base font-semibold text-gray-900">{classes.find(c => (c._id || c.id) === selectedClassId)?.name || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4 md:col-span-2">
                  <p className="text-xs uppercase text-gray-500">Subject</p>
                  <p className="text-base font-semibold text-gray-900">{overviewSubject.name}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Easy</p>
                  <p className="text-2xl font-bold text-gray-900">{overviewSubject.easyQuestions ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Medium</p>
                  <p className="text-2xl font-bold text-gray-900">{overviewSubject.mediumQuestions ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Hard</p>
                  <p className="text-2xl font-bold text-gray-900">{overviewSubject.hardQuestions ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{(overviewSubject.easyQuestions ?? 0) + (overviewSubject.mediumQuestions ?? 0) + (overviewSubject.hardQuestions ?? 0)}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4 md:col-span-2">
                  <p className="text-xs uppercase text-gray-500">Created</p>
                  <p className="text-base font-semibold text-gray-900">{new Date(overviewSubject.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Last Updated: <span className="font-medium text-gray-800">{new Date(overviewSubject.lastUpdated || overviewSubject.updatedAt || overviewSubject.createdAt).toLocaleString()}</span></p>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end">
                <button onClick={closeOverview} className="px-4 py-2 text-sm rounded-md border border-gray-300">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button onClick={goPrev} disabled={currentPage === 1} className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50">Prev</button>
        <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
        <button onClick={goNext} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}

export default ManageSubjects
