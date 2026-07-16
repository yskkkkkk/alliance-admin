import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, HelpCircle, X, Lock, Unlock } from 'lucide-react';
import { supabase } from './supabaseClient';
import HeroManager from './components/HeroManager';
import AnnouncementManager from './components/AnnouncementManager';

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('heroes'); // 'heroes' | 'announcements'
  const [theme, setTheme] = useState(localStorage.getItem('kings_shot_theme') || 'dark');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState('');

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

  const toggleHelp = () => {
    setIsHelpOpen(!isHelpOpen);
  };

  const handleAdminLogin = async () => {
    if (adminPasscode.length !== 4) return;
    try {
      const { data, error } = await supabase.rpc('verify_admin', { input_pass: adminPasscode });
      if (error) throw error;
      if (data) {
        setIsAdmin(true);
        setIsAdminLoginOpen(false);
        setAdminPasscode('');
        setAdminError('');
        window.dispatchEvent(new Event('adminLoggedIn'));
      } else {
        setAdminError('비밀번호가 일치하지 않습니다.');
      }
    } catch (e) {
      setAdminError('인증 오류가 발생했습니다.');
    }
  };

  const handlePasscodeChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setAdminPasscode(val);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>{t('appTitle')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-icon" onClick={() => isAdmin ? setIsAdmin(false) : setIsAdminLoginOpen(true)} aria-label="Admin">
            {isAdmin ? <Unlock size={20} color="var(--color-success-fg)" /> : <Lock size={20} />}
          </button>
          <button className="btn-icon" onClick={toggleHelp} aria-label="Help">
            <HelpCircle size={20} />
          </button>
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
          {activeTab === 'heroes' ? <HeroManager isAdmin={isAdmin} /> : <AnnouncementManager isAdmin={isAdmin} />}
        </div>
      </main>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="modal-overlay" onClick={toggleHelp}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="btn-icon modal-close" onClick={toggleHelp}>
              <X size={20} />
            </button>
            <h2>{t('helpTitle')}</h2>
            <ul style={{ paddingLeft: '20px' }}>
              <li>{t('help1')}</li>
              <li style={{ marginTop: '12px' }}>{t('help2')}</li>
              <li style={{ marginTop: '12px' }}>{t('help3')}</li>
            </ul>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={toggleHelp}>
              확인 (OK)
            </button>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {isAdminLoginOpen && (
        <div className="modal-overlay" onClick={() => setIsAdminLoginOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="btn-icon modal-close" onClick={() => setIsAdminLoginOpen(false)}>
              <X size={20} />
            </button>
            <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>관리자 모드 (Admin)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <input 
                type="password" 
                value={adminPasscode}
                onChange={handlePasscodeChange}
                placeholder="4자리 PIN"
                style={{ width: '100%', maxWidth: '200px', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }}
              />
              {adminError && <div style={{ color: 'var(--color-danger-fg)', fontSize: '0.9rem' }}>{adminError}</div>}
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', maxWidth: '200px', marginTop: '8px' }} 
                onClick={handleAdminLogin}
                disabled={adminPasscode.length !== 4}
              >
                잠금 해제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
