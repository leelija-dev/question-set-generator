import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const ToastCtx = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(1)

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((payload) => {
    const id = idRef.current++
    const t = { id, ...payload }
    setToasts((prev) => [...prev, t])
    if (payload.duration !== 0) {
      const ms = payload.duration ?? 3000
      setTimeout(() => remove(id), ms)
    }
    return id
  }, [remove])

  const api = useMemo(() => ({
    success: (msg, opts={}) => push({ type: 'success', message: msg, ...opts }),
    error: (msg, opts={}) => push({ type: 'error', message: msg, ...opts }),
    info: (msg, opts={}) => push({ type: 'info', message: msg, ...opts }),
    remove,
  }), [push, remove])

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onClose={remove} />
    </ToastCtx.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export const Toaster = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 w-[min(24rem,calc(100vw-2rem))]">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  )
}

const ToastItem = ({ toast, onClose }) => {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const color = toast.type === 'success' ? 'green' : toast.type === 'error' ? 'red' : 'indigo'
  return (
    <div className={`pointer-events-auto overflow-hidden rounded-md border shadow-md bg-white ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} transition-all duration-200 border-${color}-200`}> 
      <div className="p-3 flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-${color}-100 text-${color}-700`}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : 'i'}
        </span>
        <div className="flex-1 text-sm text-gray-800">{toast.message}</div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
    </div>
  )
}
