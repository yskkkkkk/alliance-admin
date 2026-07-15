import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';
import HeroManager from './components/HeroManager';
import AnnouncementManager from './components/AnnouncementManager';

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('heroes'); // 'heroes' | 'announcements'
  const [theme, setTheme] = useState(localStorage.getItem('kings_shot_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kings_shot_theme', theme);
  }, [theme]);

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>{t('appTitle')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="lang-toggle">
          <span 
            className={i18n.language === 'ko' ? 'active' : ''} 
            onClick={() => toggleLanguage('ko')}
          >
            KO
          </span>
          <span 
            className={i18n.language === 'en' ? 'active' : ''} 
            onClick={() => toggleLanguage('en')}
          >
            EN
          </span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'heroes' ? 'active' : ''}`}
            onClick={() => setActiveTab('heroes')}
          >
            {t('tabHeroes')}
          </div>
          <div 
            className={`tab ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            {t('tabAnnouncements')}
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'heroes' ? <HeroManager /> : <AnnouncementManager />}
        </div>
      </main>
    </div>
  );
}

export default App;
