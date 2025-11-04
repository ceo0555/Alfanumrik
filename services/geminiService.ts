import { GoogleGenAI, Type, Modality, GenerateContentResponse, FunctionDeclaration } from "@google/genai";
import { LessonPack, GroundingChunk, AssessmentResult, AdaptiveFollowUp, StudentExplanation, QuestionPoolItem, StructuredContent, Flashcard, InteractiveSimulation, UserProfile, UserProgressData, ParentalReport, InteractiveVideo, ClassAnalyticsData, UserDktData, PrerequisiteGraph, SafalDiagnosticResult, RemediationGroup, QuickFormativeAssessment, QfaResult, FacilityBooking, QuickCheck, CrossCurricularProject, PracticeBlueprint, PracticeResult, LabelData, SyllabusChapterTopic, StudentSubmission, Assignment, AllDktData, DktSkillState, SyllabusBlueprintUnit, PacingCalendarEvent, RemediationPack, ChatMessage, SyllabusUnit, PtmBrief, PaperBlueprint, AIProctoringReport, ExamSubmission, StudyTask, UserFlashcards, BusRoute, TeacherSchedule } from '../types';
import { blobToBase64, fileToBase64 } from "../utils/fileHelpers";
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

// Type for the partial content generated for each sub-topic
type PartialLessonContent = Pick<LessonPack, 'student_explanation' | 'assessment_blueprint'>;

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


export const fetchChapterContent = async (grade: string, subject: string, chapter: string): Promise<LessonPack> => {
    const cacheKey = `lesson-pack-v7-${grade}-${subject}-${chapter}`; // Bumped version for new generation logic
    
    try {
        const cachedData = await get<string>('cache', cacheKey);
        if (cachedData) {
            console.log(`Loading COMPLETE lesson pack from IndexedDB cache for: ${chapter}`);
            return JSON.parse(cachedData) as LessonPack;
        }
    } catch (e) {
        console.error("Could not read from IndexedDB cache", e);
    }

    console.log(`Generating new lesson pack for: Grade ${grade}, Subject: ${subject}, Chapter: ${chapter}`);
    
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found. Cannot generate lesson.");
    }

    const syllabusForGrade = cbseSyllabus[grade];
    if (!syllabusForGrade || !syllabusForGrade[subject]) {
        throw new Error(`Syllabus not found for Grade ${grade}, Subject ${subject}`);
    }

    let chapterTopic: SyllabusChapterTopic | undefined;
    for (const unit of syllabusForGrade[subject]) {
        chapterTopic = unit.chapters_or_topics.find(t => t.topic_name === chapter);
        if (chapterTopic) break;
    }

    if (!chapterTopic) {
        throw new Error(`Chapter "${chapter}" not found in syllabus for Grade ${grade}, Subject ${subject}`);
    }

    // NEW LOGIC: We will now generate content for each learning outcome as a sub-topic.
    const subTopics = chapterTopic.learning_outcomes;

    const allGeneratedContent: PartialLessonContent[] = [];
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    for (const subTopic of subTopics) {
        console.log(`Generating content for sub-topic: ${subTopic}`);
        try {
            const prompt = `
              ROLE
              You are a senior CBSE curriculum designer and pedagogy expert. Your instructions are CRITICAL and must be followed with extreme precision.

              GOAL
              Generate a detailed, comprehensive, and pedagogically sound content module for a **single, specific sub-topic** within a larger chapter.

              CONTEXT
              - Chapter: "${chapterTopic.topic_name}"
              - Grade: ${grade}
              - Subject: ${subject}
              - **Current Sub-Topic to Generate Content For**: "${subTopic}"

              PEDAGOGICAL INSTRUCTIONS (CRITICAL - NON-NEGOTIABLE):
              1.  **Strict Focus**: Generate content ONLY for the specified sub-topic ("${subTopic}"). Do NOT include content from other parts of the chapter.
              2.  **CBSE & NCF Alignment**: All content MUST be strictly aligned with the latest CBSE syllabus and NCF guidelines. Assessments and rubrics must reflect the official CBSE marking scheme.
              3.  **Depth and Variety**: The 'student_explanation' section must be rich and varied for this sub-topic. Include multiple sub-headings, lists, key terms, and at least one 'note' block if relevant. Generate content for ALL fields, including the REQUIRED 'interactive_videos' and 'real_world_applications'.
              4.  **Board Paper Integration & Dual Framework**: The 'question_pool' MUST contain 2-3 questions directly modeled on the patterns and difficulty levels for this specific sub-topic from the **last 10 years of CBSE Board Papers**. For each question, you MUST provide:
                  - A 'bloom' level (e.g., 'Remember', 'Understand', 'Apply', 'Analyze').
                  - A 'competency' classification (e.g., 'Demonstrate Knowledge and Understanding', 'Application of Knowledge/Concepts').
                  - A 'dok' (Webb's Depth of Knowledge) level from 1 to 4.
              5.  **Neutral & Educational Tone**: For subjects like History and Social Studies, maintain a strictly neutral, factual, and educational tone suitable for a K-12 textbook. Avoid sensationalism or overly graphic descriptions of historical events.
              6.  **Plain Text Content**: All string content within the JSON must be plain text. Do not use any markdown formatting.
              7.  **Schema Adherence**: All 'type' values in 'core_explanation' MUST be one of: 'heading', 'paragraph', 'list', 'key_term', or 'note'. Do not invent other types.


              OUTPUT FORMAT
              - Output ONLY the raw JSON object for the content module, containing 'student_explanation' and 'assessment_blueprint' for this sub-topic.
            `;
            
             const interactiveVideoSchema = {
                type: Type.OBJECT, properties: { title: { type: Type.STRING }, video_url: { type: Type.STRING }, script: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.NUMBER }, question_text: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correct_answer: { type: Type.STRING }, feedback_correct: { type: Type.STRING }, feedback_incorrect: { type: Type.STRING }, branch_on_incorrect: { type: Type.NUMBER }, }, required: ['timestamp', 'question_text', 'options', 'correct_answer', 'feedback_correct', 'feedback_incorrect'] } } }, required: ['title', 'video_url', 'script']
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
                            student_explanation: {
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
                                required: ['core_explanation', 'quick_check', 'worked_examples', 'guided_practice', 'independent_practice', 'HOTS', 'common_errors_and_fixes', 'interactive_videos', 'real_world_applications']
                            },
                            assessment_blueprint: {
                                type: Type.OBJECT,
                                properties: {
                                    question_pool: { type: Type.ARRAY, items: questionPoolItemSchema },
                                },
                                required: ['question_pool']
                            }
                        },
                        required: ['student_explanation', 'assessment_blueprint']
                    }
                }
            });

            if (!response.text) {
                console.warn(`Gemini API returned no text for sub-topic "${subTopic}". This might be due to a safety filter. Skipping.`);
                continue; // Skip this sub-topic and move to the next
            }
            
            try {
                const partialContent = parseJsonFromResponse(response.text) as PartialLessonContent;
                allGeneratedContent.push(partialContent);
            } catch (parsingError) {
                console.error(`Error parsing JSON from Gemini API for sub-topic "${subTopic}":`, parsingError);
                console.error("Original text from Gemini:", response.text);
            }

        } catch (error) {
            console.error(`Error fetching from Gemini API for sub-topic "${subTopic}":`, error);
        }
    }
    
    if (allGeneratedContent.length === 0) {
      throw new Error("Failed to generate any content for the chapter's sub-topics. The AI model may be temporarily unavailable. Please try again.");
    }

    // --- AGGREGATE ALL GENERATED CONTENT ---
    const finalLessonPack: LessonPack = {
        topic_id: chapterTopic.topic_id,
        topic_name: chapterTopic.topic_name,
        student_explanation: {
            core_explanation: allGeneratedContent.flatMap(c => c.student_explanation.core_explanation),
            quick_check: allGeneratedContent[0]?.student_explanation.quick_check, // Take the first one for simplicity
            worked_examples: allGeneratedContent.flatMap(c => c.student_explanation.worked_examples),
            guided_practice: allGeneratedContent.flatMap(c => c.student_explanation.guided_practice),
            independent_practice: allGeneratedContent.flatMap(c => c.student_explanation.independent_practice),
            HOTS: allGeneratedContent.flatMap(c => c.student_explanation.HOTS),
            common_errors_and_fixes: allGeneratedContent.flatMap(c => c.student_explanation.common_errors_and_fixes),
            fill_in_the_blanks: allGeneratedContent.flatMap(c => c.student_explanation.fill_in_the_blanks),
            interactive_simulations: allGeneratedContent.flatMap(c => c.student_explanation.interactive_simulations),
            interactive_videos: allGeneratedContent.flatMap(c => c.student_explanation.interactive_videos),
            real_world_applications: allGeneratedContent.flatMap(c => c.student_explanation.real_world_applications),
        },
        assessment_blueprint: {
            question_pool: allGeneratedContent.flatMap(c => c.assessment_blueprint.question_pool),
            section_breakup: [{ name: 'Section A', description: '1 Mark MCQs' }, { name: 'Section B', description: '2 Mark Short Answers' }],
            total_marks: allGeneratedContent.flatMap(c => c.assessment_blueprint.question_pool).reduce((sum, q) => sum + q.marks, 0),
            marking_scheme_rationale: "Aggregated from all sub-topics."
        },
        teacher_notes: { // Generate simple teacher notes
            TLM_list: ["Digital Whiteboard", "Alfanumrik Platform"],
            differentiation: ["Use adaptive quizzes for varied difficulty.", "Provide extra support via AI Tutor."],
            remediation_plan: ["Utilize automatically generated micro-remediation loops after assessments."],
            safety_notes: []
        },
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
        console.log(`Saved COMPLETE lesson pack to IndexedDB cache for: ${chapter}`);
    } catch (e) {
        console.error("Could not write complete lesson pack to IndexedDB cache", e);
    }

    return finalLessonPack;
};

export const generateAdaptiveFollowUp = async (results: AssessmentResult[]): Promise<AdaptiveFollowUp[]> => {
    const incorrectAnswers = results.filter(r => !r.is_correct);

    if (incorrectAnswers.length === 0) {
        return []; // No follow-up needed if everything is correct
    }

    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    const parsedJson = parseJsonFromResponse(response.text);
    return parsedJson as AdaptiveFollowUp[];
};

export const generateStudyNotes = async (studentExplanation: StudentExplanation, topic: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Keep only the core explanation to create a concise context
    const context = {
        core_explanation: studentExplanation.core_explanation,
        key_terms: studentExplanation.core_explanation.filter(b => b.type === 'key_term')
    };

    const prompt = `
      You are an academic assistant. Your task is to generate concise, well-structured study notes for a K-12 CBSE student based on the provided lesson content for the topic "${topic}".

      **Instructions**:
      - Summarize the key points from the "core_explanation".
      - List all "key_terms" with their definitions.
      - The output must be clean, easy-to-read plain text. Do not use any markdown or formatting. Use line breaks to separate ideas.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};

export const generatePracticeQuiz = async (studentExplanation: StudentExplanation, topic: string): Promise<QuestionPoolItem[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = {
        core_explanation: studentExplanation.core_explanation,
        worked_examples: studentExplanation.worked_examples,
    };

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

    return parseJsonFromResponse(response.text) as QuestionPoolItem[];
};


export const generateFlashcards = async (lessonPack: LessonPack): Promise<Flashcard[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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


    return parseJsonFromResponse(response.text) as Flashcard[];
};

export const analyzeQueryComplexity = async (query: string): Promise<'simple' | 'complex'> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    const result = parseJsonFromResponse(response.text);
    return result.complexity === 'complex' ? 'complex' : 'simple';
};

export const generateAdaptiveQuestion = async (grade: string, subject: string, chapter: string, difficulty: 'E' | 'M' | 'H', previousQuestions: string[]): Promise<QuestionPoolItem> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    return parseJsonFromResponse(response.text) as QuestionPoolItem;
};

export const explainConceptInDepth = async (text: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        You are an expert CBSE tutor. Explain the following text to a K-12 student in simple, clear, and concise terms. 
        Use analogies and break it down step-by-step. All output must be plain text. Do not use any markdown.

        Text to explain: "${text}"
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const generateConceptDeepDive = async (text: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        You are a distinguished professor and an expert CBSE tutor. Your task is to provide a "deep dive" explanation of the following text for a curious K-12 student. Go beyond a simple explanation.

        **CRITICAL INSTRUCTIONS**:
        1.  **First Principles**: Break down the concept to its fundamental principles.
        2.  **Detailed Analogies**: Use detailed, relatable analogies to explain complex parts.
        3.  **Connections**: Explain how this concept connects to other topics in the curriculum or real-world applications.
        4.  **Structure**: Structure your answer logically with clear sub-headings. The entire output must be plain text, using line breaks for structure. Do not use markdown.
        5.  **Depth**: This is a deep dive. Be comprehensive and thorough.

        **Text to explain**: "${text}"
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
};

export const checkFlashcardAnswer = async (studentAnswer: string, correctAnswer: string, term: string): Promise<{ isCorrect: boolean, feedback: string }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Evaluate the student's answer for a flashcard. The term is "${term}" and the correct definition is "${correctAnswer}".
      The student's answer is: "${studentAnswer}".
      Is the student's answer conceptually correct, even if not word-for-word?
      Provide brief, encouraging feedback.
      Return a raw JSON object: { "isCorrect": boolean, "feedback": "your feedback string" }
    `;
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

    return parseJsonFromResponse(response.text);
};

export const generateParentalReport = async (profile: UserProfile, progressData: UserProgressData): Promise<ParentalReport> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Generate a parental report for a student named ${profile.name} (Class ${profile.grade}).
        Progress data: ${JSON.stringify(progressData)}.
        - Write a brief, encouraging summary.
        - Identify 2-3 strengths based on completed chapters.
        - Identify 2-3 areas to focus on (started but not completed).
        - Provide 3 actionable, simple tips for parents to help their child.
        Return a raw JSON object matching the ParentalReport schema.
    `;
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

    return parseJsonFromResponse(response.text) as ParentalReport;
};

export const generateParentalInsight = async (query: string, studentData: { profile: UserProfile, dktData: UserDktData, assignments: Assignment[], submissions: StudentSubmission[] }): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });

    return response.text;
};


export const generateSimulationExplanation = async (concept: string, description: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Explain the concept of "${concept}" as if you were an interactive simulation.
        The simulation is described as: "${description}".
        Break down the explanation into interactive steps. All output must be plain text. Do not use any markdown.
        For example: "Step 1: Observe the particles... What happens when you increase the temperature? Now, try decreasing it..."
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const gradeShortAnswer = async (question: string, rubric: string, totalMarks: number, studentAnswer: string): Promise<{ awardedMarks: number, feedback: string }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    const parsedJson = parseJsonFromResponse(response.text);
    return parsedJson as { awardedMarks: number, feedback: string };
};

export const gradeVerbalExplanation = async (question: QuestionPoolItem, audioBlob: Blob): Promise<{ transcript: string, awardedMarks: number, feedback: string }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    return parseJsonFromResponse(response.text);
};


export const explainTextSnippet = async (snippet: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Explain this snippet in simpler terms for a K-12 student: "${snippet}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const generateMicroRemediation = async (topic: string, question: QuestionPoolItem | QuickCheck, studentAnswer: string): Promise<{ explanation: StructuredContent[], quick_check: QuickCheck }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    

    const parsedJson = parseJsonFromResponse(response.text);
    return parsedJson as { explanation: StructuredContent[], quick_check: QuickCheck };
};

export const generateCbeQuestion = async (grade: string, subject: string, chapter: string, type: 'MCQ' | 'SA' | 'Case', competency: string, dok: number, topic: string): Promise<QuestionPoolItem> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Generate a single, high-quality, CBSE-aligned competency-based question.
        - Grade: ${grade}, Subject: ${subject}, Chapter: ${chapter}, Topic: ${topic}
        - Type: ${type}, Competency: "${competency}", DOK Level: ${dok}
        - The question must be original and not a simple recall of facts. It should require application or analysis.
        - For MCQs, provide a 'distractor_rationale'.
        - For Case questions, provide a 'source_passage' and 'sub_questions'.
        - Return a single raw JSON object matching the QuestionPoolItem schema. Ensure q_id is a unique string like 'gen-[timestamp]'.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: questionPoolItemSchema }
    });

    return parseJsonFromResponse(response.text) as QuestionPoolItem;
};

export const generateRemediationGroups = async (results: SafalDiagnosticResult[]): Promise<RemediationGroup[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    return parseJsonFromResponse(response.text);
};

export const generateQfaRemediation = async (assessment: QuickFormativeAssessment, results: QfaResult[]): Promise<RemediationGroup[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    return parseJsonFromResponse(response.text);
};

export const generateRentalAgreement = async (booking: FacilityBooking): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Generate a simple, one-page facility rental agreement template based on this booking information:
        - Facility: ${booking.facility}
        - Rented by: ${booking.bookedBy}
        - Date: ${booking.date}, from ${booking.startTime} to ${booking.endTime}
        - Purpose: ${booking.purpose}
        Include standard clauses for payment, damages, cancellation, and responsibilities. Keep it clear and concise.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const generateStudentReportCardSummary = async (student: UserProfile, context: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Write a concise, encouraging summary and recommendation for a student's report card.
        - Student: ${student.name}, Class ${student.grade}
        - Context: ${context}
        Keep the tone positive. Highlight strengths and suggest 1-2 concrete areas for improvement. The output should be a single paragraph.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const generatePracticeExam = async (grade: string, subject: string, blueprint: PracticeBlueprint, chapters?: string[]): Promise<QuestionPoolItem[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chapterContext = chapters && chapters.length > 0
        ? `- The questions must ONLY cover topics from the following chapters: ${chapters.join(', ')}.`
        : '- The questions must be relevant to the subject and grade level.';
    
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
    return parseJsonFromResponse(response.text) as QuestionPoolItem[];
};

export const generatePracticeReportSummary = async (results: PracticeResult[]): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const simplifiedResults = results.map(r => ({ question: r.question.question, isCorrect: r.isCorrect, marksAwarded: r.marksAwarded, totalMarks: r.question.marks }));
    const prompt = `
      Based on these practice exam results, provide a brief, encouraging performance summary for the student.
      - Acknowledge their score, especially where partial credit was given.
      - Identify 1-2 topics they did well on.
      - Identify 1-2 topics they should review based on incorrect answers or where they lost marks.
      - Keep it concise (2-3 sentences).
      Results: ${JSON.stringify(simplifiedResults)}
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const generateCrossCurricularProjectIdea = async (grade: string, subject: string): Promise<Omit<CrossCurricularProject, 'id' | 'evidence'>> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    return parseJsonFromResponse(response.text);
};

export const analyzeScratchpadForHint = async (imageBase64: string, questionText: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
    return response.text;
};

export const analyzeScratchpadForErrorAnalysis = async (imageBase64: string, questionText: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    const result = parseJsonFromResponse(response.text);
    return result.errorType || 'unknown';
};

export const generateVideoForConcept = async (prompt: string): Promise<string> => {
    // A new AI instance MUST be created before each call to ensure the latest API key is used.
    if (!process.env.API_KEY) {
        throw new Error("API key is not available in the environment.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
            console.error("Error while polling for video operation status:", e);
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
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        const errorBody = await videoResponse.text();
        console.error("Failed to download video file. Status:", videoResponse.status, "Body:", errorBody);
        const userFriendlyError = errorBody.includes("Requested entity was not found") 
            ? "The provided API key is invalid or not found." 
            : `Failed to download video file. Server responded with status ${videoResponse.status}.`;
        throw new Error(userFriendlyError);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateTeacherWeeklyReport = async (
    students: UserProfile[],
    dktData: AllDktData,
    assignments: Assignment[],
    submissions: StudentSubmission[]
): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });

    return response.text;
};

export const gradeHandwrittenAnswer = async (
    imageFile: File,
    question: string,
    rubric: string,
    totalMarks: number
): Promise<{ transcribedText: string, awardedMarks: number, feedback: string }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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


    const parsedJson = parseJsonFromResponse(response.text);
    return parsedJson as { transcribedText: string, awardedMarks: number, feedback: string };
};

export const generateLessonPackFromTopic = async (grade: string, subject: string, topic: string): Promise<LessonPack> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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


    const pack = parseJsonFromResponse(response.text) as LessonPack;
    
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
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: blueprintSchema,
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });

    return parseJsonFromResponse(response.text);
};

export const generateRemediationPack = async (studentName: string, weakConcept: string): Promise<RemediationPack> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    return parseJsonFromResponse(response.text) as RemediationPack;
};

export const deconstructSyllabus = async (syllabusText: string): Promise<{ structuredSyllabus: SyllabusUnit[], prerequisiteGraph: PrerequisiteGraph }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    const parsedJson = parseJsonFromResponse(response.text);

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
};

export const processOmniSearchQuery = async (query: string) => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
};

export const generatePtmBrief = async (
    student: UserProfile,
    dktData: UserDktData,
    assignments: Assignment[],
    submissions: StudentSubmission[]
): Promise<PtmBrief> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: briefSchema,
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });

    return parseJsonFromResponse(response.text) as PtmBrief;
};

export const generateExamAnalyticsReport = async (
    blueprint: PaperBlueprint,
    questions: QuestionPoolItem[],
    submissions: ExamSubmission[],
    students: UserProfile[]
): Promise<AIProctoringReport> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: reportSchema,
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    
    return parseJsonFromResponse(response.text);
};

export const generateWeeklyStudyPlan = async (
    profile: UserProfile,
    dktData: UserDktData,
    userFlashcards: UserFlashcards,
    assignments: Assignment[]
): Promise<StudyTask[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    return parseJsonFromResponse(response.text) as StudyTask[];
};

export const generateTransportOptimizationTips = async (routes: BusRoute[]): Promise<string[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    return parseJsonFromResponse(response.text) as string[];
};

export const generateTeacherDailyBriefing = async (
    teacher: UserProfile,
    schedule: TeacherSchedule[],
    allDktData: AllDktData
): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const relevantDktData = Object.entries(allDktData).reduce((acc, [userId, userDkt]) => {
        const student = (acc.students as UserProfile[]).find(s => s.id === Number(userId));
        if (student) {
            (acc.dkt as any)[userId] = userDkt;
        }
        return acc;
    }, { students: [], dkt: {} });


    const prompt = `
      ROLE: You are MIGA, a proactive AI co-pilot for a teacher named ${teacher.name}.
      TASK: Generate a concise, actionable morning briefing for the teacher based on their schedule and student data.

      CONTEXT:
      - Teacher: ${teacher.name}
      - Today's Schedule: ${JSON.stringify(schedule)}
      - Relevant Student Mastery Data (DKT): ${JSON.stringify(relevantDktData.dkt)}

      INSTRUCTIONS:
      1.  **Analyze Schedule & Data**: Look at today's schedule. For each class, cross-reference the topic with student mastery data.
      2.  **Identify Key Insights**: Pinpoint 1-2 critical insights. This could be:
          -   A few students who are struggling with the specific topic being taught today.
          -   A reminder about an assignment due soon for a particular class.
          -   A positive note about a class that has high mastery in a prerequisite topic.
      3.  **Draft the Briefing**: Write a short, 2-3 sentence briefing. Be direct and helpful.
      4.  **Tone**: Professional, concise, and supportive.
      5.  **Output**: Return a single plain text string. No markdown.

      EXAMPLE OUTPUT:
      "Good morning, ${teacher.name}. In your Class 10 Science period today on 'Acids & Bases', be aware that Rohan and Priya's mastery is below 50%. A quick 5-min recap of the pH scale could be beneficial. Also, a reminder that the Class 9 Maths assignment is due tomorrow."
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};


export const generateParentCommunication = async (
    student: UserProfile,
    dktData: UserDktData,
    submissions: StudentSubmission[]
): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      ROLE: You are an experienced teacher drafting a brief, constructive update for a parent.
      TASK: Analyze the provided student data and draft a professional, 2-3 sentence message.

      CONTEXT:
      - Student: ${student.name}, Class ${student.grade}
      - Data: ${JSON.stringify({ dktData, submissions })}

      INSTRUCTIONS:
      1.  **Identify one specific strength**: Find a topic where the student has high mastery (e.g., >85%) or a recent high-scoring assignment.
      2.  **Identify one specific area for focus**: Find a topic with lower mastery (e.g., <65%) or a lower-scoring assignment.
      3.  **Draft the message**: Combine these into a positive and encouraging message. Start with the strength, then gently introduce the area for focus with a simple suggestion.
      4.  **Tone**: Professional, supportive, and collaborative.
      5.  **Output**: Return a single plain text string. No markdown or salutations (like "Dear Parent").

      EXAMPLE OUTPUT:
      "Just wanted to share a quick update on ${student.name}'s progress. He/She is showing a great grasp of 'Chemical Reactions' with 88% mastery! We are currently working on 'Acids & Bases', and a little extra review of the pH scale at home would be very beneficial to solidify his/her understanding."
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};