// src/contexts/WorkspaceContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { handleError } from '../lib/errorHandler'

const WorkspaceContext = createContext()

export function WorkspaceProvider({ children, user }) {
  const [currentWorkspace, setCurrentWorkspace] = useState(null)
  const [workspaces, setWorkspaces] = useState([])
  const [userRole, setUserRole] = useState(null) // Role in current workspace
  const [loading, setLoading] = useState(true)

  // Initialize workspaces on user login
  useEffect(() => {
    if (!user?.uid) {
      setCurrentWorkspace(null)
      setWorkspaces([])
      setUserRole(null)
      setLoading(false)
      return
    }

    let unsubscribe

    const initializeWorkspaces = async () => {
      try {
        // Get user preferences (default workspace)
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.data()
        const defaultOrgId = userData?.defaultWorkspace || 'personal'

        // Fetch all orgs user belongs to
        const membershipQuery = query(
          collection(db, 'organization-members'),
          where('uid', '==', user.uid)
        )

        unsubscribe = onSnapshot(membershipQuery, async (snapshot) => {
          const userOrgs = snapshot.docs.map((doc) => ({
            org_id: doc.id.split('/')[0],
            ...doc.data(),
          }))

          // Always include personal workspace
          const personalWorkspace = {
            org_id: 'personal',
            name: 'Personal',
            type: 'personal',
            owner_uid: user.uid,
            tier: 'personal',
            seats_limit: null,
          }

          const allWorkspaces = [personalWorkspace, ...userOrgs]
          setWorkspaces(allWorkspaces)

          // Set to default or first workspace
          const activeWorkspace =
            allWorkspaces.find((w) => w.org_id === defaultOrgId) ||
            allWorkspaces[0]
          setCurrentWorkspace(activeWorkspace)
          setUserRole(activeWorkspace?.role || 'student')

          setLoading(false)
        })
      } catch (err) {
        handleError(err, 'Initialize Workspaces')
        setLoading(false)
      }
    }

    initializeWorkspaces()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user?.uid])

  const switchWorkspace = (org_id) => {
    const workspace = workspaces.find((w) => w.org_id === org_id)
    if (workspace) {
      setCurrentWorkspace(workspace)
      setUserRole(workspace.role || 'student')
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        userRole,
        loading,
        switchWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}
