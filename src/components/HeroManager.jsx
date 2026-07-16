import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Plus, Trash2, List, Table, ArrowUpDown, RotateCcw, GripVertical } from 'lucide-react';
import useSWR from 'swr';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../supabaseClient';

const fetchHeroData = async () => {
  const [{ data: membersData, error: mError }, { data: metaData }] = await Promise.all([
    supabase.from('members').select('*').order('order_idx', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true }),
    supabase.from('metadata').select('*').eq('key', 'hero_names').single()
  ]);

  if (mError) throw mError;

  let parsedMembers = [];
  if (membersData) {
    parsedMembers = membersData.map(m => ({
      ...m,
      heroes: typeof m.heroes === 'string' ? JSON.parse(m.heroes) : m.heroes
    }));
  }

  let parsedNames = ['Hero 1', 'Hero 2', 'Hero 3', 'Hero 4', 'Hero 5', 'Hero 6'];
  if (metaData && metaData.value) {
    parsedNames = typeof metaData.value === 'string' ? JSON.parse(metaData.value) : metaData.value;
  } else {
    const savedNames = localStorage.getItem('kings_shot_hero_names');
    if (savedNames) parsedNames = JSON.parse(savedNames);
  }

  return { members: parsedMembers, heroNames: parsedNames };
};

function SortableMemberItem({ member, children, isAdmin, showTrash }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: member.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="card">
      {isAdmin && !showTrash && (
        <div {...attributes} {...listeners} style={{ position: 'absolute', top: '12px', left: '-12px', cursor: 'grab', padding: '4px', display: 'flex', alignItems: 'center' }}>
          <GripVertical size={16} color="var(--text-secondary)" />
        </div>
      )}
      {children}
    </div>
  );
}

function HeroManager({ isAdmin }) {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [heroNames, setHeroNames] = useState(['Hero 1', 'Hero 2', 'Hero 3', 'Hero 4', 'Hero 5', 'Hero 6']);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [showTrash, setShowTrash] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setViewMode('table');
      setShowTrash(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    const handleAdminLogin = () => {
      localStorage.setItem('kings_shot_snapshot_members', JSON.stringify(members));
    };
    window.addEventListener('adminLoggedIn', handleAdminLogin);
    return () => window.removeEventListener('adminLoggedIn', handleAdminLogin);
  }, [members]);

  const triggerSaveSuccess = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = members.findIndex((m) => m.id === active.id);
    const newIndex = members.findIndex((m) => m.id === over.id);
    const newItems = arrayMove(members, oldIndex, newIndex);
    
    setMembers(newItems);

    setSaveStatus('saving');
    try {
      const updates = newItems.map((item, index) => ({ id: item.id, order_idx: index }));
      await Promise.all(updates.map(u => supabase.from('members').update({ order_idx: u.order_idx }).eq('id', u.id)));
      triggerSaveSuccess();
    } catch (e) {
      setSaveStatus('');
    }
  };

  const { data: dbData, isLoading } = useSWR('heroData', fetchHeroData, { refreshInterval: 0 });

  useEffect(() => {
    if (dbData) {
      setMembers(dbData.members);
      setHeroNames(dbData.heroNames);
    }
  }, [dbData]);

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
    
    const maxOrder = members.length > 0 ? Math.max(...members.map(m => m.order_idx || 0)) : 0;
    
    const newMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      heroes: Array(6).fill(''),
      order_idx: maxOrder + 1
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
      const now = new Date().toISOString();
      setMembers(members.map(m => m.id === id ? { ...m, deleted_at: now } : m));
      try {
        await supabase.from('members').update({ deleted_at: now }).eq('id', id);
      } catch (err) {}
    }
  };

  const handleRestoreMember = async (id, e) => {
    if(e) e.stopPropagation();
    setMembers(members.map(m => m.id === id ? { ...m, deleted_at: null } : m));
    try {
      await supabase.from('members').update({ deleted_at: null }).eq('id', id);
    } catch (err) {}
  };

  const handleRollback = async () => {
    if (window.confirm('정말 관리자 로그인 시점의 데이터로 통째로 롤백하시겠습니까? (이후 변경사항 모두 취소됨)')) {
      const snap = localStorage.getItem('kings_shot_snapshot_members');
      if (snap) {
        setSaveStatus('saving');
        const snapMembers = JSON.parse(snap);
        try {
          await supabase.from('members').upsert(snapMembers);
          setMembers(snapMembers);
          triggerSaveSuccess();
        } catch(e) {
          setSaveStatus('');
        }
      }
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

  const handleMemberNameChange = (memberId, value) => {
    setMembers(members.map(member => 
      member.id === memberId ? { ...member, name: value } : member
    ));
  };

  const handleMemberNameBlur = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSaveStatus('saving');
      try {
        await supabase.from('members').update({ name: member.name }).eq('id', memberId);
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

  const filteredMembers = members.filter(m => showTrash ? !!m.deleted_at : !m.deleted_at);
  const sortedMembers = [...filteredMembers].sort((a, b) => {
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

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '8px', alignItems: 'center' }}>
        <div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`btn ${showTrash ? 'btn-primary' : ''}`} onClick={() => { setShowTrash(!showTrash); setViewMode('edit'); }} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                {showTrash ? '돌아가기' : '🗑️ 휴지통'}
              </button>
              <button className="btn" onClick={handleRollback} style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RotateCcw size={14} /> 롤백 (스냅샷)
              </button>
            </div>
          )}
        </div>
        
        {isAdmin && (
          <div className="tabs" style={{ margin: 0, padding: '4px' }}>
            <div 
              className={`tab ${viewMode === 'edit' ? 'active' : ''}`}
              onClick={() => { setViewMode('edit'); setShowTrash(false); }}
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
        )}
      </div>

      {viewMode === 'edit' ? (
        <>
          {isAdmin && !showTrash && (
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
          )}

          <div className="members-list">
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                {t('noMembers')}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredMembers.map(m => m.id)} strategy={verticalListSortingStrategy}>
                  {filteredMembers.map(member => (
                    <SortableMemberItem key={member.id} member={member} isAdmin={isAdmin} showTrash={showTrash}>
                      <div className="hero-header" onClick={() => toggleExpand(member.id)}>
                        {isAdmin && !showTrash ? (
                          <input 
                            type="text" 
                            value={member.name}
                            onChange={(e) => handleMemberNameChange(member.id, e.target.value)}
                            onBlur={() => handleMemberNameBlur(member.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: '1.05rem', fontWeight: 600, backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', outline: 'none', color: 'var(--text-primary)', width: '200px' }}
                          />
                        ) : (
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: showTrash ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{member.name}</h3>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {showTrash ? (
                            <button className="btn btn-primary" onClick={(e) => handleRestoreMember(member.id, e)} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>
                              ↺ 복구
                            </button>
                          ) : (
                            isAdmin && (
                              <button className="btn-icon" onClick={(e) => handleDeleteMember(member.id, e)}>
                                <Trash2 size={18} />
                              </button>
                            )
                          )}
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
                                  type="text" 
                                  inputMode="numeric"
                                  maxLength="1"
                                  value={level}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^1-5]/g, '');
                                    handleHeroChange(member.id, index, val);
                                  }}
                                  onBlur={() => handleHeroBlur(member.id)}
                                  placeholder="성급"
                                  style={{ textAlign: 'center' }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </SortableMemberItem>
                  ))}
                </SortableContext>
              </DndContext>
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
                        {isAdmin ? (
                          <input 
                            type="text" 
                            value={heroNames[index]}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                            onBlur={handleNameBlur}
                            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1rem', width: '80px', padding: '2px', outline: 'none' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{heroNames[index]}</span>
                        )}
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
                    {isAdmin && !showTrash ? (
                      <input 
                        type="text" 
                        value={member.name}
                        onChange={(e) => handleMemberNameChange(member.id, e.target.value)}
                        onBlur={() => handleMemberNameBlur(member.id)}
                        style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', outline: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', width: '120px' }}
                      />
                    ) : (
                      member.name
                    )}
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
