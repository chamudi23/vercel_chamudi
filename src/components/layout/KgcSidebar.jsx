import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FilePlus, Archive, Settings, BookOpen, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/skeletal/dashboard', icon: LayoutDashboard },
    { label: 'New Analysis', path: '/skeletal/analysis/new', icon: FilePlus },
    { label: 'Past Analysis', path: '/skeletal/cases', icon: Archive },
    { label: 'Knowledge Base', path: '/skeletal/dashboard/knowledge', icon: BookOpen },
    { label: 'Settings', path: '/skeletal/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50">
      <div className="p-6">
        <h1 className="text-white font-semibold text-lg leading-tight">
          Automated Skeletal<br />Analysis System
        </h1>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        <div className="text-text-secondary text-xs uppercase font-semibold mb-4 ml-2">
          Menu
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/skeletal/dashboard'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-blue text-white'
                  : 'text-text-secondary hover:bg-dark-border hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-border space-y-1">
        <button
          onClick={() => navigate('/skeletal')}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-secondary hover:bg-dark-border hover:text-white transition-colors w-full"
        >
          <ArrowLeft className="w-5 h-5" />
          Module Overview
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-orange-400 hover:bg-dark-border hover:text-orange-300 transition-colors w-full"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to OAHRIS
        </button>
      </div>
    </aside>
  );
}
