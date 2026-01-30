import { User, UserRole } from '../types';

export const hasRole = (user: User | null, roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
};

export const canManageUsers = (user: User | null): boolean => {
    return hasRole(user, [UserRole.ADMIN]);
};

export const canViewAcademicRecords = (user: User | null): boolean => {
    return hasRole(user, [UserRole.ADMIN, UserRole.TEACHER, UserRole.SUPERVISOR, UserRole.PARENT]);
};

export const canEditAcademicRecords = (user: User | null): boolean => {
    return hasRole(user, [UserRole.ADMIN, UserRole.TEACHER]);
};

export const canManageDining = (user: User | null): boolean => {
    return hasRole(user, [UserRole.ADMIN, UserRole.CATERING_MANAGER, UserRole.BURSAR]);
};

export const canNotifyKitchen = (user: User | null): boolean => {
    return hasRole(user, [UserRole.ADMIN, UserRole.BURSAR, UserRole.SUPERVISOR]);
};

export const canManageMaintenance = (user: User | null): boolean => {
    return hasRole(user, [UserRole.ADMIN, UserRole.BURSAR]);
};

export const canManageBehavior = (user: User | null): boolean => {
    return hasRole(user, [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TEACHER]);
};

export const canViewAllStudents = (user: User | null): boolean => {
    return hasRole(user, [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TEACHER, UserRole.NURSE, UserRole.BURSAR]);
};

export const isParent = (user: User | null): boolean => {
    return hasRole(user, [UserRole.PARENT]);
};
