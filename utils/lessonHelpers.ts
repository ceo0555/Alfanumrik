import { LessonPack, LessonStep } from '../types';

export const transformLessonPackToSteps = (lessonPack: LessonPack): LessonStep[] => {
  const steps: LessonStep[] = [];

  if (!lessonPack) return steps;

  // 1. Topic Title
  steps.push({
    type: 'topic_title',
    title: 'Introduction',
    content: { topic_name: lessonPack.topic_name },
  });

  // 2. Core Explanation
  if (lessonPack.student_explanation?.core_explanation) {
    steps.push({
      type: 'core_explanation',
      title: 'Core Concept',
      content: lessonPack.student_explanation.core_explanation,
    });
  }

  // 2.5. Quick Check after core explanation
  if (lessonPack.student_explanation?.quick_check) {
    steps.push({
      type: 'quick_check',
      title: 'Concept Check',
      content: lessonPack.student_explanation.quick_check,
    });
  }

  // 3. Image Briefs
  lessonPack.image_briefs?.forEach(brief => {
    steps.push({
      type: 'image_brief',
      title: 'Visual Aid',
      content: brief,
    });
  });

  // 4. Worked Examples
  lessonPack.student_explanation?.worked_examples?.forEach(ex => {
    steps.push({
      type: 'worked_example',
      title: 'Worked Example',
      content: ex,
    });
  });

  // 5. Guided Practice
  lessonPack.student_explanation?.guided_practice?.forEach(gp => {
    steps.push({
      type: 'guided_practice',
      title: 'Guided Practice',
      content: gp,
    });
  });
  
  // 6. Fill in the Blanks
  lessonPack.student_explanation?.fill_in_the_blanks?.forEach(fb => {
    steps.push({
      type: 'fill_in_the_blanks',
      title: 'Check Your Knowledge',
      content: fb,
    });
  });
  
  // 7. Interactive Simulations
  lessonPack.student_explanation?.interactive_simulations?.forEach(sim => {
    steps.push({
      type: 'interactive_simulation',
      title: 'Interactive Simulation',
      content: sim,
    });
  });

  // 7.5 Interactive Videos
  lessonPack.student_explanation?.interactive_videos?.forEach(video => {
    steps.push({
      type: 'interactive_video',
      title: 'Interactive Video',
      content: video,
    });
  });

  // 8. Independent Practice
  lessonPack.student_explanation?.independent_practice?.forEach(ip => {
    steps.push({
      type: 'independent_practice',
      title: 'Practice Problem',
      content: ip,
    });
  });

  // 9. HOTS
  lessonPack.student_explanation?.HOTS?.forEach(hots => {
    steps.push({
      type: 'HOTS',
      title: 'Higher Order Thinking',
      content: hots,
    });
  });

  // 10. Common Errors
  lessonPack.student_explanation?.common_errors_and_fixes?.forEach(err => {
    steps.push({
      type: 'common_error',
      title: 'Common Mistake',
      content: err,
    });
  });
  
  // 11. Assessment Section
  if (lessonPack.assessment_blueprint?.question_pool?.length > 0) {
    steps.push({
        type: 'assessment_intro',
        title: 'Test Your Knowledge',
        content: `Let's check your understanding with a few questions.`
    });
    lessonPack.assessment_blueprint.question_pool.forEach((q, index) => {
        steps.push({
            type: 'assessment_question',
            title: `Question ${index + 1}`,
            content: { question: q, qNum: index + 1 },
        });
    });
  }

  // 12. Adaptive Follow-up Trigger (if assessment exists)
  if (lessonPack.assessment_blueprint?.question_pool?.length > 0) {
    steps.push({
      type: 'adaptive_intro',
      title: 'Personalized Plan',
      content: 'Get a personalized plan based on your results.',
    });
  }

  // Handle a case where an adaptive plan is passed in directly
  if ('adaptivePlan' in lessonPack && Array.isArray((lessonPack as any).adaptivePlan)) {
    const plan = (lessonPack as any).adaptivePlan;
    if (plan.length > 0) {
        plan.forEach(item => {
            steps.push({
                type: 'adaptive_follow_up',
                title: 'Adaptive Follow-up',
                content: item
            });
        });
    }
  }

  // 13. Feedback
  steps.push({
      type: 'feedback',
      title: 'Lesson Feedback',
      content: { submitted: false },
  });


  return steps;
};