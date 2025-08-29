import React, { useEffect, useMemo, useState } from 'react'
import { RequestsAPI } from '../../api/ah'

// LocalStorage keys shared across hierarchy pages
const REQ_KEY = 'ah_requests'
const BOARDS_KEY = 'ah_boards'
const CLASSES_KEY = 'ah_classes'
const SUBJECTS_KEY = 'ah_subjects'

const nowISO = () => new Date().toISOString()

const typeLabel = (t) => t === 'board' ? 'Board' : t === 'class' ? 'Class' : 'Subject'

const Requests = () => {
  // Requests state
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // all | board | class | subject
  const [statusFilter, setStatusFilter] = useState('pending') // all | pending | approved | rejected

  const [viewId, setViewId] = useState(null)
  const [adminNote, setAdminNote] = useState('')

  // Context stores used when approving
  const [boards, setBoards] = useState([])
  const [classesMap, setClassesMap] = useState({}) // { [boardId]: Class[] }
  const [subjectsMap, setSubjectsMap] = useState({}) // { [boardId]: { [classId]: Subject[] } }

  // Load existing data
  useEffect(() => {
    const load = async () => {
      try {
        const list = await RequestsAPI.list({ type: typeFilter, status: statusFilter })
        setRequests(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error('Failed to load requests', e)
        setRequests([])
      }
    }
    load()
  }, [typeFilter, statusFilter])

  // Helpers to find IDs by name (best-effort)
  const findBoardByName = (name) => (boards || []).find(b => b.name?.toLowerCase() === name?.toLowerCase()) || null
  const findClassByName = (boardId, className) => (classesMap[boardId] || []).find(c => c.name?.toLowerCase() === className?.toLowerCase()) || null

  // Derived: filters and search
  const filtered = useMemo(() => {
    let list = requests
    if (typeFilter !== 'all') list = list.filter(r => r.type === typeFilter)
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(r => {
        const p = r.payload || {}
        const s = [r.type, r.status, p.name, p.boardName, p.className, r.customer?.name, r.customer?.email].filter(Boolean).join(' ').toLowerCase()
        return s.includes(q)
      })
    }
    // Most recent first
    return [...list].sort((a, b) => (new Date(b.createdAt) - new Date(a.createdAt)))
  }, [requests, typeFilter, statusFilter, search])

  const current = useMemo(() => filtered.find(r => r.id === viewId || r._id === viewId) || null, [filtered, viewId])

  // Approve flow – call server API and refresh
  const approve = async (req) => {
    if (!req) return
    try {
      const id = req._id || req.id
      await RequestsAPI.approve(id, adminNote?.trim())
      // Refresh list
      const list = await RequestsAPI.list({ type: typeFilter, status: statusFilter })
      setRequests(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error('Approve failed', e)
    } finally {
      setViewId(null)
      setAdminNote('')
    }
  }

  const reject = async (req) => {
    if (!req) return
    try {
      const id = req._id || req.id
      await RequestsAPI.reject(id, adminNote?.trim())
      const list = await RequestsAPI.list({ type: typeFilter, status: statusFilter })
      setRequests(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error('Reject failed', e)
    } finally {
      setViewId(null)
      setAdminNote('')
    }
  }

  // UI helpers
  const summary = (r) => {
    const p = r.payload || {}
    if (r.type === 'board') return `Add Board: ${p.name}`
    if (r.type === 'class') return `Add Class: ${p.name} ${p.boardName ? `→ Board: ${p.boardName}` : ''}`
    if (r.type === 'subject') return `Add Subject: ${p.name} ${p.className ? `→ Class: ${p.className}` : ''} ${p.boardName ? `→ Board: ${p.boardName}` : ''}`
    return ''
  }

  const statusBadge = (status) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status === 'pending' ? 'bg-yellow-100 text-yellow-800' : status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  )

  // Enter animation helper
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
  const modalEnter = useEnterAnimation(!!viewId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Requests</h1>
        <div className="text-sm text-gray-600">Total: <span className="font-semibold text-gray-900">{requests.length}</span></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="w-64 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Search by name, customer, board/class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="rounded-md border-gray-300" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="board">Board</option>
          <option value="class">Class</option>
          <option value="subject">Subject</option>
        </select>
        <select className="rounded-md border-gray-300" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="ml-auto text-sm text-gray-600">Showing {filtered.length} request(s)</div>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No requests found</td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={r._id || r.id}>
                  <td className="px-4 py-3 text-gray-900">{typeLabel(r.type)}</td>
                  <td className="px-4 py-3 text-gray-700">{summary(r)}</td>
                  <td className="px-4 py-3 text-gray-700">{r.customer?.name || '—'}<div className="text-xs text-gray-500">{r.customer?.email || ''}</div></td>
                  <td className="px-4 py-3 text-gray-600">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{statusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => { setViewId(r._id || r.id); setAdminNote(r.note || '') }}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
                    >View</button>
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => approve(r)} className="inline-flex items-center justify-center rounded-md bg-green-600 text-white px-2 py-1 text-sm hover:bg-green-700">Approve</button>
                        <button onClick={() => reject(r)} className="inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-1 text-sm hover:bg-red-700">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View/Decision Modal */}
      {current && (
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${modalEnter ? 'opacity-100' : 'opacity-0'}`} onClick={() => setViewId(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-200 ${modalEnter ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                <button onClick={() => setViewId(null)} className="text-gray-500 hover:text-gray-700" aria-label="Close">✕</button>
              </div>
              <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Type</p>
                  <p className="text-base font-semibold text-gray-900">{typeLabel(current.type)}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs uppercase text-gray-500">Requested</p>
                  <p className="text-base font-semibold text-gray-900">{new Date(current.createdAt).toLocaleString()}</p>
                  {current.decisionAt && (
                    <p className="text-sm text-gray-600">Decided: <span className="font-medium text-gray-800">{new Date(current.decisionAt).toLocaleString()}</span></p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-md p-4 md:col-span-2">
                  <p className="text-xs uppercase text-gray-500">Requested By</p>
                  <p className="text-base font-semibold text-gray-900">{current.customer?.name || '—'}</p>
                  {current.customer?.email && <p className="text-sm text-gray-600">{current.customer.email}</p>}
                </div>
                <div className="bg-gray-50 rounded-md p-4 md:col-span-2">
                  <p className="text-xs uppercase text-gray-500">Details</p>
                  {current.type === 'board' && (
                    <ul className="text-gray-900 text-sm list-disc ml-5">
                      <li>Board Name: <span className="font-medium">{current.payload?.name}</span></li>
                    </ul>
                  )}
                  {current.type === 'class' && (
                    <ul className="text-gray-900 text-sm list-disc ml-5">
                      <li>Class Name: <span className="font-medium">{current.payload?.name}</span></li>
                      <li>Board: <span className="font-medium">{current.payload?.boardName || boards.find(b => b.id === current.payload?.boardId)?.name || '—'}</span></li>
                    </ul>
                  )}
                  {current.type === 'subject' && (
                    <ul className="text-gray-900 text-sm list-disc ml-5">
                      <li>Subject Name: <span className="font-medium">{current.payload?.name}</span></li>
                      <li>Board: <span className="font-medium">{current.payload?.boardName || boards.find(b => b.id === current.payload?.boardId)?.name || '—'}</span></li>
                      <li>Class: <span className="font-medium">{current.payload?.className || (current.payload?.boardId && (classesMap[current.payload.boardId] || []).find(c => c.id === current.payload?.classId)?.name) || '—'}</span></li>
                    </ul>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Optional note for approval/rejection"
                  />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                {current.status === 'pending' ? (
                  <>
                    <button onClick={() => reject(current)} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Reject</button>
                    <button onClick={() => approve(current)} className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700">Approve</button>
                  </>
                ) : (
                  <button onClick={() => setViewId(null)} className="px-4 py-2 text-sm rounded-md border border-gray-300">Close</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Requests
