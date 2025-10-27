import { TeacherSchedule } from '../types';

export const mockTeacherSchedule: TeacherSchedule[] = [
    {
        id: 'ts1',
        period: 1,
        time: '09:00 - 09:40',
        grade: '10',
        subject: 'Science',
        topic: 'Chemical Reactions and Equations',
        chapterId: 'G10-Science-Chemical Reactions and Equations',
    },
    {
        id: 'ts2',
        period: 2,
        time: '09:40 - 10:20',
        grade: '9',
        subject: 'Maths',
        topic: 'Number Systems',
        chapterId: 'G9-Maths-Number Systems',
    },
    {
        id: 'ts3',
        period: 3,
        time: '10:20 - 11:00',
        grade: '10',
        subject: 'Maths',
        topic: 'Real Numbers',
        chapterId: 'G10-Maths-Real Numbers',
    },
    {
        id: 'ts4',
        period: 4,
        time: '11:20 - 12:00',
        grade: '10',
        subject: 'Science',
        topic: 'Acids, Bases and Salts',
        chapterId: 'G10-Science-Acids, Bases and Salts',
    },
];
