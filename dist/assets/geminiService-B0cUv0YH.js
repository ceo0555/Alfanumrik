import{G as I,T as e,r as d}from"./env-Ui43btNC.js";import{c as C}from"./syllabus-DftkSEae.js";const O=t=>new Promise((n,s)=>{const o=new FileReader;o.readAsDataURL(t),o.onload=()=>{const a=o.result.split(",")[1];a?n(a):s(new Error("Failed to read Base64 string from blob."))},o.onerror=a=>s(a)}),_="AlfanumrikDB",k=["cache","fineTuningData"],G=2;let b=null;const A=()=>b||(b=new Promise((t,n)=>{const s=indexedDB.open(_,G);s.onupgradeneeded=o=>{const a=s.result;o.oldVersion,k.forEach(r=>{a.objectStoreNames.contains(r)||(r==="fineTuningData"?a.createObjectStore(r,{keyPath:"id"}):a.createObjectStore(r))})},s.onsuccess=()=>{t(s.result)},s.onerror=()=>{console.error("IndexedDB error:",s.error),n(s.error)}}),b),v=async(t,n)=>{const s=await A();return new Promise((o,a)=>{const i=s.transaction(t,"readonly").objectStore(t).get(n);i.onsuccess=()=>{o(i.result)},i.onerror=()=>{console.error("IndexedDB get error:",i.error),a(i.error)}})},E=async(t,n,s)=>{const o=await A();return new Promise((a,r)=>{const m=o.transaction(t,"readwrite").objectStore(t).put(s,n);m.onsuccess=()=>{a()},m.onerror=()=>{console.error("IndexedDB set error:",m.error),r(m.error)}})},B=async(t,n)=>{const s=await A();return new Promise((o,a)=>{const i=s.transaction(t,"readwrite").objectStore(t).add(n);i.onsuccess=()=>{o()},i.onerror=()=>{console.error("IndexedDB add error:",i.error),a(i.error)}})};function h(t){let n=t;const s=t.match(/```json\n([\s\S]*?)\n```/s);s&&s[1]&&(n=s[1]);const o=n.indexOf("{"),a=n.indexOf("[");let r=-1;if(o===-1?r=a:a===-1?r=o:r=Math.min(o,a),r===-1)try{return JSON.parse(t)}catch{throw new Error("No JSON object or array found in the response.")}const c=n.lastIndexOf("}"),i=n.lastIndexOf("]");let m=-1;if(n.charAt(r)==="{"?m=c:m=i,m===-1||m<r)throw new Error("Unterminated JSON object or array in response.");n=n.substring(r,m+1);try{const y=n.replace(/\\n/g,"\\\\n").replace(/\n/g,"\\n");return JSON.parse(y)}catch{try{return JSON.parse(n)}catch(f){throw console.error("Failed to parse extracted JSON:",f),console.error("Original text:",t),console.error("Extracted string:",n),new Error("Failed to parse JSON from AI response after extraction.")}}}const u=()=>new I({apiKey:d()}),l=t=>{if(!t.text)throw new Error("Gemini response did not include text content.");return l(t)},N={type:e.OBJECT,properties:{q_id:{type:e.STRING},type:{type:e.STRING},marks:{type:e.NUMBER},difficulty:{type:e.STRING},bloom:{type:e.STRING},question:{type:e.STRING},options:{type:e.ARRAY,items:{type:e.STRING}},answer:{type:e.STRING},rubric:{type:e.STRING},tags:{type:e.ARRAY,items:{type:e.STRING}},source:{type:e.STRING},competency:{type:e.STRING},dok:{type:e.NUMBER},distractor_rationale:{type:e.STRING},source_passage:{type:e.STRING},sub_questions:{type:e.ARRAY,items:{type:e.OBJECT,properties:{q_id:{type:e.STRING},question:{type:e.STRING},marks:{type:e.NUMBER},answer:{type:e.STRING},rubric:{type:e.STRING}},required:["q_id","question","marks","answer","rubric"]}}},required:["q_id","type","marks","difficulty","bloom","question","answer","rubric","competency","dok"]},J=async(t,n,s)=>{var R;const o=`${t.topic_id}|${n}`,a=`lesson-pack-v8-${o}`;try{const g=await v("cache",a);if(g)return console.log(`Loading lesson pack from cache for topic: ${n}`),s==null||s({progress:100,message:"Loaded from cache!",step:1,totalSteps:1}),JSON.parse(g)}catch(g){console.error("Could not read from IndexedDB cache",g)}s==null||s({progress:0,message:"Generating your lesson...",step:0,totalSteps:1}),console.log(`Generating new lesson pack for topic: ${n}`);const[r,c]=t.topic_id.split("-").slice(0,2).map(g=>g.replace("G","")),i=u(),m=`
      ROLE
      You are a senior CBSE curriculum designer and pedagogy expert. Your instructions are CRITICAL and must be followed with extreme precision.

      GOAL
      Generate a detailed, comprehensive, and pedagogically sound content module for a **single, specific topic** within a larger chapter.

      CONTEXT
      - Grade: ${r}
      - Subject: ${c}
      - Chapter: "${t.topic_name}"
      - **Current Topic to Generate Content For**: "${n}"

      PEDAGOGICAL INSTRUCTIONS (CRITICAL - NON-NEGOTIABLE):
      1.  **Strict Focus**: Generate content ONLY for the specified topic ("${n}"). Do NOT include content from other parts of the chapter.
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
    `,y={type:e.OBJECT,properties:{title:{type:e.STRING},video_url:{type:e.STRING},script:{type:e.ARRAY,items:{type:e.OBJECT,properties:{timestamp:{type:e.NUMBER},question_text:{type:e.STRING},options:{type:e.ARRAY,items:{type:e.STRING}},correct_answer:{type:e.STRING},feedback_correct:{type:e.STRING},feedback_incorrect:{type:e.STRING},branch_on_incorrect:{type:e.NUMBER}},required:["timestamp","question_text","options","correct_answer","feedback_correct","feedback_incorrect"]}}},required:["title","video_url","script"]},f={type:e.OBJECT,properties:{core_explanation:{type:e.ARRAY,items:{type:e.OBJECT,properties:{type:{type:e.STRING},level:{type:e.NUMBER},content:{type:e.STRING},items:{type:e.ARRAY,items:{type:e.STRING}},term:{type:e.STRING},definition:{type:e.STRING},imageUrl:{type:e.STRING},altText:{type:e.STRING},hotspots:{type:e.ARRAY,items:{type:e.OBJECT,properties:{x:{type:e.NUMBER},y:{type:e.NUMBER},label:{type:e.STRING},details:{type:e.STRING}},required:["x","y","label","details"]}}},required:["type"]}},quick_check:{type:e.OBJECT,properties:{question:{type:e.STRING},options:{type:e.ARRAY,items:{type:e.STRING}},correct_answer:{type:e.STRING},explanation:{type:e.STRING}},required:["question","options","correct_answer","explanation"]},worked_examples:{type:e.ARRAY,items:{type:e.OBJECT,properties:{prompt:{type:e.STRING},solution:{type:e.STRING},why_it_works:{type:e.STRING}},required:["prompt","solution","why_it_works"]}},guided_practice:{type:e.ARRAY,items:{type:e.OBJECT,properties:{question:{type:e.STRING},hint:{type:e.STRING},stepwise_solution:{type:e.STRING}},required:["question","hint","stepwise_solution"]}},independent_practice:{type:e.ARRAY,items:{type:e.OBJECT,properties:{question:{type:e.STRING},answer_key:{type:e.STRING}},required:["question","answer_key"]}},HOTS:{type:e.ARRAY,items:{type:e.OBJECT,properties:{question:{type:e.STRING},exemplar_answer:{type:e.STRING}},required:["question","exemplar_answer"]}},common_errors_and_fixes:{type:e.ARRAY,items:{type:e.OBJECT,properties:{error:{type:e.STRING},fix:{type:e.STRING}},required:["error","fix"]}},fill_in_the_blanks:{type:e.ARRAY,items:{type:e.OBJECT,properties:{sentence_parts:{type:e.ARRAY,items:{type:e.STRING}},options:{type:e.ARRAY,items:{type:e.STRING}},correct_answer:{type:e.STRING}},required:["sentence_parts","options","correct_answer"]}},interactive_simulations:{type:e.ARRAY,items:{type:e.OBJECT,properties:{description:{type:e.STRING},concept_link:{type:e.STRING}},required:["description","concept_link"]}},interactive_videos:{type:e.ARRAY,items:y},real_world_applications:{type:e.ARRAY,items:{type:e.STRING}},matching_quizzes:{type:e.ARRAY,items:{type:e.OBJECT,properties:{instruction:{type:e.STRING},pairs:{type:e.ARRAY,items:{type:e.OBJECT,properties:{term:{type:e.STRING},definition:{type:e.STRING}},required:["term","definition"]}}},required:["instruction","pairs"]}}},required:["core_explanation","quick_check","worked_examples","guided_practice","independent_practice","HOTS","common_errors_and_fixes","fill_in_the_blanks","interactive_simulations","interactive_videos","real_world_applications","matching_quizzes"]},p=await i.models.generateContent({model:"gemini-2.5-pro",contents:m,config:{responseMimeType:"application/json",thinkingConfig:{thinkingBudget:32768},responseSchema:{type:e.OBJECT,properties:{student_explanation:f,assessment_blueprint:{type:e.OBJECT,properties:{question_pool:{type:e.ARRAY,items:N}},required:["question_pool"]},teacher_notes:{type:e.OBJECT,properties:{TLM_list:{type:e.ARRAY,items:{type:e.STRING}},differentiation:{type:e.ARRAY,items:{type:e.STRING}},remediation_plan:{type:e.ARRAY,items:{type:e.STRING}},safety_notes:{type:e.ARRAY,items:{type:e.STRING}}},required:["TLM_list","differentiation","remediation_plan"]}},required:["student_explanation","assessment_blueprint","teacher_notes"]}}});if(!p.text)throw new Error(`Gemini API returned no text for topic "${n}". This might be due to a safety filter.`);s==null||s({progress:95,message:"Finalizing lesson...",step:1,totalSteps:1});const S={...h(l(p)),topic_id:o,topic_name:n};(R=S==null?void 0:S.student_explanation)!=null&&R.interactive_videos&&S.student_explanation.interactive_videos.forEach(g=>{(!g.video_url||!g.video_url.startsWith("http"))&&(g.video_url="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")});try{await E("cache",a,JSON.stringify(S)),console.log(`Saved lesson pack to cache for topic: ${n}`)}catch(g){console.error("Could not write lesson pack to IndexedDB cache",g)}return s==null||s({progress:100,message:"Lesson ready!",step:1,totalSteps:1}),S},$=async t=>{const n=t.filter(i=>!i.is_correct);if(n.length===0)return[];d();const s=u(),a=`
      ROLE
      You are an expert adaptive learning tutor for a K-12 CBSE student. Your goal is to create a personalized remediation plan based on the student's incorrect answers.

      TASK
      Analyze the following list of questions the student answered incorrectly. For each distinct underlying concept that the student is struggling with, generate a "micro-lesson" to help them master it. Group questions by concept if they relate to the same topic.

      INCORRECTLY ANSWERED QUESTIONS:
      ${n.map(i=>`- ${i.question_text}`).join(`
`)}

      INSTRUCTIONS
      1.  **Identify Core Concepts**: Determine the fundamental academic concept(s) behind the incorrect answers.
      2.  **Generate Micro-Lessons**: For each concept, create a follow-up plan with the following four parts:
          - "concept": (string) The name of the concept.
          - "explanation": (string) A simple, clear, and concise re-explanation of the concept.
          - "practice_question": (object) A new, fundamental practice question to test the re-explained concept. This should be an "independent_practice" object with "question" and "answer_key".
          - "review_suggestion": (string) A suggestion to review a related, more fundamental topic if applicable.
      3.  **Format**: Return the output as a raw JSON array of these micro-lesson objects.
    `,r=await s.models.generateContent({model:"gemini-2.5-flash",contents:a,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.OBJECT,properties:{concept:{type:e.STRING},explanation:{type:e.STRING},practice_question:{type:e.OBJECT,properties:{question:{type:e.STRING},answer_key:{type:e.STRING}},required:["question","answer_key"]},review_suggestion:{type:e.STRING}},required:["concept","explanation","practice_question","review_suggestion"]}}}});return h(l(r))},j=async t=>{d();const n=u(),s=t.student_explanation.core_explanation.filter(r=>r.type==="paragraph"||r.type==="key_term").map(r=>r.type==="key_term"?`${r.term}: ${r.definition}`:r.type==="paragraph"?r.content:"").join(`
`),o=`
        Based on the following lesson content about "${t.topic_name}", generate an array of 5-7 high-quality flashcards.
        Each flashcard should have a "term" (a key concept or question) and a "definition" (a concise, clear explanation).
        Return a raw JSON array of objects.

        Content:
        ${s}
    `,a=await n.models.generateContent({model:"gemini-2.5-flash",contents:o,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.OBJECT,properties:{term:{type:e.STRING},definition:{type:e.STRING}},required:["term","definition"]}}}});return h(l(a))},Y=async(t,n,s,o,a)=>{d();const r=u(),c=`
        Generate a new, unique CBSE-aligned question for a Class ${t} ${n} student on the chapter "${s}".
        - Difficulty: ${o}
        - Type: 'MCQ' or 'SA'
        - Do NOT repeat any of these previous questions: ${a.join(", ")}
        - You MUST provide a 'bloom' level, 'competency' classification, and 'dok' (Depth of Knowledge) level for the question.
        - Return a single raw JSON object matching the QuestionPoolItem schema.
    `,i=await r.models.generateContent({model:"gemini-2.5-flash",contents:c,config:{responseMimeType:"application/json",responseSchema:N}});return h(l(i))},M=async t=>{d();const n=u(),s=`
        You are an expert CBSE tutor. Explain the following text to a K-12 student in simple, clear, and concise terms. 
        Use analogies and break it down step-by-step. All output must be plain text. Do not use any markdown.

        Text to explain: "${t}"
    `,o=await n.models.generateContent({model:"gemini-2.5-flash",contents:s});return l(o)},D=async t=>{d();const n=u(),s=`
        You are a distinguished professor and an expert CBSE tutor. Your task is to provide a "deep dive" explanation of the following text for a curious K-12 student. Go beyond a simple explanation.

        **CRITICAL INSTRUCTIONS**:
        1.  **First Principles**: Break down the concept to its fundamental principles.
        2.  **Detailed Analogies**: Use detailed, relatable analogies to explain complex parts.
        3.  **Connections**: Explain how this concept connects to other topics in the curriculum or real-world applications.
        4.  **Socratic Method**: Incorporate guiding questions throughout your explanation to encourage the student to think, rather than just passively reading. For example: "Now, what do you think would happen if...?", "Can you see how this relates to...?".
        5.  **Structure**: Structure your answer logically with clear sub-headings. The entire output must be plain text, using line breaks for structure. Do not use markdown.
        6.  **Depth**: This is a deep dive. Be comprehensive and thorough.

        **Text to explain**: "${t}"
    `,o=await n.models.generateContent({model:"gemini-2.5-pro",contents:s,config:{thinkingConfig:{thinkingBudget:32768}}});return l(o)},U=async(t,n,s)=>{d();const o=u(),a=`
      Evaluate the student's answer for a flashcard. The term is "${s}" and the correct definition is "${n}".
      The student's answer is: "${t}".
      Is the student's answer conceptually correct, even if not word-for-word?
      Provide brief, encouraging feedback.
      Return a raw JSON object: { "isCorrect": boolean, "feedback": "your feedback string" }
    `,r=await o.models.generateContent({model:"gemini-2.5-flash",contents:a,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{isCorrect:{type:e.BOOLEAN},feedback:{type:e.STRING}},required:["isCorrect","feedback"]}}});return h(l(r))},P=async(t,n)=>{d();const s=u(),o=`
        Generate a parental report for a student named ${t.name} (Class ${t.grade}).
        Progress data: ${JSON.stringify(n)}.
        - Write a brief, encouraging summary.
        - Identify 2-3 strengths based on completed chapters.
        - Identify 2-3 areas to focus on (started but not completed).
        - Provide 3 actionable, simple tips for parents to help their child.
        Return a raw JSON object matching the ParentalReport schema.
    `,a=await s.models.generateContent({model:"gemini-2.5-flash",contents:o,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{summary:{type:e.STRING},strengths:{type:e.ARRAY,items:{type:e.STRING}},focusAreas:{type:e.ARRAY,items:{type:e.STRING}},actionableTips:{type:e.ARRAY,items:{type:e.OBJECT,properties:{icon:{type:e.STRING},tip:{type:e.STRING}},required:["icon","tip"]}}},required:["summary","strengths","focusAreas","actionableTips"]}}});return h(l(a))},L=async(t,n)=>{d();const s=u(),{profile:o,dktData:a,assignments:r,submissions:c}=n,i=`
      ROLE: You are "MIGA for Parents", a helpful and clear AI assistant for the Alfanumrik learning platform.
      GOAL: Answer a parent's question about their child's academic progress by analyzing the provided data.

      CONTEXT:
      - Child's Name: ${o.name}
      - Child's Grade: ${o.grade}
      - Parent's Question: "${t}"
      - Child's Data: ${JSON.stringify({dktData:a,assignments:r,submissions:c},null,2)}

      CRITICAL INSTRUCTIONS:
      1.  **Data-Bound**: Your answer MUST be based exclusively on the provided 'Child's Data' JSON. Do not invent information or make assumptions.
      2.  **Simple Language**: Explain complex data in simple, non-technical terms. For example, instead of "DKT mastery is 0.68", say "Mastery in this topic is around 68%, which means there's room for improvement."
      3.  **Positive & Supportive Tone**: Always be encouraging. Frame challenges as opportunities for growth.
      4.  **Directly Answer the Question**: Analyze the data to directly address the parent's query.
      5.  **Be Honest if Data is Missing**: If the question cannot be answered from the provided data, politely state that, e.g., "I don't have information on that specific test, but I can tell you about their overall progress in Science."
      6.  **Plain Text Output**: Your entire response must be plain text. Do not use markdown.
    `,m=await s.models.generateContent({model:"gemini-2.5-pro",contents:i,config:{thinkingConfig:{thinkingBudget:32768}}});return l(m)},F=async(t,n)=>{d();const s=u(),o=`
        Explain the concept of "${t}" as if you were an interactive simulation.
        The simulation is described as: "${n}".
        Break down the explanation into interactive steps. All output must be plain text. Do not use any markdown.
        For example: "Step 1: Observe the particles... What happens when you increase the temperature? Now, try decreasing it..."
    `,a=await s.models.generateContent({model:"gemini-2.5-flash",contents:o});return l(a)},z=async(t,n,s,o)=>{d();const a=u(),r=`
      You are an expert CBSE examiner. Your task is to grade a student's written answer with nuance, allowing for partial credit.

      **CRITICAL INSTRUCTIONS**:
      1.  **Analyze Point-by-Point**: Carefully compare the student's answer against each point in the provided marking rubric.
      2.  **Award Partial Credit**: Based on the total marks available for the question, award marks for each correct point the student has mentioned. If a student gets some parts right but misses others, they should receive partial credit.
      3.  **Provide Detailed Feedback**: Your feedback must explain *why* a certain score was given. Mention what the student did correctly and what they missed, referencing the rubric.
      4.  **Strict JSON Output**: Your final output must be a raw JSON object with two keys:
          - "awardedMarks": (number) The total marks awarded, which can be a whole number from 0 to ${s}.
          - "feedback": (string) Your detailed, point-by-point explanation for the score.

      **GRADING TASK**:
      - **Question**: "${t}"
      - **Marking Rubric**: "${n}"
      - **Total Marks Available**: ${s}
      - **Student's Answer**: "${o}"
    `,c=await a.models.generateContent({model:"gemini-2.5-pro",contents:r,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{awardedMarks:{type:e.NUMBER},feedback:{type:e.STRING}},required:["awardedMarks","feedback"]}}});return h(l(c))},K=async(t,n)=>{d();const s=u(),o=await O(n),a={inlineData:{mimeType:n.type,data:o}},r={text:`
        You are a CBSE examiner conducting a viva voce (oral exam).
        - Question: "${t.question}"
        - Rubric for full marks: "${t.rubric}"
        - Total Marks Available: ${t.marks}

        The student's verbal answer is in the provided audio. Your task is to:
        1. Transcribe the student's complete answer.
        2. Evaluate their verbal explanation against the rubric.
        3. Award marks from 0 to ${t.marks}, allowing for partial credit.
        4. Provide brief, constructive feedback on their explanation.
        
        Return a single, raw JSON object with the following structure: { "transcript": string, "awardedMarks": number, "feedback": string }
    `},c=await s.models.generateContent({model:"gemini-2.5-pro",contents:{parts:[r,a]},config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{transcript:{type:e.STRING},awardedMarks:{type:e.NUMBER},feedback:{type:e.STRING}},required:["transcript","awardedMarks","feedback"]}}});return h(l(c))},Q=async t=>{d();const n=u(),s=`Explain this snippet in simpler terms for a K-12 student: "${t}"`,o=await n.models.generateContent({model:"gemini-2.5-flash",contents:s});return l(o)},W=async(t,n,s)=>{d();const o=u(),r="options"in n&&Array.isArray(n.options)?`
      This was a multiple-choice question.
      - Options: ${JSON.stringify(n.options)}
      - Correct Answer: "${"correct_answer"in n?n.correct_answer:n.answer}"
      - Analyze the student's incorrect choice ("${s}"). What specific misconception does this choice likely reveal? Tailor your explanation to directly address this misconception before re-explaining the core concept.
    `:"",c=`
        A student answered a question about "${t}" incorrectly.
        - Question: "${n.question}"
        - Student's incorrect answer: "${s}"
        ${r}
        
        Generate a micro-remediation plan. This must include:
        1. A concise "explanation" (as an array of StructuredContent, e.g., paragraph or list) of the core concept the student missed.
        2. A new, simple "quick_check" question (as a QuickCheck object) to verify their understanding of the re-explanation.
        Return a single raw JSON object: { "explanation": [...], "quick_check": {...} }
    `,i=await o.models.generateContent({model:"gemini-2.5-flash",contents:c,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{explanation:{type:e.ARRAY,items:{type:e.OBJECT,properties:{type:{type:e.STRING},level:{type:e.NUMBER},content:{type:e.STRING},items:{type:e.ARRAY,items:{type:e.STRING}},term:{type:e.STRING},definition:{type:e.STRING}},required:["type"]}},quick_check:{type:e.OBJECT,properties:{question:{type:e.STRING},options:{type:e.ARRAY,items:{type:e.STRING}},correct_answer:{type:e.STRING},explanation:{type:e.STRING}},required:["question","options","correct_answer","explanation"]}},required:["explanation","quick_check"]}}});return h(l(i))},H=async(t,n,s,o,a,r,c)=>{d();const i=u(),m=`
        Generate a single, high-quality, CBSE-aligned competency-based question.
        - Grade: ${t}, Subject: ${n}, Chapter: ${s}, Topic: ${c}
        - Type: ${o}, Competency: "${a}", DOK Level: ${r}
        - The question must be original and not a simple recall of facts. It should require application or analysis.
        - For MCQs, provide a 'distractor_rationale'.
        - For Case questions, provide a 'source_passage' and 'sub_questions'.
        - Return a single raw JSON object matching the QuestionPoolItem schema. Ensure q_id is a unique string like 'gen-[timestamp]'.
    `,y=await i.models.generateContent({model:"gemini-2.5-pro",contents:m,config:{responseMimeType:"application/json",responseSchema:N}});return h(l(y))},X=async t=>{d();const n=u(),s=`
        Based on these SAFAL diagnostic results, identify the top 2-3 competencies where students are struggling most (rated 'low').
        For each of these competencies, create a remediation group.
        - List the names of the students in the group.
        - Suggest a simple, actionable remediation task for the teacher to conduct.
        - Return a raw JSON array of RemediationGroup objects.

        Results: ${JSON.stringify(t)}
    `,o=await n.models.generateContent({model:"gemini-2.5-flash",contents:s,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.OBJECT,properties:{competency:{type:e.STRING},students:{type:e.ARRAY,items:{type:e.STRING}},suggestedTask:{type:e.STRING}},required:["competency","students","suggestedTask"]}}}});return h(l(o))},V=async(t,n)=>{d();const s=u(),o=`
        Analyze the results of this quick formative assessment (exit ticket).
        - Assessment: ${JSON.stringify(t)}
        - Results: ${JSON.stringify(n)}
        Identify the question(s) most students answered incorrectly. For each of these, create a remediation group.
        - The 'competency' should be the question text.
        - List the names of students who got it wrong.
        - Suggest a simple remediation task for the teacher to perform in the next class.
        Return a raw JSON array of RemediationGroup objects.
    `,a=await s.models.generateContent({model:"gemini-2.5-pro",contents:o,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.OBJECT,properties:{competency:{type:e.STRING},students:{type:e.ARRAY,items:{type:e.STRING}},suggestedTask:{type:e.STRING}},required:["competency","students","suggestedTask"]}}}});return h(l(a))},Z=async t=>{d();const n=u(),s=`
        Generate a simple, one-page facility rental agreement template based on this booking information:
        - Facility: ${t.facility}
        - Rented by: ${t.bookedBy}
        - Date: ${t.date}, from ${t.startTime} to ${t.endTime}
        - Purpose: ${t.purpose}
        Include standard clauses for payment, damages, cancellation, and responsibilities. Keep it clear and concise.
    `,o=await n.models.generateContent({model:"gemini-2.5-flash",contents:s});return l(o)},ee=async(t,n)=>{d();const s=u(),o=`
        Write a concise, encouraging summary and recommendation for a student's report card.
        - Student: ${t.name}, Class ${t.grade}
        - Context: ${n}
        Keep the tone positive. Highlight strengths and suggest 1-2 concrete areas for improvement. The output should be a single paragraph.
    `,a=await s.models.generateContent({model:"gemini-2.5-flash",contents:o});return l(a)},te=async(t,n,s,o)=>{d();const a=u(),r=o&&o.length>0?`- The questions must ONLY cover topics from the following chapters: ${o.join(", ")}.`:"- The questions must be relevant to the subject and grade level.",c=`
      Generate a practice exam paper for a Class ${t} ${n} student.
      Adhere strictly to this blueprint: ${JSON.stringify(s.structure)}.
      - The questions must be original and distinct.
      ${r}
      - For each question, create a valid QuestionPoolItem object, including 'bloom', 'competency', and 'dok' levels.
      Return a single raw JSON array of these QuestionPoolItem objects, containing exactly the number of questions specified in the blueprint.
    `,i=await a.models.generateContent({model:"gemini-2.5-pro",contents:c,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:N}}});return h(l(i))},ne=async t=>{d();const n=u(),s=t.map(r=>({question:r.question.question,isCorrect:r.isCorrect,marksAwarded:r.marksAwarded,totalMarks:r.question.marks})),o=`
      Based on these practice exam results, provide a brief, encouraging performance summary for the student.
      - Acknowledge their score, especially where partial credit was given.
      - Identify 1-2 topics they did well on.
      - Identify 1-2 topics they should review based on incorrect answers or where they lost marks.
      - Keep it concise (2-3 sentences).
      Results: ${JSON.stringify(s)}
    `,a=await n.models.generateContent({model:"gemini-2.5-flash",contents:o});return l(a)},se=async(t,n)=>{d();const s=u(),o=`
        Generate a single, creative cross-curricular project idea that integrates AI concepts with ${n} for a Class ${t} student.
        - The project should be simple and achievable with basic tools.
        - Provide a title, description, 2-3 learning objectives, and 2-3 high-level tasks.
        - Return a single raw JSON object matching the CrossCurricularProject schema (omitting 'id' and 'evidence').
    `,a=await s.models.generateContent({model:"gemini-2.5-flash",contents:o,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{title:{type:e.STRING},subject:{type:e.STRING},grade:{type:e.STRING},description:{type:e.STRING},objectives:{type:e.ARRAY,items:{type:e.STRING}},tasks:{type:e.ARRAY,items:{type:e.STRING}}},required:["title","subject","grade","description","objectives","tasks"]}}});return h(l(a))},oe=async(t,n)=>{d();const s=u(),o={inlineData:{mimeType:"image/png",data:t}},a={text:`
        Analyze the student's handwritten work in this image for the question: "${n}".
        Identify the first potential mistake or the next logical step.
        Provide a short, Socratic hint to guide the student on that specific step. Do not solve the problem or give away the answer.
        Your hint should be one or two sentences. For example: "Good start! Have you double-checked the sign when you moved the term across the equals sign?"
    `},r=await s.models.generateContent({model:"gemini-2.5-pro",contents:{parts:[o,a]}});return l(r)},ae=async(t,n)=>{d();const s=u(),o={inlineData:{mimeType:"image/png",data:t}},a={text:`
        Analyze the student's handwritten work in this image for the question: "${n}".
        Identify the primary type of error made. Classify the error into one of the following categories:
        - "calculation_error": A mistake in arithmetic.
        - "sign_error": An incorrect plus or minus sign.
        - "transposition_error": A mistake in moving terms across an equals sign.
        - "formula_error": Used the wrong formula or applied it incorrectly.
        - "conceptual_error": A fundamental misunderstanding of the concept.
        - "unknown": If the work is too messy or the error type is unclear.
        Return a single raw JSON object: { "errorType": "your_classification" }
    `},r=await s.models.generateContent({model:"gemini-2.5-pro",contents:{parts:[o,a]},config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{errorType:{type:e.STRING}},required:["errorType"]}}});return h(l(r)).errorType||"unknown"},re=async(t,n,s,o)=>{d();const a=u(),r=t.map(({id:p,name:T})=>({id:p,name:T})),c=Object.entries(n).reduce((p,[T,S])=>(p[Number(T)]=Object.entries(S).reduce((R,[g,w])=>(R[g]={mastery:w.mastery},R),{}),p),{}),i=s.map(({id:p,title:T})=>({id:p,title:T})),m=o.map(({studentId:p,assignmentId:T,score:S})=>({studentId:p,assignmentId:T,score:S})),y=`
      ROLE: You are an experienced Head of Department analyzing the weekly performance data for a class.
      
      TASK: Analyze the following JSON data. Your goal is to identify trends, pinpoint struggling students, and suggest a concrete remedial action for the teacher.

      DATA:
      ${JSON.stringify({students:r,masteryData:c,assignments:i,submissions:m},null,2)}
      
      INSTRUCTIONS:
      1.  **Identify the top 2-3 most challenging concepts for the class as a whole**. A "concept" can be inferred from the skillId in the masteryData (e.g., a skillId of 'G10-Science-Chemical Reactions and Equations' refers to that chapter/concept). Low mastery scores (below 0.6) indicate a challenge.
      2.  **Pinpoint 2-3 specific students who are falling behind**, referencing their low mastery scores on specific topics or consistently low assignment scores.
      3.  **Generate a concise, 3-paragraph narrative summary of these findings**. The first paragraph should cover class-wide trends. The second should discuss individual student challenges. The third should be an encouraging conclusion.
      4.  **Suggest a concrete, actionable 15-minute remedial activity the teacher can conduct to address the main issue identified**.
      5.  **The entire output MUST be plain text**. Do not use any markdown formatting or JSON.
    `,f=await a.models.generateContent({model:"gemini-2.5-pro",contents:y,config:{thinkingConfig:{thinkingBudget:32768}}});return l(f)},ie=async(t,n,s,o,a)=>{var T;d();const r=u(),c=(T=C[t])==null?void 0:T[n];if(!c)throw new Error(`Syllabus not found for Grade ${t}, Subject ${n}`);const i={},m={};Object.values(a).forEach(S=>{Object.entries(S).forEach(([R,g])=>{if(R.startsWith(`G${t}-${n}`)){const w=R.split("-").slice(2).join("-");i[w]=(i[w]||0)+g.mastery,m[w]=(m[w]||0)+1}})}),Object.keys(i).forEach(S=>{i[S]/=m[S]});const y=`
        ROLE: You are an expert CBSE curriculum designer and data analyst.
        GOAL: Generate a data-driven syllabus blueprint and a pacing calendar for an academic year.
        
        CONTEXT:
        - Grade: ${t}
        - Subject: ${n}
        - Total Annual Teaching Hours: ${s}
        - Approx. Exam Dates: Term 1 around ${o.term1}, Term 2/Boards around ${o.term2}.
        - Base CBSE Syllabus: ${JSON.stringify(c,null,2)}
        - Historical Performance Data (average mastery on topics from previous years): ${JSON.stringify(i,null,2)}

        INSTRUCTIONS:
        1.  Use the provided 'Base CBSE Syllabus' as the source of truth for all topics, learning outcomes, etc.
        2.  For each chapter/topic, generate a 'data_driven_rationale'. If historical data shows low mastery for a topic, recommend allocating more time for reinforcement. If a topic is a prerequisite for many others, note its importance.
        3.  Allocate the ${s} total teaching hours across all units and chapters. This is the 'allocated_hours' field. Topics with lower historical mastery or higher complexity/weightage should receive more hours. The sum of 'allocated_hours' for all chapters should approximate the total for their parent unit.
        4.  Create a week-by-week 'pacing calendar' for the academic year (assume a 36-week year starting in April). Schedule teaching based on your allocated hours, plus add assessments before exam dates, remediation cycles after assessments, and buffer weeks.
        5.  Your output must be a single raw JSON object with two keys: "blueprint" (an array of SyllabusBlueprintUnit objects, mirroring the base syllabus structure but with the added 'allocated_hours' and 'data_driven_rationale' fields) and "calendar" (an array of PacingCalendarEvent objects).
    `,f={type:e.OBJECT,properties:{blueprint:{type:e.ARRAY,items:{type:e.OBJECT,properties:{unit_no:{type:e.NUMBER},unit_name:{type:e.STRING},weightage_marks:{type:e.NUMBER},allocated_hours:{type:e.NUMBER},chapters_or_topics:{type:e.ARRAY,items:{type:e.OBJECT,properties:{topic_id:{type:e.STRING},topic_name:{type:e.STRING},learning_outcomes:{type:e.ARRAY,items:{type:e.STRING}},bloom_levels:{type:e.ARRAY,items:{type:e.STRING}},prerequisites:{type:e.ARRAY,items:{type:e.STRING}},common_misconceptions:{type:e.ARRAY,items:{type:e.STRING}},cross_links:{type:e.ARRAY,items:{type:e.STRING}},estimated_time_mins:{type:e.NUMBER},marking_scheme_mapping:{type:e.OBJECT,properties:{K:{type:e.NUMBER},U:{type:e.NUMBER},A:{type:e.NUMBER},HOTS:{type:e.NUMBER}}},allocated_hours:{type:e.NUMBER},data_driven_rationale:{type:e.STRING}},required:["topic_id","topic_name","learning_outcomes","bloom_levels","prerequisites","common_misconceptions","cross_links","estimated_time_mins","marking_scheme_mapping","allocated_hours","data_driven_rationale"]}}},required:["unit_no","unit_name","weightage_marks","allocated_hours","chapters_or_topics"]}},calendar:{type:e.ARRAY,items:{type:e.OBJECT,properties:{week:{type:e.NUMBER},start_date:{type:e.STRING},activity_type:{type:e.STRING},details:{type:e.STRING}},required:["week","start_date","activity_type","details"]}}},required:["blueprint","calendar"]},p=await r.models.generateContent({model:"gemini-2.5-pro",contents:y,config:{responseMimeType:"application/json",responseSchema:f,thinkingConfig:{thinkingBudget:32768}}});return h(l(p))},ce=async(t,n)=>{d();const s=u(),o=`
      ROLE: You are a special education expert and master teacher for the CBSE curriculum.
      GOAL: Generate a targeted, personalized remediation pack for a student who is struggling with a specific concept.

      CONTEXT:
      - Student Name: ${t}
      - Struggling Concept: "${n}"

      INSTRUCTIONS:
      1.  **Re-explanation**: Create a fresh, simple re-explanation of the concept. Use a different analogy or approach than a standard textbook. Format this as an array of 'StructuredContent' blocks (e.g., a paragraph and a list).
      2.  **Worked Example**: Provide one clear, step-by-step 'WorkedExample' that directly illustrates the re-explained concept.
      3.  **Scaffolded Practice**: Create an array of 2 'QuestionPoolItem' objects for practice. The questions should be scaffolded, starting very simple ('E' difficulty) and then a medium one. They must be directly related to the concept and include 'bloom', 'competency', and 'dok' fields.
      4.  **JSON Output**: Return a single, raw JSON object matching the 'RemediationPack' schema.

      OUTPUT FORMAT: A single raw JSON object.
    `,a={type:e.OBJECT,properties:{prompt:{type:e.STRING},solution:{type:e.STRING},why_it_works:{type:e.STRING}},required:["prompt","solution","why_it_works"]},r={type:e.OBJECT,properties:{type:{type:e.STRING},level:{type:e.NUMBER},content:{type:e.STRING},items:{type:e.ARRAY,items:{type:e.STRING}},term:{type:e.STRING},definition:{type:e.STRING}},required:["type"]},c=await s.models.generateContent({model:"gemini-2.5-pro",contents:o,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{concept:{type:e.STRING},re_explanation:{type:e.ARRAY,items:r},worked_example:a,scaffolded_practice:{type:e.ARRAY,items:N}},required:["concept","re_explanation","worked_example","scaffolded_practice"]}}});return h(l(c))},pe=async(t,n,s,o)=>{d();const a=u(),r=Object.entries(n).reduce((y,[f,p])=>(p.mastery<.9&&(y[f.split("-").slice(2).join(" ")]=`${Math.round(p.mastery*100)}%`),y),{}),c=`
      ROLE: You are an experienced academic counselor and senior teacher preparing for a Parent-Teacher Meeting (PTM).
      GOAL: Analyze the provided student data and generate a structured, professional, and actionable briefing document.

      CONTEXT:
      - Student Name: ${t.name}
      - Grade: ${t.grade}
      - Student Data: ${JSON.stringify({mastery:r,assignments:s,submissions:o},null,2)}

      CRITICAL INSTRUCTIONS:
      1.  **Synthesize Data**: Do not just list the data. Synthesize it into meaningful insights. For example, connect low mastery in a topic to a low score on a related assignment.
      2.  **Balanced Tone**: Be balanced, positive, and constructive. Start with strengths before discussing areas for focus.
      3.  **Actionable Talking Points**: The 'suggestedTalkingPoints' should be phrased as questions or statements to guide the conversation with the parent (e.g., "Let's discuss strategies to improve focus on 'Topic X' at home.").
      4.  **Behavioral Insights**: Infer behavioral patterns from the data, such as submission timeliness. If all submissions are on time, that's a positive behavioral observation.
      5.  **Strict JSON Output**: Your output must be a single, raw JSON object matching the 'PtmBrief' schema.

      OUTPUT FORMAT: A single raw JSON object.
    `,i={type:e.OBJECT,properties:{summary:{type:e.STRING},strengths:{type:e.ARRAY,items:{type:e.STRING}},focusAreas:{type:e.ARRAY,items:{type:e.STRING}},behavioralObservations:{type:e.ARRAY,items:{type:e.STRING}},suggestedTalkingPoints:{type:e.ARRAY,items:{type:e.STRING}},closingRemark:{type:e.STRING}},required:["summary","strengths","focusAreas","behavioralObservations","suggestedTalkingPoints","closingRemark"]},m=await a.models.generateContent({model:"gemini-2.5-pro",contents:c,config:{responseMimeType:"application/json",responseSchema:i,thinkingConfig:{thinkingBudget:32768}}});return h(l(m))},le=async(t,n,s,o)=>{d();const a=u(),r=s.map(y=>{const f=o.find(p=>p.id===y.studentId);return{studentId:y.studentId,studentName:(f==null?void 0:f.name)||"Unknown",infractions:y.infractions,answers:y.answers}}),c=`
        ROLE: You are an AI Proctoring Analyst. Your job is to analyze exam submission data to identify potential academic integrity issues in a neutral, data-driven way. Do NOT make definitive accusations.

        TASK: Analyze the following exam data and generate a proctoring report.

        CONTEXT:
        - Exam: "${t.name}"
        - Questions: ${JSON.stringify(n.map(y=>({q_id:y.q_id,question:y.question,type:y.type})))}
        - Submissions: ${JSON.stringify(r)}

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
    `,i={type:e.OBJECT,properties:{summary:{type:e.STRING},suspiciousClusters:{type:e.ARRAY,items:{type:e.OBJECT,properties:{studentIds:{type:e.ARRAY,items:{type:e.NUMBER}},reason:{type:e.STRING},questions:{type:e.ARRAY,items:{type:e.STRING}}},required:["studentIds","reason","questions"]}},highInfractionStudents:{type:e.ARRAY,items:{type:e.OBJECT,properties:{studentId:{type:e.NUMBER},count:{type:e.NUMBER}},required:["studentId","count"]}}},required:["summary","suspiciousClusters","highInfractionStudents"]},m=await a.models.generateContent({model:"gemini-2.5-pro",contents:c,config:{responseMimeType:"application/json",responseSchema:i,thinkingConfig:{thinkingBudget:32768}}});return h(l(m))},de=async(t,n,s,o)=>{d();const a=u(),r=new Date,c=Object.entries(n).filter(([,p])=>p.mastery<.7).sort(([,p],[,T])=>p.mastery-T.mastery).slice(0,5).map(([p,T])=>({skillId:p,mastery:T.mastery})),i=Object.values(s).flat().filter(p=>new Date(p.srsData.due)<=r).length,m=o.filter(p=>p.classGrade===t.grade&&new Date(p.dueDate)>=r).map(p=>({title:p.title,dueDate:p.dueDate,id:p.id})),y=`
        ROLE: You are an expert academic coach for a CBSE student.
        GOAL: Create a balanced, prioritized, and actionable 7-day study plan.

        CONTEXT:
        - Student: ${t.name}, Class ${t.grade}
        - Today's Date: ${r.toISOString().split("T")[0]}
        - Weakest Topics (from DKT): ${JSON.stringify(c)}
        - Overdue Spaced Repetition (SRS) Flashcards: ${i}
        - Upcoming Assignments: ${JSON.stringify(m)}

        CRITICAL INSTRUCTIONS:
        1.  **Prioritize**: Assignments due soonest are highest priority. Then, address the weakest topics. Then schedule SRS reviews.
        2.  **Balance**: Distribute tasks across 7 days, starting from today. Avoid overloading any single day.
        3.  **Actionable Tasks**: Create tasks with a clear type ('assignment', 'review_weakness', 'srs_review').
        4.  **Structure**: For each task, create a JSON object with: id, type, title, subtitle, dueDate, and data (e.g., chapterId, assignmentId).
        5.  **Output**: Return a single raw JSON array of these StudyTask objects.
    `,f=await a.models.generateContent({model:"gemini-2.5-pro",contents:y,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.OBJECT,properties:{id:{type:e.STRING},type:{type:e.STRING},title:{type:e.STRING},subtitle:{type:e.STRING},dueDate:{type:e.STRING},data:{type:e.OBJECT,properties:{chapterId:{type:e.STRING},assignmentId:{type:e.STRING}}}},required:["id","type","title","subtitle","dueDate"]}},thinkingConfig:{thinkingBudget:32768}}});return h(l(f))},ue=async t=>{d();const n=u(),s=`
      ROLE: You are a transport logistics and efficiency expert for a school.
      TASK: Analyze the following bus route data and provide 2-3 concrete, actionable optimization tips.
      
      DATA:
      ${JSON.stringify(t,null,2)}
      
      INSTRUCTIONS:
      1.  Focus on identifying inefficiencies like frequent delays, low occupancy, or routes that could be combined.
      2.  Suggestions should be specific. For example, instead of "Improve delayed routes", say "Route B is frequently delayed. Analyze traffic patterns between 3 PM - 4 PM to identify bottlenecks."
      3.  Keep tips concise and easy to understand for a school administrator.
      
      OUTPUT: A raw JSON array of strings, where each string is an optimization tip.
    `,o=await n.models.generateContent({model:"gemini-2.5-flash",contents:s,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.STRING}}}});return h(l(o))};export{de as A,M as B,ce as C,pe as D,X as E,se as F,z as a,ae as b,$ as c,D as d,W as e,Q as f,K as g,J as h,j as i,L as j,P as k,U as l,F as m,re as n,ee as o,H as p,V as q,ue as r,Z as s,oe as t,ie as u,le as v,B as w,te as x,ne as y,Y as z};
