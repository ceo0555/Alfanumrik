import { GoogleGenAI, Modality, Type } from "@google/genai";
import { LessonPack, GroundingChunk, AssessmentResult, AdaptiveFollowUp, StudentExplanation, QuestionPoolItem, StructuredContent, Flashcard, InteractiveSimulation, UserProfile, UserProgressData, ParentalReport, InteractiveVideo, ClassAnalyticsData, UserBktData, PrerequisiteGraph, SafalDiagnosticResult, RemediationGroup, QuickFormativeAssessment, QfaResult, FacilityBooking, QuickCheck, CrossCurricularProject, PracticeBlueprint, PracticeResult } from '../types';
import { fileToBase64 } from "../utils/fileHelpers";
import { get, set } from '../utils/db';

const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
    const cacheKey = `image-cache-v1-${prompt}`;
    try {
        const cachedImage = await get<string>('cache', cacheKey);
        if (cachedImage) {
            return cachedImage;
        }
    } catch (e) {
        console.warn("Could not read image from IndexedDB cache", e);
    }

    if (!process.env.API_KEY) {
        console.error("API_KEY not found for image generation.");
        return null;
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                
                try {
                    await set('cache', cacheKey, imageUrl);
                } catch (e) {
                    console.warn(`Could not cache image to IndexedDB for prompt "${prompt}".`, e);
                }
                
                return imageUrl;
            }
        }

        console.warn("Image generation response did not contain an image for prompt:", prompt);
        return null;

    } catch (error) {
        console.error("Error during image generation from prompt:", error);
        return null; // Fail gracefully
    }
};

export const fetchChapterContent = async (grade: string, subject: string, chapter: string): Promise<LessonPack> => {
    const cacheKey = `lesson-pack-v3-${grade}-${subject}-${chapter}`;
    
    // 1. Try to load the COMPLETE lesson pack from cache first.
    try {
        const cachedData = await get<string>('cache', cacheKey);
        if (cachedData) {
            const cachedPack = JSON.parse(cachedData) as LessonPack;
            // A simple validation: if there are image briefs that need images, check if they have URLs.
            // This ensures we don't return a partially cached item (e.g., text only).
            const briefsRequiringImages = cachedPack.image_briefs?.filter(b => b.image_generation_prompt).length || 0;
            const briefsWithImages = cachedPack.image_briefs?.filter(b => b.generated_image_url).length || 0;
            
            if (briefsRequiringImages === briefsWithImages) {
                console.log(`Loading COMPLETE lesson pack from IndexedDB cache for: ${chapter}`);
                return cachedPack; // FAST PATH: Return fully cached content.
            }
        }
    } catch (e) {
        console.error("Could not read from IndexedDB cache", e);
    }

    // 2. If not cached or incomplete, generate everything from scratch.
    console.log(`Fetching new lesson pack for: Grade ${grade}, Subject: ${subject}, Chapter: ${chapter}`);
    
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found. Cannot generate lesson.");
    }
    
    let lessonPack: LessonPack;

    try {
        // A. Generate the text content of the lesson.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
              ROLE
              You are a senior CBSE curriculum designer, pedagogy expert, and instructional illustrator for Grades 6–12. You are an expert teacher, not just an answer machine. Your instructions are CRITICAL and must be followed precisely.

              GOAL
              Generate a single, complete, and **very detailed** lesson_pack for the specified topic that is 100% factually accurate, pedagogically sound, and aligned to the latest CBSE curriculum, standards, and marking scheme. **The lesson must be comprehensive enough for a student to learn the topic from scratch, similar in depth to a high-quality textbook chapter.**

              PEDAGOGICAL INSTRUCTIONS (CRITICAL):
              1.  **Factual & Mathematical Accuracy**: All content, especially answers and rubrics, must be 100% factually correct and mathematically sound. Proofread all content for spelling and grammatical errors. For any numerical problems, provide a clear, vertical, step-by-step derivation, explaining the logic behind each step.
              2.  **Simplified & Comprehensive Explanations**: Deconstruct complex topics into simple, first-principle ideas. The content must be comprehensive, covering all necessary sub-topics and providing detailed explanations. A typical chapter explanation should be several paragraphs long, not just a few sentences. Break down concepts into small, digestible chunks.
              3.  **Relatable Indian Context**: Use analogies and examples that are relatable to an Indian K-12 student's daily life (e.g., using cricket to explain physics concepts, or local market scenarios for economics).
              4.  **Socratic Method in Practice**: In guided practice, instead of giving direct solutions, provide hints that prompt the student to think, guiding them toward the answer with leading questions.
              5.  **Plain Text Content**: All string content within the \`student_explanation\` object (like \`core_explanation\`, \`worked_examples\`, etc.) must be plain text. Do not use any markdown formatting (like **, *, #, etc.). Use line breaks for separation where needed.
    
              SCOPE
              - Grade: ${grade}
              - Subject: ${subject}
              - Topic: "${chapter}"
    
              CONSTRAINTS
              - **Question Pool Generation**: The \`question_pool\` must contain questions that are directly modeled on the patterns, concepts, and difficulty levels found in the **last 10 years of CBSE Board Papers**. For questions of high importance or from a specific year's paper, add relevant strings to the optional \`tags\` array, for example: \`["Important", "CBSE 2023"]\`. Ensure MCQs always have an 'options' array.
              - **Image Prompts**: The \`image_generation_prompt\` must be highly descriptive to create accurate, well-labeled, and clear educational diagrams suitable for a textbook.
              - **Output Format**: Output ONLY the raw JSON object for the lesson_pack. All student-facing text must be plain text without any markdown.
            `;
            
        const interactiveVideoSchema = {
            type: Type.OBJECT,
            properties: {
            title: { type: Type.STRING },
            video_url: { type: Type.STRING },
            script: {
                type: Type.ARRAY,
                items: {
                type: Type.OBJECT,
                properties: {
                    timestamp: { type: Type.NUMBER },
                    question_text: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correct_answer: { type: Type.STRING },
                    feedback_correct: { type: Type.STRING },
                    feedback_incorrect: { type: Type.STRING },
                    branch_on_incorrect: { type: Type.NUMBER },
                },
                required: ['timestamp', 'question_text', 'options', 'correct_answer', 'feedback_correct', 'feedback_incorrect']
                }
            }
            },
            required: ['title', 'video_url', 'script']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                    topic_id: { type: Type.STRING },
                    topic_name: { type: Type.STRING },
                    student_explanation: {
                        type: Type.OBJECT,
                        properties: {
                        core_explanation: {
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
                        quick_check: {
                            type: Type.OBJECT,
                            properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correct_answer: { type: Type.STRING },
                            explanation: { type: Type.STRING }
                            },
                            required: ['question', 'options', 'correct_answer', 'explanation']
                        },
                        worked_examples: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: { prompt: { type: Type.STRING }, solution: { type: Type.STRING }, why_it_works: { type: Type.STRING } },
                            required: ['prompt', 'solution', 'why_it_works']
                            }
                        },
                        guided_practice: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: { question: { type: Type.STRING }, hint: { type: Type.STRING }, stepwise_solution: { type: Type.STRING } },
                            required: ['question', 'hint', 'stepwise_solution']
                            }
                        },
                        independent_practice: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: { question: { type: Type.STRING }, answer_key: { type: Type.STRING } },
                            required: ['question', 'answer_key']
                            }
                        },
                        HOTS: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: { question: { type: Type.STRING }, exemplar_answer: { type: Type.STRING } },
                            required: ['question', 'exemplar_answer']
                            }
                        },
                        common_errors_and_fixes: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: { error: { type: Type.STRING }, fix: { type: Type.STRING } },
                            required: ['error', 'fix']
                            }
                        },
                        fill_in_the_blanks: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: {
                                sentence_parts: { type: Type.ARRAY, items: { type: Type.STRING } },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correct_answer: { type: Type.STRING }
                            },
                            required: ['sentence_parts', 'options', 'correct_answer']
                            }
                        },
                        interactive_simulations: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING },
                                concept_link: { type: Type.STRING }
                            },
                            required: ['description', 'concept_link']
                            }
                        },
                        interactive_videos: {
                            type: Type.ARRAY,
                            items: interactiveVideoSchema,
                        }
                        },
                        required: ['core_explanation', 'quick_check', 'worked_examples', 'guided_practice', 'independent_practice', 'HOTS', 'common_errors_and_fixes']
                    },
                    assessment_blueprint: {
                        type: Type.OBJECT,
                        properties: {
                        question_pool: {
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
                                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ['q_id', 'type', 'marks', 'difficulty', 'bloom', 'question', 'answer', 'rubric']
                            }
                        },
                        section_breakup: {
                            type: Type.OBJECT,
                            properties: {
                            A: { type: Type.STRING },
                            B: { type: Type.STRING },
                            C: { type: Type.STRING },
                            D: { type: Type.STRING },
                            E: { type: Type.STRING },
                            }
                        },
                        total_marks: { type: Type.NUMBER },
                        marking_scheme_rationale: { type: Type.STRING }
                        },
                        required: ['question_pool', 'section_breakup', 'total_marks', 'marking_scheme_rationale']
                    },
                    image_briefs: {
                        type: Type.ARRAY,
                        items: {
                        type: Type.OBJECT,
                        properties: {
                            purpose: { type: Type.STRING },
                            style: { type: Type.STRING },
                            content_spec: { type: Type.ARRAY, items: { type: Type.STRING } },
                            alt_text: { type: Type.STRING },
                            image_generation_prompt: { type: Type.STRING },
                            optional_svg_markup: { type: Type.STRING }
                        },
                        required: ['purpose', 'style', 'content_spec', 'alt_text', 'image_generation_prompt']
                        }
                    },
                    teacher_notes: {
                        type: Type.OBJECT,
                        properties: {
                        TLM_list: { type: Type.ARRAY, items: { type: Type.STRING } },
                        differentiation: { type: Type.ARRAY, items: { type: Type.STRING } },
                        remediation_plan: { type: Type.ARRAY, items: { type: Type.STRING } },
                        safety_notes: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['TLM_list', 'differentiation', 'remediation_plan']
                    }
                    },
                    required: ['topic_id', 'topic_name', 'student_explanation', 'assessment_blueprint', 'image_briefs', 'teacher_notes']
                }
            }
        });

        const jsonText = response.text.trim();
        lessonPack = JSON.parse(jsonText) as LessonPack;

    } catch (error) {
        console.error("Error fetching from Gemini API for text content:", error);
        throw new Error("Failed to generate the lesson plan. The AI model may be temporarily unavailable or the request could not be completed. Please try again.");
    }

    // Post-process to fix potential issues like placeholder video URLs
    if (lessonPack?.student_explanation?.interactive_videos) {
        lessonPack.student_explanation.interactive_videos.forEach(video => {
            // A simple check to see if it's a real URL. If not, replace with a valid placeholder.
            if (!video.video_url || !video.video_url.startsWith('http')) {
                console.warn(`Invalid video_url found: "${video.video_url}". Replacing with placeholder.`);
                video.video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; 
            }
        });
    }

    // B. Generate the images for the lesson. `generateImageFromPrompt` has its own caching.
    if (lessonPack && lessonPack.image_briefs) {
        const briefsToGenerate = lessonPack.image_briefs.filter(brief => brief.image_generation_prompt);
        for (const brief of briefsToGenerate) {
            const url = await generateImageFromPrompt(brief.image_generation_prompt);
            brief.generated_image_url = url;
        }
    }
    
    // C. Save the now COMPLETE lesson pack (with images) to the cache for future instant loads.
    try {
        await set('cache', cacheKey, JSON.stringify(lessonPack));
        console.log(`Saved COMPLETE lesson pack to IndexedDB cache for: ${chapter}`);
    } catch (e) {
        console.error("Could not write complete lesson pack to IndexedDB cache", e);
    }

    if (!lessonPack) {
        throw new Error("Fatal: Lesson pack could not be loaded or generated.");
    }

    return lessonPack;
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

export const generateImageForAnswerIfNeeded = async (query: string, answer: string): Promise<string | null> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY not found for image generation.");
        return null;
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const imageDecisionPrompt = `
            Based on the following academic question and answer for a K-12 CBSE student, would a visual diagram significantly enhance understanding?
            Your response must be a raw JSON object, with no markdown.
            The JSON should have two keys:
            1. "imageNeeded": a boolean (true if a diagram is highly beneficial, otherwise false).
            2. "imagePrompt": If imageNeeded is true, provide a concise, factual, and descriptive prompt for an image generation model to create an accurate, simple, and clearly labeled educational diagram. The diagram must be 100% authentic and correctly marked for the CBSE curriculum. If imageNeeded is false, this should be an empty string.

            Question: "${query}"
            Answer: "${answer}"
        `;

        const decisionResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: imageDecisionPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        imageNeeded: { type: Type.BOOLEAN },
                        imagePrompt: { type: Type.STRING }
                    },
                    required: ['imageNeeded', 'imagePrompt']
                }
            }
        });

        const decisionJson = JSON.parse(decisionResponse.text);
        const { imageNeeded, imagePrompt } = decisionJson;

        if (imageNeeded && imagePrompt) {
            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: imagePrompt }],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            for (const part of imageResponse.candidates?.[0]?.content?.parts ?? []) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                }
            }
        }
        
        return null;

    } catch (error) {
        console.error("Error during image generation/decision process:", error);
        return null; // Fail gracefully
    }
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

    return JSON.parse(response.text) as AdaptiveFollowUp[];
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

      **Content Provided**:
      ${JSON.stringify(context, null, 2)}

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

export const analyzeImage = async (imageFile: File, prompt: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = await fileToBase64(imageFile);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: imageFile.type, data: base64Data } },
                { text: `As an expert CBSE tutor, answer this question about the image: "${prompt}"` }
            ]
        }
    });
    return response.text;
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

export const editImage = async (imageFile: File, prompt: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = await fileToBase64(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType: imageFile.type } },
                { text: prompt }
            ]
        },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("No edited image returned from API.");
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

export const generateVideoScriptWithQuestions = async (topic: string): Promise<InteractiveVideo> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Create a script for a 2-minute interactive video on the topic "${topic}" for a K-12 student.
      - The video should have a placeholder URL.
      - Include 2-3 multiple-choice questions embedded at logical timestamps in the script.
      - For each question, provide options, a correct answer, and feedback for both correct and incorrect responses.
      - Return a single raw JSON object matching the InteractiveVideo schema.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING }, video_url: { type: Type.STRING },
                    script: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.NUMBER }, question_text: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correct_answer: { type: Type.STRING }, feedback_correct: { type: Type.STRING }, feedback_incorrect: { type: Type.STRING }, branch_on_incorrect: { type: Type.NUMBER } }, required: ['timestamp', 'question_text', 'options', 'correct_answer', 'feedback_correct', 'feedback_incorrect'] } }
                },
                required: ['title', 'video_url', 'script']
            }
        }
    });
    return JSON.parse(response.text) as InteractiveVideo;
};

export const gradeShortAnswer = async (question: string, rubric: string, studentAnswer: string): Promise<{ isCorrect: boolean, feedback: string }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      As a CBSE teacher, grade this student's short answer.
      - Question: "${question}"
      - Marking Rubric: "${rubric}"
      - Student's Answer: "${studentAnswer}"
      Is the answer correct based on the rubric? Provide brief, constructive feedback.
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

export const explainTextSnippet = async (snippet: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Explain this snippet in simpler terms for a K-12 student: "${snippet}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const generateMicroRemediation = async (topic: string, question: string, studentAnswer: string): Promise<{ explanation: StructuredContent[], quick_check: QuickCheck }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        A student answered a question about "${topic}" incorrectly.
        - Question: "${question}"
        - Student's incorrect answer: "${studentAnswer}"
        
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
    return JSON.parse(response.text);
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

export const generatePracticeExam = async (grade: string, subject: string, blueprint: PracticeBlueprint): Promise<QuestionPoolItem[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Generate a practice exam paper for a Class ${grade} ${subject} student.
      Adhere strictly to this blueprint: ${JSON.stringify(blueprint.structure)}.
      - The questions must be original and distinct.
      - They must be relevant to the subject and grade level.
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
    const simplifiedResults = results.map(r => ({ question: r.question.question, isCorrect: r.isCorrect }));
    const prompt = `
      Based on these practice exam results, provide a brief, encouraging performance summary for the student.
      - Identify 1-2 topics they did well on.
      - Identify 1-2 topics they should review based on incorrect answers.
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