
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  parentName: string;
  parentId: string;
  teacherId: string;
  rollNo: string;
  feesDue: number;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  email?: string;
  assignedClasses: string[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  method: 'Cash' | 'UPI' | 'Card';
  term: string;
  receiptNo: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  linkedId?: string; // Teacher ID or Student ID (for parent)
}
