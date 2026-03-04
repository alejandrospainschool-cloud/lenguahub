// src/lib/organizationManager.js
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  increment,
  arrayUnion,
} from 'firebase/firestore'
import { db } from './firebase'
import { handleError } from './errorHandler'

/**
 * Invite a student to organization by email
 * @param {string} org_id - Organization ID
 * @param {string} email - Student email
 * @param {string} role - 'student' | 'teacher' (default: 'student')
 * @param {string} invited_by_uid - UID of inviter
 * @returns {Promise<{invitation_id: string}>}
 */
export const inviteToOrganization = async (
  org_id,
  email,
  role = 'student',
  invited_by_uid
) => {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const invitationData = {
      org_id,
      email: email.toLowerCase(),
      role,
      invited_by: invited_by_uid,
      created_at: serverTimestamp(),
      expires_at: expiresAt,
      used_at: null,
      used_by: null,
      max_uses: null,
      uses: 0,
    }

    const invRef = await addDoc(
      collection(db, 'invitations'),
      invitationData
    )

    // TODO: Send email invitation

    return { invitation_id: invRef.id, ...invitationData }
  } catch (err) {
    handleError(err, 'Invite to Organization')
    throw err
  }
}

/**
 * Accept an invitation and add user to organization
 * @param {string} invitation_id - Invitation ID
 * @param {string} uid - User ID accepting invitation
 * @param {string} email - User email (must match invitation)
 */
export const acceptInvitation = async (invitation_id, uid, email) => {
  try {
    const invRef = doc(db, 'invitations', invitation_id)
    const invSnap = await getDoc(invRef)

    if (!invSnap.exists()) {
      throw new Error('Invitation not found')
    }

    const inv = invSnap.data()

    // Validate invitation
    if (inv.email !== email.toLowerCase()) {
      throw new Error('Email does not match invitation')
    }

    if (new Date() > inv.expires_at.toDate()) {
      throw new Error('Invitation has expired')
    }

    if (inv.used_at) {
      throw new Error('Invitation already used')
    }

    // Add user to organization
    await setDoc(
      doc(db, 'organization-members', inv.org_id, uid),
      {
        uid,
        org_id: inv.org_id,
        role: inv.role,
        joined_at: serverTimestamp(),
        invited_by: inv.invited_by,
        can_manage_students: ['teacher', 'tutor'].includes(inv.role),
        can_view_analytics: ['teacher', 'tutor'].includes(inv.role),
        can_invite_users: ['teacher', 'tutor'].includes(inv.role),
      }
    )

    // Update org seats if role is student
    if (inv.role === 'student') {
      const orgRef = doc(db, 'organizations', inv.org_id)
      await updateDoc(orgRef, {
        seats_used: increment(1),
      })
    }

    // Mark invitation as used
    await updateDoc(invRef, {
      used_at: serverTimestamp(),
      used_by: uid,
      uses: increment(1),
    })

    return { success: true, org_id: inv.org_id }
  } catch (err) {
    handleError(err, 'Accept Invitation')
    throw err
  }
}

/**
 * Add user directly to organization (admin action)
 * @param {string} org_id - Organization ID
 * @param {string} uid - User ID to add
 * @param {string} displayName - User's name
 * @param {string} email - User's email
 * @param {string} role - User's role in org
 * @param {string} added_by_uid - UID of admin adding them
 */
export const addUserToOrganization = async (
  org_id,
  uid,
  displayName,
  email,
  role = 'student',
  added_by_uid
) => {
  try {
    // Add to organization-members
    await setDoc(
      doc(db, 'organization-members', org_id, uid),
      {
        uid,
        org_id,
        role,
        joined_at: serverTimestamp(),
        invited_by: added_by_uid,
        can_manage_students: ['teacher', 'tutor'].includes(role),
        can_view_analytics: ['teacher', 'tutor'].includes(role),
        can_invite_users: ['teacher', 'tutor'].includes(role),
      }
    )

    // Add to students subcollection if student role
    if (role === 'student') {
      const studentRef = doc(
        db,
        'organizations',
        org_id,
        'students',
        uid
      )
      await setDoc(
        studentRef,
        {
          uid,
          displayName,
          email,
          total_words: 0,
          streak_days: 0,
          level: 1,
          last_activity: null,
        }
      )

      // Increment org seats
      const orgRef = doc(db, 'organizations', org_id)
      await updateDoc(orgRef, {
        seats_used: increment(1),
      })
    }

    return { success: true }
  } catch (err) {
    handleError(err, 'Add User to Organization')
    throw err
  }
}

/**
 * Remove user from organization
 * @param {string} org_id - Organization ID
 * @param {string} uid - User ID to remove
 * @param {string} removed_by_uid - UID of admin removing them
 */
export const removeUserFromOrganization = async (org_id, uid, removed_by_uid) => {
  try {
    const memberRef = doc(db, 'organization-members', org_id, uid)
    const memberSnap = await getDoc(memberRef)

    if (!memberSnap.exists()) {
      throw new Error('User not found in organization')
    }

    const role = memberSnap.data().role

    // Delete membership
    await deleteDoc(memberRef)

    // If student, remove from students subcollection and decrement seats
    if (role === 'student') {
      const studentRef = doc(db, 'organizations', org_id, 'students', uid)
      await deleteDoc(studentRef)

      const orgRef = doc(db, 'organizations', org_id)
      await updateDoc(orgRef, {
        seats_used: increment(-1),
      })
    }

    return { success: true }
  } catch (err) {
    handleError(err, 'Remove User from Organization')
    throw err
  }
}

/**
 * Get all members of an organization
 * @param {string} org_id - Organization ID
 * @returns {Promise<Array>}
 */
export const getOrganizationMembers = async (org_id) => {
  try {
    const membersQuery = query(
      collection(db, 'organization-members'),
      where('org_id', '==', org_id)
    )
    const snapshot = await getDocs(membersQuery)

    const members = []
    for (const docSnap of snapshot.docs) {
      members.push({
        id: docSnap.id,
        ...docSnap.data(),
      })
    }

    return members
  } catch (err) {
    handleError(err, 'Get Organization Members')
    return []
  }
}

/**
 * Get all students in an organization
 * @param {string} org_id - Organization ID
 * @returns {Promise<Array>}
 */
export const getOrganizationStudents = async (org_id) => {
  try {
    const studentsRef = collection(db, 'organizations', org_id, 'students')
    const snapshot = await getDocs(studentsRef)

    const students = []
    for (const docSnap of snapshot.docs) {
      students.push({
        uid: docSnap.id,
        ...docSnap.data(),
      })
    }

    return students
  } catch (err) {
    handleError(err, 'Get Organization Students')
    return []
  }
}

/**
 * Get pending invitations for an organization
 * @param {string} org_id - Organization ID
 * @returns {Promise<Array>}
 */
export const getPendingInvitations = async (org_id) => {
  try {
    const invQuery = query(
      collection(db, 'invitations'),
      where('org_id', '==', org_id),
      where('used_at', '==', null)
    )
    const snapshot = await getDocs(invQuery)

    const invitations = []
    for (const docSnap of snapshot.docs) {
      // Check if expired
      const inv = docSnap.data()
      if (new Date() <= inv.expires_at.toDate()) {
        invitations.push({
          invitation_id: docSnap.id,
          ...inv,
        })
      }
    }

    return invitations
  } catch (err) {
    handleError(err, 'Get Pending Invitations')
    return []
  }
}

/**
 * Update organization metadata
 * @param {string} org_id - Organization ID
 * @param {Object} updates - Fields to update
 */
export const updateOrganization = async (org_id, updates) => {
  try {
    const orgRef = doc(db, 'organizations', org_id)
    await updateDoc(orgRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    handleError(err, 'Update Organization')
    throw err
  }
}

/**
 * Change user's role within organization
 * @param {string} org_id - Organization ID
 * @param {string} uid - User ID
 * @param {string} newRole - New role
 */
export const changeUserRole = async (org_id, uid, newRole) => {
  try {
    const memberRef = doc(db, 'organization-members', org_id, uid)
    await updateDoc(memberRef, {
      role: newRole,
      can_manage_students: ['teacher', 'tutor', 'admin'].includes(newRole),
      can_view_analytics: ['teacher', 'tutor', 'admin'].includes(newRole),
      can_invite_users: ['teacher', 'tutor', 'admin'].includes(newRole),
    })
  } catch (err) {
    handleError(err, 'Change User Role')
    throw err
  }
}
