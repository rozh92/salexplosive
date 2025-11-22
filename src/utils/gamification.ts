
import { Sale } from '../types';

export const BADGE_DEFINITIONS: Record<string, { name: string, description: string }> = {
    '1_sale': { name: 'Eerste Verkoop!', description: 'Je hebt je eerste verkoop geregistreerd!' },
    '10_sales': { name: 'Verkoop Topper', description: '10 contracten verkocht!' },
    '25_sales': { name: 'Sales Expert', description: '25 contracten verkocht!' },
    '50_sales': { name: 'Sales Master', description: '50 contracten verkocht!' },
};

export const checkAndAwardBadges = (salesValue: number, currentBadges: string[]): string[] => {
    const newBadges = [...currentBadges];
    
    if (salesValue >= 1 && !newBadges.includes('1_sale')) {
        newBadges.push('1_sale');
    }
    if (salesValue >= 10 && !newBadges.includes('10_sales')) {
        newBadges.push('10_sales');
    }
    if (salesValue >= 25 && !newBadges.includes('25_sales')) {
        newBadges.push('25_sales');
    }
     if (salesValue >= 50 && !newBadges.includes('50_sales')) {
        newBadges.push('50_sales');
    }
    
    return newBadges;
};

export const calculateStreak = (sales: Sale[]): number => {
    if (!sales || sales.length === 0) {
        return 0;
    }

    // Get unique sale dates in YYYY-MM-DD format, sorted descending
    const saleDates = [...new Set(sales.filter(s => s && s.date).map(s => s.date.split('T')[0]))].sort().reverse();
    
    if (saleDates.length === 0) {
        return 0;
    }

    let streak = 0;
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if there is a sale today or yesterday to start the streak count
    if (saleDates[0] === todayStr || saleDates[0] === yesterdayStr) {
        streak = 1;
        let lastDate = new Date(saleDates[0]);

        for (let i = 1; i < saleDates.length; i++) {
            const currentDate = new Date(saleDates[i]);
            const diffTime = lastDate.getTime() - currentDate.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);

            if (diffDays === 1) {
                streak++;
                lastDate = currentDate;
            } else {
                break; // Streak is broken
            }
        }
    }

    return streak;
};
