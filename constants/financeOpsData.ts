import { BusRoute, EnergyDataPoint, PrintQuota, FeeStatus } from '../types';

export const mockBusRoutes: BusRoute[] = [
    { id: 'route1', routeName: 'Route A - North', status: 'On Time', occupancy: 85, eta: '12 mins' },
    { id: 'route2', routeName: 'Route B - South', status: 'Delayed', occupancy: 92, eta: '25 mins' },
    { id: 'route3', routeName: 'Route C - East', status: 'On Time', occupancy: 70, eta: '18 mins' },
    { id: 'route4', routeName: 'Route D - West', status: 'Idle', occupancy: 0, eta: 'N/A' },
];

export const transportOptimizerTips: string[] = [
    "Consider merging Route C and D during off-peak hours to save fuel, based on low occupancy data.",
    "Route B is frequently delayed. Analyze traffic patterns between 3 PM - 4 PM to identify bottlenecks.",
];

export const mockEnergyData: EnergyDataPoint[] = [
    { day: 'Mon', consumption: 250, solarGeneration: 150 },
    { day: 'Tue', consumption: 270, solarGeneration: 180 },
    { day: 'Wed', consumption: 260, solarGeneration: 175 },
    { day: 'Thu', consumption: 280, solarGeneration: 160 },
    { day: 'Fri', consumption: 240, solarGeneration: 190 },
    { day: 'Sat', consumption: 100, solarGeneration: 80 },
    { day: 'Sun', consumption: 80, solarGeneration: 70 },
];

export const energyOptimizerTips: string[] = [
    "Schedule high-energy tasks like water pumping during peak solar generation hours (11 AM - 2 PM).",
    "On weekends, consumption is low but so is generation. Check panel cleanliness to maximize efficiency.",
];

export const mockPrintQuotas: PrintQuota[] = [
    // FIX: Added missing 'id' properties to conform to the PrintQuota type.
    { id: 'pq1', staffName: 'Admin Office', quota: 2000, used: 1780 },
    { id: 'pq2', staffName: 'Science Dept.', quota: 1500, used: 950 },
    { id: 'pq3', staffName: 'Maths Dept.', quota: 1500, used: 1450 },
    { id: 'pq4', staffName: 'Library', quota: 1000, used: 430 },
];

export const mockFeeStatus: FeeStatus[] = [
    // FIX: Added missing 'id' properties to conform to the FeeStatus type.
    { id: 'fs1', studentId: 101, studentName: 'Rohan Sharma', grade: '10', status: 'Paid', amountDue: 0 },
    { id: 'fs2', studentId: 102, studentName: 'Priya Singh', grade: '9', status: 'Overdue', amountDue: 15000 },
    { id: 'fs3', studentId: 103, studentName: 'Aarav Gupta', grade: '10', status: 'Paid', amountDue: 0 },
    { id: 'fs4', studentId: 104, studentName: 'Sanya Verma', grade: '10', status: 'Partially Paid', amountDue: 5000 },
    { id: 'fs5', studentId: 105, studentName: 'Karan Mehra', grade: '11', status: 'Overdue', amountDue: 18000 },
];

export const feeReminderTemplate = (studentName: string, amount: number) => `
Dear Parent of ${studentName},

This is a gentle reminder regarding the outstanding school fee payment of ₹${amount}. The due date for this payment was [Due Date].

We kindly request you to complete the payment at your earliest convenience to avoid any late fees. You can pay online through the school portal or at the school office.

If you have already made the payment, please disregard this message.

Thank you,
[School Name] - Accounts Dept.
`;