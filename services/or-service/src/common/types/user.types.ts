export enum UserRole {
  ADMIN = 'admin',
  SCHEDULER = 'scheduler',
  SURGEON = 'surgeon',
}

export interface UserPermissions {
  canCreateReservations: boolean;
  canUpdateReservations: boolean;
  canDeleteReservations: boolean;
  canViewAllReservations: boolean;
  canManageUsers: boolean;
  canManageOperatingRooms: boolean;
  canUploadFiles: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  [UserRole.ADMIN]: {
    canCreateReservations: true,
    canUpdateReservations: true,
    canDeleteReservations: true,
    canViewAllReservations: true,
    canManageUsers: true,
    canManageOperatingRooms: true,
    canUploadFiles: true,
  },
  [UserRole.SCHEDULER]: {
    canCreateReservations: true,
    canUpdateReservations: true,
    canDeleteReservations: true,
    canViewAllReservations: true,
    canManageUsers: false,
    canManageOperatingRooms: true,
    canUploadFiles: true,
  },
  [UserRole.SURGEON]: {
    canCreateReservations: true,
    canUpdateReservations: false,
    canDeleteReservations: false,
    canViewAllReservations: false,
    canManageUsers: false,
    canManageOperatingRooms: false,
    canUploadFiles: true,
  },
};

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}
