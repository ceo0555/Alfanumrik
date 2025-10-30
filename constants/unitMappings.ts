// This file maps curriculum units to their respective chapters.
// This is used by the Practice Centre to generate targeted "Unit Tests".

export const unitMappings: { [grade: string]: { [subject: string]: { [unitName: string]: string[] } } } = {
    '10': {
        'Science': {
            'Chemical Substances': [
                'Chemical Reactions and Equations',
                'Acids, Bases and Salts',
                'Metals and Non-metals',
                'Carbon and its Compounds',
            ],
            'World of Living': [
                'Life Processes',
                'Control and Coordination',
                'How do Organisms Reproduce?',
                'Heredity',
            ],
            'Natural Phenomena': [
                'Light - Reflection and Refraction',
                'Human Eye and Colourful World',
            ],
            'Effects of Current': [
                'Electricity',
                'Magnetic Effects of Electric Current',
            ],
            'Natural Resources': [
                'Our Environment',
            ],
        },
        'Maths': {
            'Number Systems': ['Real Numbers'],
            'Algebra': [
                'Polynomials',
                'Pair of Linear Equations in Two Variables',
                'Quadratic Equations',
                'Arithmetic Progressions',
            ],
            'Coordinate Geometry': ['Coordinate Geometry'],
            'Geometry': ['Triangles', 'Circles', 'Constructions'],
            'Trigonometry': ['Introduction to Trigonometry', 'Some Applications of Trigonometry'],
            'Mensuration': ['Areas Related to Circles', 'Surface Areas and Volumes'],
            'Statistics & Probability': ['Statistics', 'Probability'],
        }
    }
};