import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiSettings,
  FiBell,
  FiBarChart2,
  FiHelpCircle,
  FiCalendar,
  FiLogOut,
  FiBook,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const menuItemsByRole = {
  STUDENT: [
    { id: 'slot-booking', label: 'Slot Booking', icon: <FiCalendar className="text-blue-500" />, path: '/student/slot-booking' },
  ],
  MENTOR: [
    { id: 'schedule', label: 'Schedule', icon: <FiBook />, path: '/mentor/schedule' },
    { id: 'manage-slots', label: 'Manage Slots', icon: <FiCalendar />, path: '/mentor/manage-slots' },
  ],
  ADMIN: [
    { id: 'manage-users', label: 'Manage Users', icon: <FiUsers />, path: '/admin/manage-users' },
    { id: 'meetings', label: 'Meetings', icon: <FiCalendar />, path: '/admin/meetings' },
    { id: 'settings', label: 'Settings', icon: <FiSettings />, path: '/admin/settings' },
  ],
};

const roleBasedDashboards = {
  STUDENT: '/student/slot-booking',
  MENTOR: '/mentor/schedule',
  ADMIN: '/admin/manage-users',
};

export default function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShowSessionExpiredModal(true);
      setLoading(false);
      return;
    }

    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const selectedRole = getCookie('selectedRole');

    async function fetchUserStatus() {
      try {
        const response = await fetch('https://masai-connect-backend-w28f.vercel.app/api/get-user-status', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 500) {
          if (response.status === 500) {
            toast.error("Session expired. Please log in again.");
          }
          localStorage.removeItem('token');
          setShowSessionExpiredModal(true);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch user status');
        }

        const data = await response.json();
        const { name, roles, status } = data;
        if (status !== 'ACTIVE') {
          router.push('/pending-approval');
          return;
        }
        setUserName(name);
        setUserRoles(roles);
        if (!selectedRole) {
          const defaultRole = roles.length === 1 ? roles[0] : roles[0];
          document.cookie = `selectedRole=${defaultRole}; path=/; SameSite=Lax`;
          setRole(defaultRole);
          setMenuItems(menuItemsByRole[defaultRole] || []);
        } else {
          setRole(selectedRole);
          setMenuItems(menuItemsByRole[selectedRole] || []);
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
        toast.error("Failed to fetch user status. Please try again later.");
        setShowSessionExpiredModal(true);
      } finally {
        setLoading(false);
      }
    }

    fetchUserStatus();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'selectedRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    router.push('/');
  };

  const handleRoleChange = (newRole) => {
    document.cookie = `selectedRole=${newRole}; path=/; SameSite=Lax`;
    setRole(newRole);
    setMenuItems(menuItemsByRole[newRole] || []);
    setShowRoleMenu(false);
    router.push(roleBasedDashboards[newRole]);
  };

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [router.pathname]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg hover:bg-gray-100 transition-colors duration-200"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <FiX className="w-6 h-6 text-gray-800" />
        ) : (
          <FiMenu className="w-6 h-6 text-gray-800" />
        )}
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50"
          >
            <div className="flex flex-col h-full">
              {/* User Info Section */}
              <div className="p-6 flex flex-col items-center border-b relative">
                {loading ? (
                  <div className="flex items-center justify-center h-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-4 border-t-blue-500 border-gray-300"></div>
                  </div>
                ) : (
                  <h1 className="text-lg font-bold text-gray-800">{userName}</h1>
                )}
                <div className="flex items-center space-x-2">
                  {loading ? (
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-sm text-gray-500">{role || 'Role not set'}</p>
                  )}
                  {userRoles.length > 1 && !loading && (
                    <button
                      onClick={() => setShowRoleMenu(!showRoleMenu)}
                      className="text-gray-600 hover:text-blue-600 focus:outline-none"
                      title="Change Role"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  )}
                </div>
                {showRoleMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-16 right-4 bg-white shadow-lg rounded-md py-2 z-50"
                  >
                    {userRoles.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        {r}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 overflow-y-auto py-6 px-4">
                <div className="space-y-2">
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    menuItems.map((item) => (
                      <motion.button
                        key={item.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(item.path)}
                        className={`flex items-center space-x-4 w-full px-4 py-3 rounded-lg transition-colors ${
                          router.pathname === item.path
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </motion.button>
                    ))
                  )}
                </div>
              </nav>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-4 px-6 py-4 text-red-600 hover:bg-red-50 transition-colors"
              >
                <FiLogOut />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Session Expired Modal */}
      <AnimatePresence>
        {showSessionExpiredModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4"
            >
              <h2 className="text-2xl font-bold mb-4">Session Expired</h2>
              <p className="mb-6">Your session has expired. Please log in again.</p>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/');
                }}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
