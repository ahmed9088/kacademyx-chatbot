/**
 * Server-side auth utilities for production-safe API routes
 * Eliminates redundant session checks in hot paths
 */

import { auth } from '@/auth';

/**
 * Use ONLY for initial page loads or admin-only endpoints
 * NOT for regular chat/message operations
 */
export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }
    return session.user;
}

/**
 * Validates that a resource belongs to the requesting user
 * Replaces session validation for ownership checks
 */
export function validateOwnership(resourceUserId, requestUserId) {
    if (!resourceUserId || !requestUserId) {
        throw new Error('Invalid user IDs for ownership validation');
    }
    if (resourceUserId !== requestUserId) {
        throw new Error('Forbidden: Resource does not belong to user');
    }
}
