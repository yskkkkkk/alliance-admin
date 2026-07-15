import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../supabaseClient';

function AnnouncementManager() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [copiedId, setCopiedId] = useState({ id: null, lang: null });
  const [expandedId, setExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          const mappedData = data.map(ann => ({
            id: ann.id,
            title: ann.title || '',
            contentKo: ann.contentKo || ann.content_ko || '',
            contentEn: ann.contentEn || ann.content_en || ''
          }));
          setAnnouncements(mappedData);
        }
      } catch (e) {
        console.error("Failed to fetch announcements:", e);
        // Fallback to local storage
        const saved = localStorage.getItem('kings_shot_announcements');
        if (saved) {
          try {
            setAnnouncements(JSON.parse(saved));
          } catch(err) {}
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAdd = async () => {
    const newId = Date.now().toString();
    const newAnn = {
      id: newId,
      title: '',
      contentKo: '',
      contentEn: ''
    };
    setAnnouncements([newAnn, ...announcements]);
    setExpandedId(newId);

    try {
      await supabase.from('announcements').insert([{ 
        id: newId, 
        title: '', 
        content_ko: '', 
        content_en: '' 
      }]);
    } catch (e) {}
  };

  const handleUpdate = async (id, field, value) => {
    setAnnouncements(announcements.map(ann => 
      ann.id === id ? { ...ann, [field]: value } : ann
    ));

    const dbField = field === 'contentKo' ? 'content_ko' : field === 'contentEn' ? 'content_en' : field;
    try {
      await supabase.from('announcements').update({ [dbField]: value }).eq('id', id);
    } catch (e) {}
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if(window.confirm(t('delete') + "?")) {
      setAnnouncements(announcements.filter(ann => ann.id !== id));
      if (expandedId === id) setExpandedId(null);

      try {
        await supabase.from('announcements').delete().eq('id', id);
      } catch (err) {}
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

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

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
