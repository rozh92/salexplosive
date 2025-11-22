
import { Sale } from '../types';

export const getSalesValueForPeriod = (sales: Sale[], period: 'today' | 'week' | 'month'): number => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Adjust for week start on Monday
    const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days to subtract to get to Monday
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - diff);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let startDate: Date;
    switch (period) {
        case 'today':
            startDate = startOfToday;
            break;
        case 'week':
            startDate = startOfWeek;
            break;
        case 'month':
            startDate = startOfMonth;
            break;
        default:
            return 0;
    }
    
    return (sales || [])
        .filter(s => new Date(s.date) >= startDate)
        .reduce((sum, sale) => sum + sale.value, 0);
};

export const getAverageSalesValueForPeriod = (sales: Sale[], period: 'week' | 'month'): number => {
    const now = new Date();
    const totalSales = getSalesValueForPeriod(sales, period);
    
    let daysElapsed = 0;
    
    if (period === 'week') {
        const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday
        daysElapsed = (dayOfWeek === 0) ? 7 : dayOfWeek;
    } else { // month
        daysElapsed = now.getDate();
    }

    if (daysElapsed === 0) return totalSales; // Avoid division by zero on the first day
    
    return totalSales / daysElapsed;
};
