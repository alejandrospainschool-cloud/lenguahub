// src/modules/organizations/CreateOrganization.jsx
import React, { useState } from 'react'
import { createOrganization } from '../../lib/workspaceManager'
import { useNavigate } from 'react-router-dom'
import { handleError } from '../../lib/errorHandler'

export default function CreateOrganization({ currentUserUid, onSuccess }) {
  const navigate = useNavigate()
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('tutor-lite')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!orgName.trim()) {
      setError('Please enter an organization name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const org = await createOrganization(orgName, orgType, currentUserUid)
      
      if (onSuccess) {
        onSuccess(org)
      } else {
        // Redirect to team settings
        navigate(`/teams/${org.org_id}`)
      }
    } catch (err) {
      handleError(err, 'Create Organization')
      setError(err.message || 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <h2 className="text-2xl font-bold mb-6">Create Your Team</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Organization Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Team Name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g., My Spanish Students"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            This will be visible to your team members
          </p>
        </div>

        {/* Organization Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Team Type</label>
          <select
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="tutor-lite">Tutor (Up to 10 students)</option>
            <option value="tutor-pro">Tutor Pro (Unlimited students)</option>
            <option value="school">School</option>
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            You can upgrade or downgrade later
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Creating...' : 'Create Team'}
        </button>
      </form>

      {/* Pricing Info */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm font-medium mb-3">Pricing</p>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div>
            <strong>Tutor Lite:</strong> £50/mo (up to 10 students)
          </div>
          <div>
            <strong>Tutor Pro:</strong> £100/mo (unlimited students)
          </div>
          <div>
            <strong>School:</strong> £5 per student/mo
          </div>
        </div>
      </div>
    </div>
  )
}
