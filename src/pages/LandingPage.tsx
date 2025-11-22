import React from 'react';
import { SparklesIcon, ChartBarIcon, UsersIcon, LightBulbIcon, UserGroupIcon } from '../components/icons/Icons';
import PublicHeader from '../components/PublicHeader';
import { useTranslation } from '../context/TranslationContext';
import PublicFooter from '../components/PublicFooter'; // Belangrijke import

const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    { nameKey: 'feature_pitch_generator_name', descriptionKey: 'feature_pitch_generator_desc', icon: SparklesIcon },
    { nameKey: 'feature_crm_name', descriptionKey: 'feature_crm_desc', icon: UsersIcon },
    { nameKey: 'feature_compa_name', descriptionKey: 'feature_compa_desc', icon: LightBulbIcon },
    { nameKey: 'feature_gamification_name', descriptionKey: 'feature_gamification_desc', icon: ChartBarIcon },
    { nameKey: 'feature_management_name', descriptionKey: 'feature_management_desc', icon: UserGroupIcon },
    { nameKey: 'feature_ai_name', descriptionKey: 'feature_ai_desc', icon: SparklesIcon },
  ];

  return (
    <div className="text-brand-text-primary min-h-screen isolate flex flex-col">
      <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden blur-3xl opacity-90 dark:opacity-70">
          <div className="absolute top-[-10rem] left-[-20rem] w-[50rem] h-[50rem] rounded-full bg-purple-400/80" />
          <div className="absolute bottom-[-15rem] right-[-15rem] w-[50rem] h-[50rem] rounded-full bg-brand-primary/60" />
          <div className="absolute bottom-[5rem] left-[15rem] w-[30rem] h-[30rem] rounded-full bg-green-400/40" />
      </div>

      <PublicHeader />

      <main className="pt-20 flex-grow">
        {/* Hero Section */}
        <div className="relative">
          <div className="relative max-w-7xl mx-auto py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-text-primary"
                  dangerouslySetInnerHTML={{ __html: t('landing_hero_title') }}
                />
                <p className="mt-6 max-w-2xl mx-auto lg:mx-0 text-lg text-brand-text-secondary">
                  {t('landing_hero_subtitle')}
                </p>
                <div className="mt-8">
                  <a href="/#/register" className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full text-lg hover:opacity-90 transition-opacity transform hover:scale-105 inline-block">
                    {t('landing_hero_cta')}
                  </a>
                  <p className="mt-4 text-sm text-brand-text-secondary">
                    {t('landing_hero_trial')}
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <img src="https://i.imgur.com/g9KhwMg.png" alt="Sales Copilot App Mockup" className="max-w-sm w-full h-auto rounded-2xl shadow-2xl transform lg:rotate-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-brand-surface/50 backdrop-blur-lg p-8 sm:p-12 rounded-2xl border border-brand-border/50 shadow-xl">
                <div className="text-center">
                  <h2 className="text-base font-semibold text-brand-primary tracking-wider uppercase">{t('landing_features_supertitle')}</h2>
                  <p className="mt-2 text-3xl font-extrabold text-brand-text-primary tracking-tight sm:text-4xl">
                    {t('landing_features_title')}
                  </p>
                  <p className="mt-4 max-w-2xl mx-auto text-xl text-brand-text-secondary">
                    {t('landing_features_subtitle')}
                  </p>
                </div>

                <div className="mt-20">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature) => (
                      <div key={feature.nameKey} className="bg-brand-surface/70 p-6 rounded-xl shadow-lg border border-brand-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-brand-primary text-white mb-4">
                            <feature.icon className="h-6 w-6" aria-hidden="true" />
                          </div>
                          <h3 className="text-lg leading-6 font-bold text-brand-text-primary">{t(feature.nameKey)}</h3>
                        <p className="mt-2 text-base text-brand-text-secondary">{t(feature.descriptionKey)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="bg-brand-surface/50 backdrop-blur-lg">
            <div className="max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold text-brand-text-primary sm:text-4xl"
                    dangerouslySetInnerHTML={{ __html: t('landing_cta_title') }}
                />
                <p className="mt-4 text-lg leading-6 text-brand-text-secondary">
                    {t('landing_cta_subtitle')}
                </p>
                <a
                    href="/#/register"
                    className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-primary hover:opacity-90 sm:w-auto"
                >
                    {t('landing_cta_button')}
                </a>
            </div>
        </div>

      </main>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
