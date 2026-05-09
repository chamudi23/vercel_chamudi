import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function LayoutWrapper() {
  return (
    <div className="flex min-h-screen bg-dark-main">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-x-hidden">
        <div className="p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
