import{G as P,T as e,h as U,i as F,r as _}from"./env-CBp54zJ0.js";import{c as L}from"./syllabus-DftkSEae.js";const z=t=>new Promise((n,r)=>{const a=new FileReader;a.readAsDataURL(t),a.onload=()=>{const o=a.result.split(",")[1];o?n(o):r(new Error("Failed to read Base64 string from blob."))},a.onerror=o=>r(o)}),Q="AlfanumrikDB",K=["cache","fineTuningData"],W=2;let C=null;const O=()=>C||(C=new Promise((t,n)=>{const r=indexedDB.open(Q,W);r.onupgradeneeded=a=>{const o=r.result;a.oldVersion,K.forEach(s=>{o.objectStoreNames.contains(s)||(s==="fineTuningData"?o.createObjectStore(s,{keyPath:"id"}):o.createObjectStore(s))})},r.onsuccess=()=>{t(r.result)},r.onerror=()=>{console.error("IndexedDB error:",r.error),n(r.error)}}),C),H=async(t,n)=>{const r=await O();return new Promise((a,o)=>{const c=r.transaction(t,"readonly").objectStore(t).get(n);c.onsuccess=()=>{a(c.result)},c.onerror=()=>{console.error("IndexedDB get error:",c.error),o(c.error)}})},V=async(t,n,r)=>{const a=await O();return new Promise((o,s)=>{const i=a.transaction(t,"readwrite").objectStore(t).put(r,n);i.onsuccess=()=>{o()},i.onerror=()=>{console.error("IndexedDB set error:",i.error),s(i.error)}})},oe=async(t,n)=>{const r=await O();return new Promise((a,o)=>{const c=r.transaction(t,"readwrite").objectStore(t).add(n);c.onsuccess=()=>{a()},c.onerror=()=>{console.error("IndexedDB add error:",c.error),o(c.error)}})};function h(t){let n=t;const r=t.match(/```json\n([\s\S]*?)\n```/s);r&&r[1]&&(n=r[1]);const a=n.indexOf("{"),o=n.indexOf("[");let s=-1;if(a===-1?s=o:o===-1?s=a:s=Math.min(a,o),s===-1)try{return JSON.parse(t)}catch{throw new Error("No JSON object or array found in the response.")}const l=n.lastIndexOf("}"),c=n.lastIndexOf("]");let i=-1;if(n.charAt(s)==="{"?i=l:i=c,i===-1||i<s)throw new Error("Unterminated JSON object or array in response.");n=n.substring(s,i+1);try{const m=n.replace(/\\n/g,"\\\\n").replace(/\n/g,"\\n");return JSON.parse(m)}catch{try{return JSON.parse(n)}catch(p){throw console.error("Failed to parse extracted JSON:",p),console.error("Original text:",t),console.error("Extracted string:",n),new Error("Failed to parse JSON from AI response after extraction.")}}}const d=()=>new P({apiKey:_()}),E="[Gemini]",y=!U()&&F(),g=(t,n)=>{console.info(`${E} ${t}: ${n}`)},f=(t,n)=>{console.error(`${E} ${t} failed`,n)},x=t=>`${t}-${Math.random().toString(36).slice(2,8)}`,A=(t={})=>({q_id:t.q_id??x("mock-q"),type:t.type??"MCQ",marks:t.marks??1,difficulty:t.difficulty??"E",bloom:t.bloom??"Remember",question:t.question??"This is a mock question generated in mock mode.",options:t.options??["Option A","Option B","Option C","Option D"],answer:t.answer??"Option A",rubric:t.rubric??"Award full marks for Option A.",competency:t.competency??"Demonstrate Knowledge",dok:t.dok??1,distractor_rationale:t.distractor_rationale,source:t.source,source_passage:t.source_passage,sub_questions:t.sub_questions,tags:t.tags,imageUrl:t.imageUrl,requiresDrawing:t.requiresDrawing,status:t.status}),q=t=>({question:`Quick check: What is one key idea about ${t}?`,options:["It is important","It is irrelevant"],correct_answer:"It is important",explanation:`In mock mode, remember that ${t} is important.`}),G=t=>({type:"paragraph",content:t}),M=(t,n)=>({topic_id:t?`${t.topic_id}|${n}`:`mock-${n.toLowerCase().replace(/\s+/g,"-")}`,topic_name:n,student_explanation:{core_explanation:[{type:"heading",level:2,content:n},G(`This is a mock explanation for ${n}. Use it for development or testing.`),{type:"list",items:[`Key fact about ${n}`,`Another point about ${n}`]}],quick_check:q(n),worked_examples:[{prompt:`Example problem related to ${n}.`,solution:"Demonstrate the key steps in mock mode.",why_it_works:"Because this is a simulated environment."}],guided_practice:[{question:`Try solving a simple scenario for ${n}.`,hint:"Focus on the main idea presented above.",stepwise_solution:"Step 1: Identify the concept. Step 2: Apply it in a simple way."}],independent_practice:[{question:`Practice question for ${n}.`,answer_key:"Refer back to the mock explanation."}],HOTS:[{question:`How could ${n} be used in the real world?`,exemplar_answer:`Consider the implications of ${n} in everyday scenarios.`}],common_errors_and_fixes:[{error:`Ignoring the definition of ${n}.`,fix:"Revisit the key explanation provided and connect it to examples."}],fill_in_the_blanks:[{sentence_parts:[`${n} helps students`,"understand ___ concepts"],options:["core","unrelated"],correct_answer:"core"}],interactive_simulations:[{description:`Imagine an interactive simulation that demonstrates ${n}.`,concept_link:`simulation-${n.toLowerCase()}`}],interactive_videos:[{title:`Mock video for ${n}`,video_url:"https://example.com/mock-video.mp4",script:[{timestamp:5,question_text:`What is a takeaway about ${n}?`,options:["Option A","Option B"],correct_answer:"Option A",feedback_correct:"Correct! You understood the mock concept.",feedback_incorrect:"Review the mock explanation once more."}]}],real_world_applications:[`In real usage, ${n} would connect to authentic examples.`],matching_quizzes:[{instruction:"Match the term to its mock definition.",pairs:[{term:`${n} Term`,definition:`A mock description to explain ${n}.`}]}]},assessment_blueprint:{question_pool:[A({question:`Assessment question that reinforces ${n}.`})]},teacher_notes:{TLM_list:[`Display charts or props representing ${n}.`],differentiation:["Offer concrete examples before abstractions."],remediation_plan:["Review the basics and allow for additional practice."],safety_notes:["No safety considerations in mock mode."]}}),X=t=>{if(t.length===0)return[];const n=t[0].question_text||"the concept";return[{concept:`Understanding ${n}`,explanation:`This mock explanation revisits the core ideas behind ${n}.`,practice_question:{question:`Try explaining ${n} in your own words.`,answer_key:"Student should highlight the main steps or ideas mentioned earlier."},review_suggestion:"Review the key notes and worked examples provided in the mock lesson."}]},Z=t=>[{term:`${t} - Core Idea`,definition:`This mock flashcard highlights the main point about ${t}.`},{term:`${t} - Example`,definition:`Provide a simple example that illustrates ${t}.`},{term:`${t} - Remember`,definition:`Remember to connect ${t} to prior knowledge.`}],v=t=>[{competency:t,students:["Student A","Student B"],suggestedTask:`Facilitate a brief mock discussion to revisit ${t}.`}],ee=t=>({summary:`This is a mock summary for ${t}.`,strengths:["Engages well during lessons","Shows curiosity in mock mode"],focusAreas:["Review foundational concepts regularly"],actionableTips:[{icon:"BookIcon",tip:"Set aside 15 minutes daily to review notes."},{icon:"WandIcon",tip:"Ask the student to explain a concept aloud."}]}),te=t=>`Mock insight responding to: "${t}". Encourage balanced routines and consistent study habits.`,$=t=>({concept:t,re_explanation:[G(`This mock explanation revisits the essentials of ${t}.`)],worked_example:{prompt:`Worked example for ${t}.`,solution:"Demonstrate the method in a few clear steps.",why_it_works:"Because it reinforces the key relationships in the concept."},scaffolded_practice:[A({question:`Entry-level practice on ${t}.`,difficulty:"E"}),A({question:`Follow-up practice on ${t}.`,difficulty:"M"})]}),B=(t,n)=>({blueprint:[{unit_no:1,unit_name:`Mock Unit for ${n}`,weightage_marks:20,allocated_hours:10,chapters_or_topics:[{topic_id:`G${t}-${n}-U1T1`,topic_name:`${n} Topic 1`,learning_outcomes:["Understand the basics in mock mode."],bloom_levels:["Remember"],prerequisites:[],common_misconceptions:["Assuming mock data behaves like production data."],cross_links:[],estimated_time_mins:60,marking_scheme_mapping:{K:5,U:5,A:5,HOTS:5},allocated_hours:5,data_driven_rationale:"Allocated to ensure development environments remain functional."}]}],calendar:[{week:1,start_date:"2025-04-01",activity_type:"Teaching",details:`Introduce mock overview for ${n}.`}]}),J=t=>({summary:`Mock briefing for ${t}.`,strengths:["Shows consistency in mock assessments"],focusAreas:["Continue practicing retrieval techniques"],behavioralObservations:["Participates positively in mock activities"],suggestedTalkingPoints:[`Discuss how ${t} can apply strategies from mock sessions.`],closingRemark:"Looking forward to continued growth in the live environment."}),j=()=>({summary:"Mock proctoring report with no suspicious activity detected.",suspiciousClusters:[],highInfractionStudents:[]}),D=t=>[{id:x("mock-task"),type:"next_lesson",title:"Review the mock lesson",subtitle:"15 minutes",dueDate:new Date().toISOString().split("T")[0],data:{}}],Y=(t,n)=>({id:x("mock-project"),title:`Mock ${n} Project`,subject:n,grade:t,description:"This is a mock cross-curricular project idea generated in development mode.",objectives:["Encourage creative thinking","Connect multiple disciplines"],tasks:["Brainstorm mock ideas","Prepare a simple presentation"],evidence:"Collect reflections from the mock activity."}),ne=()=>({structuredSyllabus:[{unit_no:1,unit_name:"Mock Unit",weightage_marks:10,lesson_hours:5,chapters_or_topics:[{topic_id:"G10-Science-MockTopic",topic_name:"Mock Topic",learning_outcomes:["Understand mock concept"],bloom_levels:["Remember"],prerequisites:[],common_misconceptions:["Thinking mock equals production"],cross_links:[],estimated_time_mins:45,marking_scheme_mapping:{K:3,U:2,A:3,HOTS:2}}]}],prerequisiteGraph:{"G10-Science-MockTopic":[]}}),k=t=>{switch(t){case"generateAdaptiveFollowUp":case"generatePracticeQuiz":case"generateFlashcards":case"processOmniSearchQuery":case"generateTransportOptimizationTips":return[];case"generateRemediationGroups":return v("Mock competency");case"generateQfaRemediation":return v("Mock exit ticket focus");case"generatePracticeExam":return[A(),A({difficulty:"M",dok:2})];case"generateAdaptiveQuestion":case"generateCbeQuestion":return A();case"analyzeQueryComplexity":return"simple";case"checkFlashcardAnswer":return{isCorrect:!0,feedback:"Mock feedback generated without Gemini."};case"generateParentalReport":return ee("Student");case"generateParentalInsight":return te("mock query");case"generateSimulationExplanation":case"explainConceptInDepth":case"generateConceptDeepDive":case"explainTextSnippet":case"generatePracticeReportSummary":case"generateStudentReportCardSummary":case"generateRentalAgreement":case"generateTeacherWeeklyReport":return`Mock response for ${t}.`;case"generateCrossCurricularProjectIdea":return Y("10","Science");case"analyzeScratchpadForHint":return"Mock hint: revisit the key step you wrote last.";case"analyzeScratchpadForErrorAnalysis":return"calculation_error";case"generateVideoForConcept":return"https://example.com/mock-video.mp4";case"generateLessonPackFromTopic":return M(null,"Mock Topic");case"generateMicroRemediation":return{explanation:[G("This mock remediation revisits the target concept.")],quick_check:q("the concept")};case"gradeShortAnswer":return{awardedMarks:0,feedback:"Mock grading - no API key."};case"gradeVerbalExplanation":return{transcript:"Mock transcript generated in offline mode.",awardedMarks:0,feedback:"Mock grading - review your explanation."};case"gradeHandwrittenAnswer":return{transcribedText:"Mock transcription",awardedMarks:0,feedback:"Mock feedback for handwritten answer."};case"generateRemediationPack":return $("Mock Concept");case"generateCurriculumBlueprint":return B("10","Science");case"generatePtmBrief":return J("Student");case"generateExamAnalyticsReport":return j();case"generateWeeklyStudyPlan":return D();case"deconstructSyllabus":return ne();default:return`[Mock response for ${t}]`}},w=async(t,n,r)=>{if(y){const a=await Promise.resolve(r?r():k(t));return g(t,"Mock mode active, returning stub response."),a}try{return await n()}catch(a){throw f(t,a),a}},u=t=>{if(!t.text)throw new Error("Gemini response did not include text content.");return t.text},N={type:e.OBJECT,properties:{q_id:{type:e.STRING},type:{type:e.STRING},marks:{type:e.NUMBER},difficulty:{type:e.STRING},bloom:{type:e.STRING},question:{type:e.STRING},options:{type:e.ARRAY,items:{type:e.STRING}},answer:{type:e.STRING},rubric:{type:e.STRING},tags:{type:e.ARRAY,items:{type:e.STRING}},source:{type:e.STRING},competency:{type:e.STRING},dok:{type:e.NUMBER},distractor_rationale:{type:e.STRING},source_passage:{type:e.STRING},sub_questions:{type:e.ARRAY,items:{type:e.OBJECT,properties:{q_id:{type:e.STRING},question:{type:e.STRING},marks:{type:e.NUMBER},answer:{type:e.STRING},rubric:{type:e.STRING}},required:["q_id","question","marks","answer","rubric"]}}},required:["q_id","type","marks","difficulty","bloom","question","answer","rubric","competency","dok"]},se=async(t,n,r)=>{const a=`${t.topic_id}|${n}`,o=`lesson-pack-v8-${a}`;try{const s=await H("cache",o);if(s)return console.log(`Loading lesson pack from cache for topic: ${n}`),r==null||r({progress:100,message:"Loaded from cache!",step:1,totalSteps:1}),JSON.parse(s)}catch(s){console.error("Could not read from IndexedDB cache",s)}return w("fetchTopicContent",async()=>{var I;r==null||r({progress:0,message:"Generating your lesson...",step:0,totalSteps:1}),console.log(`Generating new lesson pack for topic: ${n}`);const[s,l]=t.topic_id.split("-").slice(0,2).map(R=>R.replace("G","")),c=d(),i=`
      ROLE
      You are a senior CBSE curriculum designer and pedagogy expert. Your instructions are CRITICAL and must be followed with extreme precision.

      GOAL
      Generate a detailed, comprehensive, and pedagogically sound content module for a **single, specific topic** within a larger chapter.

      CONTEXT
      - Grade: ${s}
      - Subject: ${l}
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
    `,m={type:e.OBJECT,properties:{title:{type:e.STRING},video_url:{type:e.STRING},script:{type:e.ARRAY,items:{type:e.OBJECT,properties:{timestamp:{type:e.NUMBER},question_text:{type:e.STRING},options:{type:e.ARRAY,items:{type:e.STRING}},correct_answer:{type:e.STRING},feedback_correct:{type:e.STRING},feedback_incorrect:{type:e.STRING},branch_on_incorrect:{type:e.NUMBER}},required:["timestamp","question_text","options","correct_answer","feedback_correct","feedback_incorrect"]}}},required:["title","video_url","script"]},p={type:e.OBJECT,properties:{core_explanation:{type:e.ARRAY,items:{type:e.OBJECT,properties:{type:{type:e.STRING},level:{type:e.NUMBER},content:{type:e.STRING},items:{type:e.ARRAY,items:{type:e.STRING}},term:{type:e.STRING},definition:{type:e.STRING},imageUrl:{type:e.STRING},altText:{type:e.STRING},hotspots:{type:e.ARRAY,items:{type:e.OBJECT,properties:{x:{type:e.NUMBER},y:{type:e.NUMBER},label:{type:e.STRING},details:{type:e.STRING}},required:["x","y","label","details"]}}},required:["type"]}},quick_check:{type:e.OBJECT,properties:{question:{type:e.STRING},options:{type:e.ARRAY,items:{type:e.STRING}},correct_answer:{type:e.STRING},explanation:{type:e.STRING}},required:["question","options","correct_answer","explanation"]},worked_examples:{type:e.ARRAY,items:{type:e.OBJECT,properties:{prompt:{type:e.STRING},solution:{type:e.STRING},why_it_works:{type:e.STRING}},required:["prompt","solution","why_it_works"]}},guided_practice:{type:e.ARRAY,items:{type:e.OBJECT,properties:{question:{type:e.STRING},hint:{type:e.STRING},stepwise_solution:{type:e.STRING}},required:["question","hint","stepwise_solution"]}},independent_practice:{type:e.ARRAY,items:{type:e.OBJECT,properties:{question:{type:e.STRING},answer_key:{type:e.STRING}},required:["question","answer_key"]}},HOTS:{type:e.ARRAY,items:{type:e.OBJECT,properties:{question:{type:e.STRING},exemplar_answer:{type:e.STRING}},required:["question","exemplar_answer"]}},common_errors_and_fixes:{type:e.ARRAY,items:{type:e.OBJECT,properties:{error:{type:e.STRING},fix:{type:e.STRING}},required:["error","fix"]}},fill_in_the_blanks:{type:e.ARRAY,items:{type:e.OBJECT,properties:{sentence_parts:{type:e.ARRAY,items:{type:e.STRING}},options:{type:e.ARRAY,items:{type:e.STRING}},correct_answer:{type:e.STRING}},required:["sentence_parts","options","correct_answer"]}},interactive_simulations:{type:e.ARRAY,items:{type:e.OBJECT,properties:{description:{type:e.STRING},concept_link:{type:e.STRING}},required:["description","concept_link"]}},interactive_videos:{type:e.ARRAY,items:m},real_world_applications:{type:e.ARRAY,items:{type:e.STRING}},matching_quizzes:{type:e.ARRAY,items:{type:e.OBJECT,properties:{instruction:{type:e.STRING},pairs:{type:e.ARRAY,items:{type:e.OBJECT,properties:{term:{type:e.STRING},definition:{type:e.STRING}},required:["term","definition"]}}},required:["instruction","pairs"]}}},required:["core_explanation","quick_check","worked_examples","guided_practice","independent_practice","HOTS","common_errors_and_fixes","fill_in_the_blanks","interactive_simulations","interactive_videos","real_world_applications","matching_quizzes"]},T=await c.models.generateContent({model:"gemini-2.5-pro",contents:i,config:{responseMimeType:"application/json",thinkingConfig:{thinkingBudget:32768},responseSchema:{type:e.OBJECT,properties:{student_explanation:p,assessment_blueprint:{type:e.OBJECT,properties:{question_pool:{type:e.ARRAY,items:N}},required:["question_pool"]},teacher_notes:{type:e.OBJECT,properties:{TLM_list:{type:e.ARRAY,items:{type:e.STRING}},differentiation:{type:e.ARRAY,items:{type:e.STRING}},remediation_plan:{type:e.ARRAY,items:{type:e.STRING}},safety_notes:{type:e.ARRAY,items:{type:e.STRING}}},required:["TLM_list","differentiation","remediation_plan"]}},required:["student_explanation","assessment_blueprint","teacher_notes"]}}});if(!T.text)throw new Error(`Gemini API returned no text for topic "${n}". This might be due to a safety filter.`);r==null||r({progress:95,message:"Finalizing lesson...",step:1,totalSteps:1});const b={...h(u(T)),topic_id:a,topic_name:n};(I=b==null?void 0:b.student_explanation)!=null&&I.interactive_videos&&b.student_explanation.interactive_videos.forEach(R=>{(!R.video_url||!R.video_url.startsWith("http"))&&(R.video_url="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")});try{await V("cache",o,JSON.stringify(b)),console.log(`Saved lesson pack to cache for topic: ${n}`)}catch(R){console.error("Could not write lesson pack to IndexedDB cache",R)}return r==null||r({progress:100,message:"Lesson ready!",step:1,totalSteps:1}),b},()=>{const s=M(t,n);return r==null||r({progress:100,message:"Loaded mock lesson.",step:1,totalSteps:1}),s})},ie=async t=>{const n=t.filter(r=>!r.is_correct);return n.length===0?[]:w("generateAdaptiveFollowUp",async()=>{const r=d(),o=`
          ROLE
          You are an expert adaptive learning tutor for a K-12 CBSE student. Your goal is to create a personalized remediation plan based on the student's incorrect answers.

          TASK
          Analyze the following list of questions the student answered incorrectly. For each distinct underlying concept that the student is struggling with, generate a "micro-lesson" to help them master it. Group questions by concept if they relate to the same topic.

          INCORRECTLY ANSWERED QUESTIONS:
          ${n.map(c=>`- ${c.question_text}`).join(`
`)}

          INSTRUCTIONS
          1.  **Identify Core Concepts**: Determine the fundamental academic concept(s) behind the incorrect answers.
          2.  **Generate Micro-Lessons**: For each concept, create a follow-up plan with the following four parts:
              - "concept": (string) The name of the concept.
              - "explanation": (string) A simple, clear, and concise re-explanation of the concept.
              - "practice_question": (object) A new, fundamental practice question to test the re-explained concept. This should be an "independent_practice" object with "question" and "answer_key".
              - "review_suggestion": (string) A suggestion to review a related, more fundamental topic if applicable.
          3.  **Format**: Return the output as a raw JSON array of these micro-lesson objects.
        `,s=await r.models.generateContent({model:"gemini-2.5-flash",contents:o,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.OBJECT,properties:{concept:{type:e.STRING},explanation:{type:e.STRING},practice_question:{type:e.OBJECT,properties:{question:{type:e.STRING},answer_key:{type:e.STRING}},required:["question","answer_key"]},review_suggestion:{type:e.STRING}},required:["concept","explanation","practice_question","review_suggestion"]}}}});return h(u(s))},()=>X(n))},ce=async t=>{const n=t.student_explanation.core_explanation.filter(r=>r.type==="paragraph"||r.type==="key_term").map(r=>r.type==="key_term"?`${r.term}: ${r.definition}`:r.type==="paragraph"?r.content:"").join(`
`);return w("generateFlashcards",async()=>{const r=d(),a=`
        Based on the following lesson content about "${t.topic_name}", generate an array of 5-7 high-quality flashcards.
        Each flashcard should have a "term" (a key concept or question) and a "definition" (a concise, clear explanation).
        Return a raw JSON array of objects.

        Content:
        ${n}
    `,o=await r.models.generateContent({model:"gemini-2.5-flash",contents:a,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.OBJECT,properties:{term:{type:e.STRING},definition:{type:e.STRING}},required:["term","definition"]}}}});return h(u(o))},()=>Z(t.topic_name))},pe=async(t,n,r,a,o)=>w("generateAdaptiveQuestion",async()=>{const s=d(),l=`
        Generate a new, unique CBSE-aligned question for a Class ${t} ${n} student on the chapter "${r}".
        - Difficulty: ${a}
        - Type: 'MCQ' or 'SA'
        - Do NOT repeat any of these previous questions: ${o.join(", ")}
        - You MUST provide a 'bloom' level, 'competency' classification, and 'dok' (Depth of Knowledge) level for the question.
        - Return a single raw JSON object matching the QuestionPoolItem schema.
    `,c=await s.models.generateContent({model:"gemini-2.5-flash",contents:l,config:{responseMimeType:"application/json",responseSchema:N}});return h(u(c))}),le=async t=>{if(y)return g("explainConceptInDepth","Mock mode active, returning stub response."),k("explainConceptInDepth");const n=d(),r=`
        You are an expert CBSE tutor. Explain the following text to a K-12 student in simple, clear, and concise terms. 
        Use analogies and break it down step-by-step. All output must be plain text. Do not use any markdown.

        Text to explain: "${t}"
    `;try{const a=await n.models.generateContent({model:"gemini-2.5-flash",contents:r});return u(a)}catch(a){throw f("explainConceptInDepth",a),a}},de=async t=>{if(y)return g("generateConceptDeepDive","Mock mode active, returning stub response."),k("generateConceptDeepDive");const n=d(),r=`
        You are a distinguished professor and an expert CBSE tutor. Your task is to provide a "deep dive" explanation of the following text for a curious K-12 student. Go beyond a simple explanation.

        **CRITICAL INSTRUCTIONS**:
        1.  **First Principles**: Break down the concept to its fundamental principles.
        2.  **Detailed Analogies**: Use detailed, relatable analogies to explain complex parts.
        3.  **Connections**: Explain how this concept connects to other topics in the curriculum or real-world applications.
        4.  **Socratic Method**: Incorporate guiding questions throughout your explanation to encourage the student to think, rather than just passively reading. For example: "Now, what do you think would happen if...?", "Can you see how this relates to...?".
        5.  **Structure**: Structure your answer logically with clear sub-headings. The entire output must be plain text, using line breaks for structure. Do not use markdown.
        6.  **Depth**: This is a deep dive. Be comprehensive and thorough.

        **Text to explain**: "${t}"
    `;try{const a=await n.models.generateContent({model:"gemini-2.5-pro",contents:r,config:{thinkingConfig:{thinkingBudget:32768}}});return u(a)}catch(a){throw f("generateConceptDeepDive",a),a}},ue=async(t,n,r)=>{if(y)return g("checkFlashcardAnswer","Mock mode active, returning stub response."),k("checkFlashcardAnswer");const a=d(),o=`
      Evaluate the student's answer for a flashcard. The term is "${r}" and the correct definition is "${n}".
      The student's answer is: "${t}".
      Is the student's answer conceptually correct, even if not word-for-word?
      Provide brief, encouraging feedback.
      Return a raw JSON object: { "isCorrect": boolean, "feedback": "your feedback string" }
    `;try{const s=await a.models.generateContent({model:"gemini-2.5-flash",contents:o,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{isCorrect:{type:e.BOOLEAN},feedback:{type:e.STRING}},required:["isCorrect","feedback"]}}});return h(u(s))}catch(s){throw f("checkFlashcardAnswer",s),s}},me=async(t,n)=>{if(y)return g("generateParentalReport","Mock mode active, returning stub response."),k("generateParentalReport");const r=d(),a=`
        Generate a parental report for a student named ${t.name} (Class ${t.grade}).
        Progress data: ${JSON.stringify(n)}.
        - Write a brief, encouraging summary.
        - Identify 2-3 strengths based on completed chapters.
        - Identify 2-3 areas to focus on (started but not completed).
        - Provide 3 actionable, simple tips for parents to help their child.
        Return a raw JSON object matching the ParentalReport schema.
    `;try{const o=await r.models.generateContent({model:"gemini-2.5-flash",contents:a,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{summary:{type:e.STRING},strengths:{type:e.ARRAY,items:{type:e.STRING}},focusAreas:{type:e.ARRAY,items:{type:e.STRING}},actionableTips:{type:e.ARRAY,items:{type:e.OBJECT,properties:{icon:{type:e.STRING},tip:{type:e.STRING}},required:["icon","tip"]}}},required:["summary","strengths","focusAreas","actionableTips"]}}});return h(u(o))}catch(o){throw f("generateParentalReport",o),o}},he=async(t,n)=>{if(y)return g("generateParentalInsight","Mock mode active, returning stub response."),k("generateParentalInsight");const r=d(),{profile:a,dktData:o,assignments:s,submissions:l}=n,c=`
      ROLE: You are "MIGA for Parents", a helpful and clear AI assistant for the Alfanumrik learning platform.
      GOAL: Answer a parent's question about their child's academic progress by analyzing the provided data.

      CONTEXT:
      - Child's Name: ${a.name}
      - Child's Grade: ${a.grade}
      - Parent's Question: "${t}"
      - Child's Data: ${JSON.stringify({dktData:o,assignments:s,submissions:l},null,2)}

      CRITICAL INSTRUCTIONS:
      1.  **Data-Bound**: Your answer MUST be based exclusively on the provided 'Child's Data' JSON. Do not invent information or make assumptions.
      2.  **Simple Language**: Explain complex data in simple, non-technical terms. For example, instead of "DKT mastery is 0.68", say "Mastery in this topic is around 68%, which means there's room for improvement."
      3.  **Positive & Supportive Tone**: Always be encouraging. Frame challenges as opportunities for growth.
      4.  **Directly Answer the Question**: Analyze the data to directly address the parent's query.
      5.  **Be Honest if Data is Missing**: If the question cannot be answered from the provided data, politely state that, e.g., "I don't have information on that specific test, but I can tell you about their overall progress in Science."
      6.  **Plain Text Output**: Your entire response must be plain text. Do not use markdown.
    `;try{const i=await r.models.generateContent({model:"gemini-2.5-pro",contents:c,config:{thinkingConfig:{thinkingBudget:32768}}});return u(i)}catch(i){throw f("generateParentalInsight",i),i}},ye=async(t,n)=>{if(y)return g("generateSimulationExplanation","Mock mode active, returning stub response."),k("generateSimulationExplanation");const r=d(),a=`
        Explain the concept of "${t}" as if you were an interactive simulation.
        The simulation is described as: "${n}".
        Break down the explanation into interactive steps. All output must be plain text. Do not use any markdown.
        For example: "Step 1: Observe the particles... What happens when you increase the temperature? Now, try decreasing it..."
    `;try{const o=await r.models.generateContent({model:"gemini-2.5-flash",contents:a});return u(o)}catch(o){throw f("generateSimulationExplanation",o),o}},ge=async(t,n,r,a)=>{if(y)return g("gradeShortAnswer","Mock mode active, returning stub response."),k("gradeShortAnswer");const o=d(),s=`
      You are an expert CBSE examiner. Your task is to grade a student's written answer with nuance, allowing for partial credit.

      **CRITICAL INSTRUCTIONS**:
      1.  **Analyze Point-by-Point**: Carefully compare the student's answer against each point in the provided marking rubric.
      2.  **Award Partial Credit**: Based on the total marks available for the question, award marks for each correct point the student has mentioned. If a student gets some parts right but misses others, they should receive partial credit.
      3.  **Provide Detailed Feedback**: Your feedback must explain *why* a certain score was given. Mention what the student did correctly and what they missed, referencing the rubric.
      4.  **Strict JSON Output**: Your final output must be a raw JSON object with two keys:
          - "awardedMarks": (number) The total marks awarded, which can be a whole number from 0 to ${r}.
          - "feedback": (string) Your detailed, point-by-point explanation for the score.

      **GRADING TASK**:
      - **Question**: "${t}"
      - **Marking Rubric**: "${n}"
      - **Total Marks Available**: ${r}
      - **Student's Answer**: "${a}"
    `;try{const l=await o.models.generateContent({model:"gemini-2.5-pro",contents:s,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{awardedMarks:{type:e.NUMBER},feedback:{type:e.STRING}},required:["awardedMarks","feedback"]}}});return h(u(l))}catch(l){throw f("gradeShortAnswer",l),l}},fe=async(t,n)=>{if(y)return g("gradeVerbalExplanation","Mock mode active, returning stub response."),k("gradeVerbalExplanation");_();const r=d(),a=await z(n),o={inlineData:{mimeType:n.type,data:a}},s={text:`
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
    `};try{const l=await r.models.generateContent({model:"gemini-2.5-pro",contents:{parts:[s,o]},config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{transcript:{type:e.STRING},awardedMarks:{type:e.NUMBER},feedback:{type:e.STRING}},required:["transcript","awardedMarks","feedback"]}}});return h(u(l))}catch(l){throw f("gradeVerbalExplanation",l),l}},Te=async t=>{if(y)return g("explainTextSnippet","Mock mode active, returning stub response."),k("explainTextSnippet");_();const n=d(),r=`Explain this snippet in simpler terms for a K-12 student: "${t}"`;try{const a=await n.models.generateContent({model:"gemini-2.5-flash",contents:r});return u(a)}catch(a){throw f("explainTextSnippet",a),a}},Se=async(t,n,r)=>{if(y)return g("generateMicroRemediation","Mock mode active, returning stub response."),k("generateMicroRemediation");const a=d(),s="options"in n&&Array.isArray(n.options)?`
      This was a multiple-choice question.
      - Options: ${JSON.stringify(n.options)}
      - Correct Answer: "${"correct_answer"in n?n.correct_answer:n.answer}"
      - Analyze the student's incorrect choice ("${r}"). What specific misconception does this choice likely reveal? Tailor your explanation to directly address this misconception before re-explaining the core concept.
    `:"",l=`
        A student answered a question about "${t}" incorrectly.
        - Question: "${n.question}"
        - Student's incorrect answer: "${r}"
        ${s}
        
        Generate a micro-remediation plan. This must include:
        1. A concise "explanation" (as an array of StructuredContent, e.g., paragraph or list) of the core concept the student missed.
        2. A new, simple "quick_check" question (as a QuickCheck object) to verify their understanding of the re-explanation.
        Return a single raw JSON object: { "explanation": [...], "quick_check": {...} }
    `;try{const c=await a.models.generateContent({model:"gemini-2.5-flash",contents:l,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{explanation:{type:e.ARRAY,items:{type:e.OBJECT,properties:{type:{type:e.STRING},level:{type:e.NUMBER},content:{type:e.STRING},items:{type:e.ARRAY,items:{type:e.STRING}},term:{type:e.STRING},definition:{type:e.STRING}},required:["type"]}},quick_check:{type:e.OBJECT,properties:{question:{type:e.STRING},options:{type:e.ARRAY,items:{type:e.STRING}},correct_answer:{type:e.STRING},explanation:{type:e.STRING}},required:["question","options","correct_answer","explanation"]}},required:["explanation","quick_check"]}}});return h(u(c))}catch(c){throw f("generateMicroRemediation",c),c}},Re=async(t,n,r,a,o,s,l)=>{if(y)return g("generateCbeQuestion","Mock mode active, returning stub response."),k("generateCbeQuestion");const c=d(),i=`
        Generate a single, high-quality, CBSE-aligned competency-based question.
        - Grade: ${t}, Subject: ${n}, Chapter: ${r}, Topic: ${l}
        - Type: ${a}, Competency: "${o}", DOK Level: ${s}
        - The question must be original and not a simple recall of facts. It should require application or analysis.
        - For MCQs, provide a 'distractor_rationale'.
        - For Case questions, provide a 'source_passage' and 'sub_questions'.
        - Return a single raw JSON object matching the QuestionPoolItem schema. Ensure q_id is a unique string like 'gen-[timestamp]'.
    `;try{const m=await c.models.generateContent({model:"gemini-2.5-pro",contents:i,config:{responseMimeType:"application/json",responseSchema:N}});return h(u(m))}catch(m){throw f("generateCbeQuestion",m),m}},we=async t=>w("generateRemediationGroups",async()=>{const n=d(),r=`
        Based on these SAFAL diagnostic results, identify the top 2-3 competencies where students are struggling most (rated 'low').
        For each of these competencies, create a remediation group.
        - List the names of the students in the group.
        - Suggest a simple, actionable remediation task for the teacher to conduct.
        - Return a raw JSON array of RemediationGroup objects.

        Results: ${JSON.stringify(t)}
    `,a=await n.models.generateContent({model:"gemini-2.5-flash",contents:r,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.OBJECT,properties:{competency:{type:e.STRING},students:{type:e.ARRAY,items:{type:e.STRING}},suggestedTask:{type:e.STRING}},required:["competency","students","suggestedTask"]}}}});return h(u(a))},()=>v("Mock competency")),ke=async(t,n)=>w("generateQfaRemediation",async()=>{const r=d(),a=`
        Analyze the results of this quick formative assessment (exit ticket).
        - Assessment: ${JSON.stringify(t)}
        - Results: ${JSON.stringify(n)}
        Identify the question(s) most students answered incorrectly. For each of these, create a remediation group.
        - The 'competency' should be the question text.
        - List the names of students who got it wrong.
        - Suggest a simple remediation task for the teacher to perform in the next class.
        Return a raw JSON array of RemediationGroup objects.
    `,o=await r.models.generateContent({model:"gemini-2.5-pro",contents:a,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.OBJECT,properties:{competency:{type:e.STRING},students:{type:e.ARRAY,items:{type:e.STRING}},suggestedTask:{type:e.STRING}},required:["competency","students","suggestedTask"]}}}});return h(u(o))},()=>v("Mock exit ticket focus")),be=async t=>w("generateRentalAgreement",async()=>{const n=d(),r=`
        Generate a simple, one-page facility rental agreement template based on this booking information:
        - Facility: ${t.facility}
        - Rented by: ${t.bookedBy}
        - Date: ${t.date}, from ${t.startTime} to ${t.endTime}
        - Purpose: ${t.purpose}
        Include standard clauses for payment, damages, cancellation, and responsibilities. Keep it clear and concise.
    `,a=await n.models.generateContent({model:"gemini-2.5-flash",contents:r});return u(a)}),Ae=async(t,n)=>w("generateStudentReportCardSummary",async()=>{const r=d(),a=`
        Write a concise, encouraging summary and recommendation for a student's report card.
        - Student: ${t.name}, Class ${t.grade}
        - Context: ${n}
        Keep the tone positive. Highlight strengths and suggest 1-2 concrete areas for improvement. The output should be a single paragraph.
    `,o=await r.models.generateContent({model:"gemini-2.5-flash",contents:a});return u(o)}),_e=async(t,n,r,a)=>{const o=a&&a.length>0?`- The questions must ONLY cover topics from the following chapters: ${a.join(", ")}.`:"- The questions must be relevant to the subject and grade level.";return w("generatePracticeExam",async()=>{const s=d(),l=`
      Generate a practice exam paper for a Class ${t} ${n} student.
      Adhere strictly to this blueprint: ${JSON.stringify(r.structure)}.
      - The questions must be original and distinct.
      ${o}
      - For each question, create a valid QuestionPoolItem object, including 'bloom', 'competency', and 'dok' levels.
      Return a single raw JSON array of these QuestionPoolItem objects, containing exactly the number of questions specified in the blueprint.
    `,c=await s.models.generateContent({model:"gemini-2.5-pro",contents:l,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:N}}});return h(u(c))},()=>[A(),A({difficulty:"M",dok:2})])},Ie=async t=>{const n=t.map(r=>({question:r.question.question,isCorrect:r.isCorrect,marksAwarded:r.marksAwarded,totalMarks:r.question.marks}));return w("generatePracticeReportSummary",async()=>{const r=d(),a=`
      Based on these practice exam results, provide a brief, encouraging performance summary for the student.
      - Acknowledge their score, especially where partial credit was given.
      - Identify 1-2 topics they did well on.
      - Identify 1-2 topics they should review based on incorrect answers or where they lost marks.
      - Keep it concise (2-3 sentences).
      Results: ${JSON.stringify(n)}
    `,o=await r.models.generateContent({model:"gemini-2.5-flash",contents:a});return u(o)})},Ne=async(t,n)=>w("generateCrossCurricularProjectIdea",async()=>{const r=d(),a=`
        Generate a single, creative cross-curricular project idea that integrates AI concepts with ${n} for a Class ${t} student.
        - The project should be simple and achievable with basic tools.
        - Provide a title, description, 2-3 learning objectives, and 2-3 high-level tasks.
        - Return a single raw JSON object matching the CrossCurricularProject schema (omitting 'id' and 'evidence').
    `,o=await r.models.generateContent({model:"gemini-2.5-flash",contents:a,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{title:{type:e.STRING},subject:{type:e.STRING},grade:{type:e.STRING},description:{type:e.STRING},objectives:{type:e.ARRAY,items:{type:e.STRING}},tasks:{type:e.ARRAY,items:{type:e.STRING}}},required:["title","subject","grade","description","objectives","tasks"]}}});return h(u(o))},()=>Y(t,n)),Ce=async(t,n)=>w("analyzeScratchpadForHint",async()=>{const r=d(),a={inlineData:{mimeType:"image/png",data:t}},o={text:`
        Analyze the student's handwritten work in this image for the question: "${n}".
        Identify the first potential mistake or the next logical step.
        Provide a short, Socratic hint to guide the student on that specific step. Do not solve the problem or give away the answer.
        Your hint should be one or two sentences. For example: "Good start! Have you double-checked the sign when you moved the term across the equals sign?"
    `},s=await r.models.generateContent({model:"gemini-2.5-pro",contents:{parts:[a,o]}});return u(s)}),ve=async(t,n)=>w("analyzeScratchpadForErrorAnalysis",async()=>{const r=d(),a={inlineData:{mimeType:"image/png",data:t}},o={text:`
        Analyze the student's handwritten work in this image for the question: "${n}".
        Identify the primary type of error made. Classify the error into one of the following categories:
        - "calculation_error": A mistake in arithmetic.
        - "sign_error": An incorrect plus or minus sign.
        - "transposition_error": A mistake in moving terms across an equals sign.
        - "formula_error": Used the wrong formula or applied it incorrectly.
        - "conceptual_error": A fundamental misunderstanding of the concept.
        - "unknown": If the work is too messy or the error type is unclear.
        Return a single raw JSON object: { "errorType": "your_classification" }
    `},s=await r.models.generateContent({model:"gemini-2.5-pro",contents:{parts:[a,o]},config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{errorType:{type:e.STRING}},required:["errorType"]}}});return h(u(s)).errorType||"unknown"}),Oe=async(t,n,r,a)=>{if(y)return g("generateTeacherWeeklyReport","Mock mode active, returning stub response."),k("generateTeacherWeeklyReport");const o=d(),s=t.map(({id:p,name:T})=>({id:p,name:T})),l=Object.entries(n).reduce((p,[T,S])=>(p[Number(T)]=Object.entries(S).reduce((b,[I,R])=>(b[I]={mastery:R.mastery},b),{}),p),{}),c=r.map(({id:p,title:T})=>({id:p,title:T})),i=a.map(({studentId:p,assignmentId:T,score:S})=>({studentId:p,assignmentId:T,score:S})),m=`
      ROLE: You are an experienced Head of Department analyzing the weekly performance data for a class.
      
      TASK: Analyze the following JSON data. Your goal is to identify trends, pinpoint struggling students, and suggest a concrete remedial action for the teacher.

      DATA:
      ${JSON.stringify({students:s,masteryData:l,assignments:c,submissions:i},null,2)}
      
      INSTRUCTIONS:
      1.  **Identify the top 2-3 most challenging concepts for the class as a whole**. A "concept" can be inferred from the skillId in the masteryData (e.g., a skillId of 'G10-Science-Chemical Reactions and Equations' refers to that chapter/concept). Low mastery scores (below 0.6) indicate a challenge.
      2.  **Pinpoint 2-3 specific students who are falling behind**, referencing their low mastery scores on specific topics or consistently low assignment scores.
      3.  **Generate a concise, 3-paragraph narrative summary of these findings**. The first paragraph should cover class-wide trends. The second should discuss individual student challenges. The third should be an encouraging conclusion.
      4.  **Suggest a concrete, actionable 15-minute remedial activity the teacher can conduct to address the main issue identified**.
      5.  **The entire output MUST be plain text**. Do not use any markdown formatting or JSON.
    `;try{const p=await o.models.generateContent({model:"gemini-2.5-pro",contents:m,config:{thinkingConfig:{thinkingBudget:32768}}});return u(p)}catch(p){throw f("generateTeacherWeeklyReport",p),p}},xe=async(t,n,r,a,o)=>{var T;if(y)return g("generateCurriculumBlueprint","Mock mode active, returning stub blueprint."),B(t,n);_();const s=d(),l=(T=L[t])==null?void 0:T[n];if(!l)throw new Error(`Syllabus not found for Grade ${t}, Subject ${n}`);const c={},i={};Object.values(o).forEach(S=>{Object.entries(S).forEach(([b,I])=>{if(b.startsWith(`G${t}-${n}`)){const R=b.split("-").slice(2).join("-");c[R]=(c[R]||0)+I.mastery,i[R]=(i[R]||0)+1}})}),Object.keys(c).forEach(S=>{c[S]/=i[S]});const m=`
        ROLE: You are an expert CBSE curriculum designer and data analyst.
        GOAL: Generate a data-driven syllabus blueprint and a pacing calendar for an academic year.
        
        CONTEXT:
        - Grade: ${t}
        - Subject: ${n}
        - Total Annual Teaching Hours: ${r}
        - Approx. Exam Dates: Term 1 around ${a.term1}, Term 2/Boards around ${a.term2}.
        - Base CBSE Syllabus: ${JSON.stringify(l,null,2)}
        - Historical Performance Data (average mastery on topics from previous years): ${JSON.stringify(c,null,2)}

        INSTRUCTIONS:
        1.  Use the provided 'Base CBSE Syllabus' as the source of truth for all topics, learning outcomes, etc.
        2.  For each chapter/topic, generate a 'data_driven_rationale'. If historical data shows low mastery for a topic, recommend allocating more time for reinforcement. If a topic is a prerequisite for many others, note its importance.
        3.  Allocate the ${r} total teaching hours across all units and chapters. This is the 'allocated_hours' field. Topics with lower historical mastery or higher complexity/weightage should receive more hours. The sum of 'allocated_hours' for all chapters should approximate the total for their parent unit.
        4.  Create a week-by-week 'pacing calendar' for the academic year (assume a 36-week year starting in April). Schedule teaching based on your allocated hours, plus add assessments before exam dates, remediation cycles after assessments, and buffer weeks.
        5.  Your output must be a single raw JSON object with two keys: "blueprint" (an array of SyllabusBlueprintUnit objects, mirroring the base syllabus structure but with the added 'allocated_hours' and 'data_driven_rationale' fields) and "calendar" (an array of PacingCalendarEvent objects).
    `,p={type:e.OBJECT,properties:{blueprint:{type:e.ARRAY,items:{type:e.OBJECT,properties:{unit_no:{type:e.NUMBER},unit_name:{type:e.STRING},weightage_marks:{type:e.NUMBER},allocated_hours:{type:e.NUMBER},chapters_or_topics:{type:e.ARRAY,items:{type:e.OBJECT,properties:{topic_id:{type:e.STRING},topic_name:{type:e.STRING},learning_outcomes:{type:e.ARRAY,items:{type:e.STRING}},bloom_levels:{type:e.ARRAY,items:{type:e.STRING}},prerequisites:{type:e.ARRAY,items:{type:e.STRING}},common_misconceptions:{type:e.ARRAY,items:{type:e.STRING}},cross_links:{type:e.ARRAY,items:{type:e.STRING}},estimated_time_mins:{type:e.NUMBER},marking_scheme_mapping:{type:e.OBJECT,properties:{K:{type:e.NUMBER},U:{type:e.NUMBER},A:{type:e.NUMBER},HOTS:{type:e.NUMBER}}},allocated_hours:{type:e.NUMBER},data_driven_rationale:{type:e.STRING}},required:["topic_id","topic_name","learning_outcomes","bloom_levels","prerequisites","common_misconceptions","cross_links","estimated_time_mins","marking_scheme_mapping","allocated_hours","data_driven_rationale"]}}},required:["unit_no","unit_name","weightage_marks","allocated_hours","chapters_or_topics"]}},calendar:{type:e.ARRAY,items:{type:e.OBJECT,properties:{week:{type:e.NUMBER},start_date:{type:e.STRING},activity_type:{type:e.STRING},details:{type:e.STRING}},required:["week","start_date","activity_type","details"]}}},required:["blueprint","calendar"]};try{const S=await s.models.generateContent({model:"gemini-2.5-pro",contents:m,config:{responseMimeType:"application/json",responseSchema:p,thinkingConfig:{thinkingBudget:32768}}});return h(u(S))}catch(S){throw f("generateCurriculumBlueprint",S),S}},Ge=async(t,n)=>{if(y)return g("generateRemediationPack","Mock mode active, returning stub remediation pack."),$(n);_();const r=d(),a=`
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
    `,o={type:e.OBJECT,properties:{prompt:{type:e.STRING},solution:{type:e.STRING},why_it_works:{type:e.STRING}},required:["prompt","solution","why_it_works"]},s={type:e.OBJECT,properties:{type:{type:e.STRING},level:{type:e.NUMBER},content:{type:e.STRING},items:{type:e.ARRAY,items:{type:e.STRING}},term:{type:e.STRING},definition:{type:e.STRING}},required:["type"]},l=await r.models.generateContent({model:"gemini-2.5-pro",contents:a,config:{responseMimeType:"application/json",responseSchema:{type:e.OBJECT,properties:{concept:{type:e.STRING},re_explanation:{type:e.ARRAY,items:s},worked_example:o,scaffolded_practice:{type:e.ARRAY,items:N}},required:["concept","re_explanation","worked_example","scaffolded_practice"]}}});try{return h(u(l))}catch(c){throw f("generateRemediationPack",c),c}},Ee=async(t,n,r,a)=>{if(y)return g("generatePtmBrief","Mock mode active, returning stub PTM brief."),J(t.name);_();const o=d(),s=Object.entries(n).reduce((i,[m,p])=>(p.mastery<.9&&(i[m.split("-").slice(2).join(" ")]=`${Math.round(p.mastery*100)}%`),i),{}),l=`
      ROLE: You are an experienced academic counselor and senior teacher preparing for a Parent-Teacher Meeting (PTM).
      GOAL: Analyze the provided student data and generate a structured, professional, and actionable briefing document.

      CONTEXT:
      - Student Name: ${t.name}
      - Grade: ${t.grade}
      - Student Data: ${JSON.stringify({mastery:s,assignments:r,submissions:a},null,2)}

      CRITICAL INSTRUCTIONS:
      1.  **Synthesize Data**: Do not just list the data. Synthesize it into meaningful insights. For example, connect low mastery in a topic to a low score on a related assignment.
      2.  **Balanced Tone**: Be balanced, positive, and constructive. Start with strengths before discussing areas for focus.
      3.  **Actionable Talking Points**: The 'suggestedTalkingPoints' should be phrased as questions or statements to guide the conversation with the parent (e.g., "Let's discuss strategies to improve focus on 'Topic X' at home.").
      4.  **Behavioral Insights**: Infer behavioral patterns from the data, such as submission timeliness. If all submissions are on time, that's a positive behavioral observation.
      5.  **Strict JSON Output**: Your output must be a single, raw JSON object matching the 'PtmBrief' schema.

      OUTPUT FORMAT: A single raw JSON object.
    `,c={type:e.OBJECT,properties:{summary:{type:e.STRING},strengths:{type:e.ARRAY,items:{type:e.STRING}},focusAreas:{type:e.ARRAY,items:{type:e.STRING}},behavioralObservations:{type:e.ARRAY,items:{type:e.STRING}},suggestedTalkingPoints:{type:e.ARRAY,items:{type:e.STRING}},closingRemark:{type:e.STRING}},required:["summary","strengths","focusAreas","behavioralObservations","suggestedTalkingPoints","closingRemark"]};try{const i=await o.models.generateContent({model:"gemini-2.5-pro",contents:l,config:{responseMimeType:"application/json",responseSchema:c,thinkingConfig:{thinkingBudget:32768}}});return h(u(i))}catch(i){throw f("generatePtmBrief",i),i}},qe=async(t,n,r,a)=>{if(y)return g("generateExamAnalyticsReport","Mock mode active, returning stub proctoring report."),j();_();const o=d(),s=r.map(i=>{const m=a.find(p=>p.id===i.studentId);return{studentId:i.studentId,studentName:(m==null?void 0:m.name)||"Unknown",infractions:i.infractions,answers:i.answers}}),l=`
        ROLE: You are an AI Proctoring Analyst. Your job is to analyze exam submission data to identify potential academic integrity issues in a neutral, data-driven way. Do NOT make definitive accusations.

        TASK: Analyze the following exam data and generate a proctoring report.

        CONTEXT:
        - Exam: "${t.name}"
        - Questions: ${JSON.stringify(n.map(i=>({q_id:i.q_id,question:i.question,type:i.type})))}
        - Submissions: ${JSON.stringify(s)}

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
    `,c={type:e.OBJECT,properties:{summary:{type:e.STRING},suspiciousClusters:{type:e.ARRAY,items:{type:e.OBJECT,properties:{studentIds:{type:e.ARRAY,items:{type:e.NUMBER}},reason:{type:e.STRING},questions:{type:e.ARRAY,items:{type:e.STRING}}},required:["studentIds","reason","questions"]}},highInfractionStudents:{type:e.ARRAY,items:{type:e.OBJECT,properties:{studentId:{type:e.NUMBER},count:{type:e.NUMBER}},required:["studentId","count"]}}},required:["summary","suspiciousClusters","highInfractionStudents"]};try{const i=await o.models.generateContent({model:"gemini-2.5-pro",contents:l,config:{responseMimeType:"application/json",responseSchema:c,thinkingConfig:{thinkingBudget:32768}}});return h(u(i))}catch(i){throw f("generateExamAnalyticsReport",i),i}},Me=async(t,n,r,a)=>{if(y)return g("generateWeeklyStudyPlan","Mock mode active, returning stub study plan."),D();_();const o=d(),s=new Date,l=Object.entries(n).filter(([,p])=>p.mastery<.7).sort(([,p],[,T])=>p.mastery-T.mastery).slice(0,5).map(([p,T])=>({skillId:p,mastery:T.mastery})),c=Object.values(r).flat().filter(p=>new Date(p.srsData.due)<=s).length,i=a.filter(p=>p.classGrade===t.grade&&new Date(p.dueDate)>=s).map(p=>({title:p.title,dueDate:p.dueDate,id:p.id})),m=`
        ROLE: You are an expert academic coach for a CBSE student.
        GOAL: Create a balanced, prioritized, and actionable 7-day study plan.

        CONTEXT:
        - Student: ${t.name}, Class ${t.grade}
        - Today's Date: ${s.toISOString().split("T")[0]}
        - Weakest Topics (from DKT): ${JSON.stringify(l)}
        - Overdue Spaced Repetition (SRS) Flashcards: ${c}
        - Upcoming Assignments: ${JSON.stringify(i)}

        CRITICAL INSTRUCTIONS:
        1.  **Prioritize**: Assignments due soonest are highest priority. Then, address the weakest topics. Then schedule SRS reviews.
        2.  **Balance**: Distribute tasks across 7 days, starting from today. Avoid overloading any single day.
        3.  **Actionable Tasks**: Create tasks with a clear type ('assignment', 'review_weakness', 'srs_review').
        4.  **Structure**: For each task, create a JSON object with: id, type, title, subtitle, dueDate, and data (e.g., chapterId, assignmentId).
        5.  **Output**: Return a single raw JSON array of these StudyTask objects.
    `;try{const p=await o.models.generateContent({model:"gemini-2.5-pro",contents:m,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.OBJECT,properties:{id:{type:e.STRING},type:{type:e.STRING},title:{type:e.STRING},subtitle:{type:e.STRING},dueDate:{type:e.STRING},data:{type:e.OBJECT,properties:{chapterId:{type:e.STRING},assignmentId:{type:e.STRING}}}},required:["id","type","title","subtitle","dueDate"]}},thinkingConfig:{thinkingBudget:32768}}});return h(u(p))}catch(p){throw f("generateWeeklyStudyPlan",p),p}},$e=async t=>w("generateTransportOptimizationTips",async()=>{const n=d(),r=`
      ROLE: You are a transport logistics and efficiency expert for a school.
      TASK: Analyze the following bus route data and provide 2-3 concrete, actionable optimization tips.
      
      DATA:
      ${JSON.stringify(t,null,2)}
      
      INSTRUCTIONS:
      1.  Focus on identifying inefficiencies like frequent delays, low occupancy, or routes that could be combined.
      2.  Suggestions should be specific. For example, instead of "Improve delayed routes", say "Route B is frequently delayed. Analyze traffic patterns between 3 PM - 4 PM to identify bottlenecks."
      3.  Keep tips concise and easy to understand for a school administrator.
      
      OUTPUT: A raw JSON array of strings, where each string is an optimization tip.
    `,a=await n.models.generateContent({model:"gemini-2.5-flash",contents:r,config:{responseMimeType:"application/json",responseSchema:{type:e.ARRAY,items:{type:e.STRING}}}});return h(u(a))},()=>["Mock tip: Monitor route performance weekly and adjust stops as needed."]);export{Me as A,le as B,Ge as C,Ee as D,we as E,Ne as F,ge as a,ve as b,ie as c,de as d,Se as e,Te as f,fe as g,se as h,ce as i,he as j,me as k,ue as l,ye as m,Oe as n,Ae as o,Re as p,ke as q,$e as r,be as s,Ce as t,xe as u,qe as v,oe as w,_e as x,Ie as y,pe as z};
