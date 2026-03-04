// src/lib/workspaceManager.js
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore'
import { db } from './firebase'
import { handleError } from './errorHandler'

/**
 * Create a new organization/workspace
 * @param {string} name - Organization name
 * @param {string} type - 'tutor-lite' | 'tutor-pro' | 'school'
 * @param {string} ownerUid - Firebase UID of owner
 * @returns {Promise<{org_id: string, ...orgData}>}
 */
export const createOrganization = async (name, type, ownerUid) => {
  try {
    // Generate org_id (simple slug from name + timestamp)
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    const org_id = `${slug}-${Date.now()}`

    const orgData = {
      org_id,
      name,
      type,
      owner_uid: ownerUid,
      tier: type,
      seats_used: 1, // Owner counts as a seat
      seats_limit: type === 'tutor-lite' ? 10 : type === 'tutor-pro' ? null : null,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Create org document
    await setDoc(doc(db, 'organizations', org_id), orgData)

    // Add owner to organization-members
    await setDoc(
      doc(db, 'organization-members', org_id, ownerUid),
      {
        uid: ownerUid,
        org_id,
        role: 'owner',
        joined_at: serverTimestamp(),
        invited_by: null,
        can_manage_students: true,
        can_view_analytics: true,
        can_invite_users: true,
      }
    )

    return { org_id, ...orgData }
  } catch (err) {
    handleError(err, 'Create Organization')
    throw err
  }
}

/**
 * Get all organizations a user belongs to
 * @param {string} uid - User ID
 * @returns {Promise<Array>}
 */
export const getUserOrganizations = async (uid) => {
  try {
    const orgsQuery = query(
      collection(db, 'organization-members'),
      where('uid', '==', uid)
    )
    const snapshot = await getDocs(orgsQuery)

    const orgs = []
    for (const docSnap of snapshot.docs) {
      const orgId = docSnap.id.split('/')[0]
      const orgRef = doc(db, 'organizations', orgId)
      const orgSnap = await getDoc(orgRef)
      if (orgSnap.exists()) {
        orgs.push({
          org_id: orgId,
          ...orgSnap.data(),
          role: docSnap.data().role,
        })
      }
    }
    return orgs
  } catch (err) {
    handleError(err, 'Get User Organizations')
    return []
  }
}

/**
 * Get organization details
 * @param {string} org_id - Organization ID
 * @returns {Promise<Object>}
 */
export const getOrganization = async (org_id) => {
  try {
    const orgRef = doc(db, 'organizations', org_id)
    const snap = await getDoc(orgRef)
    if (snap.exists()) {
      return { org_id, ...snap.data() }
    }
    return null
  } catch (err) {
    handleError(err, 'Get Organization')
    return null
  }
}

/**
 * Get user's role in an organization
 * @param {string} org_id - Organization ID
 * @param {string} uid - User ID
 * @returns {Promise<string|null>} - Role or null if not member
 */
export const getUserRoleInOrg = async (org_id, uid) => {
  try {
    const memberRef = doc(db, 'organization-members', org_id, uid)
    const snap = await getDoc(memberRef)
    if (snap.exists()) {
      return snap.data().role
    }
    return null
  } catch (err) {
    handleError(err, 'Get User Role in Org')
    return null
  }
}

/**
 * Check if organization can add more seats
 * @param {string} org_id - Organization ID
 * @returns {Promise<{canAdd: boolean, seatsRemaining: number}>}
 */
export const checkSeatAvailability = async (org_id) => {
  try {
    const org = await getOrganization(org_id)
    if (!org) {
      return { canAdd: false, seatsRemaining: 0 }
    }

    const { seats_used, seats_limit } = org

    // Unlimited seats
    if (seats_limit === null) {
      return { canAdd: true, seatsRemaining: Infinity }
    }

    // Limited seats
    const canAdd = seats_used < seats_limit
    const seatsRemaining = seats_limit - seats_used

    return { canAdd, seatsRemaining }
  } catch (err) {
    handleError(err, 'Check Seat Availability')
    return { canAdd: false, seatsRemaining: 0 }
  }
}

/**
 * Update default workspace for user
 * @param {string} uid - User ID
 * @param {string} org_id - Organization ID to set as default
 */
export const setDefaultWorkspace = async (uid, org_id) => {
  try {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      defaultWorkspace: org_id,
    })
  } catch (err) {
    handleError(err, 'Set Default Workspace')
    throw err
  }
}

/**
 * Get organization tier info and feature availability
 * @param {string} org_id - Organization ID
 * @returns {Promise<{tier: string, features: Object}>}
 */
export const getOrgFeatures = async (org_id) => {
  try {
    const org = await getOrganization(org_id)
    if (!org) return { tier: 'none', features: {} }

    const featuresByTier = {
      personal: {
        word_bank: true,
        study_modules: true,
        ai_tools: true,
        lesson_tracking: false,
        team_management: false,
        analytics: false,
        max_students: 0,
      },
      'tutor-lite': {
        word_bank: true,
        study_modules: true,
        ai_tools: true,
        lesson_tracking: true,
        team_management: true,
        analytics: true,
        max_students: 10,
      },
      'tutor-pro': {
        word_bank: true,
        study_modules: true,
        ai_tools: true,
        lesson_tracking: true,
        team_management: true,
        analytics: true,
        max_students: Infinity,
      },
      school: {
        word_bank: true,
        study_modules: true,
        ai_tools: true,
        lesson_tracking: true,
        team_management: true,
        analytics: true,
        class_management: true,
        bulk_import: true,
        max_students: 'unlimited',
      },
    }

    return {
      tier: org.tier,
      features: featuresByTier[org.tier] || featuresByTier.personal,
      seatsUsed: org.seats_used,
      seatsLimit: org.seats_limit,
    }
  } catch (err) {
    handleError(err, 'Get Org Features')
    return { tier: 'personal', features: {} }
  }
}
