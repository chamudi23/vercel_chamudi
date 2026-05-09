import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FilePlus, Archive, Settings, BookOpen } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'New Analysis', path: '/analysis/new', icon: FilePlus },
    { label: 'Past Analysis', path: '/cases', icon: Archive },
    { label: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
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
    </aside>
  );
}
