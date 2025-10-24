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

export type StructuredContentType = 'heading' | 'paragraph' | 'list' | 'key_term' | 'note';

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


export type StructuredContent = HeadingBlock | ParagraphBlock | ListBlock | KeyTermBlock | NoteBlock;


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
  interactive_videos?: InteractiveVideo[];
}

export interface QuestionPoolItem {
  q_id: string;
  type: 'MCQ' | 'SA' | 'LA' | 'Case' | 'Competency';
  marks: number;
  difficulty: 'E' | 'M' | 'H';
  bloom: string;
  question: string;
  options?: string[];
  answer: string;
  rubric: string;
  tags?: string[];
}

export interface AssessmentBlueprint {
  question_pool: QuestionPoolItem[];
  section_breakup: { [key: string]: string };
  total_marks: number;
  marking_scheme_rationale: string;
}

export interface ImageBrief {
  purpose: string;
  style: string;
  content_spec: string[];
  alt_text: string;
  image_generation_prompt: string;
  optional_svg_markup?: string;
  generated_image_url?: string | null;
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
  image_briefs: ImageBrief[];
  teacher_notes: TeacherNotes;
}

// --- LESSON PLAYER TYPES ---
export type LessonStepType = 
  | 'topic_title'
  | 'core_explanation'
  | 'quick_check'
  | 'image_brief'
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
  | 'note';

// Base interface
interface BaseLessonStep {
  type: LessonStepType;
  title: string;
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

export interface ImageBriefStep extends BaseLessonStep {
  type: 'image_brief';
  content: ImageBrief;
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

export interface NoteStep extends BaseLessonStep {
  type: 'note';
  content: NoteBlock;
}

// The new union type
export type LessonStep =
  | TopicTitleStep
  | CoreExplanationStep
  | QuickCheckStep
  | ImageBriefStep
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
  | NoteStep;


// --- ADAPTIVE LEARNING TYPES ---

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
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface GroundingChunk {
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

// --- BAYESIAN KNOWLEDGE TRACING (BKT) TYPES ---
export interface BktSkillState {
  p_L: number; // Probability of knowing the skill
}

export interface UserBktData {
  [skillId: string]: BktSkillState;
}

export interface AllBktData {
  [userId: number]: UserBktData;
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
}

export interface UserProfile {
  id: number;
  name: string;
  grade: string;
  lastSubject: string;
  lastChapter: string;
  currentStreak: number;
  lastStreakDate: string; // ISO date string: YYYY-MM-DD
  achievements: string[]; // Array of badge IDs
  xp: number;
  level: number;
  dailyChallenge?: DailyChallenge;
}

// --- GAMIFICATION TYPES ---
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: 'FlameIcon' | 'AwardIcon' | 'ScienceIcon' | 'MathIcon' | 'SocialStudiesIcon' | 'PhysicsIcon' | 'ChemistryIcon' | 'BiologyIcon';
  color: string;
}

export type GamificationEvent = 'step_completed' | 'lesson_completed' | 'quiz_correct' | 'streak_update';


// --- FLASHCARD & SRS TYPES ---
export interface Flashcard {
  term: string;
  definition: string;
}

export interface SrsData {
  // FSRS (Free Spaced Repetition Scheduler) parameters
  due: string; // ISO date string: YYYY-MM-DD
  s: number; // Stability (in days)
  d: number; // Difficulty (a value from 1 to 10)
  reps: number; // Number of repetitions
  lapses: number; // Number of times the card was forgotten
  last_review: string | null; // ISO date string of the last review
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