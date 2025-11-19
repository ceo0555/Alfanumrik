/**
 * Data Isolation Utilities for Multi-Tenancy
 * Ensures data is properly filtered by school context
 */

import { UserProfile, Course, Assignment } from '../types';

export class DataIsolationService {
    /**
     * Filter user profiles by school ID
     */
    static filterUsersBySchool(users: UserProfile[], schoolId: string | null): UserProfile[] {
        if (!schoolId) return users;
        return users.filter(user => user.schoolId === schoolId);
    }

    /**
     * Filter courses by school ID (via teacher's school)
     */
    static filterCoursesBySchool(
        courses: Course[],
        users: UserProfile[],
        schoolId: string | null
    ): Course[] {
        if (!schoolId) return courses;
        
        const schoolTeacherIds = users
            .filter(u => u.schoolId === schoolId && u.schoolRole)
            .map(u => u.id);
        
        return courses.filter(course => schoolTeacherIds.includes(course.teacherId));
    }

    /**
     * Filter assignments by school ID
     */
    static filterAssignmentsBySchool(
        assignments: Assignment[],
        users: UserProfile[],
        schoolId: string | null
    ): Assignment[] {
        if (!schoolId) return assignments;
        
        const schoolUserIds = users
            .filter(u => u.schoolId === schoolId)
            .map(u => u.id);
        
        return assignments.filter(assignment =>
            assignment.assignedStudentIds && 
            assignment.assignedStudentIds.some((id: number) => schoolUserIds.includes(id))
        );
    }

    /**
     * Validate user access to resource
     */
    static validateAccess(
        userSchoolId: string | undefined,
        resourceSchoolId: string | undefined
    ): boolean {
        // Super admin (no school ID) has access to everything
        if (!userSchoolId) return true;
        
        // User can only access resources from their school
        return userSchoolId === resourceSchoolId;
    }

    /**
     * Sanitize data before cross-school operations
     */
    static sanitizeForExport(data: any): any {
        const sanitized = { ...data };
        
        // Remove sensitive fields
        delete sanitized.password;
        delete sanitized.apiKey;
        delete sanitized.secretToken;
        delete sanitized.privateNotes;
        
        return sanitized;
    }

    /**
     * Generate school-specific ID
     */
    static generateSchoolId(schoolCode: string, entityType: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 7);
        return `${schoolCode}-${entityType}-${timestamp}-${random}`.toLowerCase();
    }

    /**
     * Validate school capacity limits
     */
    static validateCapacity(
        currentCount: number,
        maxAllowed: number,
        entityType: string
    ): { valid: boolean; message?: string } {
        if (currentCount >= maxAllowed) {
            return {
                valid: false,
                message: `Maximum ${entityType} capacity (${maxAllowed}) reached for this school.`,
            };
        }
        
        if (currentCount >= maxAllowed * 0.9) {
            return {
                valid: true,
                message: `Warning: Approaching ${entityType} capacity limit (${currentCount}/${maxAllowed}).`,
            };
        }
        
        return { valid: true };
    }
}

/**
 * Role-Based Access Control
 */
export class RBACService {
    private static permissions = {
        super_admin: ['*'], // Full access
        principal: [
            'view_all_school_data',
            'manage_teachers',
            'manage_students',
            'manage_courses',
            'view_reports',
            'manage_settings',
        ],
        teacher: [
            'view_own_courses',
            'manage_own_courses',
            'grade_assignments',
            'view_students',
            'create_assignments',
        ],
        student: [
            'view_own_data',
            'submit_assignments',
            'view_courses',
            'take_quizzes',
        ],
        parent: [
            'view_child_data',
            'view_child_progress',
            'communicate_teachers',
        ],
    };

    static hasPermission(userRole: string, permission: string): boolean {
        const rolePermissions = this.permissions[userRole as keyof typeof this.permissions] || [];
        
        // Super admin has all permissions
        if (rolePermissions.includes('*')) return true;
        
        return rolePermissions.includes(permission);
    }

    static getPermissions(userRole: string): string[] {
        return this.permissions[userRole as keyof typeof this.permissions] || [];
    }

    static canAccessResource(
        userRole: string,
        resourceType: string,
        ownerId?: number,
        userId?: number
    ): boolean {
        // Super admin can access everything
        if (userRole === 'super_admin') return true;
        
        // Teachers can access their own resources
        if (userRole === 'teacher' && resourceType === 'course' && ownerId === userId) {
            return true;
        }
        
        // Students can access assigned resources
        if (userRole === 'student' && resourceType === 'assignment') {
            return true; // Further filtering happens in data layer
        }
        
        return false;
    }
}

/**
 * Audit Logger for compliance
 */
export class AuditLogger {
    static log(
        action: string,
        userId: number,
        schoolId: string,
        details: any = {}
    ): void {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            userId,
            schoolId,
            details,
            ipAddress: 'xxx.xxx.xxx.xxx', // Would come from request in real implementation
        };
        
        // In production, this would write to a secure audit log
        console.log('[AUDIT]', logEntry);
        
        // Store in localStorage for demo purposes
        const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        auditLogs.push(logEntry);
        
        // Keep only last 1000 entries
        if (auditLogs.length > 1000) {
            auditLogs.shift();
        }
        
        localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
    }

    static getRecentLogs(schoolId?: string, limit: number = 100): any[] {
        const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        
        let filtered = auditLogs;
        if (schoolId) {
            filtered = auditLogs.filter((log: any) => log.schoolId === schoolId);
        }
        
        return filtered.slice(-limit).reverse();
    }
}
