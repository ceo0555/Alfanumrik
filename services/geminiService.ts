import { GoogleGenAI, Modality, Type } from "@google/genai";
import { LessonPack, GroundingChunk, AssessmentResult, AdaptiveFollowUp, StudentExplanation, QuestionPoolItem, StructuredContent, Flashcard, InteractiveSimulation, UserProfile, UserProgressData, ParentalReport, InteractiveVideo } from '../types';
import { fileToBase64 } from "../utils/fileHelpers";
import { get, set } from '../utils/db';

const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
    const cacheKey = `image-cache-v1-${prompt}`;
    try {
        const cachedImage = await get<string>(cacheKey);
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
                await set(cacheKey, imageUrl);
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
    const cacheKey = `lesson-pack-v3-${grade}-${subject}-${chapter}`; // Bump version for new structure
    let lessonPack: LessonPack | null = null;
    
    // 1. Try to load text-only lesson pack from cache
    try {
        const cachedData = await get<string>(cacheKey);
        if (cachedData) {
            console.log(`Loading lesson pack from IndexedDB cache for: ${chapter}`);
            lessonPack = JSON.parse(cachedData);
        }
    } catch (e) {
        console.error("Could not read from IndexedDB cache", e);
    }

    // 2. If not cached, fetch from API and cache the text-only version
    if (!lessonPack) {
        console.log(`Fetching lesson pack for: Grade ${grade}, Subject: ${subject}, Chapter: ${chapter}`);
        
        if (!process.env.API_KEY) {
            throw new Error("API_KEY not found. Cannot generate lesson.");
        }
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const prompt = `
              ROLE
              You are a senior CBSE curriculum designer, pedagogy expert, and instructional illustrator for Grades 6–12. Operate in strict CBSE alignment for the specified academic session and marking scheme.
    
              GOAL
              Generate a single, complete lesson_pack for the specified topic that is 100% aligned to CBSE norms and the official marking scheme, with engaging, student-friendly explanations and illustrative image briefs. A primary goal is to generate a question bank to help board-appearing students score high.
    
              SCOPE
              - Grade: ${grade}
              - Subject: ${subject}
              - Topic: "${chapter}"
              - Academic Session: 2025-26
    
              CONSTRAINTS
              - Strict CBSE alignment with session-specific syllabus, assessment pattern, and marking scheme.
              - Age-appropriate, inclusive, accessible language and alt text.
              - Output ONLY the raw JSON object for the lesson_pack. Do not include any other top-level keys.
              - **Question Pool Generation**: The \`question_pool\` must contain questions that are directly modeled on the patterns, concepts, and difficulty levels found in the **last 10 years of CBSE Board Papers** and other relevant competitive exams. For questions of high importance or from a specific year's paper, add relevant strings to the optional \`tags\` array, for example: \`["Important", "CBSE 2023"]\`.
    
              The JSON object for the lesson_pack must conform to the following structure, providing rich and detailed content for every key:
              {
                "topic_id": "G${grade}-${subject.substring(0,3).toUpperCase()}-U1-T1",
                "topic_name": "${chapter}",
                "student_explanation": {
                  "core_explanation": [
                    {"type": "heading", "level": 2, "content": "Introduction to ${chapter}"},
                    {"type": "paragraph", "content": "A clear, concise, and scaffolded paragraph explaining a core concept. Use concrete Indian contexts where applicable. Break down complex ideas into smaller, digestible chunks across multiple paragraphs."},
                    {"type": "list", "items": ["First key point.", "Second key point.", "Third key point."]},
                    {"type": "key_term", "term": "Important Vocabulary", "definition": "A simple, age-appropriate definition of the term."},
                    {"type": "note", "content": "A special callout for a critical fact, formula, or piece of information that students must remember."}
                  ],
                  "quick_check": {
                    "question": "A single, clear multiple-choice question that checks for understanding of the most critical concept from the core_explanation above.",
                    "options": ["Plausible incorrect option A", "The correct answer", "Plausible incorrect option B", "Plausible incorrect option C"],
                    "correct_answer": "The correct answer",
                    "explanation": "A brief explanation of why the correct answer is right."
                  },
                  "worked_examples": [{"prompt":"...", "solution":"...", "why_it_works":"..."}],
                  "guided_practice": [{"question":"...", "hint":"...", "stepwise_solution":"..."}],
                  "independent_practice": [{"question":"...", "answer_key":"..."}],
                  "HOTS": [{"question":"...", "exemplar_answer":"..."}],
                  "common_errors_and_fixes": [{"error":"...", "fix":"..."}],
                  "fill_in_the_blanks": [{"sentence_parts": ["The process by which plants make their own food is called ", "."], "options": ["Respiration", "Photosynthesis", "Transpiration"], "correct_answer": "Photosynthesis"}],
                  "interactive_simulations": [{"description": "A brief description of a potential interactive simulation to explain a complex topic, like 'Simulate how a lever works by adjusting the fulcrum position.'", "concept_link": "Levers and Simple Machines"}],
                  "interactive_videos": [{
                      "title": "Visualizing [Concept]",
                      "video_url": "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                      "script": [
                          {
                              "timestamp": 10,
                              "question_text": "What is the main character's name?",
                              "options": ["Bunny", "Rabbit", "Buck", "Friend"],
                              "correct_answer": "Buck",
                              "feedback_correct": "That's right! His name is Buck.",
                              "feedback_incorrect": "Not quite. Let's watch the intro again.",
                              "branch_on_incorrect": 5
                          }
                      ]
                  }]
                },
                "assessment_blueprint": {
                  "question_pool": [
                    {"q_id":"...", "type":"MCQ", "marks":1, "difficulty":"M", "bloom":"Apply", "question":"A high-quality question modeled on the last 10 years of CBSE board papers.", "options": ["..."], "answer": "...", "rubric":"...", "tags": ["Important", "CBSE 2023"]}
                  ],
                  "section_breakup": {"A": "MCQ", "B": "SA", "C": "LA"},
                  "total_marks": 10,
                  "marking_scheme_rationale": "Explain K/U/A/HOTS mapping as per CBSE norms."
                },
                "image_briefs": [
                  {
                    "purpose": "Explain/visualize ...",
                    "style": "Friendly, notebook-style, clear labels, accessible, age-appropriate; no copyrighted characters.",
                    "content_spec": ["What must be shown, labels, steps, relationships"],
                    "alt_text": "Accessible description of the visual.",
                    "image_generation_prompt": "Exact text-to-image prompt for an educational diagram.",
                    "optional_svg_markup": "<svg>...</svg>"
                  }
                ],
                "teacher_notes": {
                  "TLM_list": ["concrete materials, low-cost aids"],
                  "differentiation": ["support for struggling learners", "extension for advanced learners"],
                  "remediation_plan": ["diagnostics → targeted practice → reassessment"],
                  "safety_notes": ["Where relevant in Science labs"]
                }
              }
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
            
            // Cache the text-only lesson pack immediately
            try {
                await set(cacheKey, JSON.stringify(lessonPack));
            } catch (e) {
                console.error("Could not write lesson pack (text only) to IndexedDB cache", e);
            }
    
        } catch (error) {
            console.error("Error fetching from Gemini API:", error);
            throw new Error("Failed to generate the lesson plan. The AI model may be temporarily unavailable or the request could not be completed. Please try again.");
        }
    }

    // 3. Populate images (from cache or by generating new ones)
    if (lessonPack && lessonPack.image_briefs) {
        // FIX: Replaced Promise.all with a sequential for...of loop to avoid hitting API rate limits.
        const briefsToGenerate = lessonPack.image_briefs.filter(brief => brief.image_generation_prompt);
        for (const brief of briefsToGenerate) {
            const url = await generateImageFromPrompt(brief.image_generation_prompt);
            brief.generated_image_url = url;
        }
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

      **Query**: "${query}"

      **Instructions**:
      1.  **Adhere to CBSE Standards**: Your answer must be strictly aligned with the CBSE curriculum, standards, and marking schemes.
      2.  **Understand Question Gravity**: Analyze the query to determine the expected detail level (e.g., one-word, short paragraph, detailed explanation) and keep your answer within the appropriate word limit for that type of question.
      3.  **Clean Text Output**: Provide the final answer as clean, plain text ONLY. Do not use any Markdown formatting (like **, *, #), bullet points, or any other special characters. The output should be a simple, well-formatted paragraph or series of paragraphs.
      4.  **Direct Answer**: Your response should be the answer itself. Do not mention your sources, that you performed a search, or any other meta-commentary. The answer should appear as if it comes directly from your own expert knowledge.
      5.  **Educational Focus**: Your purpose is to help with educational topics. If the query is unrelated to academics, school subjects, or learning, you must politely decline to answer and explain that your role is to assist with educational questions.
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
      
      INSTRUCTIONS:
      1.  **Deconstruct the Concept**: Break down the core concepts into simple, logical steps.
      2.  **Use Analogies**: Where appropriate, use simple, relatable analogies to explain complex ideas.
      3.  **CBSE Alignment**: Ensure the explanation aligns with the terminology and scope of the CBSE curriculum.
      4.  **Mathematical Formatting**: For any mathematical equations, formulas, or calculations, enclose them in markdown code blocks (\`\`\`...\`\`\`). Present calculations step-by-step.
      5.  **Strict Markdown**: Your entire response MUST use the following markdown rules ONLY:
          - Use '##' for main headings.
          - Use '**' for bolding key terms (e.g., **Force**).
          - Use '*' for unordered list items.
          - Use '1.', '2.', etc. for ordered list items.
          - Use \`\`\` for math blocks.
          - Separate paragraphs with a single blank line.
      
      Do not use any other markdown characters or formatting. The final output should be clean, structured, and easy to read.
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
// Ensure content exists to prevent crash on map
// FIX: The type of `block` was not being correctly narrowed after the filter. `ListBlock` has no `content` property. This check makes the access safe.
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
