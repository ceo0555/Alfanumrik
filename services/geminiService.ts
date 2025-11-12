import { GoogleGenAI, Type, Modality, GenerateContentResponse, FunctionDeclaration } from "@google/genai";
import { LessonPack, GroundingChunk, AssessmentResult, AdaptiveFollowUp, StudentExplanation, QuestionPoolItem, StructuredContent, Flashcard, InteractiveSimulation, UserProfile, UserProgressData, ParentalReport, InteractiveVideo, ClassAnalyticsData, UserDktData, PrerequisiteGraph, SafalDiagnosticResult, RemediationGroup, QuickFormativeAssessment, QfaResult, FacilityBooking, QuickCheck, CrossCurricularProject, PracticeBlueprint, PracticeResult, LabelData, SyllabusChapterTopic, StudentSubmission, Assignment, AllDktData, DktSkillState, SyllabusBlueprintUnit, PacingCalendarEvent, RemediationPack, ChatMessage, SyllabusUnit, PtmBrief, PaperBlueprint, AIProctoringReport, ExamSubmission, StudyTask, UserFlashcards, BusRoute, MatchingQuiz } from '../types';
import { blobToBase64, fileToBase64 } from "../utils/fileHelpers";
import { getGeminiApiKey, requireGeminiApiKey, hasGeminiApiKey, isGeminiMockModeEnabled } from "../utils/env";
import { get, set } from '../utils/db';
import { cbseSyllabus } from '../constants/syllabus';

function parseJsonFromResponse(text: string): any {
  // First, try to find a JSON block inside markdown ```json ... ```
  let jsonString = text;
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/s);
  if (jsonMatch && jsonMatch[1]) {
    jsonString = jsonMatch[1];
  }

  // If no markdown block, greedily find the first '{' or '[' and the last '}' or ']'
  const firstBracket = jsonString.indexOf('{');
  const firstSquare = jsonString.indexOf('[');
  
  let start = -1;
  if (firstBracket === -1) start = firstSquare;
  else if (firstSquare === -1) start = firstBracket;
  else start = Math.min(firstBracket, firstSquare);

  if (start === -1) {
    // Fallback for simple string responses that might be JSON
    try {
        return JSON.parse(text);
    } catch(e) {
        throw new Error("No JSON object or array found in the response.");
    }
  }
  
  const lastBracket = jsonString.lastIndexOf('}');
  const lastSquare = jsonString.lastIndexOf(']');
  
  // Choose the correct last character based on the first character
  let end = -1;
  if (jsonString.charAt(start) === '{') {
      end = lastBracket;
  } else {
      end = lastSquare;
  }
  
  if (end === -1 || end < start) {
      throw new Error("Unterminated JSON object or array in response.");
  }
  
  jsonString = jsonString.substring(start, end + 1);

  try {
    // Attempt to fix common JSON errors like unescaped newlines within strings
    const repairedJsonString = jsonString.replace(/\\n/g, "\\\\n").replace(/\n/g, "\\n");
    return JSON.parse(repairedJsonString);
  } catch (e) {
     try {
        // Fallback to original if repair fails
        return JSON.parse(jsonString);
     } catch (e2) {
        console.error("Failed to parse extracted JSON:", e2);
        console.error("Original text:", text);
        console.error("Extracted string:", jsonString);
        throw new Error("Failed to parse JSON from AI response after extraction.");
     }
  }
}

export interface ProgressData {
  progress: number;
  message: string;
  step: number;
  totalSteps: number;
}


const createGeminiClient = () => new GoogleGenAI({ apiKey: requireGeminiApiKey() });

const GEMINI_LOG_PREFIX = '[Gemini]';
const useGeminiMock = !hasGeminiApiKey() && isGeminiMockModeEnabled();

const logGeminiInfo = (operation: string, message: string) => {
  console.info(`${GEMINI_LOG_PREFIX} ${operation}: ${message}`);
};

const logGeminiError = (operation: string, error: unknown) => {
  console.error(`${GEMINI_LOG_PREFIX} ${operation} failed`, error);
};

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const createMockQuestion = (overrides: Partial<QuestionPoolItem> = {}): QuestionPoolItem => ({
  q_id: overrides.q_id ?? randomId('mock-q'),
  type: overrides.type ?? 'MCQ',
  marks: overrides.marks ?? 1,
  difficulty: overrides.difficulty ?? 'E',
  bloom: overrides.bloom ?? 'Remember',
  question: overrides.question ?? 'This is a mock question generated in mock mode.',
  options: overrides.options ?? ['Option A', 'Option B', 'Option C', 'Option D'],
  answer: overrides.answer ?? 'Option A',
  rubric: overrides.rubric ?? 'Award full marks for Option A.',
  competency: overrides.competency ?? 'Demonstrate Knowledge',
  dok: overrides.dok ?? 1,
  distractor_rationale: overrides.distractor_rationale,
  source: overrides.source,
  source_passage: overrides.source_passage,
  sub_questions: overrides.sub_questions,
  tags: overrides.tags,
  imageUrl: overrides.imageUrl,
  requiresDrawing: overrides.requiresDrawing,
  status: overrides.status,
});

const createMockQuickCheck = (topic: string): QuickCheck => ({
  question: `Quick check: What is one key idea about ${topic}?`,
  options: ['It is important', 'It is irrelevant'],
  correct_answer: 'It is important',
  explanation: `In mock mode, remember that ${topic} is important.`,
});

const createMockStructuredParagraph = (text: string): StructuredContent => ({
  type: 'paragraph',
  content: text,
});

const createMockLessonPack = (chapter: SyllabusChapterTopic | null, topic: string): LessonPack => {
  const topicId = chapter ? `${chapter.topic_id}|${topic}` : `mock-${topic.toLowerCase().replace(/\s+/g, '-')}`;
  return {
    topic_id: topicId,
    topic_name: topic,
    student_explanation: {
      core_explanation: [
        { type: 'heading', level: 2, content: topic },
        createMockStructuredParagraph(`This is a mock explanation for ${topic}. Use it for development or testing.`),
        { type: 'list', items: [`Key fact about ${topic}`, `Another point about ${topic}`] },
      ],
      quick_check: createMockQuickCheck(topic),
      worked_examples: [
        {
          prompt: `Example problem related to ${topic}.`,
          solution: 'Demonstrate the key steps in mock mode.',
          why_it_works: 'Because this is a simulated environment.',
        },
      ],
      guided_practice: [
        {
          question: `Try solving a simple scenario for ${topic}.`,
          hint: 'Focus on the main idea presented above.',
          stepwise_solution: 'Step 1: Identify the concept. Step 2: Apply it in a simple way.',
        },
      ],
      independent_practice: [
        {
          question: `Practice question for ${topic}.`,
          answer_key: 'Refer back to the mock explanation.',
        },
      ],
      HOTS: [
        {
          question: `How could ${topic} be used in the real world?`,
          exemplar_answer: `Consider the implications of ${topic} in everyday scenarios.`,
        },
      ],
      common_errors_and_fixes: [
        {
          error: `Ignoring the definition of ${topic}.`,
          fix: `Revisit the key explanation provided and connect it to examples.`,
        },
      ],
      fill_in_the_blanks: [
        {
          sentence_parts: [`${topic} helps students`, 'understand ___ concepts'],
          options: ['core', 'unrelated'],
          correct_answer: 'core',
        },
      ],
      interactive_simulations: [
        {
          description: `Imagine an interactive simulation that demonstrates ${topic}.`,
          concept_link: `simulation-${topic.toLowerCase()}`,
        },
      ],
      interactive_videos: [
        {
          title: `Mock video for ${topic}`,
          video_url: 'https://example.com/mock-video.mp4',
          script: [
            {
              timestamp: 5,
              question_text: `What is a takeaway about ${topic}?`,
              options: ['Option A', 'Option B'],
              correct_answer: 'Option A',
              feedback_correct: 'Correct! You understood the mock concept.',
              feedback_incorrect: 'Review the mock explanation once more.',
            },
          ],
        },
      ],
      real_world_applications: [`In real usage, ${topic} would connect to authentic examples.`],
      matching_quizzes: [
        {
          instruction: 'Match the term to its mock definition.',
          pairs: [
            {
              term: `${topic} Term`,
              definition: `A mock description to explain ${topic}.`,
            },
          ],
        },
      ],
    },
    assessment_blueprint: {
      question_pool: [
        createMockQuestion({
          question: `Assessment question that reinforces ${topic}.`,
        }),
      ],
    },
    teacher_notes: {
      TLM_list: [`Display charts or props representing ${topic}.`],
      differentiation: ['Offer concrete examples before abstractions.'],
      remediation_plan: ['Review the basics and allow for additional practice.'],
      safety_notes: ['No safety considerations in mock mode.'],
    },
  };
};

const createMockAdaptiveFollowUps = (results: AssessmentResult[]): AdaptiveFollowUp[] => {
  if (results.length === 0) {
    return [];
  }
  const focusQuestion = results[0].question_text || 'the concept';
  return [
    {
      concept: `Understanding ${focusQuestion}`,
      explanation: `This mock explanation revisits the core ideas behind ${focusQuestion}.`,
      practice_question: {
        question: `Try explaining ${focusQuestion} in your own words.`,
        answer_key: 'Student should highlight the main steps or ideas mentioned earlier.',
      },
      review_suggestion: 'Review the key notes and worked examples provided in the mock lesson.',
    },
  ];
};

const createMockFlashcards = (topic: string): Flashcard[] => [
  {
    term: `${topic} - Core Idea`,
    definition: `This mock flashcard highlights the main point about ${topic}.`,
  },
  {
    term: `${topic} - Example`,
    definition: `Provide a simple example that illustrates ${topic}.`,
  },
  {
    term: `${topic} - Remember`,
    definition: `Remember to connect ${topic} to prior knowledge.`,
  },
];

const createMockRemediationGroups = (label: string): RemediationGroup[] => [
  {
    competency: label,
    students: ['Student A', 'Student B'],
    suggestedTask: `Facilitate a brief mock discussion to revisit ${label}.`,
  },
];

const createMockParentalReport = (studentName: string): ParentalReport => ({
  summary: `This is a mock summary for ${studentName}.`,
  strengths: ['Engages well during lessons', 'Shows curiosity in mock mode'],
  focusAreas: ['Review foundational concepts regularly'],
  actionableTips: [
    { icon: 'BookIcon', tip: 'Set aside 15 minutes daily to review notes.' },
    { icon: 'WandIcon', tip: 'Ask the student to explain a concept aloud.' },
  ],
});

const createMockParentalInsight = (query: string): string =>
  `Mock insight responding to: "${query}". Encourage balanced routines and consistent study habits.`;

const createMockRemediationPack = (concept: string): RemediationPack => ({
  concept,
  re_explanation: [
    createMockStructuredParagraph(`This mock explanation revisits the essentials of ${concept}.`),
  ],
  worked_example: {
    prompt: `Worked example for ${concept}.`,
    solution: 'Demonstrate the method in a few clear steps.',
    why_it_works: 'Because it reinforces the key relationships in the concept.',
  },
  scaffolded_practice: [
    createMockQuestion({ question: `Entry-level practice on ${concept}.`, difficulty: 'E' }),
    createMockQuestion({ question: `Follow-up practice on ${concept}.`, difficulty: 'M' }),
  ],
});

const createMockCurriculumBlueprint = (grade: string, subject: string) => ({
  blueprint: [
    {
      unit_no: 1,
      unit_name: `Mock Unit for ${subject}`,
      weightage_marks: 20,
      allocated_hours: 10,
      chapters_or_topics: [
        {
          topic_id: `G${grade}-${subject}-U1T1`,
          topic_name: `${subject} Topic 1`,
          learning_outcomes: ['Understand the basics in mock mode.'],
          bloom_levels: ['Remember'],
          prerequisites: [],
          common_misconceptions: ['Assuming mock data behaves like production data.'],
          cross_links: [],
          estimated_time_mins: 60,
          marking_scheme_mapping: { K: 5, U: 5, A: 5, HOTS: 5 },
          allocated_hours: 5,
          data_driven_rationale: 'Allocated to ensure development environments remain functional.',
        },
      ],
    },
  ],
  calendar: [
    {
      week: 1,
      start_date: '2025-04-01',
      activity_type: 'Teaching',
      details: `Introduce mock overview for ${subject}.`,
    },
  ],
});

const createMockPtmBrief = (studentName: string): PtmBrief => ({
  summary: `Mock briefing for ${studentName}.`,
  strengths: ['Shows consistency in mock assessments'],
  focusAreas: ['Continue practicing retrieval techniques'],
  behavioralObservations: ['Participates positively in mock activities'],
  suggestedTalkingPoints: [
    `Discuss how ${studentName} can apply strategies from mock sessions.`,
  ],
  closingRemark: 'Looking forward to continued growth in the live environment.',
});

const createMockAIProctoringReport = (): AIProctoringReport => ({
  summary: 'Mock proctoring report with no suspicious activity detected.',
  suspiciousClusters: [],
  highInfractionStudents: [],
});

const createMockWeeklyStudyPlan = (topic?: string): StudyTask[] => [
  {
    id: randomId('mock-task'),
    type: 'next_lesson',
    title: `Review the mock lesson${topic ? ` on ${topic}` : ''}`,
    subtitle: '15 minutes',
    dueDate: new Date().toISOString().split('T')[0],
    data: {},
  },
];

const createMockCrossCurricularProject = (grade: string, subject: string): CrossCurricularProject => ({
  id: randomId('mock-project'),
  title: `Mock ${subject} Project`,
  subject,
  grade,
  description: 'This is a mock cross-curricular project idea generated in development mode.',
  objectives: ['Encourage creative thinking', 'Connect multiple disciplines'],
  tasks: ['Brainstorm mock ideas', 'Prepare a simple presentation'],
  evidence: 'Collect reflections from the mock activity.',
});

const createMockDeconstructedSyllabus = (): { structuredSyllabus: SyllabusUnit[]; prerequisiteGraph: PrerequisiteGraph } => ({
  structuredSyllabus: [
    {
      unit_no: 1,
      unit_name: 'Mock Unit',
      weightage_marks: 10,
      lesson_hours: 5,
      chapters_or_topics: [
        {
          topic_id: 'G10-Science-MockTopic',
          topic_name: 'Mock Topic',
          learning_outcomes: ['Understand mock concept'],
          bloom_levels: ['Remember'],
          prerequisites: [],
          common_misconceptions: ['Thinking mock equals production'],
          cross_links: [],
          estimated_time_mins: 45,
          marking_scheme_mapping: { K: 3, U: 2, A: 3, HOTS: 2 },
        },
      ],
    },
  ],
  prerequisiteGraph: {
    'G10-Science-MockTopic': [],
  },
});

const getDefaultMockResponse = <T>(operation: string): T => {
  switch (operation) {
    case 'generateAdaptiveFollowUp':
    case 'generatePracticeQuiz':
    case 'generateFlashcards':
    case 'generateRemediationGroups':
    case 'generateQfaRemediation':
    case 'processOmniSearchQuery':
    case 'generateTransportOptimizationTips':
      return ([] as unknown) as T;
    case 'generateRemediationGroups':
      return createMockRemediationGroups('Mock competency') as unknown as T;
    case 'generateQfaRemediation':
      return createMockRemediationGroups('Mock exit ticket focus') as unknown as T;
    case 'generatePracticeExam':
      return [createMockQuestion(), createMockQuestion({ difficulty: 'M', dok: 2 })] as unknown as T;
    case 'generateAdaptiveQuestion':
    case 'generateCbeQuestion':
      return createMockQuestion() as unknown as T;
    case 'analyzeQueryComplexity':
      return 'simple' as unknown as T;
    case 'checkFlashcardAnswer':
      return { isCorrect: true, feedback: 'Mock feedback generated without Gemini.' } as unknown as T;
    case 'generateParentalReport':
      return createMockParentalReport('Student') as unknown as T;
    case 'generateParentalInsight':
      return createMockParentalInsight('mock query') as unknown as T;
    case 'generateSimulationExplanation':
    case 'explainConceptInDepth':
    case 'generateConceptDeepDive':
    case 'explainTextSnippet':
    case 'generatePracticeReportSummary':
    case 'generateStudentReportCardSummary':
    case 'generateRentalAgreement':
    case 'generateTeacherWeeklyReport':
      return `Mock response for ${operation}.` as unknown as T;
    case 'generateCrossCurricularProjectIdea':
      return createMockCrossCurricularProject('10', 'Science') as unknown as T;
    case 'analyzeScratchpadForHint':
      return 'Mock hint: revisit the key step you wrote last.' as unknown as T;
    case 'analyzeScratchpadForErrorAnalysis':
      return 'calculation_error' as unknown as T;
    case 'generateVideoForConcept':
      return 'https://example.com/mock-video.mp4' as unknown as T;
    case 'generateLessonPackFromTopic':
      return createMockLessonPack(null, 'Mock Topic') as unknown as T;
    case 'generateMicroRemediation':
      return {
        explanation: [createMockStructuredParagraph('This mock remediation revisits the target concept.')],
        quick_check: createMockQuickCheck('the concept'),
      } as unknown as T;
    case 'gradeShortAnswer':
      return { awardedMarks: 0, feedback: 'Mock grading - no API key.' } as unknown as T;
    case 'gradeVerbalExplanation':
      return { transcript: 'Mock transcript generated in offline mode.', awardedMarks: 0, feedback: 'Mock grading - review your explanation.' } as unknown as T;
    case 'gradeHandwrittenAnswer':
      return { transcribedText: 'Mock transcription', awardedMarks: 0, feedback: 'Mock feedback for handwritten answer.' } as unknown as T;
    case 'generateRemediationPack':
      return createMockRemediationPack('Mock Concept') as unknown as T;
    case 'generateCurriculumBlueprint':
      return createMockCurriculumBlueprint('10', 'Science') as unknown as T;
    case 'generatePtmBrief':
      return createMockPtmBrief('Student') as unknown as T;
    case 'generateExamAnalyticsReport':
      return createMockAIProctoringReport() as unknown as T;
    case 'generateWeeklyStudyPlan':
      return createMockWeeklyStudyPlan() as unknown as T;
    case 'deconstructSyllabus':
      return createMockDeconstructedSyllabus() as unknown as T;
    default:
      return (`[Mock response for ${operation}]` as unknown) as T;
  }
};

const withGemini = async <T>(
  operation: string,
  executor: () => Promise<T>,
  mockFactory?: () => T | Promise<T>
): Promise<T> => {
  if (useGeminiMock) {
    const result = await Promise.resolve(
      mockFactory ? mockFactory() : getDefaultMockResponse<T>(operation)
    );
    logGeminiInfo(operation, 'Mock mode active, returning stub response.');
    return result;
  }

  try {
    return await executor();
  } catch (error) {
    logGeminiError(operation, error);
    throw error;
  }
};

const getResponseText = (response: GenerateContentResponse): string => {
  if (!response.text) {
    throw new Error("Gemini response did not include text content.");
  }
  return response.text;
};

const questionPoolItemSchema = {
    type: Type.OBJECT,
    properties: {
        q_id: { type: Type.STRING },
        type: { type: Type.STRING },
        marks: { type: Type.NUMBER },
        difficulty: { type: Type.STRING },
        bloom: { type: Type.STRING },
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        answer: { type: Type.STRING },
        rubric: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        source: { type: Type.STRING },
        competency: { type: Type.STRING },
        dok: { type: Type.NUMBER },
        distractor_rationale: { type: Type.STRING },
        source_passage: { type: Type.STRING },
        sub_questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { q_id: { type: Type.STRING }, question: { type: Type.STRING }, marks: { type: Type.NUMBER }, answer: { type: Type.STRING }, rubric: { type: Type.STRING } }, required: ['q_id', 'question', 'marks', 'answer', 'rubric'] } }
    },
    required: ['q_id', 'type', 'marks', 'difficulty', 'bloom', 'question', 'answer', 'rubric', 'competency', 'dok']
};

export const fetchTopicContent = async (
    chapter: SyllabusChapterTopic,
    topic: string,
    onProgress?: (progressData: ProgressData) => void
): Promise<LessonPack> => {
    const topicId = `${chapter.topic_id}|${topic}`;
    const cacheKey = `lesson-pack-v8-${topicId}`;
    
    try {
        const cachedData = await get<string>('cache', cacheKey);
        if (cachedData) {
            console.log(`Loading lesson pack from cache for topic: ${topic}`);
            onProgress?.({ progress: 100, message: 'Loaded from cache!', step: 1, totalSteps: 1 });
            return JSON.parse(cachedData) as LessonPack;
        }
    } catch (e) {
        console.error("Could not read from IndexedDB cache", e);
    }

    return withGemini(
        'fetchTopicContent',
        async () => {
            onProgress?.({ progress: 0, message: 'Generating your lesson...', step: 0, totalSteps: 1 });
            console.log(`Generating new lesson pack for topic: ${topic}`);
            
            const [grade, subject] = chapter.topic_id.split('-').slice(0, 2).map(s => s.replace('G', ''));
            const ai = createGeminiClient();
        
      const prompt = `
      ROLE
      You are a senior CBSE curriculum designer and pedagogy expert. Your instructions are CRITICAL and must be followed with extreme precision.

      GOAL
      Generate a detailed, comprehensive, and pedagogically sound content module for a **single, specific topic** within a larger chapter.

      CONTEXT
      - Grade: ${grade}
      - Subject: ${subject}
      - Chapter: "${chapter.topic_name}"
      - **Current Topic to Generate Content For**: "${topic}"

      PEDAGOGICAL INSTRUCTIONS (CRITICAL - NON-NEGOTIABLE):
      1.  **Strict Focus**: Generate content ONLY for the specified topic ("${topic}"). Do NOT include content from other parts of the chapter.
      2.  **CBSE & NCF Alignment**: All content MUST be strictly aligned with the latest CBSE syllabus and NCF guidelines. Assessments and rubrics must reflect the official CBSE marking scheme.
      3.  **Depth and Variety**: The 'student_explanation' section must be rich and varied. Generate content for ALL fields as specified in the schema.
      4.  **Board Paper Integration & Dual Framework**: The 'question_pool' MUST contain 2-3 questions directly modeled on the patterns and difficulty levels for this specific topic from the **last 10 years of CBSE Board Papers**. For each question, you MUST provide:
          - A 'bloom' level (e.g., 'Remember', 'Understand', 'Apply', 'Analyze').
          - A 'competency' classification (e.g., 'Demonstrate Knowledge and Understanding', 'Application of Knowledge/Concepts').
          - A 'dok' (Webb's Depth of Knowledge) level from 1 to 4.
      5.  **Plain Text Content**: All string content within the JSON must be plain text. Do not use any markdown formatting.

      SCHEMA RULES (ABSOLUTE & NON-NEGOTIABLE):
      - The 'core_explanation' array can contain objects of different 'type'.
      - If 'type' is 'heading', the object MUST contain 'level' (a number) and 'content' (a string).
      - If 'type' is 'paragraph', the object MUST contain 'content' (a string).
      - If 'type' is 'list', the object MUST contain 'items' (an array of strings).
      - If 'type' is 'key_term', the object MUST contain 'term' (a string) and 'definition' (a string).
      - If 'type' is 'note', the object MUST contain 'content' (a string).
      - If 'type' is 'diagram', the object MUST contain 'imageUrl', 'altText', and 'hotspots'. It MUST NOT contain 'level', 'term', 'definition', or 'content'.
      - DO NOT add properties to an object that do not belong to its 'type'. This is the most critical rule. For example, a 'paragraph' object should ONLY have 'type' and 'content' properties.

      OUTPUT FORMAT
      - Output ONLY a single raw JSON object for the content module, containing 'student_explanation', 'assessment_blueprint', and 'teacher_notes'.
    `;
      
      const interactiveVideoSchema = {
          type: Type.OBJECT, properties: { title: { type: Type.STRING }, video_url: { type: Type.STRING }, script: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.NUMBER }, question_text: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correct_answer: { type: Type.STRING }, feedback_correct: { type: Type.STRING }, feedback_incorrect: { type: Type.STRING }, branch_on_incorrect: { type: Type.NUMBER }, }, required: ['timestamp', 'question_text', 'options', 'correct_answer', 'feedback_correct', 'feedback_incorrect'] } } }, required: ['title', 'video_url', 'script']
      };

      const studentExplanationSchema = {
          type: Type.OBJECT,
          properties: {
              core_explanation: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { 
                  type: { type: Type.STRING }, 
                  level: { type: Type.NUMBER }, 
                  content: { type: Type.STRING }, 
                  items: { type: Type.ARRAY, items: { type: Type.STRING } }, 
                  term: { type: Type.STRING }, 
                  definition: { type: Type.STRING },
                  imageUrl: { type: Type.STRING },
                  altText: { type: Type.STRING },
                  hotspots: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      label: { type: Type.STRING },
                      details: { type: Type.STRING },
                  }, required: ['x', 'y', 'label', 'details'] } },
              }, required: ['type'] } },
              quick_check: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correct_answer: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ['question', 'options', 'correct_answer', 'explanation'] },
              worked_examples: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, solution: { type: Type.STRING }, why_it_works: { type: Type.STRING } }, required: ['prompt', 'solution', 'why_it_works'] } },
              guided_practice: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, hint: { type: Type.STRING }, stepwise_solution: { type: Type.STRING } }, required: ['question', 'hint', 'stepwise_solution'] } },
              independent_practice: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer_key: { type: Type.STRING } }, required: ['question', 'answer_key'] } },
              HOTS: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, exemplar_answer: { type: Type.STRING } }, required: ['question', 'exemplar_answer'] } },
              common_errors_and_fixes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { error: { type: Type.STRING }, fix: { type: Type.STRING } }, required: ['error', 'fix'] } },
              fill_in_the_blanks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { sentence_parts: { type: Type.ARRAY, items: { type: Type.STRING } }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correct_answer: { type: Type.STRING } }, required: ['sentence_parts', 'options', 'correct_answer'] } },
              interactive_simulations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, concept_link: { type: Type.STRING } }, required: ['description', 'concept_link'] } },
              interactive_videos: { type: Type.ARRAY, items: interactiveVideoSchema, },
              real_world_applications: { type: Type.ARRAY, items: { type: Type.STRING } },
              matching_quizzes: { type: Type.ARRAY, items: {
                  type: Type.OBJECT, properties: {
                      instruction: { type: Type.STRING },
                      pairs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                          term: { type: Type.STRING },
                          definition: { type: Type.STRING }
                      }, required: ['term', 'definition'] } }
                  }, required: ['instruction', 'pairs']
              } }
          },
          required: ['core_explanation', 'quick_check', 'worked_examples', 'guided_practice', 'independent_practice', 'HOTS', 'common_errors_and_fixes', 'fill_in_the_blanks', 'interactive_simulations', 'interactive_videos', 'real_world_applications', 'matching_quizzes']
      };

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingBudget: 32768 },
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      student_explanation: studentExplanationSchema,
                      assessment_blueprint: {
                          type: Type.OBJECT,
                          properties: {
                              question_pool: { type: Type.ARRAY, items: questionPoolItemSchema },
                          },
                          required: ['question_pool']
                      },
                       teacher_notes: {
                          type: Type.OBJECT,
                          properties: {
                              TLM_list: { type: Type.ARRAY, items: { type: Type.STRING } },
                              differentiation: { type: Type.ARRAY, items: { type: Type.STRING } },
                              remediation_plan: { type: Type.ARRAY, items: { type: Type.STRING } },
                              safety_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
                          },
                          required: ['TLM_list', 'differentiation', 'remediation_plan']
                      }
                  },
                  required: ['student_explanation', 'assessment_blueprint', 'teacher_notes']
              }
          }
      });

      if (!response.text) {
          throw new Error(`Gemini API returned no text for topic "${topic}". This might be due to a safety filter.`);
      }
      
      onProgress?.({ progress: 95, message: 'Finalizing lesson...', step: 1, totalSteps: 1 });

      const partialPack = parseJsonFromResponse(getResponseText(response));

      const finalLessonPack: LessonPack = {
          ...partialPack,
          topic_id: topicId,
          topic_name: topic,
      };
      
      // Replace placeholder video URLs
      if (finalLessonPack?.student_explanation?.interactive_videos) {
          finalLessonPack.student_explanation.interactive_videos.forEach(video => {
              if (!video.video_url || !video.video_url.startsWith('http')) {
                  video.video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; 
              }
          });
      }
      
      try {
          await set('cache', cacheKey, JSON.stringify(finalLessonPack));
          console.log(`Saved lesson pack to cache for topic: ${topic}`);
      } catch (e) {
          console.error("Could not write lesson pack to IndexedDB cache", e);
      }
      onProgress?.({ progress: 100, message: 'Lesson ready!', step: 1, totalSteps: 1 });

      return finalLessonPack;
        },
        () => {
            const mockPack = createMockLessonPack(chapter, topic);
            onProgress?.({ progress: 100, message: 'Loaded mock lesson.', step: 1, totalSteps: 1 });
            return mockPack;
        }
    );
};


export const generateAdaptiveFollowUp = async (results: AssessmentResult[]): Promise<AdaptiveFollowUp[]> => {
    const incorrectAnswers = results.filter(r => !r.is_correct);

    if (incorrectAnswers.length === 0) {
        return []; // No follow-up needed if everything is correct
    }

    return withGemini(
        'generateAdaptiveFollowUp',
        async () => {
            const ai = createGeminiClient();

        const incorrectQuestionsString = incorrectAnswers.map(r => `- ${r.question_text}`).join('\n');

        const prompt = `
          ROLE
          You are an expert adaptive learning tutor for a K-12 CBSE student. Your goal is to create a personalized remediation plan based on the student's incorrect answers.

          TASK
          Analyze the following list of questions the student answered incorrectly. For each distinct underlying concept that the student is struggling with, generate a "micro-lesson" to help them master it. Group questions by concept if they relate to the same topic.

          INCORRECTLY ANSWERED QUESTIONS:
          ${incorrectQuestionsString}

          INSTRUCTIONS
          1.  **Identify Core Concepts**: Determine the fundamental academic concept(s) behind the incorrect answers.
          2.  **Generate Micro-Lessons**: For each concept, create a follow-up plan with the following four parts:
              - "concept": (string) The name of the concept.
              - "explanation": (string) A simple, clear, and concise re-explanation of the concept.
              - "practice_question": (object) A new, fundamental practice question to test the re-explained concept. This should be an "independent_practice" object with "question" and "answer_key".
              - "review_suggestion": (string) A suggestion to review a related, more fundamental topic if applicable.
          3.  **Format**: Return the output as a raw JSON array of these micro-lesson objects.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            concept: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            practice_question: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    answer_key: { type: Type.STRING }
                                },
                                required: ['question', 'answer_key']
                            },
                            review_suggestion: { type: Type.STRING }
                        },
                        required: ['concept', 'explanation', 'practice_question', 'review_suggestion']
                    }
                }
            }
        });

        const parsedJson = parseJsonFromResponse(getResponseText(response));
        return parsedJson as AdaptiveFollowUp[];
        },
        () => createMockAdaptiveFollowUps(incorrectAnswers)
    );
};

export const generateStudyNotes = async (studentExplanation: StudentExplanation, topic: string): Promise<string> => {
    const context = {
        core_explanation: studentExplanation.core_explanation,
        key_terms: studentExplanation.core_explanation.filter(b => b.type === 'key_term')
    };

    return withGemini(
        'generateStudyNotes',
        async () => {
            const ai = createGeminiClient();
        const prompt = `
          You are an academic assistant. Your task is to generate concise, well-structured study notes for a K-12 CBSE student based on the provided lesson content for the topic "${topic}".

          **Instructions**:
          - Summarize the key points from the "core_explanation".
          - List all "key_terms" with their definitions.
          - The output must be clean, easy-to-read plain text. Do not use any markdown formatting. Use line breaks to separate ideas.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return getResponseText(response);
        },
        () => `Mock study notes for ${topic}. Focus on the headline ideas and revisit the mock lesson pack for details.`
    );
};

export const generatePracticeQuiz = async (studentExplanation: StudentExplanation, topic: string): Promise<QuestionPoolItem[]> => {
    const context = {
        core_explanation: studentExplanation.core_explanation,
        worked_examples: studentExplanation.worked_examples,
    };

    return withGemini(
        'generatePracticeQuiz',
        async () => {
            const ai = createGeminiClient();
        const prompt = `
            You are an expert question paper generator for the CBSE curriculum. Based on the following lesson content for "${topic}", create a new, distinct set of 3 practice questions.
            
            **Content Provided**:
            ${JSON.stringify(context, null, 2)}
            
            **Instructions**:
            - Generate 3 questions that test the core concepts.
            - The questions should be of type 'MCQ' or 'SA' (Short Answer).
            - For each question, provide a 'bloom' level, a 'competency' classification, and a 'dok' (Depth of Knowledge) level.
            - Each question must be a valid \`QuestionPoolItem\` object.
            - Return the output as a raw JSON array of these objects.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: questionPoolItemSchema
                }
            }
        });

        return parseJsonFromResponse(getResponseText(response)) as QuestionPoolItem[];
        },
        () => [
            createMockQuestion({ question: `Mock quiz question 1 about ${topic}.` }),
            createMockQuestion({ question: `Mock quiz question 2 about ${topic}.`, difficulty: 'M', dok: 2 }),
            createMockQuestion({ question: `Mock quiz question 3 about ${topic}.`, difficulty: 'H', dok: 3 }),
        ]
    );
};


export const generateFlashcards = async (lessonPack: LessonPack): Promise<Flashcard[]> => {
    const context = lessonPack.student_explanation.core_explanation
        .filter(block => block.type === 'paragraph' || block.type === 'key_term')
        .map(block => {
            if (block.type === 'key_term') {
                return `${block.term}: ${block.definition}`;
            } else if (block.type === 'paragraph') {
                return block.content;
            }
            return '';
        })
        .join('\n');

    return withGemini(
        'generateFlashcards',
        async () => {
            const ai = createGeminiClient();
    const prompt = `
        Based on the following lesson content about "${lessonPack.topic_name}", generate an array of 5-7 high-quality flashcards.
        Each flashcard should have a "term" (a key concept or question) and a "definition" (a concise, clear explanation).
        Return a raw JSON array of objects.

        Content:
        ${context}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        term: { type: Type.STRING },
                        definition: { type: Type.STRING },
                    },
                    required: ['term', 'definition'],
                },
            },
        },
    });


    return parseJsonFromResponse(getResponseText(response)) as Flashcard[];
        },
        () => createMockFlashcards(lessonPack.topic_name)
    );
};

export const analyzeQueryComplexity = async (query: string): Promise<'simple' | 'complex'> => {
    return withGemini(
        'analyzeQueryComplexity',
        async () => {
            const ai = createGeminiClient();
    const prompt = `
        Analyze the complexity of the following student query.
        - If it's a straightforward factual question that can be answered with a direct search (e.g., "what is photosynthesis", "who was Ashoka"), classify it as "simple".
        - If it requires deep reasoning, multi-step problem solving, or synthesis of multiple concepts (e.g., "explain the photoelectric effect with an example", "solve this physics problem..."), classify it as "complex".
        Return a raw JSON object with a single key "complexity" set to either "simple" or "complex".

        Query: "${query}"
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    complexity: { type: Type.STRING },
                },
                required: ['complexity']
            }
        }
    });

    const result = parseJsonFromResponse(getResponseText(response));
    return result.complexity === 'complex' ? 'complex' : 'simple';
        },
        () => 'simple'
    );
};

export const generateAdaptiveQuestion = async (grade: string, subject: string, chapter: string, difficulty: 'E' | 'M' | 'H', previousQuestions: string[]): Promise<QuestionPoolItem> => {
    return withGemini(
        'generateAdaptiveQuestion',
        async () => {
            const ai = createGeminiClient();
    const prompt = `
        Generate a new, unique CBSE-aligned question for a Class ${grade} ${subject} student on the chapter "${chapter}".
        - Difficulty: ${difficulty}
        - Type: 'MCQ' or 'SA'
        - Do NOT repeat any of these previous questions: ${previousQuestions.join(', ')}
        - You MUST provide a 'bloom' level, 'competency' classification, and 'dok' (Depth of Knowledge) level for the question.
        - Return a single raw JSON object matching the QuestionPoolItem schema.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: questionPoolItemSchema
        }
    });

    return parseJsonFromResponse(getResponseText(response)) as QuestionPoolItem;
        }
    );
};

export const explainConceptInDepth = async (text: string): Promise<string> => {
    if (useGeminiMock) {
        logGeminiInfo('explainConceptInDepth', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<string>('explainConceptInDepth');
    }
    const ai = createGeminiClient();
    const prompt = `
        You are an expert CBSE tutor. Explain the following text to a K-12 student in simple, clear, and concise terms. 
        Use analogies and break it down step-by-step. All output must be plain text. Do not use any markdown.

        Text to explain: "${text}"
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return getResponseText(response);
    } catch (error) {
        logGeminiError('explainConceptInDepth', error);
        throw error;
    }
};

export const generateConceptDeepDive = async (text: string): Promise<string> => {
    if (useGeminiMock) {
        logGeminiInfo('generateConceptDeepDive', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<string>('generateConceptDeepDive');
    }
    const ai = createGeminiClient();
    const prompt = `
        You are a distinguished professor and an expert CBSE tutor. Your task is to provide a "deep dive" explanation of the following text for a curious K-12 student. Go beyond a simple explanation.

        **CRITICAL INSTRUCTIONS**:
        1.  **First Principles**: Break down the concept to its fundamental principles.
        2.  **Detailed Analogies**: Use detailed, relatable analogies to explain complex parts.
        3.  **Connections**: Explain how this concept connects to other topics in the curriculum or real-world applications.
        4.  **Socratic Method**: Incorporate guiding questions throughout your explanation to encourage the student to think, rather than just passively reading. For example: "Now, what do you think would happen if...?", "Can you see how this relates to...?".
        5.  **Structure**: Structure your answer logically with clear sub-headings. The entire output must be plain text, using line breaks for structure. Do not use markdown.
        6.  **Depth**: This is a deep dive. Be comprehensive and thorough.

        **Text to explain**: "${text}"
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return getResponseText(response);
    } catch (error) {
        logGeminiError('generateConceptDeepDive', error);
        throw error;
    }
};

export const checkFlashcardAnswer = async (studentAnswer: string, correctAnswer: string, term: string): Promise<{ isCorrect: boolean, feedback: string }> => {
    if (useGeminiMock) {
        logGeminiInfo('checkFlashcardAnswer', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<{ isCorrect: boolean; feedback: string }>('checkFlashcardAnswer');
    }
    const ai = createGeminiClient();
    const prompt = `
      Evaluate the student's answer for a flashcard. The term is "${term}" and the correct definition is "${correctAnswer}".
      The student's answer is: "${studentAnswer}".
      Is the student's answer conceptually correct, even if not word-for-word?
      Provide brief, encouraging feedback.
      Return a raw JSON object: { "isCorrect": boolean, "feedback": "your feedback string" }
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT, properties: { isCorrect: { type: Type.BOOLEAN }, feedback: { type: Type.STRING } }, required: ['isCorrect', 'feedback']
                }
            }
        });

        return parseJsonFromResponse(getResponseText(response));
    } catch (error) {
        logGeminiError('checkFlashcardAnswer', error);
        throw error;
    }
};

export const generateParentalReport = async (profile: UserProfile, progressData: UserProgressData): Promise<ParentalReport> => {
    if (useGeminiMock) {
        logGeminiInfo('generateParentalReport', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<ParentalReport>('generateParentalReport');
    }
    const ai = createGeminiClient();
    const prompt = `
        Generate a parental report for a student named ${profile.name} (Class ${profile.grade}).
        Progress data: ${JSON.stringify(progressData)}.
        - Write a brief, encouraging summary.
        - Identify 2-3 strengths based on completed chapters.
        - Identify 2-3 areas to focus on (started but not completed).
        - Provide 3 actionable, simple tips for parents to help their child.
        Return a raw JSON object matching the ParentalReport schema.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
                        actionableTips: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { icon: { type: Type.STRING }, tip: { type: Type.STRING } }, required: ['icon', 'tip'] } }
                    },
                    required: ['summary', 'strengths', 'focusAreas', 'actionableTips']
                }
            }
        });

        return parseJsonFromResponse(getResponseText(response)) as ParentalReport;
    } catch (error) {
        logGeminiError('generateParentalReport', error);
        throw error;
    }
};

export const generateParentalInsight = async (query: string, studentData: { profile: UserProfile, dktData: UserDktData, assignments: Assignment[], submissions: StudentSubmission[] }): Promise<string> => {
    if (useGeminiMock) {
        logGeminiInfo('generateParentalInsight', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<string>('generateParentalInsight');
    }
    const ai = createGeminiClient();
    const { profile, dktData, assignments, submissions } = studentData;

    const prompt = `
      ROLE: You are "MIGA for Parents", a helpful and clear AI assistant for the Alfanumrik learning platform.
      GOAL: Answer a parent's question about their child's academic progress by analyzing the provided data.

      CONTEXT:
      - Child's Name: ${profile.name}
      - Child's Grade: ${profile.grade}
      - Parent's Question: "${query}"
      - Child's Data: ${JSON.stringify({ dktData, assignments, submissions }, null, 2)}

      CRITICAL INSTRUCTIONS:
      1.  **Data-Bound**: Your answer MUST be based exclusively on the provided 'Child's Data' JSON. Do not invent information or make assumptions.
      2.  **Simple Language**: Explain complex data in simple, non-technical terms. For example, instead of "DKT mastery is 0.68", say "Mastery in this topic is around 68%, which means there's room for improvement."
      3.  **Positive & Supportive Tone**: Always be encouraging. Frame challenges as opportunities for growth.
      4.  **Directly Answer the Question**: Analyze the data to directly address the parent's query.
      5.  **Be Honest if Data is Missing**: If the question cannot be answered from the provided data, politely state that, e.g., "I don't have information on that specific test, but I can tell you about their overall progress in Science."
      6.  **Plain Text Output**: Your entire response must be plain text. Do not use markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });

        return getResponseText(response);
    } catch (error) {
        logGeminiError('generateParentalInsight', error);
        throw error;
    }
};


export const generateSimulationExplanation = async (concept: string, description: string): Promise<string> => {
    if (useGeminiMock) {
        logGeminiInfo('generateSimulationExplanation', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<string>('generateSimulationExplanation');
    }
    const ai = createGeminiClient();
    const prompt = `
        Explain the concept of "${concept}" as if you were an interactive simulation.
        The simulation is described as: "${description}".
        Break down the explanation into interactive steps. All output must be plain text. Do not use any markdown.
        For example: "Step 1: Observe the particles... What happens when you increase the temperature? Now, try decreasing it..."
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return getResponseText(response);
    } catch (error) {
        logGeminiError('generateSimulationExplanation', error);
        throw error;
    }
};

export const gradeShortAnswer = async (question: string, rubric: string, totalMarks: number, studentAnswer: string): Promise<{ awardedMarks: number, feedback: string }> => {
    if (useGeminiMock) {
        logGeminiInfo('gradeShortAnswer', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<{ awardedMarks: number; feedback: string }>('gradeShortAnswer');
    }
    const ai = createGeminiClient();
    const prompt = `
      You are an expert CBSE examiner. Your task is to grade a student's written answer with nuance, allowing for partial credit.

      **CRITICAL INSTRUCTIONS**:
      1.  **Analyze Point-by-Point**: Carefully compare the student's answer against each point in the provided marking rubric.
      2.  **Award Partial Credit**: Based on the total marks available for the question, award marks for each correct point the student has mentioned. If a student gets some parts right but misses others, they should receive partial credit.
      3.  **Provide Detailed Feedback**: Your feedback must explain *why* a certain score was given. Mention what the student did correctly and what they missed, referencing the rubric.
      4.  **Strict JSON Output**: Your final output must be a raw JSON object with two keys:
          - "awardedMarks": (number) The total marks awarded, which can be a whole number from 0 to ${totalMarks}.
          - "feedback": (string) Your detailed, point-by-point explanation for the score.

      **GRADING TASK**:
      - **Question**: "${question}"
      - **Marking Rubric**: "${rubric}"
      - **Total Marks Available**: ${totalMarks}
      - **Student's Answer**: "${studentAnswer}"
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT, properties: { awardedMarks: { type: Type.NUMBER }, feedback: { type: Type.STRING } }, required: ['awardedMarks', 'feedback']
                }
            }
        });

        const parsedJson = parseJsonFromResponse(getResponseText(response));
        return parsedJson as { awardedMarks: number, feedback: string };
    } catch (error) {
        logGeminiError('gradeShortAnswer', error);
        throw error;
    }
};

export const gradeVerbalExplanation = async (question: QuestionPoolItem, audioBlob: Blob): Promise<{ transcript: string, awardedMarks: number, feedback: string }> => {
    if (useGeminiMock) {
        logGeminiInfo('gradeVerbalExplanation', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<{ transcript: string; awardedMarks: number; feedback: string }>('gradeVerbalExplanation');
    }
    requireGeminiApiKey();
    const ai = createGeminiClient();
    const audioBase64 = await blobToBase64(audioBlob);

    const audioPart = { inlineData: { mimeType: audioBlob.type, data: audioBase64 } };
    const textPart = { text: `
        You are a CBSE examiner conducting a viva voce (oral exam).
        - Question: "${question.question}"
        - Rubric for full marks: "${question.rubric}"
        - Total Marks Available: ${question.marks}

        The student's verbal answer is in the provided audio. Your task is to:
        1. Transcribe the student's complete answer.
        2. Evaluate their verbal explanation against the rubric.
        3. Award marks from 0 to ${question.marks}, allowing for partial credit.
        4. Provide brief, constructive feedback on their explanation.
        
        Return a single, raw JSON object with the following structure: { "transcript": string, "awardedMarks": number, "feedback": string }
    `};

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [textPart, audioPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT, 
                    properties: { 
                        transcript: { type: Type.STRING }, 
                        awardedMarks: { type: Type.NUMBER }, 
                        feedback: { type: Type.STRING } 
                    }, 
                    required: ['transcript', 'awardedMarks', 'feedback']
                }
            }
        });
        return parseJsonFromResponse(getResponseText(response));
    } catch (error) {
        logGeminiError('gradeVerbalExplanation', error);
        throw error;
    }
};


export const explainTextSnippet = async (snippet: string): Promise<string> => {
    if (useGeminiMock) {
        logGeminiInfo('explainTextSnippet', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<string>('explainTextSnippet');
    }
    requireGeminiApiKey();
    const ai = createGeminiClient();
    const prompt = `Explain this snippet in simpler terms for a K-12 student: "${snippet}"`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return getResponseText(response);
    } catch (error) {
        logGeminiError('explainTextSnippet', error);
        throw error;
    }
};

export const generateMicroRemediation = async (topic: string, question: QuestionPoolItem | QuickCheck, studentAnswer: string): Promise<{ explanation: StructuredContent[], quick_check: QuickCheck }> => {
    if (useGeminiMock) {
        logGeminiInfo('generateMicroRemediation', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<{ explanation: StructuredContent[]; quick_check: QuickCheck }>('generateMicroRemediation');
    }
    const ai = createGeminiClient();

    const isMcq = 'options' in question && Array.isArray(question.options);
    const mcqContext = isMcq ? `
      This was a multiple-choice question.
      - Options: ${JSON.stringify(question.options)}
      - Correct Answer: "${'correct_answer' in question ? question.correct_answer : question.answer}"
      - Analyze the student's incorrect choice ("${studentAnswer}"). What specific misconception does this choice likely reveal? Tailor your explanation to directly address this misconception before re-explaining the core concept.
    ` : '';

    const prompt = `
        A student answered a question about "${topic}" incorrectly.
        - Question: "${question.question}"
        - Student's incorrect answer: "${studentAnswer}"
        ${mcqContext}
        
        Generate a micro-remediation plan. This must include:
        1. A concise "explanation" (as an array of StructuredContent, e.g., paragraph or list) of the core concept the student missed.
        2. A new, simple "quick_check" question (as a QuickCheck object) to verify their understanding of the re-explanation.
        Return a single raw JSON object: { "explanation": [...], "quick_check": {...} }
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    level: { type: Type.NUMBER },
                                    content: { type: Type.STRING },
                                    items: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    term: { type: Type.STRING },
                                    definition: { type: Type.STRING },
                                },
                                required: ['type']
                            }
                        },
                        quick_check: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correct_answer: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ['question', 'options', 'correct_answer', 'explanation'] }
                    },
                    required: ['explanation', 'quick_check']
                }
            }
        });
        
        const parsedJson = parseJsonFromResponse(getResponseText(response));
        return parsedJson as { explanation: StructuredContent[], quick_check: QuickCheck };
    } catch (error) {
        logGeminiError('generateMicroRemediation', error);
        throw error;
    }
};

export const generateCbeQuestion = async (grade: string, subject: string, chapter: string, type: 'MCQ' | 'SA' | 'Case', competency: string, dok: number, topic: string): Promise<QuestionPoolItem> => {
    if (useGeminiMock) {
        logGeminiInfo('generateCbeQuestion', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<QuestionPoolItem>('generateCbeQuestion');
    }
    const ai = createGeminiClient();
    const prompt = `
        Generate a single, high-quality, CBSE-aligned competency-based question.
        - Grade: ${grade}, Subject: ${subject}, Chapter: ${chapter}, Topic: ${topic}
        - Type: ${type}, Competency: "${competency}", DOK Level: ${dok}
        - The question must be original and not a simple recall of facts. It should require application or analysis.
        - For MCQs, provide a 'distractor_rationale'.
        - For Case questions, provide a 'source_passage' and 'sub_questions'.
        - Return a single raw JSON object matching the QuestionPoolItem schema. Ensure q_id is a unique string like 'gen-[timestamp]'.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: questionPoolItemSchema }
        });

        return parseJsonFromResponse(getResponseText(response)) as QuestionPoolItem;
    } catch (error) {
        logGeminiError('generateCbeQuestion', error);
        throw error;
    }
};

export const generateRemediationGroups = async (results: SafalDiagnosticResult[]): Promise<RemediationGroup[]> => {
    return withGemini(
        'generateRemediationGroups',
        async () => {
            const ai = createGeminiClient();
    const prompt = `
        Based on these SAFAL diagnostic results, identify the top 2-3 competencies where students are struggling most (rated 'low').
        For each of these competencies, create a remediation group.
        - List the names of the students in the group.
        - Suggest a simple, actionable remediation task for the teacher to conduct.
        - Return a raw JSON array of RemediationGroup objects.

        Results: ${JSON.stringify(results)}
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY, items: { type: Type.OBJECT, properties: { competency: { type: Type.STRING }, students: { type: Type.ARRAY, items: { type: Type.STRING } }, suggestedTask: { type: Type.STRING } }, required: ['competency', 'students', 'suggestedTask'] }
            }
        }
    });

    return parseJsonFromResponse(getResponseText(response)) as RemediationGroup[];
        },
        () => createMockRemediationGroups('Mock competency')
    );
};

export const generateQfaRemediation = async (assessment: QuickFormativeAssessment, results: QfaResult[]): Promise<RemediationGroup[]> => {
    return withGemini(
        'generateQfaRemediation',
        async () => {
            const ai = createGeminiClient();
    const prompt = `
        Analyze the results of this quick formative assessment (exit ticket).
        - Assessment: ${JSON.stringify(assessment)}
        - Results: ${JSON.stringify(results)}
        Identify the question(s) most students answered incorrectly. For each of these, create a remediation group.
        - The 'competency' should be the question text.
        - List the names of students who got it wrong.
        - Suggest a simple remediation task for the teacher to perform in the next class.
        Return a raw JSON array of RemediationGroup objects.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', contents: prompt, config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY, items: { type: Type.OBJECT, properties: { competency: { type: Type.STRING }, students: { type: Type.ARRAY, items: { type: Type.STRING } }, suggestedTask: { type: Type.STRING } }, required: ['competency', 'students', 'suggestedTask'] }
            }
        }
    });

    return parseJsonFromResponse(getResponseText(response)) as RemediationGroup[];
        },
        () => createMockRemediationGroups('Mock exit ticket focus')
    );
};

export const generateRentalAgreement = async (booking: FacilityBooking): Promise<string> => {
    return withGemini(
        'generateRentalAgreement',
        async () => {
            const ai = createGeminiClient();
    const prompt = `
        Generate a simple, one-page facility rental agreement template based on this booking information:
        - Facility: ${booking.facility}
        - Rented by: ${booking.bookedBy}
        - Date: ${booking.date}, from ${booking.startTime} to ${booking.endTime}
        - Purpose: ${booking.purpose}
        Include standard clauses for payment, damages, cancellation, and responsibilities. Keep it clear and concise.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return getResponseText(response);
        }
    );
};

export const generateStudentReportCardSummary = async (student: UserProfile, context: string): Promise<string> => {
    return withGemini(
        'generateStudentReportCardSummary',
        async () => {
            const ai = createGeminiClient();
    const prompt = `
        Write a concise, encouraging summary and recommendation for a student's report card.
        - Student: ${student.name}, Class ${student.grade}
        - Context: ${context}
        Keep the tone positive. Highlight strengths and suggest 1-2 concrete areas for improvement. The output should be a single paragraph.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return getResponseText(response);
        }
    );
};

export const generatePracticeExam = async (grade: string, subject: string, blueprint: PracticeBlueprint, chapters?: string[]): Promise<QuestionPoolItem[]> => {
    const chapterContext = chapters && chapters.length > 0
        ? `- The questions must ONLY cover topics from the following chapters: ${chapters.join(', ')}.`
        : '- The questions must be relevant to the subject and grade level.';
    
    return withGemini(
        'generatePracticeExam',
        async () => {
            const ai = createGeminiClient();
    const prompt = `
      Generate a practice exam paper for a Class ${grade} ${subject} student.
      Adhere strictly to this blueprint: ${JSON.stringify(blueprint.structure)}.
      - The questions must be original and distinct.
      ${chapterContext}
      - For each question, create a valid QuestionPoolItem object, including 'bloom', 'competency', and 'dok' levels.
      Return a single raw JSON array of these QuestionPoolItem objects, containing exactly the number of questions specified in the blueprint.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: questionPoolItemSchema
            }
        }
    });
    return parseJsonFromResponse(getResponseText(response)) as QuestionPoolItem[];
        },
        () => [createMockQuestion(), createMockQuestion({ difficulty: 'M', dok: 2 })]
    );
};

export const generatePracticeReportSummary = async (results: PracticeResult[]): Promise<string> => {
    const simplifiedResults = results.map(r => ({ question: r.question.question, isCorrect: r.isCorrect, marksAwarded: r.marksAwarded, totalMarks: r.question.marks }));
    return withGemini(
        'generatePracticeReportSummary',
        async () => {
            const ai = createGeminiClient();
    const prompt = `
      Based on these practice exam results, provide a brief, encouraging performance summary for the student.
      - Acknowledge their score, especially where partial credit was given.
      - Identify 1-2 topics they did well on.
      - Identify 1-2 topics they should review based on incorrect answers or where they lost marks.
      - Keep it concise (2-3 sentences).
      Results: ${JSON.stringify(simplifiedResults)}
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return getResponseText(response);
        }
    );
};

export const generateCrossCurricularProjectIdea = async (grade: string, subject: string): Promise<Omit<CrossCurricularProject, 'id' | 'evidence'>> => {
    return withGemini(
        'generateCrossCurricularProjectIdea',
        async () => {
            const ai = createGeminiClient();
    const prompt = `
        Generate a single, creative cross-curricular project idea that integrates AI concepts with ${subject} for a Class ${grade} student.
        - The project should be simple and achievable with basic tools.
        - Provide a title, description, 2-3 learning objectives, and 2-3 high-level tasks.
        - Return a single raw JSON object matching the CrossCurricularProject schema (omitting 'id' and 'evidence').
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING }, subject: { type: Type.STRING }, grade: { type: Type.STRING }, description: { type: Type.STRING },
                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'subject', 'grade', 'description', 'objectives', 'tasks']
            }
        }
    });
    return parseJsonFromResponse(getResponseText(response)) as Omit<CrossCurricularProject, 'id' | 'evidence'>;
        },
        () => createMockCrossCurricularProject(grade, subject)
    );
};

export const analyzeScratchpadForHint = async (imageBase64: string, questionText: string): Promise<string> => {
    return withGemini(
        'analyzeScratchpadForHint',
        async () => {
            const ai = createGeminiClient();
    
    const imagePart = { inlineData: { mimeType: 'image/png', data: imageBase64 } };
    const textPart = { text: `
        Analyze the student's handwritten work in this image for the question: "${questionText}".
        Identify the first potential mistake or the next logical step.
        Provide a short, Socratic hint to guide the student on that specific step. Do not solve the problem or give away the answer.
        Your hint should be one or two sentences. For example: "Good start! Have you double-checked the sign when you moved the term across the equals sign?"
    `};

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
    });
    return getResponseText(response);
        }
    );
};

export const analyzeScratchpadForErrorAnalysis = async (imageBase64: string, questionText: string): Promise<string> => {
    return withGemini(
        'analyzeScratchpadForErrorAnalysis',
        async () => {
            const ai = createGeminiClient();

    const imagePart = { inlineData: { mimeType: 'image/png', data: imageBase64 } };
    const textPart = { text: `
        Analyze the student's handwritten work in this image for the question: "${questionText}".
        Identify the primary type of error made. Classify the error into one of the following categories:
        - "calculation_error": A mistake in arithmetic.
        - "sign_error": An incorrect plus or minus sign.
        - "transposition_error": A mistake in moving terms across an equals sign.
        - "formula_error": Used the wrong formula or applied it incorrectly.
        - "conceptual_error": A fundamental misunderstanding of the concept.
        - "unknown": If the work is too messy or the error type is unclear.
        Return a single raw JSON object: { "errorType": "your_classification" }
    `};

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    errorType: { type: Type.STRING }
                },
                required: ['errorType']
            }
        }
    });

    const result = parseJsonFromResponse(getResponseText(response));
    return result.errorType || 'unknown';
        }
    );
};

export const generateVideoForConcept = async (prompt: string): Promise<string> => {
    if (useGeminiMock) {
        logGeminiInfo('generateVideoForConcept', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<string>('generateVideoForConcept');
    }
    // A new AI instance MUST be created before each call to ensure the latest API key is used.
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error("API key is not available in the environment.");
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Create a 30-second, simple animated educational video explaining this concept for a 10th-grade student: "${prompt}". Use clear labels and simple visuals.`,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            try {
                operation = await ai.operations.getVideosOperation({ operation: operation });
            } catch (e) {
                logGeminiError('generateVideoForConcept', e);
                throw new Error("Polling for video generation status failed.");
            }
        }

        if (operation.error) {
            throw new Error(`Video generation failed with an error: ${operation.error.message}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation succeeded, but no download link was returned.");
        }

        // The API key must be appended to the download URL
        const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!videoResponse.ok) {
            const errorBody = await videoResponse.text();
            logGeminiError('generateVideoForConcept', { status: videoResponse.status, body: errorBody });
            const userFriendlyError = errorBody.includes("Requested entity was not found") 
                ? "The provided API key is invalid or not found." 
                : `Failed to download video file. Server responded with status ${videoResponse.status}.`;
            throw new Error(userFriendlyError);
        }

        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);
    } catch (error) {
        logGeminiError('generateVideoForConcept', error);
        throw error;
    }
};

export const generateTeacherWeeklyReport = async (
    students: UserProfile[],
    dktData: AllDktData,
    assignments: Assignment[],
    submissions: StudentSubmission[]
): Promise<string> => {
    if (useGeminiMock) {
        logGeminiInfo('generateTeacherWeeklyReport', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<string>('generateTeacherWeeklyReport');
    }
    const ai = createGeminiClient();

    // Simplify data to make the prompt more concise and focused for the LLM
    const simplifiedStudents = students.map(({ id, name }) => ({ id, name }));
    const simplifiedDkt = Object.entries(dktData).reduce((acc, [userId, userData]) => {
        (acc as any)[Number(userId)] = Object.entries(userData).reduce((userAcc, [skillId, skillData]) => {
            (userAcc as any)[skillId] = { mastery: (skillData as DktSkillState).mastery };
            return userAcc;
        }, {});
        return acc;
    }, {});

    const simplifiedAssignments = assignments.map(({ id, title }) => ({ id, title }));
    const simplifiedSubmissions = submissions.map(({ studentId, assignmentId, score }) => ({ studentId, assignmentId, score }));

    const prompt = `
      ROLE: You are an experienced Head of Department analyzing the weekly performance data for a class.
      
      TASK: Analyze the following JSON data. Your goal is to identify trends, pinpoint struggling students, and suggest a concrete remedial action for the teacher.

      DATA:
      ${JSON.stringify({
        students: simplifiedStudents,
        masteryData: simplifiedDkt,
        assignments: simplifiedAssignments,
        submissions: simplifiedSubmissions,
      }, null, 2)}
      
      INSTRUCTIONS:
      1.  **Identify the top 2-3 most challenging concepts for the class as a whole**. A "concept" can be inferred from the skillId in the masteryData (e.g., a skillId of 'G10-Science-Chemical Reactions and Equations' refers to that chapter/concept). Low mastery scores (below 0.6) indicate a challenge.
      2.  **Pinpoint 2-3 specific students who are falling behind**, referencing their low mastery scores on specific topics or consistently low assignment scores.
      3.  **Generate a concise, 3-paragraph narrative summary of these findings**. The first paragraph should cover class-wide trends. The second should discuss individual student challenges. The third should be an encouraging conclusion.
      4.  **Suggest a concrete, actionable 15-minute remedial activity the teacher can conduct to address the main issue identified**.
      5.  **The entire output MUST be plain text**. Do not use any markdown formatting or JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });

        return getResponseText(response);
    } catch (error) {
        logGeminiError('generateTeacherWeeklyReport', error);
        throw error;
    }
};

export const gradeHandwrittenAnswer = async (
    imageFile: File,
    question: string,
    rubric: string,
    totalMarks: number
): Promise<{ transcribedText: string, awardedMarks: number, feedback: string }> => {
    if (useGeminiMock) {
        logGeminiInfo('gradeHandwrittenAnswer', 'Mock mode active, returning stub response.');
        return getDefaultMockResponse<{ transcribedText: string; awardedMarks: number; feedback: string }>('gradeHandwrittenAnswer');
    }
    requireGeminiApiKey();
    const ai = createGeminiClient();

    const imageBase64 = await fileToBase64(imageFile);

    const imagePart = { inlineData: { mimeType: imageFile.type, data: imageBase64 } };
    const textPart = { text: `
      You are an expert CBSE examiner AI. Your task is to grade a student's handwritten answer from an image.

      **CRITICAL INSTRUCTIONS**:
      1.  **Transcribe First**: Look at the image and accurately transcribe the student's handwritten answer.
      2.  **Grade Against Rubric**: Compare the transcribed answer against the provided marking rubric point-by-point.
      3.  **Award Partial Credit**: Award marks judiciously. If a student gets some parts right but misses others, they MUST receive partial credit.
      4.  **Provide Detailed Feedback**: Your feedback must explain *why* a certain score was given. Mention what the student did correctly and what they missed, referencing the rubric.
      5.  **Strict JSON Output**: Your final output must be a single, raw JSON object with three keys:
          - "transcribedText": (string) The full transcribed text of the student's answer.
          - "awardedMarks": (number) The total marks awarded (can be a whole or decimal number from 0 to ${totalMarks}).
          - "feedback": (string) Your detailed, point-by-point explanation for the score.

      **GRADING TASK**:
      - **Question**: "${question}"
      - **Marking Rubric**: "${rubric}"
      - **Total Marks Available**: ${totalMarks}
      - **Student's Handwritten Answer**: (in the provided image)
    `};

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transcribedText: { type: Type.STRING },
                        awardedMarks: { type: Type.NUMBER },
                        feedback: { type: Type.STRING }
                    },
                    required: ['transcribedText', 'awardedMarks', 'feedback']
                }
            }
        });


        const parsedJson = parseJsonFromResponse(getResponseText(response));
        return parsedJson as { transcribedText: string, awardedMarks: number, feedback: string };
    } catch (error) {
        logGeminiError('gradeHandwrittenAnswer', error);
        throw error;
    }
};

export const generateLessonPackFromTopic = async (grade: string, subject: string, topic: string): Promise<LessonPack> => {
    if (useGeminiMock) {
        logGeminiInfo('generateLessonPackFromTopic', 'Mock mode active, returning stub lesson pack.');
        return createMockLessonPack(null, topic);
    }
    requireGeminiApiKey();
    const ai = createGeminiClient();

    const prompt = `
        ROLE: You are an expert CBSE curriculum designer.
        GOAL: Generate a complete and detailed LessonPack JSON object for the given topic.
        CONTEXT:
        - Grade: ${grade}
        - Subject: ${subject}
        - Topic: "${topic}"
        
        INSTRUCTIONS:
        - Generate content for ALL fields in the LessonPack schema provided.
        - The 'student_explanation' should be comprehensive, with multiple types of content (core_explanation, examples, practice, etc.).
        - The 'assessment_blueprint' should have a varied question pool of at least 5 questions. Each question must include 'bloom', 'competency', and 'dok' fields.
        - The 'teacher_notes' should be practical and helpful.
        - All string content must be plain text without markdown.
        - The 'topic_id' should be a slug-cased string like 'G${grade}-${subject.replace(' ', '')}-${topic.replace(/\s+/g, '-')}'.
        
        OUTPUT FORMAT: A single raw JSON object matching the LessonPack schema.
    `;

    const interactiveVideoSchema = {
        type: Type.OBJECT, properties: { title: { type: Type.STRING }, video_url: { type: Type.STRING }, script: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.NUMBER }, question_text: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correct_answer: { type: Type.STRING }, feedback_correct: { type: Type.STRING }, feedback_incorrect: { type: Type.STRING }, branch_on_incorrect: { type: Type.NUMBER }, }, required: ['timestamp', 'question_text', 'options', 'correct_answer', 'feedback_correct', 'feedback_incorrect'] } } }, required: ['title', 'video_url', 'script']
    };

    const studentExplanationSchema = {
        type: Type.OBJECT,
        properties: {
            core_explanation: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, level: { type: Type.NUMBER }, content: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } }, term: { type: Type.STRING }, definition: { type: Type.STRING }, }, required: ['type'] } },
            quick_check: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correct_answer: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ['question', 'options', 'correct_answer', 'explanation'] },
            worked_examples: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, solution: { type: Type.STRING }, why_it_works: { type: Type.STRING } }, required: ['prompt', 'solution', 'why_it_works'] } },
            guided_practice: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, hint: { type: Type.STRING }, stepwise_solution: { type: Type.STRING } }, required: ['question', 'hint', 'stepwise_solution'] } },
            independent_practice: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer_key: { type: Type.STRING } }, required: ['question', 'answer_key'] } },
            HOTS: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, exemplar_answer: { type: Type.STRING } }, required: ['question', 'exemplar_answer'] } },
            common_errors_and_fixes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { error: { type: Type.STRING }, fix: { type: Type.STRING } }, required: ['error', 'fix'] } },
            fill_in_the_blanks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { sentence_parts: { type: Type.ARRAY, items: { type: Type.STRING } }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correct_answer: { type: Type.STRING } }, required: ['sentence_parts', 'options', 'correct_answer'] } },
            interactive_simulations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, concept_link: { type: Type.STRING } }, required: ['description', 'concept_link'] } },
            interactive_videos: { type: Type.ARRAY, items: interactiveVideoSchema, },
            real_world_applications: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['core_explanation', 'quick_check', 'worked_examples', 'guided_practice', 'independent_practice', 'HOTS', 'common_errors_and_fixes', 'fill_in_the_blanks', 'interactive_simulations', 'interactive_videos', 'real_world_applications']
    };
    
    const lessonPackSchema = {
        type: Type.OBJECT,
        properties: {
            topic_id: { type: Type.STRING },
            topic_name: { type: Type.STRING },
            student_explanation: studentExplanationSchema,
            assessment_blueprint: {
                type: Type.OBJECT,
                properties: {
                    question_pool: { type: Type.ARRAY, items: questionPoolItemSchema },
                },
                required: ['question_pool']
            },
            teacher_notes: {
                type: Type.OBJECT,
                properties: {
                    TLM_list: { type: Type.ARRAY, items: { type: Type.STRING } },
                    differentiation: { type: Type.ARRAY, items: { type: Type.STRING } },
                    remediation_plan: { type: Type.ARRAY, items: { type: Type.STRING } },
                    safety_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['TLM_list', 'differentiation', 'remediation_plan', 'safety_notes']
            }
        },
        required: ['topic_id', 'topic_name', 'student_explanation', 'assessment_blueprint', 'teacher_notes']
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: lessonPackSchema,
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });

    if (!response.text) {
        throw new Error("Gemini API returned no text for the lesson pack.");
    }


    const pack = parseJsonFromResponse(getResponseText(response)) as LessonPack;
    
    // Replace placeholder video URLs
    if (pack?.student_explanation?.interactive_videos) {
        pack.student_explanation.interactive_videos.forEach(video => {
            if (!video.video_url || !video.video_url.startsWith('http')) {
                video.video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; 
            }
        });
    }

    return pack;
};

export const generateCurriculumBlueprint = async (
    grade: string,
    subject: string,
    totalHours: number,
    examDates: { term1: string; term2: string },
    allDktData: AllDktData
): Promise<{ blueprint: SyllabusBlueprintUnit[], calendar: PacingCalendarEvent[] }> => {
    if (useGeminiMock) {
        logGeminiInfo('generateCurriculumBlueprint', 'Mock mode active, returning stub blueprint.');
        return createMockCurriculumBlueprint(grade, subject);
    }
    requireGeminiApiKey();
    const ai = createGeminiClient();
    
    const syllabusForSubject = cbseSyllabus[grade]?.[subject];
    if (!syllabusForSubject) {
        throw new Error(`Syllabus not found for Grade ${grade}, Subject ${subject}`);
    }

    const averageMastery: { [topicName: string]: number } = {};
    const topicCounts: { [topicName: string]: number } = {};

    Object.values(allDktData).forEach(userDkt => {
        Object.entries(userDkt).forEach(([skillId, skillData]) => {
            if (skillId.startsWith(`G${grade}-${subject}`)) {
                const topicName = skillId.split('-').slice(2).join('-');
                averageMastery[topicName] = (averageMastery[topicName] || 0) + (skillData as DktSkillState).mastery;
                topicCounts[topicName] = (topicCounts[topicName] || 0) + 1;
            }
        });
    });

    Object.keys(averageMastery).forEach(topicName => {
        averageMastery[topicName] /= topicCounts[topicName];
    });

    const prompt = `
        ROLE: You are an expert CBSE curriculum designer and data analyst.
        GOAL: Generate a data-driven syllabus blueprint and a pacing calendar for an academic year.
        
        CONTEXT:
        - Grade: ${grade}
        - Subject: ${subject}
        - Total Annual Teaching Hours: ${totalHours}
        - Approx. Exam Dates: Term 1 around ${examDates.term1}, Term 2/Boards around ${examDates.term2}.
        - Base CBSE Syllabus: ${JSON.stringify(syllabusForSubject, null, 2)}
        - Historical Performance Data (average mastery on topics from previous years): ${JSON.stringify(averageMastery, null, 2)}

        INSTRUCTIONS:
        1.  Use the provided 'Base CBSE Syllabus' as the source of truth for all topics, learning outcomes, etc.
        2.  For each chapter/topic, generate a 'data_driven_rationale'. If historical data shows low mastery for a topic, recommend allocating more time for reinforcement. If a topic is a prerequisite for many others, note its importance.
        3.  Allocate the ${totalHours} total teaching hours across all units and chapters. This is the 'allocated_hours' field. Topics with lower historical mastery or higher complexity/weightage should receive more hours. The sum of 'allocated_hours' for all chapters should approximate the total for their parent unit.
        4.  Create a week-by-week 'pacing calendar' for the academic year (assume a 36-week year starting in April). Schedule teaching based on your allocated hours, plus add assessments before exam dates, remediation cycles after assessments, and buffer weeks.
        5.  Your output must be a single raw JSON object with two keys: "blueprint" (an array of SyllabusBlueprintUnit objects, mirroring the base syllabus structure but with the added 'allocated_hours' and 'data_driven_rationale' fields) and "calendar" (an array of PacingCalendarEvent objects).
    `;

    const blueprintSchema = {
        type: Type.OBJECT,
        properties: {
            blueprint: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        unit_no: { type: Type.NUMBER },
                        unit_name: { type: Type.STRING },
                        weightage_marks: { type: Type.NUMBER },
                        allocated_hours: { type: Type.NUMBER },
                        chapters_or_topics: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    topic_id: { type: Type.STRING },
                                    topic_name: { type: Type.STRING },
                                    learning_outcomes: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    bloom_levels: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    common_misconceptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    cross_links: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    estimated_time_mins: { type: Type.NUMBER },
                                    marking_scheme_mapping: { type: Type.OBJECT, properties: { K: { type: Type.NUMBER }, U: { type: Type.NUMBER }, A: { type: Type.NUMBER }, HOTS: { type: Type.NUMBER } } },
                                    allocated_hours: { type: Type.NUMBER },
                                    data_driven_rationale: { type: Type.STRING },
                                },
                                required: ['topic_id', 'topic_name', 'learning_outcomes', 'bloom_levels', 'prerequisites', 'common_misconceptions', 'cross_links', 'estimated_time_mins', 'marking_scheme_mapping', 'allocated_hours', 'data_driven_rationale']
                            }
                        }
                    },
                    required: ['unit_no', 'unit_name', 'weightage_marks', 'allocated_hours', 'chapters_or_topics']
                }
            },
            calendar: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        week: { type: Type.NUMBER },
                        start_date: { type: Type.STRING },
                        activity_type: { type: Type.STRING },
                        details: { type: Type.STRING },
                    },
                    required: ['week', 'start_date', 'activity_type', 'details']
                }
            }
        },
        required: ['blueprint', 'calendar']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: blueprintSchema,
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });

        return parseJsonFromResponse(getResponseText(response));
    } catch (error) {
        logGeminiError('generateCurriculumBlueprint', error);
        throw error;
    }
};

export const generateRemediationPack = async (studentName: string, weakConcept: string): Promise<RemediationPack> => {
    if (useGeminiMock) {
        logGeminiInfo('generateRemediationPack', 'Mock mode active, returning stub remediation pack.');
        return createMockRemediationPack(weakConcept);
    }
    requireGeminiApiKey();
    const ai = createGeminiClient();

    const prompt = `
      ROLE: You are a special education expert and master teacher for the CBSE curriculum.
      GOAL: Generate a targeted, personalized remediation pack for a student who is struggling with a specific concept.

      CONTEXT:
      - Student Name: ${studentName}
      - Struggling Concept: "${weakConcept}"

      INSTRUCTIONS:
      1.  **Re-explanation**: Create a fresh, simple re-explanation of the concept. Use a different analogy or approach than a standard textbook. Format this as an array of 'StructuredContent' blocks (e.g., a paragraph and a list).
      2.  **Worked Example**: Provide one clear, step-by-step 'WorkedExample' that directly illustrates the re-explained concept.
      3.  **Scaffolded Practice**: Create an array of 2 'QuestionPoolItem' objects for practice. The questions should be scaffolded, starting very simple ('E' difficulty) and then a medium one. They must be directly related to the concept and include 'bloom', 'competency', and 'dok' fields.
      4.  **JSON Output**: Return a single, raw JSON object matching the 'RemediationPack' schema.

      OUTPUT FORMAT: A single raw JSON object.
    `;
    
    const workedExampleSchema = { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, solution: { type: Type.STRING }, why_it_works: { type: Type.STRING } }, required: ['prompt', 'solution', 'why_it_works'] };
    const structuredContentSchema = { type: Type.OBJECT, properties: { type: { type: Type.STRING }, level: { type: Type.NUMBER }, content: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } }, term: { type: Type.STRING }, definition: { type: Type.STRING }, }, required: ['type'] };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    concept: { type: Type.STRING },
                    re_explanation: { type: Type.ARRAY, items: structuredContentSchema },
                    worked_example: workedExampleSchema,
                    scaffolded_practice: { type: Type.ARRAY, items: questionPoolItemSchema }
                },
                required: ['concept', 're_explanation', 'worked_example', 'scaffolded_practice']
            }
        }
    });

    try {
        const parsed = parseJsonFromResponse(getResponseText(response)) as RemediationPack;
        return parsed;
    } catch (error) {
        logGeminiError('generateRemediationPack', error);
        throw error;
    }
};

export const deconstructSyllabus = async (syllabusText: string): Promise<{ structuredSyllabus: SyllabusUnit[], prerequisiteGraph: PrerequisiteGraph }> => {
    if (useGeminiMock) {
        logGeminiInfo('deconstructSyllabus', 'Mock mode active, returning stub syllabus.');
        return createMockDeconstructedSyllabus();
    }
    requireGeminiApiKey();
    const ai = createGeminiClient();

    const prompt = `
      ROLE: You are an expert curriculum architect and data scientist specializing in pedagogy.
      GOAL: Analyze the provided raw syllabus text, structure it into a clean JSON format, and, most importantly, infer the prerequisite relationships between all topics.

      CONTEXT: The text provided is an unstructured syllabus from the CBSE board.

      CRITICAL INSTRUCTIONS:
      1.  **Structure the Syllabus**: Parse the unstructured text and organize it into a hierarchical JSON array of 'SyllabusUnit' objects. Each unit must contain chapters/topics, and each topic must have its learning outcomes, bloom levels, etc., filled out based on the text. Infer reasonable values if not explicitly stated.
      2.  **Infer Prerequisite Graph**: This is the most critical task. Analyze the content and logical flow of all topics across all units. Create a 'prerequisiteGraph' which is an array of objects. Each object must have a "topicId" (string, the ID of a chapter) and a "prerequisites" (an array of topic_id strings that are prerequisites for that chapter). A topic can have zero, one, or multiple prerequisites.
      3.  **Comprehensive Graph**: The graph must be comprehensive. A topic from Unit 3 might be a prerequisite for a topic in Unit 5. Your analysis must span the entire syllabus.
      4.  **Strict JSON Output**: Your final output must be a single, raw JSON object with two keys: "structuredSyllabus" and "prerequisiteGraph".

      SYLLABUS TEXT TO ANALYZE:
      ---
      ${syllabusText}
      ---
    `;

    const markingSchemeSchema = { type: Type.OBJECT, properties: { K: { type: Type.NUMBER }, U: { type: Type.NUMBER }, A: { type: Type.NUMBER }, HOTS: { type: Type.NUMBER } }, required: ['K', 'U', 'A', 'HOTS'] };

    const chapterTopicSchema = {
        type: Type.OBJECT,
        properties: {
            topic_id: { type: Type.STRING },
            topic_name: { type: Type.STRING },
            learning_outcomes: { type: Type.ARRAY, items: { type: Type.STRING } },
            bloom_levels: { type: Type.ARRAY, items: { type: Type.STRING } },
            prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
            common_misconceptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            cross_links: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimated_time_mins: { type: Type.NUMBER },
            marking_scheme_mapping: markingSchemeSchema,
        },
        required: ['topic_id', 'topic_name', 'learning_outcomes', 'bloom_levels', 'prerequisites', 'common_misconceptions', 'cross_links', 'estimated_time_mins', 'marking_scheme_mapping']
    };

    const syllabusUnitSchema = {
        type: Type.OBJECT,
        properties: {
            unit_no: { type: Type.NUMBER },
            unit_name: { type: Type.STRING },
            weightage_marks: { type: Type.NUMBER },
            lesson_hours: { type: Type.NUMBER },
            chapters_or_topics: { type: Type.ARRAY, items: chapterTopicSchema },
        },
        required: ['unit_no', 'unit_name', 'weightage_marks', 'lesson_hours', 'chapters_or_topics']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        structuredSyllabus: {
                            type: Type.ARRAY,
                            items: syllabusUnitSchema,
                        },
                        prerequisiteGraph: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    topicId: { type: Type.STRING },
                                    prerequisites: {
                                        type: Type.ARRAY,
                                        items: { type: Type.STRING }
                                    }
                                },
                                required: ['topicId', 'prerequisites']
                            }
                        }
                    },
                    required: ['structuredSyllabus', 'prerequisiteGraph']
                },
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });

        const parsedJson = parseJsonFromResponse(getResponseText(response));

        // Transform the array of graph nodes back into the expected PrerequisiteGraph object
        const rawGraph: { topicId: string, prerequisites: string[] }[] = parsedJson.prerequisiteGraph;
        const prerequisiteGraph: PrerequisiteGraph = rawGraph.reduce((acc, item) => {
            acc[item.topicId] = item.prerequisites;
            return acc;
        }, {} as PrerequisiteGraph);

        return {
            structuredSyllabus: parsedJson.structuredSyllabus,
            prerequisiteGraph: prerequisiteGraph
        };
    } catch (error) {
        logGeminiError('deconstructSyllabus', error);
        throw error;
    }
};

export const processOmniSearchQuery = async (query: string) => {
    return withGemini(
        'processOmniSearchQuery',
        async () => {
            const ai = createGeminiClient();

    const navigateTool: FunctionDeclaration = {
        name: 'navigate',
        parameters: {
            type: Type.OBJECT,
            description: 'Navigate to a specific tab in the School OS dashboard.',
            properties: {
                tabName: {
                    type: Type.STRING,
                    description: "The name of the tab to navigate to. Must be one of: overview, students, assignments, reports, announcements, exam_suite, diagnostics, ai_coding, board_planner, classroom, finance_ops, growth, curriculum_planner, exams, courses"
                }
            },
            required: ['tabName']
        }
    };
    
    const findStudentTool: FunctionDeclaration = {
        name: 'findStudent',
        parameters: {
            type: Type.OBJECT,
            description: 'Find a student by their name.',
            properties: {
                studentName: { type: Type.STRING, description: 'The partial or full name of the student to search for.' }
            },
            required: ['studentName']
        }
    };

    const createAnnouncementTool: FunctionDeclaration = {
        name: 'createAnnouncement',
        parameters: {
            type: Type.OBJECT,
            description: 'Opens the modal to create a new announcement for a specific grade.',
            properties: {
                grade: { type: Type.STRING, description: 'The grade to create the announcement for (e.g., "10").' }
            },
            required: ['grade']
        }
    };

    const prompt = `You are an intelligent command palette assistant for a School Operating System. The user will provide a natural language query. Your job is to understand their intent and call the appropriate function to fulfill their request.

User query: "${query}"`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ functionDeclarations: [navigateTool, findStudentTool, createAnnouncementTool] }]
        }
    });

    return response.functionCalls;
        },
        () => []
    );
};

export const generatePtmBrief = async (
    student: UserProfile,
    dktData: UserDktData,
    assignments: Assignment[],
    submissions: StudentSubmission[]
): Promise<PtmBrief> => {
    if (useGeminiMock) {
        logGeminiInfo('generatePtmBrief', 'Mock mode active, returning stub PTM brief.');
        return createMockPtmBrief(student.name);
    }
    requireGeminiApiKey();
    const ai = createGeminiClient();

    // Simplify data for the prompt
    const simplifiedDkt = Object.entries(dktData).reduce((acc, [skillId, skillData]) => {
        if ((skillData as DktSkillState).mastery < 0.9) { // Only include areas not fully mastered
            (acc as any)[skillId.split('-').slice(2).join(' ')] = `${Math.round((skillData as DktSkillState).mastery * 100)}%`;
        }
        return acc;
    }, {} as { [key: string]: string });

    const prompt = `
      ROLE: You are an experienced academic counselor and senior teacher preparing for a Parent-Teacher Meeting (PTM).
      GOAL: Analyze the provided student data and generate a structured, professional, and actionable briefing document.

      CONTEXT:
      - Student Name: ${student.name}
      - Grade: ${student.grade}
      - Student Data: ${JSON.stringify({ mastery: simplifiedDkt, assignments, submissions }, null, 2)}

      CRITICAL INSTRUCTIONS:
      1.  **Synthesize Data**: Do not just list the data. Synthesize it into meaningful insights. For example, connect low mastery in a topic to a low score on a related assignment.
      2.  **Balanced Tone**: Be balanced, positive, and constructive. Start with strengths before discussing areas for focus.
      3.  **Actionable Talking Points**: The 'suggestedTalkingPoints' should be phrased as questions or statements to guide the conversation with the parent (e.g., "Let's discuss strategies to improve focus on 'Topic X' at home.").
      4.  **Behavioral Insights**: Infer behavioral patterns from the data, such as submission timeliness. If all submissions are on time, that's a positive behavioral observation.
      5.  **Strict JSON Output**: Your output must be a single, raw JSON object matching the 'PtmBrief' schema.

      OUTPUT FORMAT: A single raw JSON object.
    `;

    const briefSchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            behavioralObservations: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedTalkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            closingRemark: { type: Type.STRING },
        },
        required: ['summary', 'strengths', 'focusAreas', 'behavioralObservations', 'suggestedTalkingPoints', 'closingRemark']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: briefSchema,
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });

        return parseJsonFromResponse(getResponseText(response)) as PtmBrief;
    } catch (error) {
        logGeminiError('generatePtmBrief', error);
        throw error;
    }
};

export const generateExamAnalyticsReport = async (
    blueprint: PaperBlueprint,
    questions: QuestionPoolItem[],
    submissions: ExamSubmission[],
    students: UserProfile[]
): Promise<AIProctoringReport> => {
    if (useGeminiMock) {
        logGeminiInfo('generateExamAnalyticsReport', 'Mock mode active, returning stub proctoring report.');
        return createMockAIProctoringReport();
    }
    requireGeminiApiKey();
    const ai = createGeminiClient();

    const simplifiedSubmissions = submissions.map(sub => {
        const student = students.find(s => s.id === sub.studentId);
        return {
            studentId: sub.studentId,
            studentName: student?.name || 'Unknown',
            infractions: sub.infractions,
            answers: sub.answers
        };
    });

    const prompt = `
        ROLE: You are an AI Proctoring Analyst. Your job is to analyze exam submission data to identify potential academic integrity issues in a neutral, data-driven way. Do NOT make definitive accusations.

        TASK: Analyze the following exam data and generate a proctoring report.

        CONTEXT:
        - Exam: "${blueprint.name}"
        - Questions: ${JSON.stringify(questions.map(q => ({ q_id: q.q_id, question: q.question, type: q.type })))}
        - Submissions: ${JSON.stringify(simplifiedSubmissions)}

        INSTRUCTIONS:
        1.  **Analyze for Anomalies**: Look for suspicious patterns, primarily in written answers ('SA', 'LA'). Key indicators are:
            -   Identical, uniquely incorrect answers submitted by multiple students.
            -   Statistically improbable phrasing similarity in long-form answers.
        2.  **Correlate with Infractions**: Check if students involved in suspicious answer clusters also have high infraction counts (e.g., > 2).
        3.  **Generate Report**: Create a JSON report with:
            -   A brief 'summary' of the analysis.
            -   'suspiciousClusters': An array of objects, each detailing a cluster of students, the reason for suspicion (e.g., "Identical incorrect answers"), and the relevant question IDs. Only report high-confidence clusters.
            -   'highInfractionStudents': A list of students with more than 2 infractions.

        OUTPUT: A single raw JSON object matching the 'AIProctoringReport' schema.
    `;

    const reportSchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            suspiciousClusters: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        studentIds: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        reason: { type: Type.STRING },
                        questions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['studentIds', 'reason', 'questions']
                }
            },
            highInfractionStudents: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        studentId: { type: Type.NUMBER },
                        count: { type: Type.NUMBER },
                    },
                    required: ['studentId', 'count']
                }
            }
        },
        required: ['summary', 'suspiciousClusters', 'highInfractionStudents']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: reportSchema,
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        
        return parseJsonFromResponse(getResponseText(response));
    } catch (error) {
        logGeminiError('generateExamAnalyticsReport', error);
        throw error;
    }
};

export const generateWeeklyStudyPlan = async (
    profile: UserProfile,
    dktData: UserDktData,
    userFlashcards: UserFlashcards,
    assignments: Assignment[]
): Promise<StudyTask[]> => {
    if (useGeminiMock) {
        logGeminiInfo('generateWeeklyStudyPlan', 'Mock mode active, returning stub study plan.');
        return createMockWeeklyStudyPlan();
    }
    requireGeminiApiKey();
    const ai = createGeminiClient();
    const today = new Date();
    
    const weakSkills = Object.entries(dktData)
        .filter(([, data]) => data.mastery < 0.7)
        .sort(([, a], [, b]) => a.mastery - b.mastery)
        .slice(0, 5) // Top 5 weaknesses
        .map(([skillId, data]) => ({ skillId, mastery: data.mastery }));

    const dueFlashcardsCount = Object.values(userFlashcards)
        .flat()
        .filter(card => new Date(card.srsData.due) <= today)
        .length;

    const upcomingAssignments = assignments
        .filter(a => a.classGrade === profile.grade && new Date(a.dueDate) >= today)
        .map(a => ({ title: a.title, dueDate: a.dueDate, id: a.id }));

    const prompt = `
        ROLE: You are an expert academic coach for a CBSE student.
        GOAL: Create a balanced, prioritized, and actionable 7-day study plan.

        CONTEXT:
        - Student: ${profile.name}, Class ${profile.grade}
        - Today's Date: ${today.toISOString().split('T')[0]}
        - Weakest Topics (from DKT): ${JSON.stringify(weakSkills)}
        - Overdue Spaced Repetition (SRS) Flashcards: ${dueFlashcardsCount}
        - Upcoming Assignments: ${JSON.stringify(upcomingAssignments)}

        CRITICAL INSTRUCTIONS:
        1.  **Prioritize**: Assignments due soonest are highest priority. Then, address the weakest topics. Then schedule SRS reviews.
        2.  **Balance**: Distribute tasks across 7 days, starting from today. Avoid overloading any single day.
        3.  **Actionable Tasks**: Create tasks with a clear type ('assignment', 'review_weakness', 'srs_review').
        4.  **Structure**: For each task, create a JSON object with: id, type, title, subtitle, dueDate, and data (e.g., chapterId, assignmentId).
        5.  **Output**: Return a single raw JSON array of these StudyTask objects.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            type: { type: Type.STRING },
                            title: { type: Type.STRING },
                            subtitle: { type: Type.STRING },
                            dueDate: { type: Type.STRING },
                            data: {
                                type: Type.OBJECT,
                                properties: {
                                    chapterId: { type: Type.STRING },
                                    assignmentId: { type: Type.STRING }
                                }
                            }
                        },
                        required: ['id', 'type', 'title', 'subtitle', 'dueDate']
                    }
                },
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });

        return parseJsonFromResponse(getResponseText(response)) as StudyTask[];
    } catch (error) {
        logGeminiError('generateWeeklyStudyPlan', error);
        throw error;
    }
};

export const generateTransportOptimizationTips = async (routes: BusRoute[]): Promise<string[]> => {
    return withGemini(
        'generateTransportOptimizationTips',
        async () => {
            const ai = createGeminiClient();

    const prompt = `
      ROLE: You are a transport logistics and efficiency expert for a school.
      TASK: Analyze the following bus route data and provide 2-3 concrete, actionable optimization tips.
      
      DATA:
      ${JSON.stringify(routes, null, 2)}
      
      INSTRUCTIONS:
      1.  Focus on identifying inefficiencies like frequent delays, low occupancy, or routes that could be combined.
      2.  Suggestions should be specific. For example, instead of "Improve delayed routes", say "Route B is frequently delayed. Analyze traffic patterns between 3 PM - 4 PM to identify bottlenecks."
      3.  Keep tips concise and easy to understand for a school administrator.
      
      OUTPUT: A raw JSON array of strings, where each string is an optimization tip.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                },
            },
        },
    });

    return parseJsonFromResponse(getResponseText(response)) as string[];
        },
        () => ['Mock tip: Monitor route performance weekly and adjust stops as needed.']
    );
};