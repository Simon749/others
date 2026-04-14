// app/api/middleware/permissions.js
// PHASE 1: PERMISSION CHECKING - WHO CAN DO WHAT

/**
 * USER ROLES IN THE SYSTEM
 */
export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",     // Can do everything
  ADMIN: "admin",                  // School admin - full access
  CLASS_TEACHER: "class_teacher",  // Can manage only their assigned class
  ACCOUNTANT: "accountant",        // View-only access to reports
  PARENT: "parent",                // View own child's data only
  STUDENT: "student",              // View own data only
};

/**
 * PERMISSION MATRIX - Who can do what
 */
export const PERMISSIONS = {
  // Attendance operations
  "attendance:view": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLASS_TEACHER, USER_ROLES.PARENT, USER_ROLES.STUDENT],
  "attendance:create": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLASS_TEACHER],
  "attendance:edit": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLASS_TEACHER],
  "attendance:delete": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
  "attendance:bulk_edit": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLASS_TEACHER],

  // Audit operations
  "audit:view": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLASS_TEACHER],
  "audit:view_own": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLASS_TEACHER, USER_ROLES.PARENT],

  // Reports
  "reports:view": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CLASS_TEACHER, USER_ROLES.ACCOUNTANT],
  "reports:export": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT],

  // User management
  "users:manage": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
  "users:view": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],

  // Settings
  "settings:manage": [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
};

/**
 * Check if user has permission to perform action
 * @param {string} userRole - User's role
 * @param {string} action - Action to perform (e.g., "attendance:edit")
 * @param {object} context - Additional context (grade, stream, userId)
 * @returns {boolean}
 */
export const checkPermission = (userRole, action, context = {}) => {

  console.log("Checking:", action, "For Role:", userRole);
  console.log("Allowed Roles:", PERMISSIONS[action]);
  console.log("Is Included:", PERMISSIONS[action]?.includes(userRole));

  // Super admin can do anything
  if (userRole === USER_ROLES.SUPER_ADMIN) return true;

  // Check if action is allowed for this role
  const allowedRoles = PERMISSIONS[action];

  if (!allowedRoles) {
    console.warn(`Unknown action: ${action}`);
    return false;
  }

  return allowedRoles.includes(userRole.toLowerCase());
};

/**
 * Check if teacher can edit this specific class
 * @param {object} user - User object {id, role, gradeId, streamId}
 * @param {number} gradeId - Grade ID being edited
 * @param {number} streamId - Stream ID being edited
 * @returns {boolean}
 */
export const canEditClass = (user, gradeId, streamId) => {
  // Admin can edit any class
  if (user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.ADMIN) {
    return true;
  }

  // Class teacher can only edit their assigned class
  if (user.role === USER_ROLES.CLASS_TEACHER) {
    return user.gradeId === gradeId && user.streamId === streamId;
  }

  // Others cannot edit
  return false;
};

/**
 * Check if user can view attendance for a student
 * @param {object} user - User object
 * @param {number} studentId - Student ID
 * @param {object} student - Student object {id, gradeId, streamId}
 * @returns {boolean}
 */
export const canViewStudent = (user, studentId, student) => {
  // Admin can view any student
  if (user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.ADMIN) {
    return true;
  }

  // Class teacher can view students in their class
  if (user.role === USER_ROLES.CLASS_TEACHER) {
    return user.gradeId === student.gradeId && user.streamId === student.streamId;
  }

  // Parent can only view their own child
  if (user.role === USER_ROLES.PARENT) {
    return user.childId === studentId; // Assumes parent has childId linked
  }

  // Student can only view self
  if (user.role === USER_ROLES.STUDENT) {
    return user.studentId === studentId; // Assumes student user has studentId linked
  }

  return false;
};

/**
 * Format permission denied response
 */
export const permissionDeniedResponse = (userId, action, reason = "") => {
  return {
    success: false,
    error: "Permission Denied",
    message: `User ${userId} is not authorized to perform "${action}"${reason ? ": " + reason : ""}`,
    timestamp: new Date().toISOString(),
    statusCode: 403,
  };
};

/**
 * Middleware function to check permission (for Express-style middleware)
 */
export const requirePermission = (action) => {
  return async (req, res, next) => {
    try {
      // Get user from session/JWT (assumes auth middleware sets req.user)
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User not authenticated",
        });
      }

      if (!checkPermission(user.role, action)) {
        return res.status(403).json(permissionDeniedResponse(user.id, action));
      }

      next();
    } catch (error) {
      res.status(500).json({ error: "Permission check failed" });
    }
  };
};
