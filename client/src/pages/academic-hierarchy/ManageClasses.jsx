import React, { useEffect, useMemo, useState } from 'react'
import { BoardsAPI, ClassesAPI } from '../../api/ah'

const ManageClasses = () => {
  const [boards, setBoards] = useState([])
  const [selectedBoardId, setSelectedBoardId] = useState('')

  // classes list for selected board
  const [classes, setClasses] = useState([])

  // UI state
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
  const openOverview = (c) => setOverviewId(c._id || c.id)
  const closeOverview = () => setOverviewId(null)
  const overviewClass = useMemo(() => classes.find(c => (c._id || c.id) === overviewId) || null, [classes, overviewId])

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

  // Load classes when selectedBoardId changes
  useEffect(() => {
    if (!selectedBoardId) { setClasses([]); return }
    const load = async () => {
      try {
        const list = await ClassesAPI.list(selectedBoardId)
        setClasses(Array.isArray(list) ? list : [])
      } catch (e) {
        setClasses([])
      }
    }
    load()
  }, [selectedBoardId])

  // Derived
  const currentClasses = useMemo(() => {
    const list = classes || []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(c => (c.name || '').toLowerCase().includes(q))
  }, [classes, search])

  const totalPages = Math.max(1, Math.ceil(currentClasses.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIdx = (currentPage - 1) * pageSize
  const endIdx = startIdx + pageSize
  const pageItems = currentClasses.slice(startIdx, endIdx)

  useEffect(() => { setPage(1) }, [selectedBoardId, search, pageSize])

  // Actions
  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    const trimmed = name.trim()
    if (!trimmed) { setError('Class name is required'); return }
    try {
      const created = await ClassesAPI.create({ name: trimmed, boardId: selectedBoardId })
      setClasses(prev => [created, ...prev])
      setName('')
    } catch (err) {
      setError('Class already exists for this board or failed to create')
    }
  }

  const startEdit = (c) => { setEditingId(c._id || c.id); setEditingName(c.name) }
  const cancelEdit = () => { setEditingId(null); setEditingName(''); setError('') }
  const saveEdit = async () => {
    const trimmed = editingName.trim()
    if (!trimmed) { setError('Class name is required'); return }
    try {
      const updated = await ClassesAPI.update(editingId, { name: trimmed })
      setClasses(prev => prev.map(c => ((c._id || c.id) === editingId ? updated : c)))
      setEditingId(null); setEditingName(''); setError('')
    } catch (err) {
      setError('Another class with this name already exists or update failed')
    }
  }

  const askDelete = (c) => { setDeleteId(c._id || c.id); setDeleteName(c.name) }
  const cancelDelete = () => { setDeleteId(null); setDeleteName('') }
  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await ClassesAPI.remove(deleteId)
      setClasses(prev => prev.filter(c => (c._id || c.id) !== deleteId))
    } catch (_) {}
    setDeleteId(null); setDeleteName('')
  }

  // Anim flags for modals
  const editEnter = useEnterAnimation(!!editingId)
  const deleteEnter = useEnterAnimation(!!deleteId)
  const overviewEnter = useEnterAnimation(!!overviewId)

  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))

  const selectedBoard = boards.find(b => (b._id || b.id) === selectedBoardId) || null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Classes</h1>
        <div className="text-sm text-gray-600">Boards: <span className="font-semibold text-gray-900">{boards.length}</span></div>
      </div>

      {/* Add Class */}
      <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
          <div className="w-full lg:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {boards.map(b => (
                <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Class 1, Grade 8, XII"
              className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {error && !editingId && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Add Class
          </button>
        </div>
      </form>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes..."
            className="w-64 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          {selectedBoard ? (
            <>
              Board: <span className="font-medium text-gray-900">{selectedBoard.name}</span> ·
              Classes: <span className="font-medium text-gray-900 ml-1">{classes.length}</span> ·
              Showing <span className="font-medium text-gray-900">{currentClasses.length === 0 ? 0 : startIdx + 1}-{Math.min(endIdx, currentClasses.length)}</span> of {currentClasses.length}
            </>
          ) : 'No board selected'}
        </div>
      </div>

      {/* Classes List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overview</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No classes found</td>
              </tr>
            ) : (
              pageItems.map(c => (
                <tr key={c._id || c.id}>
                  <td className="px-4 py-3 text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openOverview(c)}
                      title="View overview"
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-700">
                        <path d="M12 5c-7.633 0-11 6.5-11 7s3.367 7 11 7 11-6.5 11-7-3.367-7-11-7zm0 12c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z" />
                      </svg>
                      <span>View</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => startEdit(c)}
                      title="Edit"
                      aria-label="Edit"
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 p-1.5 text-gray-700 hover:bg-gray-50 hover:text-indigo-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5.5v-.42l8.6-8.6.42.42-8.6 8.6zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.82 1.82 3.75 3.75 1.82-1.82z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => askDelete(c)}
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
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${editEnter ? 'opacity-100' : 'opacity-0'}`} onClick={cancelEdit} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${editEnter ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Class</h3>
                <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700" aria-label="Close">✕</button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit() }}
                  className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter class name"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button onClick={cancelEdit} className="px-4 py-2 text-sm rounded-md border border-gray-300">Cancel</button>
                <button onClick={saveEdit} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${deleteEnter ? 'opacity-100' : 'opacity-0'}`} onClick={cancelDelete} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${deleteEnter ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Delete Class</h3>
              </div>
              <div className="px-5 py-4 space-y-2">
                <p className="text-sm text-gray-700">Are you sure you want to delete the class <span className="font-semibold text-gray-900">{deleteName}</span>?</p>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button onClick={cancelDelete} className="px-4 py-2 text-sm rounded-md border border-gray-300">No, Keep</button>
                <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Modal */}
      {overviewClass && (
        <div className="fixed inset-0 z-40">
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${overviewEnter ? 'opacity-100' : 'opacity-0'}`} onClick={closeOverview} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${overviewEnter ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Class Overview</h3>
                <button onClick={closeOverview} className="text-gray-500 hover:text-gray-700" aria-label="Close">✕</button>
              </div>
              <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Class</p>
                  <p className="text-base font-semibold text-gray-900">{overviewClass.name}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Created</p>
                  <p className="text-base font-semibold text-gray-900">{new Date(overviewClass.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Last Updated: <span className="font-medium text-gray-800">{new Date(overviewClass.lastUpdated || overviewClass.updatedAt || overviewClass.createdAt).toLocaleString()}</span></p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">{overviewClass.metrics?.subjects ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Sections</p>
                  <p className="text-2xl font-bold text-gray-900">{overviewClass.metrics?.sections ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Students</p>
                  <p className="text-2xl font-bold text-gray-900">{overviewClass.metrics?.students ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">ID</p>
                  <p className="text-sm font-mono text-gray-900 break-all">{overviewClass._id || overviewClass.id}</p>
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
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded-md text-sm ${p === currentPage ? 'bg-indigo-600 text-white' : 'border border-gray-300'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <button onClick={goNext} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}

// Simple enter animation helper (kept local)
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

export default ManageClasses
