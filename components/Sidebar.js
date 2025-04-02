import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiHome,
  FiCalendar,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiClock
} from 'react-icons/fi';

export default function Sidebar({ className = '' }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const isAdmin = router.pathname.startsWith('/admin');

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const adminLinks = [
    { href: '/admin', icon: FiHome, label: 'Dashboard' },
    { href: '/admin/mentor-approval', icon: FiUsers, label: 'Mentor Approval' },
    { href: '/admin/settings', icon: FiSettings, label: 'Settings' }
  ];

  const mentorLinks = [
    { href: '/mentor/dashboard', icon: FiHome, label: 'Dashboard' },
    { href: '/mentor/manage-slots', icon: FiCalendar, label: 'Manage Slots' },
    { href: '/mentor/sessions', icon: FiUsers, label: 'Sessions' },
    { href: '/mentor/settings', icon: FiSettings, label: 'Settings' }
  ];

  const links = isAdmin ? adminLinks : mentorLinks;

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      <div className="flex-1 py-4">
        <div className="flex items-center justify-between px-4 mb-8">
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {isAdmin ? 'Admin Panel' : 'Mentor Panel'}
            </h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {collapsed ? (
              <FiChevronRight className="text-gray-500" />
            ) : (
              <FiChevronLeft className="text-gray-500" />
            )}
          </button>
        </div>

        <nav className="space-y-1">
          {links.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <div
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  router.pathname === href
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span className="ml-3">{label}</span>}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={() => {
            // TODO: Implement logout
            router.push('/');
          }}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <FiLogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
} 