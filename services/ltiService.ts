import { LtiContext } from '../types';
import { mockLtiLaunchPayload } from '../constants/ltiData';

/**
 * Simulates the backend processing of an LTI 1.3 launch request.
 * In a real app, this would involve validating a JWT sent from the LMS.
 * Here, we just use mock data and enrich it.
 * @param chapterId The resource link ID (in our case, the chapter to launch).
 */
export const handleLaunch = (chapterId: string): LtiContext => {
  console.log(`LTI Service: Simulating launch for chapter: ${chapterId}`);
  
  // In a real app, you would decode and validate the JWT from the LMS here.
  // We'll use our mock payload as the decoded token.
  const decodedToken = mockLtiLaunchPayload;

  const context: LtiContext = {
    isLtiLaunch: true,
    user: {
      id: decodedToken.sub,
      name: decodedToken.name,
      roles: decodedToken["https://purl.imsglobal.org/spec/lti/claim/roles"],
    },
    course: {
      id: decodedToken["https://purl.imsglobal.org/spec/lti/claim/context"].id,
      title: decodedToken["https://purl.imsglobal.org/spec/lti/claim/context"].title,
    },
    ags: {
      lineitem: decodedToken["https://purl.imsglobal.org/spec/lti-ags/claim/endpoint"].lineitem,
    },
    linkedResource: {
      chapterId: chapterId,
    }
  };
  
  return context;
};

/**
 * Simulates submitting a score back to the LMS using Assignment and Grade Services (AGS).
 * In a real app, this would be a secure, OAuth2-authenticated POST request from your server.
 * @param context The LTI context containing the AGS endpoint.
 * @param score The score to submit (0-100).
 */
export const submitScore = async (context: LtiContext, score: number): Promise<void> => {
    const { ags, user } = context;

    const gradePayload = {
        "scoreGiven": score,
        "scoreMaximum": 100,
        "comment": `Completed Alfanumrik lesson. Score: ${score.toFixed(0)}%`,
        "timestamp": new Date().toISOString(),
        "activityProgress": "Completed",
        "gradingProgress": "FullyGraded",
        "userId": user.id
    };

    console.log("LTI Service: Simulating AGS Grade Passback...");
    console.log(`POST to: ${ags.lineitem}/scores`);
    console.log("Payload:", JSON.stringify(gradePayload, null, 2));

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("LTI Service: Grade submission successful (simulated).");
    
    // In a real app, you would make a fetch() call from your backend here:
    /*
    const response = await fetch(`${ags.lineitem}/scores`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getOAuth2Token()}`, // Server-side logic to get a token
            'Content-Type': 'application/vnd.ims.lis.v1.score+json'
        },
        body: JSON.stringify(gradePayload)
    });
    if (!response.ok) {
        throw new Error("Failed to submit score to LMS.");
    }
    */
};