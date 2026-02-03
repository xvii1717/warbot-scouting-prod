'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AnalysisPage() {
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortedStat, setSortedStat] = useState('avg_score');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: compData } = await supabase.from('competitions').select('*').order('year', { ascending: false });
      if (compData && compData.length > 0) {
        setCompetitions(compData);
        const savedCompId = localStorage.getItem('analysis_last_comp_id');
        setSelectedCompId(savedCompId && compData.find(c => c.id.toString() === savedCompId) ? savedCompId : compData[0].id.toString());
      }
      const { data: stats } = await supabase.from('team_averages').select('*');
      setTeamStats(stats || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCompChange = (compId: string) => {
    setSelectedCompId(compId);
    localStorage.setItem('analysis_last_comp_id', compId);
  }

  const activeTeams = [...teamStats]
    .filter(t => t.competition_id === selectedCompId && t.team_number.toString().includes(searchQuery))
    .sort((a, b) => (b[sortedStat] || 0) - (a[sortedStat] || 0));

  if (loading) return <div className="p-10 text-white animate-pulse font-mono text-center uppercase tracking-widest">Accessing Chronos Data Core...</div>;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 bg-black min-h-screen text-white">
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-gray-800 pb-6">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-black text-red-700 tracking-tighter italic uppercase">Team Analysis</h1>
          <div className="flex items-center gap-3 justify-center lg:justify-start mt-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Event:</span>
            <select 
              value={selectedCompId}
              onChange={(e) => handleCompChange(e.target.value)}
              className="bg-gray-900 border border-gray-800 p-1.5 rounded text-[10px] font-bold uppercase text-red-500"
            >
              {competitions.map(c => <option key={c.id} value={c.id}>{c.year} - {c.name}</option>)}
            </select>
          </div>
        </div>
        <input 
          type="number" inputMode="decimal" placeholder="Search team #..."
          className="bg-gray-900 border border-gray-700 p-3 rounded-xl text-sm w-full lg:w-80 focus:border-red-600 outline-none transition-all"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* --- SCROLLABLE TABLE --- */}
      <div className="space-y-2">
        <p className="text-[9px] text-gray-600 uppercase font-black lg:hidden text-center animate-pulse">Swipe horizontally to view full data →</p>
        
        <div className="overflow-auto rounded-xl border border-gray-800 bg-gray-900/20 max-h-[70vh] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-gray-800 sticky top-0 z-30 shadow-md">
              <tr className="text-[10px] font-black uppercase text-gray-400">
                <th className="p-4 sticky left-0 z-40 bg-gray-800 border-r border-gray-700">Team</th>
                <SortHeader label="Score" id="avg_score" current={sortedStat} set={setSortedStat} />
                <SortHeader label="Auto" id="avg_auto" current={sortedStat} set={setSortedStat} />
                <SortHeader label="Tele" id="avg_teleop" current={sortedStat} set={setSortedStat} />
                <SortHeader label="Climb" id="avg_climb" current={sortedStat} set={setSortedStat} />
                <SortHeader label="Def" id="avg_defense" current={sortedStat} set={setSortedStat} />
                <SortHeader label="Movement Speed" id="avg_speed" current={sortedStat} set={setSortedStat} />
                <SortHeader label="Shooting Speed" id="avg_shooting_speed" current={sortedStat} set={setSortedStat} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {activeTeams.map((stat) => (
                <tr 
                  key={stat.team_number}
                  onClick={() => router.push(`/analysis/teams/team/${stat.team_number}`)}
                  className="hover:bg-red-600/5 cursor-pointer transition-colors group"
                >
                  <td className="p-4 font-black text-2xl group-hover:text-red-500 sticky left-0 z-20 bg-black border-r border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">#{stat.team_number}</td>
                  <StatCell value={stat.avg_score} active={sortedStat === 'avg_score'} />
                  <StatCell value={stat.avg_auto} active={sortedStat === 'avg_auto'} />
                  <StatCell value={stat.avg_teleop} active={sortedStat === 'avg_teleop'} />
                  <StatCell value={stat.avg_climb} active={sortedStat === 'avg_climb'} />
                  <StatCell value={stat.avg_defense} active={sortedStat === 'avg_defense'} />
                  <StatCell value={stat.avg_speed} active={sortedStat === 'avg_speed'} />
                  <StatCell value={stat.avg_shooting_speed} active={sortedStat === 'avg_shooting_speed'} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortHeader({ label, id, current, set }: any) {
  return (
    <th 
      onClick={() => set(id)} 
      className={`p-4 cursor-pointer hover:text-white transition-colors whitespace-nowrap ${current === id ? 'text-red-500 bg-red-500/10' : ''}`}
    >
      {label} {current === id && '▼'}
    </th>
  );
}

function StatCell({ value, active }: any) {
  return (
    <td className={`p-4 font-mono text-sm whitespace-nowrap ${active ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
      {value || 0}
    </td>
  );
}