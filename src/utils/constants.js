export const CURRENCY_SYMBOL = 'R';

export const TASK_CATEGORIES = [
    { label: 'Cleaning', value: 'Cleaning', icon: '🧹' },
    { label: 'Delivery', value: 'Delivery', icon: '🚚' },
    { label: 'Tech Help', value: 'Tech', icon: '💻' },
    { label: 'Moving', value: 'Moving', icon: '📦' },
    { label: 'Gardening', value: 'Gardening', icon: '🌿' },
    { label: 'Handyman', value: 'Handyman', icon: '🛠️' },
    { label: 'Pet Care', value: 'Pets', icon: '🐾' },
    { label: 'Other', value: 'Other', icon: '📍' },
];

export const TASK_STATUS = {
    OPEN: 'OPEN',
    ASSIGNED: 'ASSIGNED',
    PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DISPUTED: 'DISPUTED',
    INVITED: 'INVITED',
    PENDING_APPROVAL: 'PENDING_APPROVAL'
};

export const NEIGHBOURHOOD_TIPS = [
    {
        id: 1,
        title: 'Stay Safe',
        description: 'Always meet in public places for the first time.',
        icon: 'ShieldCheck'
    },
    {
        id: 2,
        title: 'Build Trust',
        description: 'Complete tasks on time to earn 5-star reviews.',
        icon: 'Star'
    },
    {
        id: 3,
        title: 'Communicate',
        description: 'Keep neighbours updated through the chat.',
        icon: 'MessageCircle'
    },
    {
        id: 4,
        title: 'Be Detailed',
        description: 'Add clear photos to your tasks to get better applicants.',
        icon: 'Camera'
    },
];
