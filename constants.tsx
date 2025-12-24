
import { UserRole, Student, Teacher, User, AttendanceStatus, AttendanceRecord, PaymentRecord } from './types';

export const STUDENTS: Student[] = [
  { id: 's1', name: 'Alex Johnson', grade: '10th', parentName: 'Mark Johnson', parentId: 'p1', teacherId: 't1', rollNo: '101', feesDue: 500 },
  { id: 's2', name: 'Sophie Miller', grade: '10th', parentName: 'Sarah Miller', parentId: 'p2', teacherId: 't1', rollNo: '102', feesDue: 0 },
  { id: 's3', name: 'James Wilson', grade: '10th', parentName: 'Emma Wilson', parentId: 'p3', teacherId: 't2', rollNo: '103', feesDue: 1200 },
  { id: 's4', name: 'Lily Chen', grade: '9th', parentName: 'David Chen', parentId: 'p4', teacherId: 't2', rollNo: '201', feesDue: 300 },
];

export const TEACHERS: Teacher[] = [
  { id: 't1', name: 'Dr. Emily Smith', subject: 'Mathematics', assignedClasses: ['10th', '12th'] },
  { id: 't2', name: 'Prof. Michael Brown', subject: 'Science', assignedClasses: ['9th', '10th'] },
];

export const USERS: User[] = [
  { id: 'u1', name: 'Super Admin', role: UserRole.ADMIN, email: 'admin@eduflow.com' },
  { id: 'u2', name: 'Emily Smith', role: UserRole.TEACHER, email: 'emily@eduflow.com', linkedId: 't1' },
  { id: 'u3', name: 'Mark Johnson', role: UserRole.PARENT, email: 'mark@gmail.com', linkedId: 's1' },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', studentId: 's1', date: '2023-10-01', status: AttendanceStatus.PRESENT },
  { id: 'a2', studentId: 's1', date: '2023-10-02', status: AttendanceStatus.ABSENT },
  { id: 'a3', studentId: 's1', date: '2023-10-03', status: AttendanceStatus.PRESENT },
  { id: 'a4', studentId: 's2', date: '2023-10-01', status: AttendanceStatus.PRESENT },
  { id: 'a5', studentId: 's2', date: '2023-10-02', status: AttendanceStatus.LATE },
];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: 'pay1', studentId: 's1', amount: 1500, date: '2023-09-15', method: 'UPI', term: 'First Quarter', receiptNo: 'RCP-001' },
  { id: 'pay2', studentId: 's3', amount: 800, date: '2023-09-10', method: 'Cash', term: 'Registration', receiptNo: 'RCP-002' },
];
