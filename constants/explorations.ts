import { BrainCircuitIcon, GlobeIcon, DatabaseIcon } from '../constants/icons';

export interface ExplorationItem {
    id: string;
    type: 'research' | 'global' | 'data';
    title: string;
    summary: string;
    source: string;
    subjects: string[];
}

export const explorationItems: ExplorationItem[] = [
    {
        id: 'res1',
        type: 'research',
        title: 'The Role of Graphene in Next-Gen Water Filtration',
        summary: 'A recent study in Nature Nanotechnology explores how single-layer graphene membranes can achieve ultra-fast water permeation while rejecting salt ions, a breakthrough for desalination technology.',
        source: 'Nature Nanotechnology, Vol. 18',
        subjects: ['Chemistry', 'Physics'],
    },
    {
        id: 'glob1',
        type: 'global',
        title: 'How Maglev Trains Use Electromagnetism',
        summary: 'The Shanghai Maglev is the world\'s first commercial magnetic levitation line. It uses powerful electromagnets to levitate and propel the train, connecting directly to concepts of magnetic effects of electric current from the Class 10 syllabus.',
        source: 'World Economic Forum',
        subjects: ['Physics', 'Social Studies'],
    },
    {
        id: 'data1',
        type: 'data',
        title: 'India\'s Changing Agricultural Landscape (1960-2020)',
        summary: 'Explore a dataset from the Food and Agriculture Organization (FAO) showing the change in production of major crops like wheat, rice, and pulses in India over 60 years. Analyze trends and connect them to historical events like the Green Revolution.',
        source: 'FAOSTAT Database',
        subjects: ['Social Studies', 'Maths'],
    },
    {
        id: 'res2',
        type: 'research',
        title: 'CRISPR-Cas9: Gene Editing and its Ethical Implications',
        summary: 'A summary of the foundational 2012 paper by Doudna and Charpentier on using CRISPR-Cas9 as a programmable gene-editing tool. This links to the Class 12 Biology chapter on Biotechnology.',
        source: 'Science, Vol. 337',
        subjects: ['Biology'],
    },
    {
        id: 'glob2',
        type: 'global',
        title: 'The Suez Canal and its Impact on Global Trade',
        summary: 'The Suez Canal is an artificial sea-level waterway in Egypt, connecting the Mediterranean Sea to the Red Sea. It is one of the world\'s most heavily used shipping lanes, directly impacting global supply chains and the concept of "Lifelines of National Economy".',
        source: 'National Geographic',
        subjects: ['Social Studies'],
    },
     {
        id: 'data2',
        type: 'data',
        title: 'Urban Air Quality Index (AQI) Across Major Indian Cities',
        summary: 'This dataset provides daily AQI readings for cities like Delhi, Mumbai, and Bengaluru. Students can use this to practice data handling, calculate averages, and correlate pollution levels with events like festivals or seasonal changes.',
        source: 'CPCB, India',
        subjects: ['Environmental Studies', 'Maths'],
    }
];
