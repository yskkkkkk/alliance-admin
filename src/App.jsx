import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Info } from 'lucide-react';

function App() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('kings_shot_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kings_shot_theme', theme);
  }, [theme]);

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>{t('appTitle')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px 16px' }}>
        <div className="sunset-card">
          <div className="sunset-header">
            <span className="sunset-badge">{t('sunsetBadge')}</span>
            <h2 className="sunset-title">{t('sunsetTitle')}</h2>
          </div>

          <div className="sunset-body">
            <p>{t('sunsetP1')}</p>
            <p>{t('sunsetP2')}</p>
            <p>{t('sunsetP3')}</p>
          </div>

          <div className="sunset-info-box">
            <div className="sunset-info-header">
              <Info size={16} />
              <span>{t('sunsetContact')}</span>
            </div>
            <dl className="sunset-metadata">
              <div>
                <dt>{t('sunsetMetaDate')}</dt>
                <dd>{t('sunsetMetaDateVal')}</dd>
              </div>
              <div>
                <dt>{t('sunsetMetaService')}</dt>
                <dd>{t('sunsetMetaServiceVal')}</dd>
              </div>
              <div>
                <dt>{t('sunsetMetaData')}</dt>
                <dd>{t('sunsetMetaDataVal')}</dd>
              </div>
            </dl>
          </div>

          <footer className="sunset-footer">
            <span>© 2026 King's Shot Alliance.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
