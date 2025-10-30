

import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { LessonPack, GroundingChunk, AssessmentResult, AdaptiveFollowUp, StudentExplanation, QuestionPoolItem, StructuredContent, Flashcard, InteractiveSimulation, UserProfile, UserProgressData, ParentalReport, InteractiveVideo, ClassAnalyticsData, UserDktData, PrerequisiteGraph, SafalDiagnosticResult, RemediationGroup, QuickFormativeAssessment, QfaResult, FacilityBooking, QuickCheck, CrossCurricularProject, PracticeBlueprint, PracticeResult, LabelData, SyllabusChapterTopic } from '../types';
import { fileToBase64 } from "../utils/fileHelpers";
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


export const fetchChapterContent = async (grade: string, subject: string, chapter: string): Promise<LessonPack> => {
    const cacheKey = `lesson-pack-v6-${grade}-${subject}-${chapter}`; // Bumped version for new generation logic
    
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
              4.  **Board Paper Integration**: The 'question_pool' MUST contain 2-3 questions directly modeled on the patterns and difficulty levels for this specific sub-topic from the **last 10 years of CBSE Board Papers**.
              5.  **Neutral & Educational Tone**: For subjects like History and Social Studies, maintain a strictly neutral, factual, and educational tone suitable for a K-12 textbook. Avoid sensationalism or overly graphic descriptions of historical events.
              6.  **Plain Text Content**: All string content within the JSON must be plain text. Do not use any markdown formatting.

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
                                    question_pool: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { q_id: { type: Type.STRING }, type: { type: Type.STRING }, marks: { type: Type.NUMBER }, difficulty: { type: Type.STRING }, bloom: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING }, rubric: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['q_id', 'type', 'marks', 'difficulty', 'bloom', 'question', 'answer', 'rubric'] } },
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
            
            const partialContent = parseJsonFromResponse(response.text) as PartialLessonContent;
            allGeneratedContent.push(partialContent);

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

export const generateGroundedAnswer = async (query: string): Promise<{ answer: string, sources: GroundingChunk[] }> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      You are MIGA, an expert academic tutor specializing in the Indian K-12 CBSE curriculum. Your task is to answer the following student's query using up-to-date information from your search tool.

      **CRITICAL INSTRUCTIONS (MUST be followed)**:
      1.  **Pedagogical Soundness & Accuracy**: Your answer must be 100% factually accurate and pedagogically sound for a K-12 student. Simplify complex concepts and use relatable Indian contexts where possible.
      2.  **CBSE Alignment**: Ensure the answer is strictly aligned with the CBSE curriculum, standards, and marking schemes.
      3.  **Clean, Direct Answer**: Provide the final answer as clean, plain text ONLY. Do not use any Markdown, headings, or lists. Do not mention your sources or that you performed a search.
      4.  **Educational Focus**: If the query is unrelated to academics, politely decline to answer.

      **Student Query**: "${query}"
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        },
    });

    const answer = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    return { answer, sources };
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
                items: {
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
                    },
                    required: ['q_id', 'type', 'marks', 'difficulty', 'bloom', 'question', 'answer', 'rubric']
                }
            }
        }
    });
    return JSON.parse(response.text) as QuestionPoolItem[];
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

    return JSON.parse(response.text) as Flashcard[];
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
    const result = JSON.parse(response.text);
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
        - Return a single raw JSON object matching the QuestionPoolItem schema.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    q_id: { type: Type.STRING }, type: { type: Type.STRING }, marks: { type: Type.NUMBER }, difficulty: { type: Type.STRING }, bloom: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING }, rubric: { type: Type.STRING }
                },
                required: ['q_id', 'type', 'marks', 'difficulty', 'bloom', 'question', 'answer', 'rubric']
            }
        }
    });
    return JSON.parse(response.text) as QuestionPoolItem;
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
    return JSON.parse(response.text);
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
    return JSON.parse(response.text) as ParentalReport;
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
        model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text) as QuestionPoolItem;
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
    return JSON.parse(response.text);
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
        - Suggest a simple remediation task.
        Return a raw JSON array of RemediationGroup objects.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', contents: prompt, config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY, items: { type: Type.OBJECT, properties: { competency: { type: Type.STRING }, students: { type: Type.ARRAY, items: { type: Type.STRING } }, suggestedTask: { type: Type.STRING } }, required: ['competency', 'students', 'suggestedTask'] }
            }
        }
    });
    return JSON.parse(response.text);
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
      - For each question, create a valid QuestionPoolItem object.
      Return a single raw JSON array of these QuestionPoolItem objects, containing exactly the number of questions specified in the blueprint.
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
                    properties: { q_id: { type: Type.STRING }, type: { type: Type.STRING }, marks: { type: Type.NUMBER }, difficulty: { type: Type.STRING }, bloom: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING }, rubric: { type: Type.STRING } },
                    required: ['q_id', 'type', 'marks', 'difficulty', 'bloom', 'question', 'answer', 'rubric']
                }
            }
        }
    });
    return JSON.parse(response.text) as QuestionPoolItem[];
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
    return JSON.parse(response.text);
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