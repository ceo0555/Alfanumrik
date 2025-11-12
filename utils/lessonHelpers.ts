import { LessonPack, LessonStep, AdaptiveFollowUp } from '../types';

export const transformLessonPackToSteps = (lessonPack: LessonPack): LessonStep[] => {
  const steps: LessonStep[] = [];

  if (!lessonPack) return steps;
  
  const addStep = (stepData: Omit<LessonStep, 'originalIndex'>) => {
    steps.push({ ...stepData, originalIndex: steps.length } as LessonStep);
  };

  // 1. Topic Title
  addStep({
    type: 'topic_title',
    title: 'Introduction',
    content: { topic_name: lessonPack.topic_name },
  });

  // 2. Core Explanation
  if (lessonPack.student_explanation?.core_explanation) {
    addStep({
      type: 'core_explanation',
      title: 'Core Concept',
      content: lessonPack.student_explanation.core_explanation,
    });
  }

  // 2.5. Quick Check after core explanation
  if (lessonPack.student_explanation?.quick_check) {
    addStep({
      type: 'quick_check',
      title: 'Concept Check',
      content: lessonPack.student_explanation.quick_check,
    });
  }

  // 3. Matching Quiz
  lessonPack.student_explanation?.matching_quizzes?.forEach(mq => {
    addStep({
      type: 'matching_quiz',
      title: 'Match the Terms',
      content: mq,
    });
  });

  // 4. Worked Examples
  lessonPack.student_explanation?.worked_examples?.forEach(ex => {
    addStep({
      type: 'worked_example',
      title: 'Worked Example',
      content: ex,
    });
  });

  // 5. Guided Practice
  lessonPack.student_explanation?.guided_practice?.forEach(gp => {
    addStep({
      type: 'guided_practice',
      title: 'Guided Practice',
      content: gp,
    });
  });
  
  // 6. Fill in the Blanks
  lessonPack.student_explanation?.fill_in_the_blanks?.forEach(fb => {
    addStep({
      type: 'fill_in_the_blanks',
      title: 'Check Your Knowledge',
      content: fb,
    });
  });
  
  // 7. Interactive Simulations
  lessonPack.student_explanation?.interactive_simulations?.forEach(sim => {
    addStep({
      type: 'interactive_simulation',
      title: 'Interactive Simulation',
      content: sim,
    });
  });

  // 7.5 Interactive Videos
  lessonPack.student_explanation?.interactive_videos?.forEach(video => {
    addStep({
      type: 'interactive_video',
      title: 'Interactive Video',
      content: video,
    });
  });

  // 8. Independent Practice
  lessonPack.student_explanation?.independent_practice?.forEach(ip => {
    addStep({
      type: 'independent_practice',
      title: 'Practice Problem',
      content: ip,
    });
  });

  // 9. HOTS
  lessonPack.student_explanation?.HOTS?.forEach(hots => {
    addStep({
      type: 'HOTS',
      title: 'Higher Order Thinking',
      content: hots,
    });
  });

  // 10. Common Errors
  lessonPack.student_explanation?.common_errors_and_fixes?.forEach(err => {
    addStep({
      type: 'common_error',
      title: 'Common Mistake',
      content: err,
    });
  });
  
  // 11. Assessment Section
  if (lessonPack.assessment_blueprint?.question_pool?.length > 0) {
    addStep({
        type: 'assessment_intro',
        title: 'Test Your Knowledge',
        content: `Let's check your understanding with a few questions.`
    });
    lessonPack.assessment_blueprint.question_pool.forEach((q, index) => {
        addStep({
            type: 'assessment_question',
            title: `Question ${index + 1}`,
            content: { question: q, qNum: index + 1 },
        });
    });
  }

  // 12. Adaptive Follow-up Trigger (if assessment exists)
  if (lessonPack.assessment_blueprint?.question_pool?.length > 0) {
    addStep({
      type: 'adaptive_intro',
      title: 'Personalized Plan',
      content: 'Get a personalized plan based on your results.',
    });
  }

  // Handle a case where an adaptive plan is passed in directly
    if ('adaptivePlan' in lessonPack && Array.isArray((lessonPack as { adaptivePlan: AdaptiveFollowUp[] }).adaptivePlan)) {
      const plan = (lessonPack as { adaptivePlan: AdaptiveFollowUp[] }).adaptivePlan;
    if (plan.length > 0) {
          plan.forEach((item: AdaptiveFollowUp) => {
            addStep({
                type: 'adaptive_follow_up',
                title: 'Adaptive Follow-up',
                content: item
            });
        });
    }
  }

  // 13. Feedback
  addStep({
      type: 'feedback',
      title: 'Lesson Feedback',
      content: { submitted: false },
  });


  return steps;
};