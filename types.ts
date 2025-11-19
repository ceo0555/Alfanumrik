// --- MULTI-TENANCY & SCHOOL TYPES ---

export interface School {
  id: string;
  name: string;
  code: string; // Unique school code
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  principalName: string;
  totalStudents: number;
  totalTeachers: number;
  established: string;
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  subscriptionExpiry: string;
  isActive: boolean;
  settings: SchoolSettings;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolSettings {
  allowParentAccess: boolean;
  enableAIFeatures: boolean;
  enableLMS: boolean;
  enableAssessments: boolean;
  maxStudentsPerClass: number;
  academicYearStart: string;
  academicYearEnd: string;
  gradeSystem: 'percentage' | 'gpa' | 'letter';
  attendanceRequired: boolean;
  customDomain?: string;
}

export interface BulkImportResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  importedIds: number[];
}

export interface PerformanceMetrics {
  activeUsers: number;
  totalLogins: number;
  avgSessionDuration: number;
  apiResponseTime: number;
  errorRate: number;
  timestamp: string;
}

// --- NEW CURRICULUM & LESSON PACK TYPES ---

export interface SyllabusMarkingScheme {
  K: number;
  U: number;
  A: number;
  HOTS: number;
}

export interface SyllabusChapterTopic {
  topic_id: string;
  topic_name: string;
  learning_outcomes: string[];
  bloom_levels: string[];
  prerequisites: string[];
  common_misconceptions: string[];
  cross_links: string[];
  estimated_time_mins: number;
  marking_scheme_mapping: SyllabusMarkingScheme;
}

export interface SyllabusUnit {
  unit_no: number;
  unit_name: string;
  weightage_marks: number;
  lesson_hours: number;
  chapters_or_topics: SyllabusChapterTopic[];
}

export interface WorkedExample {
  prompt: string;
  solution: string;
  why_it_works: string;
}

export interface GuidedPractice {
  question: string;
  hint: string;
  stepwise_solution: string;
}

export interface IndependentPractice {
  question: string;
  answer_key: string;
}

export interface HOTSQuestion {
  question: string;
  exemplar_answer: string;
}

export interface CommonErrorAndFix {
  error: string;
  fix: string;
}

export interface FillInTheBlanks {
  sentence_parts: string[];
  options: string[];
  correct_answer: string;
}

export interface InteractiveSimulation {
  description: string;
  concept_link: string; // e.g., a link to a relevant section or just a concept name
}

export interface QuickCheck {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}


// --- STRUCTURED CONTENT FOR EXPLANATIONS ---

export type StructuredContentType = 'heading' | 'paragraph' | 'list' | 'key_term' | 'note' | 'diagram';

export interface HeadingBlock {
    type: 'heading';
    level: 2 | 3 | 4; // h2, h3, h4
    content: string;
}

export interface ParagraphBlock {
    type: 'paragraph';
    content: string;
}

export interface ListBlock {
    type: 'list';
    items: string[];
}

export interface KeyTermBlock {
    type: 'key_term';
    term: string;
    definition: string;
}

export interface NoteBlock {
    type: 'note';
    content: string;
}

export interface DiagramHotspot {
    x: number; // percentage from left (0.0 to 1.0)
    y: number; // percentage from top (0.0 to 1.0)
    label: string;
    details: string;
}

export interface DiagramBlock {
    type: 'diagram';
    imageUrl: string;
    altText: string;
    hotspots: DiagramHotspot[];
}


export type StructuredContent = HeadingBlock | ParagraphBlock | ListBlock | KeyTermBlock | NoteBlock | DiagramBlock;


// --- NEW INTERACTIVE VIDEO TYPES ---
export interface VideoQuestion {
  timestamp: number; // in seconds
  question_text: string;
  options: string[];
  correct_answer: string;
  feedback_correct: string;

  feedback_incorrect: string;
  branch_on_incorrect?: number; // timestamp to jump to on incorrect answer
}

export interface InteractiveVideo {
  title: string;
  video_url: string; // URL to a placeholder or actual video
  script: VideoQuestion[];
}


export interface StudentExplanation {
  core_explanation: StructuredContent[];
  quick_check: QuickCheck;
  worked_examples: WorkedExample[];
  guided_practice: GuidedPractice[];
  independent_practice: IndependentPractice[];
  HOTS: HOTSQuestion[];
  common_errors_and_fixes: CommonErrorAndFix[];
  fill_in_the_blanks: FillInTheBlanks[];
  interactive_simulations: InteractiveSimulation[];
  interactive_videos: InteractiveVideo[];
  real_world_applications: string[];
  matching_quizzes: MatchingQuiz[];
}

export interface MatchingQuiz {
  instruction: string;
  pairs: { term: string; definition: string }[];
}

export interface SubQuestion {
    q_id: string;
    question: string;
    marks: number;
    answer: string;
    rubric: string;
}

export interface QuestionPoolItem {
  q_id: string;
  type: 'MCQ' | 'SA' | 'LA' | 'Case' | 'Competency' | 'VerbalExplanation';
  marks: number;
  difficulty: 'E' | 'M' | 'H';
  bloom: string;
  question: string;
  options?: string[];
  answer: string;
  rubric: string;
  tags?: string[];
  source?: string; // e.g., "CBSE 2023"
  imageUrl?: string; // For questions with a diagram
  requiresDrawing?: boolean; // For questions that require drawing an answer
  // NEW FIELDS for CBE
  competency: string; // e.g., 'Demonstrate Knowledge and Understanding'
  dok: 1 | 2 | 3 | 4; // Webb's Depth of Knowledge Level
  source_passage?: string; // For Case-based questions
  sub_questions?: SubQuestion[]; // For Case-based questions
  distractor_rationale?: string; // For MCQ distractor analysis
  status?: 'pending' | 'approved'; // For assessment review queue
}

export interface AssessmentBlueprint {
  question_pool: QuestionPoolItem[];
  section_breakup?: { name: string; description: string }[];
  total_marks?: number;
  marking_scheme_rationale?: string;
}

export interface LabelData {
  label: string;
  x: number; // Percentage from left (0.0 to 1.0)
  y: number; // Percentage from top (0.0 to 1.0)
}

export interface TeacherNotes {
  TLM_list: string[];
  differentiation: string[];
  remediation_plan: string[];
  safety_notes: string[];
}

export interface LessonPack {
  topic_id: string;
  topic_name: string;
  student_explanation: StudentExplanation;
  assessment_blueprint: AssessmentBlueprint;
  teacher_notes: TeacherNotes;
}

// --- AI CURRICULUM SYNTHESIZER TYPES ---
export interface SyllabusBlueprintChapter extends SyllabusChapterTopic {
  allocated_hours: number;
  data_driven_rationale: string;
}

export interface SyllabusBlueprintUnit {
  unit_no: number;
  unit_name: string;
  weightage_marks: number;
  allocated_hours: number;
  chapters_or_topics: SyllabusBlueprintChapter[];
}

export interface PacingCalendarEvent {
  week: number;
  start_date: string;
  activity_type: 'Teaching' | 'Assessment' | 'Remediation' | 'Buffer' | 'Exam';
  details: string;
}

export interface RemediationPack {
  concept: string;
  re_explanation: StructuredContent[];
  worked_example: WorkedExample;
  scaffolded_practice: QuestionPoolItem[];
}


// --- LESSON PLAYER TYPES ---
export type LessonStepType = 
  | 'topic_title'
  | 'core_explanation'
  | 'quick_check'
  | 'worked_example'
  | 'guided_practice'
  | 'independent_practice'
  | 'HOTS'
  | 'common_error'
  | 'fill_in_the_blanks'
  | 'interactive_simulation'
  | 'interactive_video'
  | 'assessment_intro'
  | 'assessment_question'
  | 'adaptive_intro'
  | 'adaptive_follow_up'
  | 'feedback'
  | 'key_term'
  | 'matching_quiz'
  | 'note';

// Base interface
interface BaseLessonStep {
  type: LessonStepType;
  title: string;
  originalIndex?: number; // Index in the original, non-adapted sequence
  isRemediation?: boolean; // True if this step was dynamically inserted
}

// Specific step interfaces
export interface TopicTitleStep extends BaseLessonStep {
  type: 'topic_title';
  content: { topic_name: string };
}

export interface CoreExplanationStep extends BaseLessonStep {
  type: 'core_explanation';
  content: StructuredContent[];
}

export interface QuickCheckStep extends BaseLessonStep {
  type: 'quick_check';
  content: QuickCheck;
}

export interface WorkedExampleStep extends BaseLessonStep {
  type: 'worked_example';
  content: WorkedExample;
}

export interface GuidedPracticeStep extends BaseLessonStep {
  type: 'guided_practice';
  content: GuidedPractice;
}

export interface IndependentPracticeStep extends BaseLessonStep {
  type: 'independent_practice';
  content: IndependentPractice;
}

export interface HOTSStep extends BaseLessonStep {
  type: 'HOTS';
  content: HOTSQuestion;
}

export interface CommonErrorStep extends BaseLessonStep {
  type: 'common_error';
  content: CommonErrorAndFix;
}

export interface FillInTheBlanksStep extends BaseLessonStep {
  type: 'fill_in_the_blanks';
  content: FillInTheBlanks;
}

export interface InteractiveSimulationStep extends BaseLessonStep {
  type: 'interactive_simulation';
  content: InteractiveSimulation;
}

export interface InteractiveVideoStep extends BaseLessonStep {
  type: 'interactive_video';
  content: InteractiveVideo;
}

export interface AssessmentIntroStep extends BaseLessonStep {
  type: 'assessment_intro';
  content: string; // The intro text
}

export interface AssessmentQuestionStep extends BaseLessonStep {
  type: 'assessment_question';
  content: { question: QuestionPoolItem, qNum: number };
}

export interface AdaptiveIntroStep extends BaseLessonStep {
  type: 'adaptive_intro';
  content: string; // The message
}

export interface AdaptiveFollowUpStep extends BaseLessonStep {
  type: 'adaptive_follow_up';
  content: AdaptiveFollowUp;
}

export interface FeedbackStep extends BaseLessonStep {
  type: 'feedback';
  content: { submitted: boolean };
}

export interface KeyTermStep extends BaseLessonStep {
  type: 'key_term';
  content: KeyTermBlock;
}

export interface MatchingQuizStep extends BaseLessonStep {
  type: 'matching_quiz';
  content: MatchingQuiz;
}

export interface NoteStep extends BaseLessonStep {
  type: 'note';
  content: NoteBlock;
}

// The new union type
export type LessonStep =
  | TopicTitleStep
  | CoreExplanationStep
  | QuickCheckStep
  | WorkedExampleStep
  | GuidedPracticeStep
  | IndependentPracticeStep
  | HOTSStep
  | CommonErrorStep
  | FillInTheBlanksStep
  | InteractiveSimulationStep
  | InteractiveVideoStep
  | AssessmentIntroStep
  | AssessmentQuestionStep
  | AdaptiveIntroStep
  | AdaptiveFollowUpStep
  | FeedbackStep
  | KeyTermStep
  | MatchingQuizStep
  | NoteStep;


// --- ADAPTIVE LEARNING TYPES ---

export interface PrerequisiteGraph {
  [chapterId: string]: string[]; // Key is a chapterId, value is an array of prerequisite chapterIds
}

export interface AssessmentResult {
  q_id: string;
  question_text: string;
  is_correct: boolean;
}

export interface AdaptiveFollowUp {
  concept: string;
  explanation: string;
  practice_question: IndependentPractice;
  review_suggestion: string;
}

export type QuizState = 'setup' | 'active' | 'results';

export interface FineTuningDataPoint {
  id: string;
  timestamp: string;
  source: 'teacher_feedback';
  data: {
    question: string;
    studentAnswer: string;
    teacherFeedback: string;
  };
}

// NEW: Context for proactive tutor intervention
export type TutorInterventionContext = {
  question: QuestionPoolItem | QuickCheck;
  studentAnswer: string;
};


// --- DIGITAL SCRATCHPAD TYPES ---
export interface Path {
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}
export interface ScratchpadState {
  paths: Path[];
}

// --- SCHOOL DASHBOARD TYPES ---
export interface TeacherAssignment {
  teacherId: number;
  grade: string;
  subject: string;
}

export interface ClassAnalyticsData {
  grade: string;
  subjectMastery: { subject: string; mastery: number }[];
  challengingConcepts: { concept: string; mastery: number }[];
  studentsToWatch: { name: string; mastery: number }[];
}

export interface Assignment {
  id: string;
  title: string;
  instructions?: string;
  dueDate: string;
  assignedChapterIds: string[];
  classGrade: string;
  assignedStudentIds?: number[];
  assignmentType: 'chapters' | 'quiz';
  quizQuestions?: QuestionPoolItem[];
  isCatchUp?: boolean;
}

export interface ReportCardData {
  studentId: number;
  studentName: string;
  grade: string;
  overallMastery: number;
  subjectBreakdown: { subject: string; mastery: number }[];
  aiSummary: string;
}

export interface Announcement {
    id: string;
    grade: string;
    title: string;
    content: string;
    date: string; // ISO Date string
}

export interface StudentSubmissionAnswer {
    q_id: string;
    answer: string;
    isCorrect?: boolean; // Set by teacher during grading
    feedback?: string;   // Set by teacher during grading
}

export interface StudentSubmission {
    id: string;
    assignmentId: string;
    studentId: number;
    answers: StudentSubmissionAnswer[];
    status: 'submitted' | 'graded';
    score?: number; // Set by teacher during grading
}

export interface PtmBrief {
  summary: string;
  strengths: string[];
  focusAreas: string[];
  behavioralObservations: string[];
  suggestedTalkingPoints: string[];
  closingRemark: string;
}

// --- EXAM SUITE TYPES ---
export interface BlueprintSection {
    id: string;
    name: string;
    questionType: 'MCQ' | 'SA' | 'LA' | 'Case';
    questions: number;
    marksPerQuestion: number;
}

export interface PaperBlueprint {
    id: string;
    name: string;
    grade: string;
    subject: string;
    totalMarks: number;
    competencyWeightage: number; // Percentage (e.g., 50)
    sections: BlueprintSection[];
}

export interface GeneratedPaper {
    blueprint: PaperBlueprint;
    questions: QuestionPoolItem[];
    analytics: {
        competencyCoverage: { [key: string]: number };
        dokDistribution: { [key: number]: number };
        actualCompetencyPercentage: number;
    };
}

export interface ExamSession {
    id: string;
    blueprintId: string;
    code: string;
    startTime: number;
    endTime?: number;
    isActive: boolean;
}

export interface ExamSubmission {
    id: string;
    sessionId: string;
    studentId: number;
    answers: { [q_id: string]: string | ScratchpadState };
    submittedAt: number;
    infractions: number;
}

export interface AIProctoringReport {
    summary: string;
    suspiciousClusters: {
        studentIds: number[];
        reason: string;
        questions: string[];
    }[];
    highInfractionStudents: {
        studentId: number;
        count: number;
    }[];
}


// --- PRACTICE CENTRE TYPES ---
export interface PracticeBlueprint {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  structure: {
    section: string;
    questionType: 'MCQ' | 'SA' | 'LA' | 'Case';
    count: number;
    marksPerQuestion: number;
  }[];
}

export interface PracticeExam {
  blueprint: PracticeBlueprint;
  questions: QuestionPoolItem[];
  answers: { [q_id: string]: string | ScratchpadState }; // Answer can be text or a drawing state
  markedForReview: Set<string>;
  startTime: number;
  endTime?: number;
}

export interface PracticeResult {
  q_id: string;
  question: QuestionPoolItem;
  studentAnswer: string | ScratchpadState;
  isCorrect: boolean;
  marksAwarded: number;
  aiFeedback: string | null;
}

// --- DIAGNOSTICS & FLN TYPES ---
export interface SafalDiagnosticResult {
    studentId: number;
    studentName: string;
    competencies: { [competency: string]: 'high' | 'medium' | 'low' };
}

export interface RemediationGroup {
    competency: string;
    students: string[]; // array of student names
    suggestedTask: string;
}

export interface FlnMilestone {
    id: string;
    category: 'Literacy' | 'Numeracy';
    skill: string;
}

export interface StudentFlnProgress {
    [studentId: number]: {
        [milestoneId: string]: 'not_started' | 'emerging' | 'achieved';
    };
}

// --- AI & CODING MODULES ---
export interface ModuleLesson {
    type: 'Activity' | 'Theory';
    title: string;
    duration: string; // e.g., "90 mins"
}

export interface CodingModule {
    id: string;
    title: string;
    description: string;
    targetGrades: string;
    lessonPlan: ModuleLesson[];
}

export interface StudentPortfolioProject {
    studentId: number;
    studentName: string;
    projectTitle: string;
    status: 'Completed' | 'In Progress';
    submissionUrl: string; // link to a mock project
}

export type AllPortfolios = StudentPortfolioProject[];

export interface CrossCurricularProject {
    id: string;
    title: string;
    subject: string;
    grade: string;
    description: string;
    objectives: string[];
    tasks: string[];
    evidence: string; // Storing teacher's notes on evidence
}

// --- BOARD PLANNER TYPES ---
export type BoardPlannerEventIcon = 'CalendarDaysIcon' | 'ClipboardCheckIcon' | 'RefreshCwIcon' | 'AwardIcon';

export interface BoardPlannerEvent {
    id: string;
    title: string;
    description: string;
    date: string; // e.g., "April 1, 2025" or "Late Sep"
    icon: BoardPlannerEventIcon;
    color: 'blue' | 'yellow' | 'green' | 'red';
}

export interface CommunicationTemplate {
    id: string;
    title: string;
    audience: 'Parents' | 'Students';
    content: string;
}

// --- CLASSROOM CORE TYPES ---
export interface TeacherSchedule {
    id: string;
    period: number;
    time: string; // e.g., "09:00 - 09:40"
    grade: string;
    subject: string;
    topic: string;
    chapterId: string;
    isTaught?: boolean;
    notes?: string; // For digital logbook
}

export interface AttendanceRecord {
    [scheduleId: string]: { // key is the schedule id for the class period
        [studentId: number]: 'present' | 'absent';
    }
}

export interface QuickFormativeAssessment {
    id: string;
    title: string;
    grade: string;
    scheduleId: string; // which class period it's for
    questions: { text: string; answer: string }[];
    status: 'active' | 'completed';
    createdAt: string; // ISO date string
}

export interface QfaResult {
    assessmentId: string;
    studentId: number;
    studentName: string;
    answers: string[]; // array of answers, index corresponds to question index
    submittedAt: string; // ISO date string
}

// --- FINANCE & OPS TYPES ---
export interface BusRoute {
    id: string;
    routeName: string;
    status: 'On Time' | 'Delayed' | 'Idle';
    occupancy: number; // percentage
    eta: string; // e.g., "15 mins"
}

export interface EnergyDataPoint {
    day: string;
    consumption: number; // in kWh
    solarGeneration: number; // in kWh
}

export interface PrintQuota {
    id: string;
    staffName: string;
    quota: number; // e.g., 500 pages
    used: number;
}

export interface FeeStatus {
    id: string;
    studentId: number;
    studentName: string;
    grade: string;
    status: 'Paid' | 'Overdue' | 'Partially Paid';
    amountDue: number;
}

// --- GROWTH TYPES ---
export interface AfterSchoolProgram {
    id: string;
    title: string;
    instructor: string;
    enrollment: number;
    capacity: number;
}

export interface FacilityBooking {
    id: string;
    facility: 'Auditorium' | 'Sports Ground' | 'Computer Lab';
    bookedBy: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    purpose: string;
}

// --- INTEGRATION TYPES ---
export interface Notification {
    id: string;
    userId: number;
    title: string;
    message: string;
    date: string; // ISO String
    isRead: boolean;
}

// --- NEW LMS TYPES ---
export interface CourseContent {
    type: 'lesson' | 'quiz';
    contentId: string; // Corresponds to chapterId or assignmentId
    title: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    teacherId: number;
    grade: string;
    content: CourseContent[];
    enrolledStudentIds: number[];
}

export interface Grade {
    id: string;
    studentId: number;
    courseId: string;
    assignmentId: string;
    score: number;
    totalMarks: number;
}


// LTI 1.3 Context
export interface LtiContext {
  isLtiLaunch: true;
  user: {
    id: string;
    name: string;
    roles: string[];
  };
  course: {
    id: string;
    title: string;
  };
  ags: {
    lineitem: string; // URL for grade passback
  };
  linkedResource: {
    chapterId: string;
  };
}


// --- GENERAL APP TYPES ---

export type UserRole = 'student' | 'parent' | 'school';

export interface Curriculum {
  [grade: string]: {
    [subject: string]: string[];
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  status?: 'retrieving' | 'generating' | 'done';
  sources?: GroundingChunk[];
}

export interface GroundingSource {
  uri?: string;
  title?: string;
  snippet?: string;
}

export interface GroundingChunk {
  maps?: unknown;
  retrievedContext?: unknown;
  web?: GroundingSource;
}

export interface ChapterProgress {
  status: 'started' | 'completed';
  dueDate?: string; // ISO date string, e.g., "YYYY-MM-DD"
  currentStep?: number;
}

export interface UserProgressData {
  [chapterId: string]: ChapterProgress;
}

export interface AllProgressData {
  [userId: number]: UserProgressData;
}

// --- KNOWLEDGE TRACING & SRS TYPES ---

export interface SrsData {
  // FSRS (Free Spaced Repetition Scheduler) parameters
  due: string; // ISO date string: YYYY-MM-DD
  s: number; // Stability (in days)
  d: number; // Difficulty (a value from 1 to 10)
  reps: number; // Number of repetitions
  lapses: number; // Number of times the card was forgotten
  last_review: string | null; // ISO date string of the last review
}

// NEW: Represents a single attempt on a skill for advanced knowledge tracing.
export interface DktAttempt {
  correct: 0 | 1;
  timestamp: number;
  errorType?: string; // Qualitative analysis from LLM (e.g., 'conceptual_error', 'calculation_error')
}

export interface DktSkillState {
  mastery: number; // A value from 0.0 to 1.0 representing skill mastery
  history: DktAttempt[]; // History of last N attempts
  srs?: SrsData; // Integrated FSRS data for mastered skills
}


export interface UserDktData {
  [skillId: string]: DktSkillState;
}

export interface AllDktData {
  [userId: number]: UserDktData;
}

// --- SMART STUDY PLAN TYPES ---
export type StudyTaskType = 'review_weakness' | 'srs_review' | 'next_lesson' | 'assignment' | 'manual';

export interface StudyTask {
  id: string;
  type: StudyTaskType;
  title: string;
  notes?: string;
  subtitle: string;
  dueDate: string; // ISO string
  isCompleted?: boolean; // for manual tasks primarily
  data?: {
      chapterId?: string;
      assignmentId?: string;
      taskIds?: string[];
  };
}

// --- --- --- ---

export interface DailyChallenge {
  id: string; // e.g., '2024-05-21'
  type: 'earn_xp' | 'complete_lesson';
  target: number | string; // e.g., 150 (for XP) or 'Science' (for subject)
  progress: number;
  isCompleted: boolean;
  description: string;
  reward: number; // XP reward
  coinReward: number; // Scholar Coin reward
}

export interface UserProfile {
  id: number;
  name: string;
  grade: string;
  schoolId?: string; // Multi-tenancy support
  lastSubject: string;
  lastChapter: string;
  currentStreak: number;
  lastStreakDate: string; // ISO date string: YYYY-MM-DD
  achievements: string[]; // Array of badge IDs
  xp: number;
  level: number;
  scholarCoins: number;
  dailyChallenge?: DailyChallenge;
  studyPlan?: StudyTask[];
  manualTasks?: StudyTask[];
  widgets?: WidgetConfig[];
  tutorSessionUnlocked: boolean;
  unlockedPetAccessories?: string[];
  // RBAC fields
  schoolRole?: 'principal' | 'teacher';
  childIds?: number[];
}

// --- GAMIFICATION TYPES ---
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: 'FlameIcon' | 'AwardIcon' | 'ScienceIcon' | 'MathIcon' | 'SocialStudiesIcon' | 'PhysicsIcon' | 'ChemistryIcon' | 'BiologyIcon';
  color: string;
}

export type GamificationEvent = 'step_completed' | 'lesson_completed' | 'quiz_correct' | 'streak_update' | 'focus_session_completed' | 'mastery_unlock' | 'streak_milestone';


// --- FLASHCARD & SRS TYPES ---
export interface Flashcard {
  term: string;
  definition: string;
}

export interface UserFlashcardItem {
  card: Flashcard;
  srsData: SrsData;
}

export interface UserFlashcards {
  [chapterId: string]: UserFlashcardItem[];
}

export interface AllFlashcardsData {
  [userId: number]: UserFlashcards;
}

export interface FlashcardReviewItem extends UserFlashcardItem {
  chapterId: string;
  cardIndex: number;
  id: string;
}

// --- PARENT DASHBOARD TYPES ---
export interface ParentalReport {
  summary: string;
  strengths: string[];
  focusAreas: string[];
  actionableTips: {
    icon: 'FlameIcon' | 'BookIcon' | 'WandIcon' | 'CalendarDaysIcon';
    tip: string;
  }[];
}

// --- PLANNER WIDGET TYPES ---
export type WidgetType = 'today_focus' | 'pinned_chapter' | 'pinned_practice' | 'quick_note';

export interface BaseWidgetConfig {
    id: string;
    type: WidgetType;
}

export interface TodayFocusWidgetConfig extends BaseWidgetConfig {
    type: 'today_focus';
}

export interface PinnedChapterWidgetConfig extends BaseWidgetConfig {
    type: 'pinned_chapter';
    data: {
        grade: string;
        subject: string;
        chapter: string;
    };
}

export interface PinnedPracticeWidgetConfig extends BaseWidgetConfig {
    type: 'pinned_practice';
    data: {
        subject: string;
        blueprintId: string;
    };
}

export interface QuickNoteWidgetConfig extends BaseWidgetConfig {
    type: 'quick_note';
    data: {
        content: string;
    };
}

export type WidgetConfig = TodayFocusWidgetConfig | PinnedChapterWidgetConfig | PinnedPracticeWidgetConfig | QuickNoteWidgetConfig;


// --- SCHOLAR'S WALLET TYPES ---
export type MarketplaceCategory = 'power-up' | 'customization' | 'voucher';

export interface MarketplaceItem {
    id: string;
    title: string;
    description: string;
    cost: number;
    category: MarketplaceCategory;
    action: {
        type: 'navigate' | 'unlock' | 'redeem';
        payload: any;
    };
}