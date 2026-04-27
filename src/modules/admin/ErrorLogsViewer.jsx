// src/modules/admin/ErrorLogsViewer.jsx
import React, { useEffect, useState } from 'react'
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  limit,
  where 
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import Card from '../../components/ui/Card'
import { AlertCircle, Trash2 } from 'lucide-react'

export default function ErrorLogsViewer({ userId }) {
  const [errorLogs, setErrorLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'today', 'week'

  useEffect(() => {
    const errorLogsRef = collection(
      db,
      'artifacts',
      'language-hub-v2',
      'errorLogs'
    )

    // Query error logs ordered by newest first
    const q = query(
      errorLogsRef,
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })).filter(log => {
        if (filter === 'today') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const logDate = new Date(log.createdAt.toDate ? log.createdAt.toDate() : log.createdAt)
          logDate.setHours(0, 0, 0, 0)
          return logDate.getTime() === today.getTime()
        }
        return true
      })

      setErrorLogs(logs)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [filter])

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Loading error logs...</p>
      </Card>
    )
  }

  const getContextColor = (context) => {
    const colors = {
      'API Call': 'bg-red-100 text-red-800',
      'Firestore': 'bg-orange-100 text-orange-800',
      'Auth': 'bg-purple-100 text-purple-800',
      'Payment': 'bg-blue-100 text-blue-800',
      'default': 'bg-gray-100 text-gray-800',
    }
    return colors[context] || colors.default
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-bold">Error Logs ({errorLogs.length})</h2>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded text-sm ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            All Errors
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-2 rounded text-sm ${
              filter === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Today
          </button>
        </div>

        {errorLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No errors logged yet. Great! 🎉</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {errorLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded p-3 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getContextColor(log.context)}`}>
                        {log.context}
                      </span>
                      <span className="text-xs text-gray-500">
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-red-700 mb-1">
                      {log.errorMessage}
                    </p>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <p><strong>User:</strong> {log.userEmail}</p>
                      <p><strong>URL:</strong> {log.url}</p>
                      {log.errorStack && (
                        <details>
                          <summary className="cursor-pointer text-blue-600 hover:underline">
                            View Stack Trace
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-200 rounded text-xs overflow-auto max-h-40">
                            {log.errorStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Admin Access</h3>
        <p className="text-sm text-blue-800">
          This error log viewer is accessible to admin users only. All errors are logged in real-time and sent to{' '}
          <strong>{process.env.REACT_APP_ADMIN_ERROR_EMAIL || 'admin@example.com'}</strong>.
        </p>
      </Card>
    </div>
  )
}
