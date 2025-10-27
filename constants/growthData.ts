import { AfterSchoolProgram, FacilityBooking } from '../types';

export const mockAfterSchoolPrograms: AfterSchoolProgram[] = [
    { id: 'asp1', title: 'Robotics Club', instructor: 'Mr. Verma', enrollment: 18, capacity: 20 },
    { id: 'asp2', title: 'Advanced Mathematics', instructor: 'Ms. Sharma', enrollment: 12, capacity: 15 },
    { id: 'asp3', title: 'Debate & Public Speaking', instructor: 'Mr. Singh', enrollment: 25, capacity: 25 },
    { id: 'asp4', title: 'Creative Writing', instructor: 'Ms. Das', enrollment: 9, capacity: 15 },
];

export const mockFacilityBookings: FacilityBooking[] = [
    { id: 'fb1', facility: 'Auditorium', bookedBy: 'Annual Day Committee', date: '2025-10-15', startTime: '09:00', endTime: '17:00', purpose: 'Annual Day Rehearsal' },
    { id: 'fb2', facility: 'Sports Ground', bookedBy: 'External Sports Academy', date: '2025-10-18', startTime: '16:00', endTime: '18:00', purpose: 'Cricket Coaching' },
    { id: 'fb3', facility: 'Computer Lab', bookedBy: 'Coding Bootcamp Inc.', date: '2025-10-19', startTime: '10:00', endTime: '14:00', purpose: 'Weekend Coding Workshop' },
];
