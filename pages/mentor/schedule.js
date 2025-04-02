import { useEffect, useState } from 'react';
import Sidebar from '../shared-components/Sidebar';
import Header from '../shared-components/Header';
import { 
  FiCalendar, 
  FiClock, 
  FiUserCheck, 
  FiVideo, 
  FiCheckCircle 
} from 'react-icons/fi';

/**
 * Helper: Parse a dd-mm-yyyy date string into a JS Date object.
 */
const parseSessionDate = (dateStr) => {
  const [day, month, year] = dateStr.split('-');
  return new Date(year, month - 1, day);
};

/**
 * Helper: Given a session (with date and time), return an object with its start and end Date objects.
 */
const getSessionTimes = (session) => {
  const date = parseSessionDate(session.date);
  const [startTimeStr, endTimeStr] = session.time.split(' - ');
  
  const parseTime = (timeStr) => {
    const [time, meridian] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  };
  
  const { hours: startHours, minutes: startMinutes } = parseTime(startTimeStr);
  const { hours: endHours, minutes: endMinutes } = parseTime(endTimeStr);
  
  const startDateTime = new Date(date);
  const endDateTime = new Date(date);
  startDateTime.setHours(startHours, startMinutes, 0, 0);
  endDateTime.setHours(endHours, endMinutes, 0, 0);
  
  return { startDateTime, endDateTime };
};

/**
 * Determine the join button state for a session.
 * - If the session is marked as "Completed" or the current time is after the session's end time, return a disabled button with "Session Ended".
 * - Otherwise (for upcoming and ongoing sessions), return an enabled join button.
 */
const getJoinButtonStatus = (session) => {
  const { startDateTime, endDateTime } = getSessionTimes(session);
  const now = new Date();

  if (session.status === 'Completed' || now > endDateTime) {
    return { disabled: true, label: 'Session Ended' };
  }
  return { disabled: false, label: 'Join' };
};

export default function MentorSchedule() {
  // ----- State for Sessions -----
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState("Upcoming");

  // ----- Pagination State -----
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination when activeTab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // ----- Fetch Sessions from the Backend -----
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const mentorId = "679c6adcfa0a2f65ce121758";
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("Token not found in localStorage.");
        }
        const response = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/bookings?user=${mentorId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch sessions.");
        }
        const data = await response.json();
        const sessionsData = data.map((booking) => ({
          id: booking._id,
          title: booking.sessionType,
          studentName: booking.student?.name || "Student",
          date: booking.slot.date,
          time: booking.slot.time,
          status: booking.status,
          mode: booking.mode,
          agenda: booking.agenda,
          zoomJoinUrl: booking.zoomJoinUrl,
        }));
        setSessions(sessionsData);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // ----- Utility: Color Coding Based on Session Status -----
  const getStatusClasses = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'border-blue-500 bg-blue-50';
      case 'In Progress':
        return 'border-yellow-500 bg-yellow-50';
      case 'Completed':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  // ----- Filtering Sessions by Active Tab -----
  const filteredSessions = sessions.filter((session) => {
    const { startDateTime, endDateTime } = getSessionTimes(session);
    const now = new Date();
    if (activeTab === 'Upcoming') {
      return startDateTime > now;
    } else if (activeTab === 'Past') {
      return now > endDateTime;
    }
    return true;
  });

  // ----- Handle Session Response -----
  const handleSessionResponse = async (sessionId, response) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/bookings/${sessionId}/response`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response })
      });
      if (!res.ok) throw new Error('Failed to update session response');
      // Refresh sessions after update
      fetchSessions();
    } catch (err) {
      console.error('Error updating session response:', err);
    }
  };

  // ----- Pagination Logic -----
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar className="h-full" />
        <main className="flex-1 w-full p-8 bg-gray-100">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Mentor Schedule</h1>
          {/* Tabs */}
          <div className="flex space-x-6 mb-8 border-b pb-2">
            {['Upcoming', 'Past'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-medium pb-2 transition-all ${
                  activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {filteredSessions.length === 0 ? (
            <p className="text-gray-600">No {activeTab.toLowerCase()} sessions found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-6 rounded-xl shadow-sm transition-all duration-300 transform hover:scale-[1.02] ${
                    activeTab === 'Past' 
                      ? 'bg-gradient-to-br from-gray-100 to-gray-200 opacity-75' 
                      : 'bg-gradient-to-br from-white to-blue-50 hover:shadow-lg border border-blue-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 text-lg">{session.title}</h3>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      session.mode === 'Online' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {session.mode}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                      <FiUserCheck className="text-blue-500" />
                      <span className="text-gray-700 font-medium">{session.studentName}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                      <FiCalendar className="text-blue-500" />
                      <span className="text-gray-700 font-medium">{session.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                      <FiClock className="text-blue-500" />
                      <span className="text-gray-700 font-medium">{session.time}</span>
                    </div>
                    {session.agenda && (
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-800">Agenda:</span> {session.agenda}
                        </p>
                      </div>
                    )}
                  </div>
                  {activeTab === 'Upcoming' && (
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => handleSessionResponse(session.id, 'decline')}
                        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleSessionResponse(session.id, 'accept')}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors shadow-sm"
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}