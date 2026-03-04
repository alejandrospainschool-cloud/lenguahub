// src/modules/organizations/InviteStudents.jsx
import React, { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { inviteToOrganization, getPendingInvitations } from '../../lib/organizationManager'
import { CheckCircle, Copy, Mail, Plus, X } from 'lucide-react'
import { handleError } from '../../lib/errorHandler'

export default function InviteStudents({ org_id, currentUserUid }) {
  const { currentWorkspace } = useWorkspace()
  const [email, setEmail] = useState('')
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(null)

  // Load pending invitations on mount
  React.useEffect(() => {
    loadInvitations()
  }, [org_id])

  const loadInvitations = async () => {
    try {
      const pending = await getPendingInvitations(org_id || currentWorkspace.org_id)
      setInvitations(pending)
    } catch (err) {
      console.error('Failed to load invitations:', err)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email' })
      return
    }

    setLoading(true)
    try {
      const result = await inviteToOrganization(
        org_id || currentWorkspace.org_id,
        email,
        'student',
        currentUserUid
      )

      setInvitations([...invitations, result])
      setEmail('')
      setMessage({ type: 'success', text: 'Invitation sent!' })
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      handleError(err, 'Invite Student')
      setMessage({
        type: 'error',
        text: err.message || 'Failed to send invitation',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold mb-6">Invite Students</h2>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="mb-8">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Invite
            </button>
          </div>

          {message && (
            <div
              className={`mt-3 px-4 py-2 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}
        </form>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Mail size={18} />
              Pending Invitations ({invitations.length})
            </h3>

            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.invitation_id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                >
                  <div>
                    <p className="font-medium">{inv.email}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Expires{' '}
                      {inv.expires_at?.toDate?.().toLocaleDateString?.() ||
                        'in 7 days'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(inv.invitation_id)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      title="Copy invitation ID"
                    >
                      {copied === inv.invitation_id ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
              Students can accept invitations via email or by using the
              invitation ID.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
