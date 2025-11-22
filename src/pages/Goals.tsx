

import React, { useState } from 'react';
import { Goal } from '../types';
import { PlusIcon, TrashIcon, TrophyIcon } from '../components/icons/Icons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';

const Goals: React.FC = () => {
  const { goals, addGoal, deleteGoal } = useAuth();
  const { t } = useTranslation();
  
  const [salesTarget, setSalesTarget] = useState<number>(5);
  const [salesGoalType, setSalesGoalType] = useState<'daily' | 'weekly'>('daily');

  const handleAddSalesGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salesTarget <= 0) return;
    try {
        const existingGoal = goals.find(g => g.type === salesGoalType);
        if (existingGoal) {
            alert(`Er is al een ${salesGoalType === 'daily' ? 'dagelijks' : 'wekelijks'} verkoopdoel ingesteld. Verwijder het oude doel eerst om een nieuwe in te stellen.`);
            return;
        }
        await addGoal({
          target: salesTarget,
          type: salesGoalType,
        });
        setSalesTarget(5); // Reset form
    } catch (error: any) {
        alert(`Fout bij toevoegen van verkoopdoel: ${error.message}`);
    }
  };
  
  const handleDeleteGoal = async (id: string) => {
    try {
        await deleteGoal(id);
    } catch (error: any) {
        alert(`Fout bij verwijderen van doel: ${error.message}`);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <h1 className="text-4xl font-bold mb-8">{t('goals_title')}</h1>
      
      <div className="bg-brand-surface rounded-xl p-6 shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">{t('new_sales_goal')}</h2>
        <form onSubmit={handleAddSalesGoal} className="flex flex-col sm:flex-row items-center gap-4">
          <div className='flex-grow w-full sm:w-auto'>
            <label htmlFor="salesTarget" className="sr-only">{t('sales_goal_amount_label')}</label>
            <input 
                type="number"
                id="salesTarget"
                value={salesTarget} 
                onChange={(e) => setSalesTarget(parseInt(e.target.value) || 0)}
                placeholder={t('sales_goal_amount_label')}
                min="1"
                className="w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
              <select value={salesGoalType} onChange={(e) => setSalesGoalType(e.target.value as 'daily' | 'weekly')} className="w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none">
                <option value="daily">{t('sales_goal_period_day')}</option>
                <option value="weekly">{t('sales_goal_period_week')}</option>
              </select>
              <button type="submit" className="bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg flex items-center hover:opacity-90 transition-opacity">
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('set_goal')}
              </button>
          </div>
        </form>
      </div>
      
      <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary">{t('active_sales_goals')}</h2>
        <div className="space-y-3">
          {goals.length > 0 ? goals.map(goal => (
            <div key={goal.id} className="flex items-center justify-between bg-brand-secondary p-4 rounded-lg">
              <div className="flex items-center">
                <TrophyIcon className="w-6 h-6 mr-3 text-brand-primary" />
                <p className="font-medium text-brand-text-primary">
                  {goal.type === 'daily' ? t('daily_goal') : t('weekly_goal')} 
                  <span className="font-bold text-brand-primary">{goal.target} {t('sales')}</span>
                </p>
              </div>
              <button onClick={() => handleDeleteGoal(goal.id)} className="text-brand-text-secondary hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10 w-8 h-8 grid place-items-center">
                  <TrashIcon className="w-5 h-5"/>
              </button>
            </div>
          )) : (
              <p className="text-brand-text-secondary">{t('goals_empty_state')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Goals;
