// src/components/layout/WorkspaceSelector.jsx
import React, { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { setDefaultWorkspace } from '../../lib/workspaceManager'
import { ChevronDown, Plus, Home, Users } from 'lucide-react'
import clsx from 'clsx'

export default function WorkspaceSelector({ user }) {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace()
  const [isOpen, setIsOpen] = useState(false)

  if (!currentWorkspace) return null

  const handleSwitch = (orgId) => {
    switchWorkspace(orgId)
    if (user?.uid) {
      setDefaultWorkspace(user.uid, orgId)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Current Workspace Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
          'font-medium text-sm'
        )}
      >
        {currentWorkspace.type === 'personal' ? (
          <Home size={16} />
        ) : (
          <Users size={16} />
        )}
        <span className="max-w-[120px] truncate uppercase text-xs">
          {currentWorkspace.name}
        </span>
        <ChevronDown
          size={16}
          className={clsx('transition-transform', {
            'rotate-180': isOpen,
          })}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={clsx(
            'absolute top-full left-0 z-50 mt-1',
            'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
            'rounded-lg shadow-lg min-w-[200px]'
          )}
        >
          <div className="py-2">
            {/* Your Workspaces */}
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Your Workspace
              </p>
            </div>

            {/* Personal Workspace */}
            <button
              onClick={() =>
                handleSwitch('personal')
              }
              className={clsx(
                'w-full text-left px-3 py-2 transition-colors',
                currentWorkspace.org_id === 'personal'
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home size={14} />
                  <span className="text-sm">Personal</span>
                </div>
                {currentWorkspace.org_id === 'personal' && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your personal learning
              </p>
            </button>

            {/* Team Workspaces */}
            {workspaces.length > 1 && (
              <>
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 mt-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Teams
                  </p>
                </div>

                <div className="max-h-[240px] overflow-y-auto">
                  {workspaces
                    .filter((w) => w.org_id !== 'personal')
                    .map((workspace) => (
                      <button
                        key={workspace.org_id}
                        onClick={() => handleSwitch(workspace.org_id)}
                        className={clsx(
                          'w-full text-left px-3 py-2 transition-colors',
                          currentWorkspace.org_id === workspace.org_id
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Users size={14} />
                              <span className="text-sm truncate">
                                {workspace.name}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                              {workspace.type}
                            </p>
                          </div>
                          {currentWorkspace.org_id === workspace.org_id && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}

            {/* Create New Workspace Button */}
            <button
              disabled
              className={clsx(
                'w-full mt-2 px-3 py-2 border-t border-slate-200 dark:border-slate-700',
                'flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400',
                'hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors'
              )}
              title="Coming soon - use admin panel to create teams"
            >
              <Plus size={14} />
              Create Team
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
