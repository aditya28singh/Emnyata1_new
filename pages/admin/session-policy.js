import { useState, useEffect } from 'react';
import { FiSettings, FiClock, FiCalendar, FiSave } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

export default function SessionPolicy() {
  const [policy, setPolicy] = useState({
    sessionDuration: 30, // in minutes
    maxSlotsPerDay: 4,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeRange: {
      start: '09:00',
      end: '18:00'
    },
    bufferTime: 15 // minutes between sessions
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch current policy on component mount
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch('/api/admin/session-policy');
        if (!response.ok) throw new Error('Failed to fetch policy');
        const data = await response.json();
        setPolicy(data);
      } catch (err) {
        setError('Failed to load policy settings');
      }
    };

    fetchPolicy();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/admin/session-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy)
      });

      if (!response.ok) throw new Error('Failed to update policy');
      
      setSuccessMessage('Policy updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update policy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar className="h-full" />
        <main className="flex-1 w-full p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
              <FiSettings className="text-3xl text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Session Policy Management
              </h1>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Duration */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <FiClock className="text-xl text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-800">Session Duration</h2>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="15"
                    max="120"
                    step="15"
                    value={policy.sessionDuration}
                    onChange={(e) => setPolicy({ ...policy, sessionDuration: parseInt(e.target.value) })}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <span className="text-gray-600">minutes per session</span>
                </div>
              </div>

              {/* Maximum Slots Per Day */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <FiCalendar className="text-xl text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-800">Daily Slot Limits</h2>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={policy.maxSlotsPerDay}
                    onChange={(e) => setPolicy({ ...policy, maxSlotsPerDay: parseInt(e.target.value) })}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <span className="text-gray-600">maximum slots per day per mentor</span>
                </div>
              </div>

              {/* Available Days */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Days</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <label
                      key={day}
                      className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                        policy.availableDays.includes(day)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={policy.availableDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPolicy({
                              ...policy,
                              availableDays: [...policy.availableDays, day]
                            });
                          } else {
                            setPolicy({
                              ...policy,
                              availableDays: policy.availableDays.filter(d => d !== day)
                            });
                          }
                        }}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Time Range</h2>
                <div className="flex items-center space-x-4">
                  <input
                    type="time"
                    value={policy.timeRange.start}
                    onChange={(e) => setPolicy({
                      ...policy,
                      timeRange: { ...policy.timeRange, start: e.target.value }
                    })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <span className="text-gray-600">to</span>
                  <input
                    type="time"
                    value={policy.timeRange.end}
                    onChange={(e) => setPolicy({
                      ...policy,
                      timeRange: { ...policy.timeRange, end: e.target.value }
                    })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Buffer Time */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Buffer Time Between Sessions</h2>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="5"
                    value={policy.bufferTime}
                    onChange={(e) => setPolicy({ ...policy, bufferTime: parseInt(e.target.value) })}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <span className="text-gray-600">minutes between sessions</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                  <div className="relative flex items-center space-x-2">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiSave className="text-xl transform group-hover:rotate-12 transition-transform duration-300" />
                    )}
                    <span>{loading ? 'Saving...' : 'Save Policy'}</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
} 