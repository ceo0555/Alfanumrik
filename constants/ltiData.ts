export const mockLtiLaunchPayload = {
    "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest",
    "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
    "https://purl.imsglobal.org/spec/lti/claim/deployment_id": "YOUR_DEPLOYMENT_ID",
    "https://purl.imsglobal.org/spec/lti/claim/target_link_uri": "https://yourapp.com/launch",
    "https://purl.imsglobal.org/spec/lti/claim/resource_link": {
        "id": "resource-link-id-123",
        "title": "Chapter 1: Chemical Reactions"
    },
    "https://purl.imsglobal.org/spec/lti/claim/roles": [
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student"
    ],
    "sub": "user-uuid-from-canvas",
    "name": "Rohan Sharma",
    "given_name": "Rohan",
    "family_name": "Sharma",
    "email": "rohan.sharma@school.edu",
    "https://purl.imsglobal.org/spec/lti/claim/context": {
        "id": "course-id-from-canvas",
        "label": "SCI-101",
        "title": "Grade 10 Science",
        "type": [
            "http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering"
        ]
    },
    "https://purl.imsglobal.org/spec/lti/claim/tool_platform": {
        "name": "Canvas",
        "contact_email": "notifications@instructure.com",
        "description": "Canvas LMS",
        "url": "https://canvas.instructure.com",
        "product_family_code": "canvas",
        "version": "cloud"
    },
    "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint": {
        "scope": [
            "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
            "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
            "https://purl.imsglobal.org/spec/lti-ags/scope/score"
        ],
        "lineitems": "https://your-canvas-instance.com/api/lti/courses/123/line_items",
        "lineitem": "https://your-canvas-instance.com/api/lti/courses/123/line_items/456"
    },
    "https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice": {
        "context_memberships_url": "https://your-canvas-instance.com/api/lti/courses/123/names_and_roles",
        "service_versions": [
            "2.0"
        ]
    },
    "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings": {
        "deep_link_return_url": "https://your-canvas-instance.com/courses/123/deep_linking_response",
        "accept_types": [
            "ltiResourceLink"
        ],
        "accept_presentation_document_targets": [
            "iframe",
            "window"
        ]
    }
};

export const getMockDeepLinkingResponse = (chapterId: string, chapterName: string) => ({
    body: {
        "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiDeepLinkingResponse",
        "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
        "https://purl.imsglobal.org/spec/lti/claim/deployment_id": "YOUR_DEPLOYMENT_ID",
        "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": [
            {
                "type": "ltiResourceLink",
                "title": chapterName,
                "url": `https://yourapp.com/?lti_launch=true&chapterId=${encodeURIComponent(chapterId)}`,
                "presentation": {
                    "documentTarget": "iframe"
                },
                "custom": {
                    "chapter_id": chapterId
                }
            }
        ]
    }
});

export const mockNrpsRosterResponse = {
    "id": "https://your-canvas-instance.com/api/lti/courses/123/names_and_roles",
    "members": [
        {
            "status": "Active",
            "name": "Jane Instructor",
            "picture": "https://.../avatar.jpg",
            "given_name": "Jane",
            "family_name": "Instructor",
            "email": "jane@school.edu",
            "user_id": "user-uuid-jane",
            "lis_person_sourcedid": "jane-sourcedid",
            "roles": [
                "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor"
            ]
        },
        {
            "status": "Active",
            "name": "Rohan Sharma",
            "picture": "https://.../avatar.jpg",
            "given_name": "Rohan",
            "family_name": "Sharma",
            "email": "rohan@school.edu",
            "user_id": "user-uuid-rohan",
            "lis_person_sourcedid": "rohan-sourcedid",
            "roles": [
                "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student"
            ]
        },
        {
            "status": "Active",
            "name": "Priya Singh",
            "picture": "https://.../avatar.jpg",
            "given_name": "Priya",
            "family_name": "Singh",
            "email": "priya@school.edu",
            "user_id": "user-uuid-priya",
            "lis_person_sourcedid": "priya-sourcedid",
            "roles": [
                "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student"
            ]
        }
    ]
};