import { GoogleGenAI, Modality, Type } from "@google/genai";
import { LessonPack, GroundingChunk, AssessmentResult, AdaptiveFollowUp, StudentExplanation, QuestionPoolItem, StructuredContent, Flashcard, InteractiveSimulation, UserProfile, UserProgressData, ParentalReport, InteractiveVideo, ClassAnalyticsData, UserBktData, PrerequisiteGraph, SafalDiagnosticResult, RemediationGroup, QuickFormativeAssessment, QfaResult, FacilityBooking, QuickCheck } from '../types';
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
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: "4:3",
            },
        });
        
        if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0 && imageResponse.generatedImages[0].image) {
            const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            
            try {
                await set('cache', cacheKey, imageUrl);
            } catch (e) {
                console.warn(`Could not cache image to IndexedDB for prompt "${prompt}".`, e);
            }
            
            return imageUrl;
        } else {
            console.warn("Image generation response did not contain an image for prompt:", prompt);
            return null;
        }
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
              Generate a single, complete lesson_pack for the specified topic that is 100% factually accurate, pedagogically sound, and aligned to the latest CBSE curriculum, standards, and marking scheme.

              PEDAGOGICAL INSTRUCTIONS (CRITICAL):
              1.  **Factual & Mathematical Accuracy**: All content must be 100% factually correct and mathematically sound. For any numerical problems, provide a clear, step-by-step derivation, explaining the logic behind each step.
              2.  **Simplified Explanations**: Deconstruct complex topics into simple, first-principle ideas. Break down concepts into small, digestible chunks.
              3.  **Relatable Indian Context**: Use analogies and examples that are relatable to an Indian K-12 student's daily life (e.g., using cricket to explain physics concepts, or local market scenarios for economics).
              4.  **Socratic Method in Practice**: In guided practice, instead of giving direct solutions, provide hints that prompt the student to think, guiding them toward the answer with leading questions.
    
              SCOPE
              - Grade: ${grade}
              - Subject: ${subject}
              - Topic: "${chapter}"
    
              CONSTRAINTS
              - **Question Pool Generation**: The \`question_pool\` must contain questions that are directly modeled on the patterns, concepts, and difficulty levels found in the **last 10 years of CBSE Board Papers**. For questions of high importance or from a specific year's paper, add relevant strings to the optional \`tags\` array, for example: \`["Important", "CBSE 2023"]\`.
              - **Output Format**: Output ONLY the raw JSON object for the lesson_pack.
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
      3.  **Clean, Direct Answer**: Provide the final answer as clean, plain text ONLY. Do not use Markdown. Do not mention your sources or that you performed a search.
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
            const imageResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: imagePrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png',
                    aspectRatio: "4:3",
                },
            });
            
            if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0 && imageResponse.generatedImages[0].image) {
                const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        
        return null;

    } catch (error) {
        console.error("Error during image generation/decision process:", error);
        return null; // Fail gracefully
    }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A calm, clear voice
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio ?? null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
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
      - Use simple markdown: use '##' for main headings and '*' for bullet points.
      - The output should be clean, easy-to-read text, perfect for quick revision.
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
                    },
                    required: ['q_id', 'type', 'marks', 'difficulty', 'bloom', 'question', 'answer', 'rubric']
                }
            }
        }
    });
    
    return JSON.parse(response.text);
};


export const explainTextSnippet = async (snippet: string, context: { topic: string, subject: string, grade: string }): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
        As an expert CBSE tutor for a Grade ${context.grade} student studying ${context.subject}, explain the following snippet in a simple, concise, and easy-to-understand way.
        The snippet is from the chapter "${context.topic}". Keep the explanation to 2-3 sentences.

        **Snippet to Explain**: "${snippet}"
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};


export const explainConceptInDepth = async (text: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      ROLE: You are an expert CBSE educator and content specialist.
      TASK: Analyze the user-provided text and explain it clearly and comprehensively for a K-12 student.
      INPUT TEXT: "${text}"
      
      CRITICAL INSTRUCTIONS (MUST be followed):
      1.  **Pedagogical Soundness & Accuracy**: Your explanation must be 100% factually accurate and pedagogically sound. Simplify complex concepts and use relatable Indian contexts where possible.
      2.  **Step-by-Step Guidance for Math**: For any numerical problems, provide a clear, step-by-step derivation. Explain the logic behind each step and verify your calculations.
      3.  **Strict Markdown**: Your entire response MUST use the following markdown rules ONLY:
          - '##' for main headings.
          - '**' for bolding key terms.
          - '*' for unordered list items.
          - '1.', '2.', etc. for ordered lists.
          - \`\`\` for math blocks.
      
      Do not use any other markdown. The final output should be clean, structured, and easy to read.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};


export const generateFlashcards = async (lessonPack: LessonPack): Promise<Flashcard[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const coreConcepts = lessonPack.student_explanation.core_explanation
        .filter(block => block.type === 'paragraph' || block.type === 'key_term')
        .map(block => {
            if (block.type === 'key_term') {
                return `${block.term}: ${block.definition}`;
            }
            if ('content' in block) {
                return block.content || '';
            }
            return '';
        }).join('\n');
    
    const prompt = `
        Based on the following core concepts from a CBSE lesson on "${lessonPack.topic_name}", identify the most important key terms, definitions, and critical facts. Generate a set of flashcards for them.

        **Lesson Content**:
        ${coreConcepts}

        **Instructions**:
        - A good flashcard has a single, specific term/concept on one side and a concise definition/explanation on the other.
        - Do not create flashcards for broad, generic sentences. Focus on vocabulary, formulas, key dates, or specific cause-effect relationships.
        - Return the output as a raw JSON array of objects, where each object has a "term" and a "definition".
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
                    required: ['term', 'definition']
                }
            }
        }
    });

    return JSON.parse(response.text);
};

export const generateSimulationExplanation = async (concept: string, description: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        Act as a virtual science/maths lab instructor. A student wants to understand the concept of "${concept}" through a text-based interactive simulation described as: "${description}".

        Your task is to write a step-by-step walkthrough that simulates this interaction. Guide the user through the concept as if they were performing the actions.
        
        **Example Structure**:
        1.  **Setup**: "Imagine we have a simple lever..."
        2.  **Action 1**: "First, let's place the fulcrum in the middle..."
        3.  **Observation 1**: "What happens when you apply force? You'll notice..."
        4.  **Action 2**: "Now, let's move the fulcrum closer to the load..."
        5.  **Observation 2**: "See how you need less force now? This demonstrates..."
        6.  **Conclusion**: "So, we've learned that..."

        **Instructions**:
        - Be engaging and use the second person ("You'll notice...").
        - Keep the steps simple and logical.
        - The goal is to build intuition for the concept.
        - Use simple markdown: '##' for headings, '**' for bold, and numbered lists.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateParentalReport = async (profile: UserProfile, progress: UserProgressData): Promise<ParentalReport> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        ROLE: You are MIGA, an expert educational psychologist specializing in K-12 learning patterns.
        TASK: Analyze the provided student data and generate a concise, encouraging, and actionable report for their parent.
        
        **Student Data**:
        - Name: ${profile.name}
        - Grade: ${profile.grade}
        - Current Streak: ${profile.currentStreak} days
        - Completed Lessons: ${JSON.stringify(progress, null, 2)}

        **Instructions**:
        1.  **Analyze Progress**: Look at the completed chapters. Are they clustered in one subject? Are they consistent?
        2.  **Generate Summary**: Write a brief, positive summary (2-3 sentences) of the student's recent activity and engagement.
        3.  **Identify Strengths**: List 2-3 specific strengths. This could be consistency (high streak), focus on a particular subject, or simply engagement.
        4.  **Identify Focus Areas**: List 1-2 constructive areas for focus. Frame this positively (e.g., "Encourage exploring other subjects" instead of "They only study Science").
        5.  **Actionable Tips**: Provide 3 concrete, actionable tips for the parent. Each tip must have an associated 'icon' from the allowed list.
        
        **Output Format**: Your response must be a single, raw JSON object conforming to this structure:
        {
          "summary": "...",
          "strengths": ["...", "..."],
          "focusAreas": ["...", "..."],
          "actionableTips": [
            { "icon": "FlameIcon", "tip": "Celebrate their impressive learning streak to motivate them!" },
            { "icon": "BookIcon", "tip": "..." },
            { "icon": "WandIcon", "tip": "..." }
          ]
        }
        
        **Allowed Icons for Tips**: "FlameIcon", "BookIcon", "WandIcon", "CalendarDaysIcon"
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
                    actionableTips: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                icon: { type: Type.STRING },
                                tip: { type: Type.STRING },
                            },
                            required: ['icon', 'tip']
                        }
                    }
                },
                required: ['summary', 'strengths', 'focusAreas', 'actionableTips']
            }
        }
    });

    return JSON.parse(response.text);
};

export const checkFlashcardAnswer = async (userAnswer: string, correctAnswer: string, term: string): Promise<{ isCorrect: boolean; feedback: string }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
        A student is quizzing themselves on flashcards. You need to evaluate their answer.
        The term is: "${term}"
        The correct definition is: "${correctAnswer}"
        The student's answer is: "${userAnswer}"

        Task:
        1. Compare the student's answer to the correct definition.
        2. Determine if the student's answer is conceptually correct, even if not word-for-word.
        3. Provide brief, encouraging feedback.

        Your response must be a single, raw JSON object with two keys:
        - "isCorrect": boolean (true if the student's answer is semantically and factually correct).
        - "feedback": string (A short, one-sentence explanation of why their answer was right or wrong).

        Example for a correct answer: { "isCorrect": true, "feedback": "Great job! You captured the main idea perfectly." }
        Example for an incorrect answer: { "isCorrect": false, "feedback": "You're on the right track, but you missed the key point about..." }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isCorrect: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING }
                },
                required: ['isCorrect', 'feedback']
            }
        }
    });

    return JSON.parse(response.text);
};

export const generateVideoScriptWithQuestions = async (topic: string): Promise<InteractiveVideo> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        ROLE: You are an expert instructional designer and video scriptwriter for CBSE K-12 education.
        TASK: Create a script for a short (approx. 2-3 minute) educational video on the topic: "${topic}". The script must include in-stream questions to make it interactive.
        
        INSTRUCTIONS:
        1.  **Title**: Create a clear and engaging title for the video.
        2.  **Video URL**: Use this placeholder URL: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        3.  **Script with Questions**: Write a script that includes at least 2-3 multiple-choice questions embedded at logical points.
        4.  **Branching Logic**: For at least one question, add a 'branch_on_incorrect' timestamp that directs the student to an earlier part of the video for a quick review if they get it wrong.
        
        **Output Format**: Your response must be a single, raw JSON object conforming to the 'InteractiveVideo' structure.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
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
            }
        }
    });
    return JSON.parse(response.text) as InteractiveVideo;
};

export const generateClassPerformanceSummary = async (analytics: ClassAnalyticsData): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      ROLE: You are an expert educational data analyst providing insights to a school principal.
      TASK: Analyze the provided class performance data and generate a concise, actionable summary.
      
      **Data for Class ${analytics.grade}**:
      - Subject Mastery (%): ${analytics.subjectMastery.map(s => `${s.subject}: ${s.mastery}%`).join(', ')}
      - Top 3 Challenging Concepts (avg mastery): ${analytics.challengingConcepts.slice(0, 3).map(c => `${c.concept}: ${c.mastery}%`).join(', ')}
      - Students who may need support (avg mastery): ${analytics.studentsToWatch.slice(0, 3).map(s => `${s.name}: ${s.mastery}%`).join(', ')}

      **Instructions**:
      1.  **Synthesize**: Write a 3-4 sentence summary highlighting the key trends.
      2.  **Be Actionable**: Start with a clear overview. Mention 1-2 subjects that are performing well and 1-2 that might need attention.
      3.  **Pinpoint Issues**: Refer to one of the challenging concepts as a specific area for targeted intervention.
      4.  **Suggest Action**: Conclude with a constructive suggestion for the teachers, such as recommending a review session on a specific topic.
      5.  **Tone**: Professional, insightful, and supportive. Do not just list the data.
      
      **Example Output**: "Overall, Class ${analytics.grade} shows strong performance in [Strong Subject], but there's a noticeable gap in [Weak Subject]. Specifically, many students are struggling with '[Challenging Concept]', which may be impacting their scores. It would be beneficial for teachers to conduct a targeted review session on this topic to reinforce foundational understanding."
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateStudentReportCardSummary = async (profile: UserProfile, reportContext: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      ROLE: You are an expert educational analyst writing a report card summary for a student's teacher.
      TASK: Analyze the provided student data and a rich context of their performance to generate a concise, professional, and constructive summary.
      
      **Student Data**:
      - Name: ${profile.name}
      - Grade: ${profile.grade}
      
      **Comprehensive Performance Context**:
      ${reportContext}

      **Instructions**:
      1.  **Synthesize Performance**: Write a 2-3 sentence paragraph summarizing the student's overall academic performance. Go beyond just mastery scores; look for patterns. For example, connect low mastery to attendance, or poor assignment scores to specific diagnostic weaknesses.
      2.  **Identify Strengths**: Mention 1-2 subjects or specific topics where the student demonstrates strong mastery (high BKT probabilities).
      3.  **Identify Areas for Growth**: Gently point out 1-2 subjects or topics where mastery is lower and suggest it as an area for focus. Use the context to suggest *why* they might be struggling (e.g., "This seems related to the foundational concepts identified in their SAFAL diagnostic...").
      4.  **Suggest Next Steps**: Conclude with a brief, actionable recommendation for the teacher (e.g., "Recommend targeted practice on [topic]" or "Encourage their interest in [strong subject]").
      5.  **Tone**: Professional, balanced, and student-focused. Avoid overly negative language.
      
      **Example Output**: "${profile.name} shows a strong aptitude for Science, with consistently high mastery in topics like Life Processes. While their foundational understanding is solid, there is an opportunity for growth in Mathematics, particularly with algebraic concepts, which corresponds to their recent assignment scores. Targeted practice in this area could significantly boost their confidence and overall performance."
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};


export const generateRemediationGroups = async (results: SafalDiagnosticResult[]): Promise<RemediationGroup[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Prepare a simplified data structure for the prompt
    const analysisData = results.map(res => ({
        studentName: res.studentName,
        lowCompetencies: Object.entries(res.competencies)
            .filter(([, score]) => score === 'low')
            .map(([competency]) => competency)
    }));

    const prompt = `
        ROLE: You are an expert educational strategist for a CBSE school in India.
        TASK: Analyze diagnostic assessment data to identify groups of students who need remedial help on specific competencies and suggest targeted tasks for them.

        ASSESSMENT DATA:
        The following data shows students and the competencies where they scored 'low'.
        ${JSON.stringify(analysisData, null, 2)}

        INSTRUCTIONS:
        1.  **Identify Common Gaps**: Find competencies where multiple students are struggling.
        2.  **Form Remediation Groups**: For each of these common-gap competencies, create a group. List the names of the students who need help with that specific competency.
        3.  **Suggest Actionable Tasks**: For each group, suggest one simple, concrete, and actionable remedial task that a teacher can implement. The task should directly address the competency gap. Examples: "Work through 3 solved examples of long division on the blackboard," or "Read a short story together and identify the main character's motivations."
        4.  **Format**: Return the output as a raw JSON array of objects. Each object must have three keys: "competency", "students" (an array of student names), and "suggestedTask".

        EXAMPLE OUTPUT:
        [
          {
            "competency": "Solves linear equations",
            "students": ["Rohan Sharma", "Priya Singh"],
            "suggestedTask": "Provide a worksheet with 5 linear equations, starting with simple one-step problems and gradually increasing complexity. Work through the first one together as a group."
          }
        ]
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
                        competency: { type: Type.STRING },
                        students: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestedTask: { type: Type.STRING },
                    },
                    required: ['competency', 'students', 'suggestedTask']
                }
            }
        }
    });

    return JSON.parse(response.text) as RemediationGroup[];
};

export const generateQfaRemediation = async (assessment: QuickFormativeAssessment, results: QfaResult[]): Promise<RemediationGroup[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const analysisData = assessment.questions.map((question, index) => {
        const incorrectStudents = results
            .filter(res => res.answers[index]?.trim().toLowerCase() !== question.answer.trim().toLowerCase())
            .map(res => res.studentName);
        return {
            question: question.text,
            incorrectStudents,
        };
    }).filter(item => item.incorrectStudents.length > 0);

    if (analysisData.length === 0) return [];

    const prompt = `
        ROLE: You are an AI teaching assistant helping a teacher with immediate post-class remediation.
        TASK: Analyze the results of a quick "Exit Ticket" style assessment to identify common misconceptions and group students for a brief follow-up activity.

        ASSESSMENT RESULTS (shows questions and which students answered them incorrectly):
        ${JSON.stringify(analysisData, null, 2)}

        INSTRUCTIONS:
        1.  **Identify Common Misconceptions**: Look at questions where multiple students struggled. The question text itself reveals the core concept being tested.
        2.  **Form Remediation Groups**: For each question with multiple incorrect answers, create a remediation group.
        3.  **Suggest a Micro-Task**: For each group, suggest a very short (1-2 minute) and specific task the teacher can do with that group to clarify the misconception. Examples: "Briefly re-explain the term 'photosynthesis' using a simple diagram on the board," or "Ask them to identify the verb in the sentence 'The cat sat on the mat'."
        4.  **Format**: Return the output as a raw JSON array of objects. Each object must have "competency" (use the question text as a proxy for the competency), "students", and "suggestedTask".
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
                        competency: { type: Type.STRING },
                        students: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestedTask: { type: Type.STRING },
                    },
                    required: ['competency', 'students', 'suggestedTask']
                }
            }
        }
    });

    return JSON.parse(response.text) as RemediationGroup[];
};

// --- NEWLY ADDED FUNCTIONS ---

export const analyzeImage = async (imageFile: File, prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Image = await fileToBase64(imageFile);

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: imageFile.type,
        },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
};

export const editImage = async (imageFile: File, prompt: string): Promise<string | null> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Image = await fileToBase64(imageFile);

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: imageFile.type,
        },
    };

    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    return null;
};

export const analyzeQueryComplexity = async (query: string): Promise<'simple' | 'complex'> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY not found for query analysis.");
        return 'simple';
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Analyze the following student's query and classify its complexity.
        A 'simple' query can typically be answered by a direct web search (e.g., "who won the olympics?", "what is photosynthesis?").
        A 'complex' query requires multi-step reasoning, synthesis of information, or deep conceptual explanation (e.g., "explain the physics behind a curveball", "write a python script for...").

        Your response MUST be a single word: either "simple" or "complex".

        Query: "${query}"
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    const result = response.text.trim().toLowerCase();
    if (result === 'complex') {
        return 'complex';
    }
    return 'simple';
};

export const generateAdaptiveQuestion = async (
    grade: string,
    subject: string,
    chapter: string,
    difficulty: 'E' | 'M' | 'H',
    previousQuestions: string[]
): Promise<QuestionPoolItem> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        ROLE: Expert CBSE question paper setter.
        TASK: Generate a single, new, high-quality assessment question for a student.
        
        CONTEXT:
        - Grade: ${grade}
        - Subject: ${subject}
        - Chapter: "${chapter}"
        - Requested Difficulty: ${difficulty} ('E' for Easy, 'M' for Medium, 'H' for Hard)

        CONSTRAINTS:
        - The question MUST be different from the following previously asked questions:
          ${previousQuestions.map(q => `- ${q}`).join('\n')}
        - The question type should be either 'MCQ' (Multiple Choice Question) or 'SA' (Short Answer). Prefer MCQs for 'E' and 'M' difficulties.
        - Provide a concise, correct answer and a clear rubric for marking.
        - Output MUST be a single, raw JSON object conforming to the QuestionPoolItem structure. Do not add any other text or markdown.
        - Generate a unique q_id.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
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
                },
                required: ['q_id', 'type', 'marks', 'difficulty', 'bloom', 'question', 'answer', 'rubric']
            }
        }
    });

    return JSON.parse(response.text) as QuestionPoolItem;
};

export const generatePrerequisiteGraph = async (grade: string, subject: string, chapters: string[]): Promise<{ [chapterId: string]: string[] }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      ROLE: You are an expert CBSE curriculum designer.
      TASK: Analyze the following list of chapters for a specific grade and subject, and determine their prerequisite relationships.

      CONTEXT:
      - Grade: ${grade}
      - Subject: ${subject}
      - Chapters: ${JSON.stringify(chapters)}

      INSTRUCTIONS:
      1.  **Identify direct prerequisite chapters from the provided list for each chapter. A prerequisite must come before the chapter in a logical learning sequence.
      2.  If a chapter has no prerequisites within the list, provide an empty array for it.
      3.  The output MUST be a single, raw JSON object where each key is a chapter name from the list, and its value is an array of chapter names that are its direct prerequisites.
      
      EXAMPLE OUTPUT for a fictional subject:
      {
        "Introduction to Algebra": [],
        "Linear Equations": ["Introduction to Algebra"],
        "Quadratic Equations": ["Linear Equations"]
      }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                // No properties defined, so any property is allowed
                // The value of each property is an array of strings
                additionalProperties: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        }
    });

    const chapterMap = JSON.parse(response.text);
    const prerequisiteGraphPart: { [chapterId: string]: string[] } = {};

    for (const chapterName of chapters) {
        const chapterId = `G${grade}-${subject}-${chapterName}`;
        const prereqNames = chapterMap[chapterName] as string[] | undefined;
        if(prereqNames) {
          const prereqIds = prereqNames.map(name => `G${grade}-${subject}-${name}`);
          prerequisiteGraphPart[chapterId] = prereqIds;
        } else {
          prerequisiteGraphPart[chapterId] = [];
        }
    }

    return prerequisiteGraphPart;
};

export const generateRagAnswer = async (
  query: string,
  contentChunks: { id: string; content: string }[],
  context: { grade: string, subject: string, chapter: string }
): Promise<{ answer: string; sourceIds: string[] }> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const contextString = contentChunks.map(chunk => `[START CHUNK id="${chunk.id}"]\n${chunk.content}\n[END CHUNK id="${chunk.id}"]`).join('\n\n');

    const prompt = `
      You are an expert AI tutor for a Grade ${context.grade} student studying "${context.chapter}" in ${context.subject}.
      Your task is to answer the student's question based ONLY on the provided content chunks. Do not use any outside knowledge.

      **STUDENT QUESTION**:
      "${query}"

      **PROVIDED CONTENT CHUNKS**:
      ${contextString}

      **INSTRUCTIONS**:
      1.  **Analyze and Select**: First, carefully read the student's question and all the content chunks. Identify the chunks that are most relevant for answering the question.
      2.  **Synthesize Answer**: Formulate a clear, concise, and helpful answer to the student's question using ONLY information from the selected relevant chunks.
      3.  **Cite Sources**: Identify the 'id' of every chunk you used to create your answer.
      4.  **Format Output**: Your response MUST be a single, raw JSON object with no markdown. The JSON object must have two keys:
          - "answer": A string containing the synthesized answer.
          - "source_ids": An array of strings containing the 'id's of the chunks you used.

      **EXAMPLE RESPONSE**:
      {
        "answer": "Photosynthesis is the process where plants use sunlight, water, and carbon dioxide to create their own food (glucose) and release oxygen as a byproduct. This process primarily occurs in the chloroplasts found in plant leaves.",
        "source_ids": ["core_explanation_1", "key_term_0"]
      }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    answer: { type: Type.STRING },
                    source_ids: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['answer', 'source_ids']
            }
        }
    });

    const result = JSON.parse(response.text);
    return { answer: result.answer, sourceIds: result.source_ids };
};

export const generateCbeQuestion = async (
    grade: string,
    subject: string,
    chapter: string,
    type: 'MCQ' | 'SA' | 'Case',
    competency: string,
    dok: number,
    topic: string
): Promise<QuestionPoolItem> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let typeSpecificSchema, typeSpecificInstructions;

    const baseProperties = {
        marks: { type: Type.NUMBER },
        difficulty: { type: Type.STRING, enum: ['E', 'M', 'H'] },
        bloom: { type: Type.STRING },
        rubric: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    };

    switch (type) {
        case 'MCQ':
            typeSpecificInstructions = `
                - For "MCQ", create a clear question with four plausible options. One must be unambiguously correct.
                - The "answer" must be the exact text of the correct option.
                - The "distractor_rationale" must explain why the three incorrect options are wrong.
            `;
            typeSpecificSchema = {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
                distractor_rationale: { type: Type.STRING, description: "Rationale for why distractors are incorrect." },
            };
            break;
        case 'SA':
            typeSpecificInstructions = `
                - For "SA" (Short Answer), create a question that requires a brief, specific answer (1-2 sentences).
                - The "answer" should be the ideal, concise answer.
            `;
            typeSpecificSchema = {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
            };
            break;
        case 'Case':
            typeSpecificInstructions = `
                - For "Case", create a source passage (e.g., a paragraph, data table, or scenario) relevant to the topic.
                - Then, create 2-3 sub-questions that require students to analyze or interpret the source passage.
            `;
            typeSpecificSchema = {
                source_passage: { type: Type.STRING },
                sub_questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            q_id: { type: Type.STRING },
                            question: { type: Type.STRING },
                            marks: { type: Type.NUMBER },
                            answer: { type: Type.STRING },
                            rubric: { type: Type.STRING },
                        },
                        required: ['q_id', 'question', 'marks', 'answer', 'rubric']
                    }
                }
            };
            break;
    }

    const prompt = `
        ROLE: Expert CBSE Question Paper Setter for Indian K-12 schools.
        TASK: Generate a single, high-quality, competency-based question item.

        CONTEXT & CONSTRAINTS:
        - Grade: ${grade}
        - Subject: ${subject}
        - Chapter: "${chapter}"
        - Specific Topic: "${topic}"
        - Question Type: ${type}
        - Target Competency: "${competency}"
        - Target DOK Level: ${dok}
        - Ensure the question is fresh, original, and not easily found online.
        - The question must be 100% aligned with the latest CBSE syllabus and assessment style.
        - For questions modeled on past papers, add a tag like "CBSE 2023 Style".
        
        TYPE-SPECIFIC INSTRUCTIONS:
        ${typeSpecificInstructions}

        OUTPUT:
        - Your response must be ONLY a raw JSON object containing the properties defined in the schema for the requested type.
        - Do not include properties that are fixed (like type, competency, dok, q_id) as they will be added later.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: { ...typeSpecificSchema, ...baseProperties }
            }
        }
    });

    const generatedQuestion = JSON.parse(response.text) as Partial<QuestionPoolItem>;
    
    // Add back the fixed properties
    generatedQuestion.q_id = `gen-${Date.now()}`;
    generatedQuestion.type = type;
    generatedQuestion.competency = competency;
    generatedQuestion.dok = dok as 1 | 2 | 3 | 4;

    // For Case questions, the top-level question and answer are derived
    if (type === 'Case') {
        generatedQuestion.question = "Refer to the passage below and answer the questions that follow.";
        generatedQuestion.answer = "See sub-questions.";
    }

    return generatedQuestion as QuestionPoolItem;
};

// FIX: Added missing generateRentalAgreement function.
export const generateRentalAgreement = async (booking: FacilityBooking): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
        ROLE: You are a paralegal assistant for a school.
        TASK: Generate a simple, standard facility rental agreement based on the provided booking details.
        
        **Booking Details**:
        - Facility: ${booking.facility}
        - Booked By: ${booking.bookedBy}
        - Purpose: ${booking.purpose}
        - Date: ${booking.date}
        - Start Time: ${booking.startTime}
        - End Time: ${booking.endTime}

        **Instructions**:
        - Create a formal but easy-to-understand rental agreement.
        - Include sections for: Parties, Facility Details, Purpose of Use, Date and Time, Rental Fee (use a placeholder like "[INSERT FEE]"), Responsibilities of the Renter (e.g., cleanliness, damages), and a signature block.
        - The output should be plain text, suitable for copying into a document.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateMicroRemediation = async (topic: string, question: string, incorrectAnswer: string): Promise<{ explanation: StructuredContent[], quick_check: QuickCheck } | null> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        ROLE: You are an expert and friendly CBSE tutor AI.
        TASK: A student has answered a question incorrectly. Create a short, targeted "micro-remediation" lesson to help them understand the specific concept they missed.

        CONTEXT:
        - Topic: ${topic}
        - Original Question: "${question}"
        - Student's Incorrect Answer: "${incorrectAnswer}"

        INSTRUCTIONS:
        1.  **Diagnose the Misconception**: Analyze why the student's answer is wrong.
        2.  **Generate a Simple Explanation**: Write a concise, one-paragraph explanation of the core concept the student misunderstood. Use a simple analogy if possible. The explanation should be an array containing one 'paragraph' block.
        3.  **Create a New Quick Check**: Generate a *new*, simpler multiple-choice question that directly tests their understanding of the concept you just re-explained. This new question should be easier than the original one.

        OUTPUT:
        Your response must be a single, raw JSON object with no markdown, containing two keys: "explanation" and "quick_check".
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    explanation: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING, enum: ['paragraph'] },
                                content: { type: Type.STRING }
                            },
                            required: ['type', 'content']
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
                    }
                },
                required: ['explanation', 'quick_check']
            }
        }
    });
    
    try {
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse micro-remediation response:", e);
        return null;
    }
};

export const gradeShortAnswer = async (question: string, rubric: string, studentAnswer: string): Promise<{ isCorrect: boolean; feedback: string } | null> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not found.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
        ROLE: You are an expert AI Teaching Assistant for a CBSE school.
        TASK: Grade a student's short-answer question based on the provided rubric and generate constructive feedback.

        CONTEXT:
        - Question: "${question}"
        - Marking Rubric: "${rubric}"
        - Student's Answer: "${studentAnswer}"

        INSTRUCTIONS:
        1.  **Evaluate Correctness**: Strictly compare the student's answer against the rubric. Determine if the core points of the rubric are met. The answer doesn't need to be word-for-word but must be conceptually correct.
        2.  **Generate Feedback**: Write a single, concise sentence of feedback for the student.
            - If correct: Be encouraging (e.g., "Excellent, you've clearly explained the key concept.").
            - If incorrect: Be constructive and specific (e.g., "Good attempt, but remember to mention the role of [key term from rubric].").
        
        OUTPUT:
        Your response must be a single, raw JSON object with two keys:
        - "isCorrect": boolean (true if the student's answer meets the rubric's criteria).
        - "feedback": string (The one-sentence feedback you generated).
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isCorrect: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING }
                },
                required: ['isCorrect', 'feedback']
            }
        }
    });

    try {
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse AI grading response:", e);
        return null;
    }
};