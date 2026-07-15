import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

function AnnouncementManager() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [copiedId, setCopiedId] = useState({ id: null, lang: null });
  const [expandedId, setExpandedId] = useState(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kings_shot_announcements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old data if necessary
        const migrated = parsed.map(ann => ({
          ...ann,
          contentKo: ann.contentKo || ann.content || '',
          contentEn: ann.contentEn || ''
        }));
        setAnnouncements(migrated);
      } catch (e) {
        console.error("Failed to parse announcements data");
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('kings_shot_announcements', JSON.stringify(announcements));
  }, [announcements]);

  const handleAdd = () => {
    const newId = Date.now().toString();
    const newAnn = {
      id: newId,
      title: '',
      contentKo: '',
      contentEn: ''
    };
    setAnnouncements([newAnn, ...announcements]);
    setExpandedId(newId);
  };

  const handleUpdate = (id, field, value) => {
    setAnnouncements(announcements.map(ann => 
      ann.id === id ? { ...ann, [field]: value } : ann
    ));
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if(window.confirm(t('delete') + "?")) {
      setAnnouncements(announcements.filter(ann => ann.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCopy = async (id, title, content, lang) => {
    const textToCopy = `[${title}]\n\n${content}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId({ id, lang });
      setTimeout(() => setCopiedId({ id: null, lang: null }), 2000);
    } catch (err) {
      alert("Failed to copy text. Please try again.");
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={18} /> {t('newAnnouncement')}
        </button>
      </div>

      <div className="announcements-list">
        {announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            {t('noAnnouncements')}
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className="card">
              <div 
                className="hero-header" 
                onClick={() => toggleExpand(ann.id)}
                style={{ paddingBottom: expandedId === ann.id ? '16px' : '0' }}
              >
                <div style={{ flex: 1, marginRight: '12px' }} onClick={e => e.stopPropagation()}>
                  <input 
                    type="text" 
                    value={ann.title}
                    onChange={(e) => handleUpdate(ann.id, 'title', e.target.value)}
                    placeholder={t('announcementTitle')}
                    style={{ fontWeight: 600, fontSize: '1.05rem', backgroundColor: 'transparent', padding: '4px 0', border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: 0, width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="btn-icon" onClick={(e) => handleDelete(ann.id, e)}>
                    <Trash2 size={18} />
                  </button>
                  {expandedId === ann.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              
              {expandedId === ann.id && (
                <div className="hero-body animate-fade-in" style={{ marginTop: 0, paddingTop: '16px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('contentKo')}</label>
                    <textarea 
                      value={ann.contentKo}
                      onChange={(e) => handleUpdate(ann.id, 'contentKo', e.target.value)}
                      placeholder={t('contentKo')}
                      style={{ minHeight: '100px' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('contentEn')}</label>
                    <textarea 
                      value={ann.contentEn}
                      onChange={(e) => handleUpdate(ann.id, 'contentEn', e.target.value)}
                      placeholder={t('contentEn')}
                      style={{ minHeight: '100px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className={`btn ${copiedId.id === ann.id && copiedId.lang === 'ko' ? 'btn-primary' : ''}`}
                      style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                      onClick={() => handleCopy(ann.id, ann.title, ann.contentKo, 'ko')}
                    >
                      {copiedId.id === ann.id && copiedId.lang === 'ko' ? (
                        <><CheckCircle2 size={18} /> {t('copied')}</>
                      ) : (
                        <><Copy size={18} /> {t('copyKo')}</>
                      )}
                    </button>
                    <button 
                      className={`btn ${copiedId.id === ann.id && copiedId.lang === 'en' ? 'btn-primary' : ''}`}
                      style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                      onClick={() => handleCopy(ann.id, ann.title, ann.contentEn, 'en')}
                    >
                      {copiedId.id === ann.id && copiedId.lang === 'en' ? (
                        <><CheckCircle2 size={18} /> {t('copied')}</>
                      ) : (
                        <><Copy size={18} /> {t('copyEn')}</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AnnouncementManager;
