import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Plus, Trash2, List, Table, ArrowUpDown } from 'lucide-react';
import { supabase } from '../supabaseClient';

function HeroManager() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [heroNames, setHeroNames] = useState(['Hero 1', 'Hero 2', 'Hero 3', 'Hero 4', 'Hero 5', 'Hero 6']);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  const triggerSaveSuccess = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        if (data) {
          // parse heroes if it's stringified, though supabase jsonb returns object/array
          const parsedData = data.map(m => ({
            ...m,
            heroes: typeof m.heroes === 'string' ? JSON.parse(m.heroes) : m.heroes
          }));
          setMembers(parsedData);
        }

        const { data: metaData } = await supabase
          .from('metadata')
          .select('*')
          .eq('key', 'hero_names')
          .single();
        
        if (metaData && metaData.value) {
          setHeroNames(typeof metaData.value === 'string' ? JSON.parse(metaData.value) : metaData.value);
        } else {
          // Fallback to local storage if DB empty
          const savedNames = localStorage.getItem('kings_shot_hero_names');
          if (savedNames) setHeroNames(JSON.parse(savedNames));
        }
      } catch (e) {
        console.error("Failed to fetch data:", e);
        // Fallback to local storage
        const saved = localStorage.getItem('kings_shot_members');
        if (saved) setMembers(JSON.parse(saved));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNameChange = (index, value) => {
    const newNames = [...heroNames];
    newNames[index] = value;
    setHeroNames(newNames);
    localStorage.setItem('kings_shot_hero_names', JSON.stringify(newNames));
  };

  const handleNameBlur = async () => {
    setSaveStatus('saving');
    try {
      await supabase.from('metadata').upsert({ key: 'hero_names', value: heroNames });
      triggerSaveSuccess();
    } catch (e) {
      setSaveStatus('');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    if (members.length >= 100) {
      alert("Maximum 100 members allowed.");
      return;
    }
    
    const newMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      heroes: Array(6).fill('') 
    };
    
    setMembers([...members, newMember]);
    setNewMemberName('');

    try {
      await supabase.from('members').insert([newMember]);
    } catch (err) {
      console.error("Failed to insert member", err);
    }
  };

  const handleDeleteMember = async (id, e) => {
    if(e) e.stopPropagation();
    if(window.confirm(t('delete') + "?")) {
      setMembers(members.filter(m => m.id !== id));
      try {
        await supabase.from('members').delete().eq('id', id);
      } catch (err) {}
    }
  };

  const handleHeroChange = (memberId, heroIndex, value) => {
    setMembers(members.map(member => {
      if (member.id === memberId) {
        const newHeroes = [...member.heroes];
        newHeroes[heroIndex] = value;
        return { ...member, heroes: newHeroes };
      }
      return member;
    }));
  };

  const handleHeroBlur = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSaveStatus('saving');
      try {
        await supabase.from('members').update({ heroes: member.heroes }).eq('id', memberId);
        triggerSaveSuccess();
      } catch (err) {
        setSaveStatus('');
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (sortConfig.key === null) return 0;
    
    let aVal, bVal;
    if (sortConfig.key === 'name') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    } else {
      const index = parseInt(sortConfig.key);
      aVal = parseInt(a.heroes[index]) || 0;
      bVal = parseInt(b.heroes[index]) || 0;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
        <div className="tabs" style={{ margin: 0, padding: '4px' }}>
          <div 
            className={`tab ${viewMode === 'edit' ? 'active' : ''}`}
            onClick={() => setViewMode('edit')}
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <List size={16} /> {t('viewModeEdit')}
          </div>
          <div 
            className={`tab ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Table size={16} /> {t('viewModeTable')}
          </div>
        </div>
      </div>

      {viewMode === 'edit' ? (
        <>
          <form onSubmit={handleAddMember} className="card" style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div className="input-group" style={{ margin: 0, flex: 1 }}>
              <label>{t('memberName')}</label>
              <input 
                type="text" 
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Nickname..."
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 16px' }}>
              <Plus size={18} /> {t('addMember')}
            </button>
          </form>

          <div className="members-list">
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                {t('noMembers')}
              </div>
            ) : (
              members.map(member => (
                <div key={member.id} className="card">
                  <div className="hero-header" onClick={() => toggleExpand(member.id)}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{member.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button className="btn-icon" onClick={(e) => handleDeleteMember(member.id, e)}>
                        <Trash2 size={18} />
                      </button>
                      {expandedId === member.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                  
                  {expandedId === member.id && (
                    <div className="hero-body animate-fade-in">
                      <div className="hero-grid">
                        {member.heroes.map((level, index) => (
                          <div key={index} className="input-group">
                            <label>{heroNames[index]}</label>
                            <input 
                              type="number" 
                              min="0"
                              value={level}
                              onChange={(e) => handleHeroChange(member.id, index, e.target.value)}
                              onBlur={() => handleHeroBlur(member.id)}
                              placeholder="Lv."
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Table View */
        <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              {t('noMembers')}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                  <th 
                    style={{ 
                      padding: '12px 16px', 
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: 'var(--bg-tertiary)',
                      zIndex: 10,
                      boxShadow: '1px 0 0 0 var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                        {t('memberName')}
                      </span>
                      <button 
                        className="btn-icon"
                        style={{ padding: '4px', opacity: sortConfig.key === 'name' ? 1 : 0.3 }}
                        onClick={() => handleSort('name')}
                      >
                        <ArrowUpDown size={14} />
                      </button>
                    </div>
                  </th>
                  {[0, 1, 2, 3, 4, 5].map(index => (
                    <th 
                      key={index}
                      style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input 
                          type="text" 
                          value={heroNames[index]}
                          onChange={(e) => handleNameChange(index, e.target.value)}
                          onBlur={handleNameBlur}
                          style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1rem', width: '80px', padding: '2px', outline: 'none' }}
                        />
                        <button 
                          className="btn-icon"
                          style={{ padding: '4px', opacity: sortConfig.key === index.toString() ? 1 : 0.3 }}
                          onClick={() => handleSort(index.toString())}
                        >
                          <ArrowUpDown size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member, i) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)' }}>
                    <td 
                    style={{ 
                      padding: '12px 16px', 
                      position: 'sticky', 
                      left: 0, 
                      backgroundColor: i % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-tertiary)', 
                      zIndex: 5,
                      fontWeight: 600,
                      boxShadow: '1px 0 0 0 var(--border-color)'
                    }}
                  >
                    {member.name}
                  </td>
                    {member.heroes.map((level, index) => (
                      <td key={index} style={{ padding: '12px 16px', color: level ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {level || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default HeroManager;
