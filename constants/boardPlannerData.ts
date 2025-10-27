import { BoardPlannerEvent, CommunicationTemplate } from '../types';

export const mockCalendarEvents: BoardPlannerEvent[] = [
    {
        id: 'event1',
        title: 'Term 1 Begins',
        description: 'Start of the new academic session. Focus on foundational concepts.',
        date: 'April 1, 2025',
        icon: 'CalendarDaysIcon',
        color: 'blue',
    },
    {
        id: 'event2',
        title: 'Internal Assessment Cycle 1 (IA-1)',
        description: 'First round of internal assessments to gauge initial understanding.',
        date: 'Mid-July 2025',
        icon: 'ClipboardCheckIcon',
        color: 'yellow',
    },
    {
        id: 'event3',
        title: 'Remediation Cycle 1',
        description: 'Targeted intervention and re-teaching based on IA-1 results.',
        date: 'Early August 2025',
        icon: 'RefreshCwIcon',
        color: 'green',
    },
    {
        id: 'event4',
        title: 'Board Exam Opportunity 1',
        description: 'First attempt for board exams. Students can appear for subjects they feel prepared for.',
        date: 'Nov-Dec 2025',
        icon: 'AwardIcon',
        color: 'red',
    },
    {
        id: 'event5',
        title: 'Term 2 Begins',
        description: 'Focus shifts to the remaining syllabus for the second term.',
        date: 'December 2025',
        icon: 'CalendarDaysIcon',
        color: 'blue',
    },
    {
        id: 'event6',
        title: 'Internal Assessment Cycle 2 (IA-2)',
        description: 'Second round of internals covering the syllabus taught in Term 2.',
        date: 'Late January 2026',
        icon: 'ClipboardCheckIcon',
        color: 'yellow',
    },
    {
        id: 'event7',
        title: 'Remediation Cycle 2 & Pre-Boards',
        description: 'Final remediation and mock exams to prepare for the final board attempt.',
        date: 'February 2026',
        icon: 'RefreshCwIcon',
        color: 'green',
    },
    {
        id: 'event8',
        title: 'Board Exam Opportunity 2',
        description: 'Second and final attempt for board exams. Best-of-two scores will be considered.',
        date: 'Feb-Mar 2026',
        icon: 'AwardIcon',
        color: 'red',
    },
];

export const communicationTemplates: CommunicationTemplate[] = [
    {
        id: 'comm1',
        title: 'Understanding the New Twice-Yearly Board Exams',
        audience: 'Parents',
        content: `Dear Parents,\n\nAs per the new National Curriculum Framework (NCF), students will now have two opportunities to appear for their Board Examinations. This is a positive step designed to reduce stress and allow students to perform at their best.\n\nKey Highlights:\n- Two Exam Opportunities: One around Nov-Dec and the second in Feb-Mar.\n- Best-of-Two Scores: The final marksheet will reflect the best score a student achieves in each subject across the two attempts.\n- Reduced Pressure: This system allows students to focus on a smaller portion of the syllabus for each attempt and provides a chance for improvement.\n\nWe will be conducting regular internal assessments and remediation cycles to ensure your child is well-prepared. We look forward to your support in this new journey.\n\nSincerely,\n[School Name]`
    },
    {
        id: 'comm2',
        title: 'Your Path to Success: Twice-Yearly Board Exams',
        audience: 'Students',
        content: `Dear Students,\n\nGreat news! The board exam system has been updated to help you succeed with less stress. You will now have two chances to write your board exams each year.\n\nWhat this means for you:\n- Less Pressure: Focus on mastering the syllabus for one term at a time.\n- Chance to Improve: If you're not happy with your score in a subject from the first attempt, you can work on it and do better in the second.\n- Your Best Score Counts: Only your best performance in each subject will be used for your final result.\n\nLet's use this opportunity to learn deeply and perform our best. Your teachers are here to support you at every step.\n\nAll the best,\n[Principal's Name]`
    },
    {
        id: 'comm3',
        title: 'Upcoming Internal Assessment (IA-1) Schedule',
        audience: 'Parents',
        content: `Dear Parents,\n\nThis is to inform you that our first cycle of Internal Assessments (IA-1) will be conducted from [Start Date] to [End Date]. These assessments are an important part of the continuous evaluation process and help us identify areas where students may need additional support.\n\nThe schedule and syllabus have been shared with the students. We request you to ensure your child prepares well for these assessments.\n\nThank you,\n[School Name]`
    },
];
