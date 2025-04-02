import { useState, useEffect } from 'react';
import { FiSettings, FiUsers, FiCalendar, FiBarChart2 } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMentors: 0,
    totalStudents: 0,
    totalSessions: 0,
    upcomingSessions: 0
  });

  useEffect(() => {
    // TODO: Fetch actual stats from API
    setStats({
      totalMentors: 25,
      totalStudents: 150,
      totalSessions: 300,
      upcomingSessions: 45
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar className="h-full" />
        <main className="flex-1 w-full p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <div className="flex items-center space-x-3">
                  <FiUsers className="text-2xl text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Total Mentors</h2>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMentors}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <div className="flex items-center space-x-3">
                  <FiUsers className="text-2xl text-green-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Total Students</h2>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <div className="flex items-center space-x-3">
                  <FiCalendar className="text-2xl text-purple-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Total Sessions</h2>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSessions}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <div className="flex items-center space-x-3">
                  <FiBarChart2 className="text-2xl text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Upcoming Sessions</h2>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingSessions}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/admin/session-policy">
                <div className="group bg-white rounded-xl p-6 shadow-sm border border-blue-100 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-200">
                  <div className="flex items-center space-x-3">
                    <FiSettings className="text-2xl text-blue-500 group-hover:text-blue-600 transition-colors" />
                    <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      Session Policy Management
                    </h2>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Configure session duration, daily limits, and availability settings
                  </p>
                </div>
              </Link>

              <Link href="/admin/mentor-approval">
                <div className="group bg-white rounded-xl p-6 shadow-sm border border-blue-100 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-200">
                  <div className="flex items-center space-x-3">
                    <FiUsers className="text-2xl text-green-500 group-hover:text-green-600 transition-colors" />
                    <h2 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors">
                      Mentor Approval
                    </h2>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Review and approve new mentor applications
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 