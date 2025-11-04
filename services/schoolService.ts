import { AllDktData, UserProfile, TeacherSchedule, DktSkillState } from '../types';
import { curriculum } from '../constants/curriculum';
import { INITIAL_MASTERY } from './adaptiveEngine';

// Simulates a backend service for aggregating and analyzing school-wide data.

export const getSchoolOverviewMetrics = (students: UserProfile[], allDktData: AllDktData, allProgressData: any) => {
    const totalStudents = students.length;
    
    const studentIds = new Set(students.map(s => s.id));
    const lessonsCompleted = Object.entries(allProgressData)
        .filter(([userId]) => studentIds.has(Number(userId)))
        .flatMap(([,progress]) => Object.values(progress as any))
        .filter((p: any) => p.status === 'completed').length;

    let totalMasterySum = 0;
    let studentsWithData = 0;
    students.forEach(student => {
        const userDkt = allDktData[student.id];
        if (userDkt && Object.keys(userDkt).length > 0) {
            const total = (Object.values(userDkt) as DktSkillState[]).reduce((sum, skill) => sum + skill.mastery, 0);
            totalMasterySum += total / Object.keys(userDkt).length;
            studentsWithData++;
        }
    });

    const averageMastery = studentsWithData > 0 ? Math.round((totalMasterySum / studentsWithData) * 100) : 0;

    return {
        totalStudents,
        lessonsCompleted,
        averageMastery,
        activeStudents: totalStudents, // Mocked for now
    };
};

export const getChallengingConcepts = (students: UserProfile[], allDktData: AllDktData, grade: string, subject: string) => {
    const conceptMastery: { [concept: string]: { total: number, count: number } } = {};
    const chapters = curriculum[grade as keyof typeof curriculum]?.[subject] || [];

    chapters.forEach(chapter => {
        const skillId = `G${grade}-${subject}-${chapter}`;
        conceptMastery[chapter] = { total: 0, count: 0 };

        students.forEach(student => {
            const userDkt = allDktData[student.id];
            if (userDkt && userDkt[skillId]) {
                conceptMastery[chapter].total += userDkt[skillId].mastery;
                conceptMastery[chapter].count++;
            } else {
                // If a student hasn't started, count their mastery as the initial value
                conceptMastery[chapter].total += INITIAL_MASTERY;
                conceptMastery[chapter].count++;
            }
        });
    });

    return Object.entries(conceptMastery)
        .map(([concept, data]) => ({
            concept,
            averageMastery: data.count > 0 ? Math.round((data.total / data.count) * 100) : 0,
        }))
        .filter(c => c.averageMastery < 80) // Only show concepts that are not fully mastered
        .sort((a, b) => a.averageMastery - b.averageMastery)
        .slice(0, 5); // Top 5
};

export const getStudentsToWatch = (students: UserProfile[], allDktData: AllDktData) => {
    return students.map(student => {
        const userDkt = allDktData[student.id];
        let overallMastery = 0;
        let trend = 0; // -1 for down, 0 for stable, 1 for up

        if (userDkt && Object.keys(userDkt).length > 0) {
            const skills = Object.values(userDkt) as DktSkillState[];
            overallMastery = Math.round((skills.reduce((sum, s) => sum + s.mastery, 0) / skills.length) * 100);

            // Simple trend analysis: look at the last 3 attempts for any skill
            const lastAttempts = skills.flatMap(s => s.history).sort((a,b) => a.timestamp - b.timestamp).slice(-3);
            if (lastAttempts.length >= 3) {
                const recentCorrect = lastAttempts.filter(a => a.correct).length;
                if (recentCorrect === 0) trend = -1;
                else if (recentCorrect === 3) trend = 1;
            }
        }
        return { student, overallMastery, trend };
    })
    .filter(s => s.overallMastery < 60 || s.trend === -1) // Filter for low mastery or downward trend
    .sort((a, b) => a.overallMastery - b.overallMastery)
    .slice(0, 5); // Top 5
};

export const getClassPacingStatus = (grade: string, teacherSchedules: TeacherSchedule[]) => {
    const gradeSchedules = teacherSchedules.filter(s => s.grade === grade);
    if (gradeSchedules.length === 0) return [];
    
    // Group by subject
    const bySubject = gradeSchedules.reduce((acc, schedule) => {
        if (!acc[schedule.subject]) {
            acc[schedule.subject] = { total: 0, taught: 0 };
        }
        acc[schedule.subject].total++;
        if (schedule.isTaught) {
            acc[schedule.subject].taught++;
        }
        return acc;
    }, {} as { [subject: string]: { total: number, taught: number } });

    return Object.entries(bySubject).map(([subject, data]) => ({
        subject,
        progress: data.total > 0 ? Math.round((data.taught / data.total) * 100) : 0,
    }));
};