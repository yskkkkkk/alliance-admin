import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../supabaseClient';

const fetchAnnouncements = async () => {
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(ann => ({
    id: ann.id,
    title: ann.title || '',
    contentKo: ann.contentKo || ann.content_ko || '',
    contentEn: ann.contentEn || ann.content_en || '',
    deleted_at: ann.deleted_at
  }));
};

function AnnouncementManager({ isAdmin }) {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [copiedId, setCopiedId] = useState({ id: null, lang: null });
  const [expandedId, setExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [showTrash, setShowTrash] = useState(false);

  useEffect(() => {
    if (!isAdmin) setShowTrash(false);
  }, [isAdmin]);

  const triggerSaveSuccess = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const { data: dbAnns, isLoading } = useSWR('announcements', fetchAnnouncements, { refreshInterval: 0 });

  useEffect(() => {
    if (dbAnns) {
      setAnnouncements(dbAnns);
    }
  }, [dbAnns]);

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

  const handleUpdate = (id, field, value) => {
    setAnnouncements(announcements.map(ann => {
      if (ann.id === id) {
        return { ...ann, [field]: value };
      }
      return ann;
    }));
  };

  const handleBlur = async (id, field) => {
    const ann = announcements.find(a => a.id === id);
    if (ann) {
      const dbField = field === 'contentKo' ? 'content_ko' : field === 'contentEn' ? 'content_en' : field;
      setSaveStatus('saving');
      try {
        await supabase.from('announcements').update({ [dbField]: ann[field] }).eq('id', id);
        triggerSaveSuccess();
      } catch (e) {
        setSaveStatus('');
      }
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if(window.confirm(t('delete') + "?")) {
      const now = new Date().toISOString();
      setAnnouncements(announcements.map(ann => ann.id === id ? { ...ann, deleted_at: now } : ann));
      if (expandedId === id) setExpandedId(null);

      try {
        await supabase.from('announcements').update({ deleted_at: now }).eq('id', id);
      } catch (err) {}
    }
  };

  const handleRestore = async (id, e) => {
    e.stopPropagation();
    setAnnouncements(announcements.map(ann => ann.id === id ? { ...ann, deleted_at: null } : ann));
    try {
      await supabase.from('announcements').update({ deleted_at: null }).eq('id', id);
    } catch (err) {}
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCopy = async (id, title, content, lang) => {
    const textToCopy = content;
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

  const activeAnnouncements = announcements.filter(ann => {
    if (!ann.deleted_at) return !showTrash;
    const deletedDate = new Date(ann.deleted_at);
    const diffDays = (new Date() - deletedDate) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) return false;
    return showTrash;
  });

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      {saveStatus && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: saveStatus === 'saving' ? '#0969da' : '#2da44e',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontWeight: 'bold',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {saveStatus === 'saving' ? '🔄 저장 중...' : '✔ 저장 완료'}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isAdmin && (
            <>
              <button className="btn btn-primary" onClick={handleAdd}>
                <Plus size={18} /> {t('newAnnouncement')}
              </button>
              <button className={`btn ${showTrash ? 'btn-primary' : ''}`} onClick={() => setShowTrash(!showTrash)}>
                {showTrash ? '돌아가기' : '🗑️ 휴지통'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="announcements-list">
        {activeAnnouncements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            {t('noAnnouncements')}
          </div>
        ) : (
          activeAnnouncements.map(ann => (
            <div key={ann.id} className="card">
              <div 
                className="hero-header" 
                onClick={() => toggleExpand(ann.id)}
                style={{ paddingBottom: expandedId === ann.id ? '16px' : '0' }}
              >
                <div style={{ flex: 1, marginRight: '12px' }} onClick={e => e.stopPropagation()}>
                  {isAdmin ? (
                    <input 
                      type="text" 
                      value={ann.title}
                      onChange={(e) => handleUpdate(ann.id, 'title', e.target.value)}
                      onBlur={() => handleBlur(ann.id, 'title')}
                      placeholder={t('announcementTitle')}
                      style={{ fontWeight: 600, fontSize: '1.05rem', backgroundColor: 'transparent', padding: '4px 0', border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: 0, width: '100%', color: showTrash ? 'var(--text-secondary)' : 'var(--text-primary)' }}
                    />
                  ) : (
                    <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{ann.title}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {showTrash ? (
                    <button className="btn btn-primary" onClick={(e) => handleRestore(ann.id, e)} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>
                      ↺ 복구
                    </button>
                  ) : (
                    isAdmin && (
                      <button className="btn-icon" onClick={(e) => handleDelete(ann.id, e)}>
                        <Trash2 size={18} />
                      </button>
                    )
                  )}
                  {expandedId === ann.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              
              {expandedId === ann.id && (
                <div className="hero-body animate-fade-in" style={{ marginTop: 0, paddingTop: '16px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('contentKo')}</label>
                    {isAdmin ? (
                      <textarea 
                        value={ann.contentKo}
                        onChange={(e) => handleUpdate(ann.id, 'contentKo', e.target.value)}
                        onBlur={() => handleBlur(ann.id, 'contentKo')}
                        placeholder={t('contentKo')}
                        style={{ minHeight: '100px' }}
                      />
                    ) : (
                      <div style={{ minHeight: '100px', whiteSpace: 'pre-wrap', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                        {ann.contentKo}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('contentEn')}</label>
                    {isAdmin ? (
                      <textarea 
                        value={ann.contentEn}
                        onChange={(e) => handleUpdate(ann.id, 'contentEn', e.target.value)}
                        onBlur={() => handleBlur(ann.id, 'contentEn')}
                        placeholder={t('contentEn')}
                        style={{ minHeight: '100px' }}
                      />
                    ) : (
                      <div style={{ minHeight: '100px', whiteSpace: 'pre-wrap', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                        {ann.contentEn}
                      </div>
                    )}
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
