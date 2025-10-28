import { CodingModule, CrossCurricularProject, StudentPortfolioProject } from '../types';

export const codingModules: CodingModule[] = [
    {
        id: 'ai-foundations-m1',
        title: 'AI Foundations for Middle School',
        description: 'A 12-hour introductory module designed to align with the CBSE AI curriculum for middle school. It balances theoretical concepts with hands-on activities, culminating in a simple AI project.',
        targetGrades: '6-8',
        lessonPlan: [
            { type: 'Theory', title: 'What is AI? Introduction to Concepts', duration: '45 mins' },
            { type: 'Activity', title: 'Activity: AI in Daily Life Scavenger Hunt', duration: '45 mins' },
            { type: 'Theory', title: 'Domains of AI: Data Science, CV, NLP', duration: '60 mins' },
            { type: 'Activity', title: 'Activity: Teachable Machine - Image Classification', duration: '120 mins' },
            { type: 'Theory', title: 'Introduction to Python & Basic Syntax', duration: '90 mins' },
            { type: 'Activity', title: 'Activity: "Hello World" & Simple Chatbot Logic in Python', duration: '90 mins' },
            { type: 'Theory', title: 'AI Ethics & Bias', duration: '60 mins' },
            { type: 'Activity', title: 'Project: Build a Rock-Paper-Scissors Game with AI', duration: '180 mins' },
            { type: 'Activity', title: 'Portfolio Showcase & Peer Review', duration: '30 mins' },
        ],
    },
    {
        id: 'ai-advanced-s1',
        title: 'Advanced AI & Python',
        description: 'A 20-hour module for senior students focusing on practical applications of AI using Python libraries. Aligns with CBSE Skill Subject "Artificial Intelligence".',
        targetGrades: '9-12',
        lessonPlan: [
            { type: 'Theory', title: 'Recap: Python Fundamentals & Data Structures', duration: '90 mins' },
            { type: 'Activity', title: 'Activity: Data Analysis with Pandas & NumPy', duration: '120 mins' },
            { type: 'Theory', title: 'Introduction to Machine Learning Models', duration: '60 mins' },
            { type: 'Activity', title: 'Activity: Building a Predictive Model with Scikit-learn', duration: '180 mins' },
            { type: 'Theory', title: 'Deep Dive into Natural Language Processing (NLP)', duration: '90 mins' },
            { type: 'Activity', title: 'Activity: Sentiment Analysis of Movie Reviews', duration: '180 mins' },
            { type: 'Theory', title: 'Understanding Computer Vision (CV)', duration: '60 mins' },
            { type: 'Activity', title: 'Project: Capstone Project (e.g., Chatbot, Image Recognizer)', duration: '360 mins' },
            { type: 'Activity', title: 'Project Presentations & Viva', duration: '60 mins' },
        ],
    },
];

export const crossCurricularProjects: CrossCurricularProject[] = [
    {
        id: 'ccp-ss-10-1',
        title: 'AI for Climate Change Analysis',
        subject: 'Social Studies',
        grade: '10',
        description: 'Students use a simplified dataset and AI tools to identify trends in climate data and correlate them with historical events.',
        objectives: [
            'Understand how AI can be used to analyze large datasets.',
            'Identify patterns in climate data.',
            'Connect data trends to concepts of industrialization and globalization.',
        ],
        tasks: [
            'Analyze a provided temperature dataset using a visual AI tool.',
            'Generate charts showing temperature anomalies over time.',
            'Write a report on the findings, linking them to historical industrial periods.',
        ],
        evidence: '',
    },
    {
        id: 'ccp-sci-9-1',
        title: 'AI Model for Classifying Organisms',
        subject: 'Science',
        grade: '9',
        description: 'Using Teachable Machine, students train an image classification model to distinguish between different types of plants or animals based on images.',
        objectives: [
            'Understand the basics of machine learning and image classification.',
            'Reinforce knowledge of biological classification systems.',
            'Evaluate the accuracy and limitations of their AI model.',
        ],
        tasks: [
            'Gather images of different species.',
            'Train an image classification model using Teachable Machine.',
            'Test the model with new images and document its accuracy.',
        ],
        evidence: '',
    },
    {
        id: 'ccp-math-8-1',
        title: 'Predictive Models with AI',
        subject: 'Maths',
        grade: '8',
        description: 'Students explore how linear regression can be used as a simple predictive AI model. They use a tool to plot data and predict future values.',
        objectives: [
            'Connect the mathematical concept of linear equations to predictive AI.',
            'Understand the concept of a "best-fit" line.',
            'Make predictions based on a dataset.',
        ],
        tasks: [
            'Use an online graphing tool to plot provided data points.',
            'Draw a line of best fit.',
            'Use the line to predict a value for a future data point.',
        ],
        evidence: '',
    },
    {
        id: 'ccp-art-7-1',
        title: 'AI-Generated Art & Music',
        subject: 'Arts',
        grade: '7',
        description: 'Students experiment with generative AI tools to create visual art from text prompts and simple musical compositions, exploring concepts of creativity and authorship.',
        objectives: [
            'Understand the concept of generative AI.',
            'Explore different AI art generation styles.',
            'Discuss the role of AI in creative expression.',
        ],
        tasks: [
            'Use a text-to-image generator to create artwork based on a poem.',
            'Use a music generation tool to create a short melody.',
            'Present their creations and discuss the process.',
        ],
        evidence: '',
    },
    {
        id: 'ccp-pe-11-1',
        title: 'AI in Sports Analytics',
        subject: 'Physical Education',
        grade: '11',
        description: 'Students analyze a small dataset of cricket or football performance statistics (e.g., runs scored, wickets taken) to identify patterns and make simple predictions about player performance.',
        objectives: [
            'Introduce the use of data analysis in sports.',
            'Understand basic statistical concepts like average and trends.',
            'Hypothesize factors that contribute to player performance.',
        ],
        tasks: [
            'Analyze a spreadsheet with player statistics.',
            'Identify the player with the best average performance.',
            'Create a chart visualizing a player\'s performance over a season.',
        ],
        evidence: '',
    },
];

export const mockPortfolios: StudentPortfolioProject[] = [
    { studentId: 101, studentName: 'Rohan Sharma', projectTitle: 'Rock-Paper-Scissors AI', status: 'Completed', submissionUrl: '#' },
    { studentId: 102, studentName: 'Priya Singh', projectTitle: 'Rock-Paper-Scissors AI', status: 'In Progress', submissionUrl: '#' },
    { studentId: 103, studentName: 'Aarav Gupta', projectTitle: 'Rock-Paper-Scissors AI', status: 'Completed', submissionUrl: '#' },
    { studentId: 104, studentName: 'Sanya Verma', projectTitle: 'Sentiment Analysis of Movie Reviews', status: 'In Progress', submissionUrl: '#' },
    { studentId: 105, studentName: 'Karan Mehra', projectTitle: 'Sentiment Analysis of Movie Reviews', status: 'Completed', submissionUrl: '#' },
    { studentId: 106, studentName: 'Anika Reddy', projectTitle: 'Rock-Paper-Scissors AI', status: 'Completed', submissionUrl: '#' },
];