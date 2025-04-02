import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../shared-components/Sidebar';
import Header from '../shared-components/Header';
import { 
  FiCalendar, 
  FiClock, 
  FiXCircle, 
  FiUser, 
  FiUserCheck,
  FiCheckCircle,
  FiEdit,
  FiVideo,
  FiFileText,
  FiMic
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Rocket, Sparkles } from 'lucide-react';
import Cookies from 'js-cookie';
import * as JwtDecode from 'jwt-decode';

// Maximum number of bookings allowed per student.
const MAX_BOOKINGS = 105;

// ----- Possible statuses -----
const SESSION_STATUSES = [
  'Booked',
  'In Progress',
  'Completed',
  'Cancellation Requested',
  'Reschedule Requested',
  'Cancelled',
  'Rescheduled',
];

// ----- Dummy Connection Types (static) -----
const connectionTypes = [
  { id: 'Dost / EC Connect', label: 'Dost / EC Connect', description: 'Book a session with EC support or Dost for academic and personal guidance.' },
  { id: 'Mentor Connect', label: 'Mentor Connect', description: 'Schedule a one-on-one session with a mentor to discuss your projects.' },
];

// ----- Color mapping for Connection Types -----
const connectionTypeColors = {
  "Dost / EC Connect": { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700" },
  "Mentor Connect": { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-700" },
};

// Mapping from connection type to desired role
const sessionTypeToDesiredRole = {
  "Dost / EC Connect": "EC",
  "Mentor Connect": "MENTOR"
};

function getDisplayRole(mentor, sessionType) {
  if (!mentor || !sessionType) return "";
  return sessionTypeToDesiredRole[sessionType.id] || "";
}

/** Parse "dd-mm-yyyy" into a Date object */
function parseSlotDate(dateStr) {
  const [day, month, year] = dateStr.split('-');
  return new Date(year, month - 1, day);
}

/** Parse "HH:MM AM/PM" into an object */
function parseTimeString(timeStr) {
  const [time, meridian] = timeStr.split(' ');
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute, meridian };
}

/** Convert 12-hour time to 24-hour */
function convertTo24Hour(hour, meridian) {
  if (meridian.toUpperCase() === "PM" && hour !== 12) return hour + 12;
  if (meridian.toUpperCase() === "AM" && hour === 12) return 0;
  return hour;
}

/** Parse session slot time into { start, end } Date objects */
function parseSessionSlotTime(dateStr, timeRange) {
  const [startTimeStr, endTimeStr] = timeRange.split(' - ');
  const [day, month, year] = dateStr.split('-').map(Number);
  
  const { hour: startHour, minute: startMinute, meridian: startMeridian } = parseTimeString(startTimeStr);
  const { hour: endHour, minute: endMinute, meridian: endMeridian } = parseTimeString(endTimeStr);
  
  const start = new Date(year, month - 1, day);
  start.setHours(convertTo24Hour(startHour, startMeridian), startMinute, 0, 0);
  
  const end = new Date(year, month - 1, day);
  end.setHours(convertTo24Hour(endHour, endMeridian), endMinute, 0, 0);
  
  return { start, end };
}

/** Returns "upcoming", "ongoing", or "past" based on session time */
function getSessionTimeWindow(session) {
  const { start, end } = parseSessionSlotTime(session.slot.date, session.slot.time);
  const now = new Date();
  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'ongoing';
}

/**
 * getSessionUIState:
 * Determines which buttons (Join, Cancel, Reschedule) to show and how they should behave,
 * based on the session's status and its time window.
 */
function getSessionUIState(session) {
  const timeWindow = getSessionTimeWindow(session);
  const status = session.status;

  let showJoin = false, joinDisabled = true, joinLabel = 'Join';
  let showCancel = false, showReschedule = false;

  switch (status) {
    case 'Booked':
    case 'In Progress':
    case 'Rescheduled':
      if (timeWindow === 'ongoing') {
        showJoin = true;
        joinDisabled = false;
        joinLabel = 'Join';
      } else if (timeWindow === 'upcoming') {
        showJoin = true;
        joinDisabled = true;
        joinLabel = 'Not Started';
        showCancel = true;
        showReschedule = true;
      } else {
        showJoin = true;
        joinDisabled = true;
        joinLabel = 'Session Ended';
      }
      break;
    case 'Cancellation Requested':
    case 'Reschedule Requested':
      showJoin = true;
      joinDisabled = true;
      joinLabel = 'Awaiting Approval';
      break;
    case 'Cancelled':
      showJoin = true;
      joinDisabled = true;
      joinLabel = 'Cancelled';
      break;
    case 'Completed':
      showJoin = true;
      joinDisabled = true;
      joinLabel = 'Session Completed';
      break;
    default:
      showJoin = false;
  }
  return { showJoin, joinDisabled, joinLabel, showCancel, showReschedule };
}

/**
 * getSessionStatus: Returns a string "Upcoming" or "Past" based on time.
 */
function getSessionStatus(session) {
  const { start } = parseSessionSlotTime(session.slot.date, session.slot.time);
  const now = new Date();
  if (now < start) return "Upcoming";
  return "Past";
}

/**
 * getStatusColor: Returns CSS classes for the session container based on status.
 */
function getStatusColor(status) {
  switch (status) {
    case 'Booked': return 'border-blue-500 bg-blue-50';
    case 'In Progress': return 'border-indigo-500 bg-indigo-50';
    case 'Completed': return 'border-green-500 bg-green-50';
    case 'Cancellation Requested':
    case 'Reschedule Requested': return 'border-amber-500 bg-amber-50';
    case 'Cancelled': return 'border-red-500 bg-red-50';
    case 'Rescheduled': return 'border-purple-500 bg-purple-50';
    default: return 'border-gray-500 bg-gray-50';
  }
}

/** Get current week (Monday to Sunday) */
function getCurrentWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const weekDays = [];
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const day = current.getDate().toString().padStart(2, '0');
    const month = (current.getMonth() + 1).toString().padStart(2, '0');
    const year = current.getFullYear();
    weekDays.push({
      day: dayNames[i],
      date: `${day}-${month}-${year}`,
      iso: current.toISOString().split('T')[0],
    });
  }
  return weekDays;
}

/** Group an array of slots by date */
function groupSlotsByDate(slotsArray) {
  return slotsArray.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});
}

/** AccordionGroup: Displays slots for one day in a collapsible section */
function AccordionGroup({ date, slots, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const getDayName = (dateStr) => {
    const dateObj = parseSlotDate(dateStr);
    return dateObj.toLocaleString('en-US', { weekday: 'long' });
  };
  return (
    <div className="mb-4 border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between bg-gradient-to-r from-gray-100 to-gray-200 p-3 hover:from-gray-200 hover:to-gray-300 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          <FiCheckCircle className="text-green-500" />
          <span className="text-lg font-semibold text-gray-800">
            {date} ({getDayName(date)})
          </span>
        </div>
        <span className="text-xl">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {slots.map((slot, index) => (
            <div
              key={slot._id || slot.id || index}
              className="flex items-center space-x-2 bg-gray-50 p-2 rounded shadow-md"
            >
              <FiCalendar className="text-blue-500" />
              <span className="text-gray-800 font-medium">{slot.date}</span>
              <FiClock className="text-blue-500" />
              <span className="text-gray-800">{slot.display}</span>
              {onEdit && (
                <button
                  onClick={() => onEdit(slot)}
                  className="ml-auto transition-transform transform hover:scale-110 text-blue-500"
                >
                  <FiEdit />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentSlotBooking() {
  // ----- Booking Flow State -----
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingStep, setBookingStep] = useState('selectType'); 
  const [selectedSessionType, setSelectedSessionType] = useState(null);
  const [selectedSessionMode, setSelectedSessionMode] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [agenda, setAgenda] = useState('');

  // ----- Course State (fetched from backend) -----
  const [course, setCourse] = useState(null);

  // ----- Booked Sessions (Bookings) State -----
  const [sessions, setSessions] = useState([]);

  // ----- Active Tab for Displaying Sessions -----
  const [activeTab, setActiveTab] = useState("Upcoming");

  // ----- Available Slots for Selected Mentor -----
  const [availableSlots, setAvailableSlots] = useState([]);

  // ----- Reschedule Modal State -----
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [sessionToReschedule, setSessionToReschedule] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // ----- Cancellation Modal State -----
  const [cancellationModalVisible, setCancellationModalVisible] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);

  // ----- Info Modal State for Already Requested -----
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState('');

  // ----- Session-specific Processing States -----
  const [cancellingSessionId, setCancellingSessionId] = useState(null);
  const [reschedulingSessionId, setReschedulingSessionId] = useState(null);

  // Add state for welcome overlay
  const [showWelcome, setShowWelcome] = useState(true);

  // Add new state variables for doubt type and details
  const [doubtType, setDoubtType] = useState(null);
  const [assignmentId, setAssignmentId] = useState('');
  const [practiceDoubt, setPracticeDoubt] = useState('');

  // ----- Reload Sessions Helper -----
  const reloadSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const studentId = "679c6adcfa0a2f65ce121758";
      const res = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/bookings?user=${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to reload sessions.");
      const data = await res.json();
      const sessionsData = data.map((booking) => ({
        id: booking._id,
        sessionType: booking.sessionType,
        sessionMode: booking.mode,
        mentor: booking.mentor,
        slot: booking.slot,
        slotId: booking.slot.slotId,
        agenda: booking.agenda,
        status: booking.status,
        zoomJoinUrl: booking.zoomJoinUrl,
      }));
      setSessions(sessionsData);
    } catch (err) {
      console.error("Error reloading sessions:", err);
    }
  };

  // ----- Open/Close Booking Modal -----
  const openBookingModal = () => {
    setBookingStep('selectType');
    setSelectedSessionType(null);
    setSelectedSessionMode(null);
    setSelectedMentor(null);
    setSelectedSlot(null);
    setAgenda('');
    setBookingModalVisible(true);
  };
  const closeBookingModal = () => {
    setBookingModalVisible(false);
  };

  // ----- Check if a slot is already booked -----
  const isSlotBooked = (slotId) => {
    return sessions.some(
      (session) =>
        session.slotId === slotId && session.mentor._id === selectedMentor?._id
    );
  };

  // ----- Fetch Sessions from Backend -----
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        const studentId = "679c6adcfa0a2f65ce121758";
        const res = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/bookings?user=${studentId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch sessions.");
        const data = await res.json();
        const sessionsData = data.map((booking) => ({
          id: booking._id,
          sessionType: booking.sessionType,
          sessionMode: booking.mode,
          mentor: booking.mentor,
          slot: booking.slot,
          slotId: booking.slot.slotId,
          agenda: booking.agenda,
          status: booking.status,
          zoomJoinUrl: booking.zoomJoinUrl,
        }));
        setSessions(sessionsData);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      }
    };
    fetchSessions();
  }, []);

  // ----- Fetch Course Details -----
  const COURSE_ID = "67a9b3795cf0982adcc295d7";
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/courses/${COURSE_ID}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch course");
        const data = await res.json();
        setCourse(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCourse();
  }, []);

  // ----- Fetch Mentors Based on Session Type -----
  useEffect(() => {
    if (bookingStep === 'selectMentor' && selectedSessionType && course) {
      let userIds = [];
      if (selectedSessionType.id === "Dost / EC Connect") {
        userIds = course.ECs.map(item => item._id);
      } else if (selectedSessionType.id === "Mentor Connect") {
        userIds = course.mentors.map(item => item._id);
      }
      if (userIds && userIds.length > 0) {
        const fetchUsersByIds = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/users?ids=${userIds.join(',')}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch users by ids");
            const data = await res.json();
            setMentors(data);
          } catch (err) {
            console.error(err);
          }
        };
        fetchUsersByIds();
      } else {
        setMentors([]);
      }
    }
  }, [bookingStep, selectedSessionType, course]);

  // ----- Fetch Available Slots for Selected Mentor -----
  useEffect(() => {
    const fetchSlots = async () => {
      if (bookingStep === 'selectSlot' && selectedMentor) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/slots?mentor=${selectedMentor._id}&status=Open`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed to fetch slots");
          const data = await res.json();
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);
          const filteredSlots = data.filter(slot => {
            const slotDate = parseSlotDate(slot.date);
            return slotDate >= today && slotDate <= nextWeek;
          });
          setAvailableSlots(filteredSlots);
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchSlots();
  }, [bookingStep, selectedMentor]);

  // ----- Cancel Session Flow -----
  const handleCancelButtonClick = (session) => {
    if (session.status === "Cancellation Requested" || session.status === "Reschedule Requested") {
      setInfoModalMessage("A request has already been submitted. Please await mentor approval.");
      setInfoModalVisible(true);
    } else {
      setSessionToCancel(session);
      setCancellationModalVisible(true);
    }
  };

  const confirmCancellation = async () => {
    if (!sessionToCancel?.id) {
      toast.error("Session ID is missing. Cannot cancel session.");
      return;
    }
    setCancellingSessionId(sessionToCancel.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/bookings/${sessionToCancel.id}`, {
        method: 'PUT',
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status: "Cancellation Requested" }),
      });
      if (!res.ok) throw new Error("Failed to request cancellation.");
      const updatedSession = await res.json();
      setSessions(prev => prev.map(s => s.id === updatedSession._id ? { ...updatedSession, id: updatedSession._id } : s));
      toast.success("Your cancellation request has been submitted. Please await mentor approval.");
      setCancellationModalVisible(false);
      await reloadSessions();
    } catch (error) {
      console.error("Error cancelling session:", error);
      toast.error(error.message);
    } finally {
      setCancellingSessionId(null);
    }
  };

  // ----- Reschedule Session Flow -----
  const handleRescheduleButtonClick = (session) => {
    if (session.status === "Reschedule Requested" || session.status === "Cancellation Requested") {
      setInfoModalMessage("A request has already been submitted. Please await mentor approval.");
      setInfoModalVisible(true);
    } else {
      setSessionToReschedule(session);
      setNewDate(session.slot.date);
      setNewTime(session.slot.time);
      setRescheduleModalVisible(true);
    }
  };

  const confirmReschedule = async () => {
    if (!sessionToReschedule?.id) {
      toast.error("Session ID is missing. Cannot reschedule session.");
      return;
    }
    setReschedulingSessionId(sessionToReschedule.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/bookings/${sessionToReschedule.id}`, {
        method: 'PUT',
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          status: "Reschedule Requested",
          slot: { ...sessionToReschedule.slot, date: newDate, time: newTime }
        }),
      });
      if (!res.ok) throw new Error("Failed to request reschedule.");
      const updatedSession = await res.json();
      setSessions(prev => prev.map(s => s.id === updatedSession._id ? { ...updatedSession, id: updatedSession._id } : s));
      toast.success("Your reschedule request has been submitted. Please await mentor approval.");
      setRescheduleModalVisible(false);
      await reloadSessions();
    } catch (error) {
      console.error("Error rescheduling session:", error);
      toast.error(error.message);
    } finally {
      setReschedulingSessionId(null);
    }
  };

  // ----- Determine Join Button Status -----
  const getJoinButtonStatus = (session) => {
    const { start, end } = parseSessionSlotTime(session.slot.date, session.slot.time);
    const now = new Date();
    if (session.status === 'Completed' || now > end) {
      return { disabled: true, label: 'Session Ended' };
    }
    if (session.status === "Cancellation Requested" || session.status === "Reschedule Requested") {
      return { disabled: true, label: "Awaiting Approval" };
    }
    return { disabled: false, label: 'Join' };
  };

  // ----- Confirm Booking -----
  const confirmBooking = async () => {
    if (sessions.length >= MAX_BOOKINGS) {
      toast.error("You have reached your maximum booking limit.");
      return;
    }
    const token = localStorage.getItem('token');
    const payload = {
      student: "679c6adcfa0a2f65ce121758",    
      mentor: selectedMentor._id,              
      sessionType: selectedSessionType.id,     
      mode: selectedSessionMode,               
      slot: {                                   
        slotId: selectedSlot.slotId || selectedSlot._id,  
        date: selectedSlot.date,
        time: selectedSlot.time,
      },
      agenda: agenda.trim(),                    
    };
    try {
      const res = await fetch("https://masai-connect-backend-w28f.vercel.app/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Booking creation failed");
      }
      const booking = await res.json();
      setSessions([...sessions, {
        id: booking._id,
        sessionType: booking.sessionType,
        sessionMode: booking.mode,
        mentor: booking.mentor,
        slot: booking.slot,
        slotId: booking.slot.slotId,
        agenda: booking.agenda,
        status: booking.status,
        zoomJoinUrl: booking.zoomJoinUrl,
      }]);
      toast.success("Your booking has been confirmed!");
      setBookingStep('success');
      setTimeout(() => {
        setBookingModalVisible(false);
      }, 2000);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(error.message);
    }
  };

  // ----- Filtering Sessions by Active Tab -----
  const filteredSessions = sessions.filter((session) => {
    const sessionStatus = getSessionStatus(session);
    if (activeTab === 'Upcoming') {
      return sessionStatus === "Upcoming";
    } else if (activeTab === 'Past') {
      return sessionStatus === "Past";
    }
    return true;
  });

  // ----- Get Current Week (if needed) -----
  const currentWeek = getCurrentWeek();

  // Function to handle proceed click
  const handleProceedClick = () => {
    if (selectedSessionType.id === 'Mentor Connect') {
      setBookingStep('selectDoubtType');
    } else {
      setBookingStep('selectSlot');
    }
  };

  // Function to handle no thanks click
  const handleNoThanks = () => {
    setShowWelcome(false);
  };

  // ----- Handle Session Type Selection -----
  const handleSessionTypeSelect = (type) => {
    setSelectedSessionType(type);
    if (type.id === 'Mentor Connect') {
      setBookingStep('selectDoubtType');
    } else if (type.id === 'Dost / EC Connect') {
      // For Dost Connect, show the pre-assigned slot directly
      setBookingStep('showDostSlot');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <div className="relative max-w-md w-full overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-xl shadow-xl">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="p-8"
                  >
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/20 rounded-full transform translate-x-20 -translate-y-20 blur-2xl animate-pulse" />
                    <div className="absolute top-20 left-0 w-32 h-32 bg-purple-400/20 rounded-full transform -translate-x-16 blur-2xl animate-pulse delay-300" />
                    <div className="absolute bottom-0 right-20 w-36 h-36 bg-pink-400/20 rounded-full transform translate-y-20 blur-2xl animate-pulse delay-700" />
                    
                    <div className="relative z-10">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center"
                      >
                        {/* Character Animation */}
                        <motion.div
                          animate={{
                            y: [0, -10, 0],
                            rotate: [0, -5, 5, 0]
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="mb-6 p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full"
                        >
                          <div className="relative">
                            <Rocket className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                            <motion.div
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="absolute -bottom-2 -right-2"
                            >
                              <Sparkles className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                            </motion.div>
                          </div>
                        </motion.div>
                        
                        <h2 className="text-3xl font-bold tracking-tight mb-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                          Welcome to Your Journey! 🚀
                        </h2>
                        <p className="text-gray-600 text-center mb-8">
                          Your adventure begins here! Connect with amazing mentors 
                          and peers who'll help you reach for the stars.
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <button
                          onClick={handleProceedClick}
                          className="flex-1 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-lg transition-colors"
                        >
                          Let's Begin!
                        </button>
                        <button
                          onClick={handleNoThanks}
                          className="flex-1 text-base font-medium border-2 border-gray-300 hover:bg-gray-100 py-3 px-6 rounded-lg transition-colors"
                        >
                          Maybe Later
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Emnyata Sessions</h1>

          {/* ----- Tabs for Sessions ----- */}
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

          {/* ----- Display Sessions ----- */}
          {filteredSessions.length === 0 ? (
            <p className="text-gray-600">No {activeTab.toLowerCase()} sessions found.</p>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session, index) => {
                const { showJoin, joinDisabled, joinLabel, showCancel, showReschedule } = getSessionUIState(session);
                const joinStatus = getJoinButtonStatus(session);
                return (
                  <div
                    key={session.id || index}
                    className={`relative border-l-4 p-4 rounded shadow-md ${getStatusColor(session.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {session.sessionType?.label ?? session.sessionType}
                      </h2>
                      <span className="px-3 py-1 text-sm rounded-full bg-gray-200 text-gray-700">
                        {session.sessionMode}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">
                      With {session.mentor.name}
                      {getDisplayRole(session.mentor, selectedSessionType) && ` (${getDisplayRole(session.mentor, selectedSessionType)})`}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <FiCalendar className="text-blue-500" />
                      <span>{session.slot.date}</span>
                      <FiClock className="text-blue-500" />
                      <span>{session.slot.time}</span>
                    </div>
                    {session.agenda && (
                      <p className="mt-2 text-gray-600">
                        <span className="font-medium">Agenda:</span> {session.agenda}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">Status: {session.status}</p>
                    {(session.status === "Cancellation Requested" || session.status === "Reschedule Requested") && (
                      <p className="mt-1 text-sm text-orange-600 font-semibold">
                        Request Pending: Please await mentor approval.
                      </p>
                    )}

                    {/* Cancel/Reschedule Buttons */}
                    {(showCancel || showReschedule) && (
                      <div className="mt-4 flex space-x-4">
                        {showCancel && (
                          <button 
                            onClick={() => handleCancelButtonClick(session)}
                            disabled={session.id === cancellingSessionId}
                            className={`px-4 py-2 rounded transition-colors ${
                              session.id === cancellingSessionId
                                ? 'bg-red-300 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600'
                            } text-white`}
                          >
                            {session.id === cancellingSessionId ? "Cancelling..." : "Cancel"}
                          </button>
                        )}
                        {showReschedule && (
                          <button 
                            onClick={() => handleRescheduleButtonClick(session)}
                            disabled={session.id === reschedulingSessionId}
                            className={`px-4 py-2 rounded transition-colors ${
                              session.id === reschedulingSessionId
                                ? 'bg-yellow-300 cursor-not-allowed'
                                : 'bg-yellow-500 hover:bg-yellow-600'
                            } text-white`}
                          >
                            {session.id === reschedulingSessionId ? "Rescheduling..." : "Reschedule"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Join Button */}
                    {showJoin && (
                      <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                        <a
                          href={!joinDisabled ? session.zoomJoinUrl : undefined}
                          onClick={(e) => { if (joinDisabled) e.preventDefault(); }}
                          className={`inline-flex items-center px-6 py-2 rounded-lg transition-all duration-300 shadow-lg ${
                            joinDisabled
                              ? 'bg-blue-300 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white`}
                          target={joinDisabled ? "_self" : "_blank"}
                          rel={joinDisabled ? undefined : "noopener noreferrer"}
                        >
                          <FiVideo className="h-5 w-5 mr-2" />
                          <span>{joinLabel}</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating "Book Session" Button */}
          <button
            onClick={openBookingModal}
            disabled={sessions.length >= MAX_BOOKINGS}
            title={sessions.length >= MAX_BOOKINGS ? `Booking limit reached. You can only book ${MAX_BOOKINGS} sessions.` : ""}
            className={`fixed bottom-6 right-6 ${
              sessions.length >= MAX_BOOKINGS 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-colors`}
          >
            Book Session
          </button>

          {/* Cancellation Confirmation Modal */}
          {cancellationModalVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Confirm Cancellation</h2>
                <p className="mb-6 text-gray-700">
                  Are you sure you want to cancel this session? Your cancellation request will be sent for mentor approval.
                </p>
                <div className="flex justify-end space-x-4">
                  <button 
                    onClick={() => setCancellationModalVisible(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    No, Keep Session
                  </button>
                  <button 
                    onClick={confirmCancellation}
                    disabled={sessionToCancel && sessionToCancel.id === cancellingSessionId}
                    className={`px-4 py-2 rounded transition-colors ${
                      sessionToCancel && sessionToCancel.id === cancellingSessionId
                        ? 'bg-red-300 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white`}
                  >
                    {sessionToCancel && sessionToCancel.id === cancellingSessionId ? "Cancelling..." : "Yes, Cancel Session"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reschedule Modal */}
          {rescheduleModalVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Reschedule Session</h2>
                <label className="block mb-2">
                  <span className="font-medium">New Date (dd-mm-yyyy)</span>
                  <input 
                    type="text" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g., 25-03-2025"
                  />
                </label>
                <label className="block mb-4">
                  <span className="font-medium">New Time (HH:MM AM/PM - HH:MM AM/PM)</span>
                  <input 
                    type="text" 
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g., 11:00 AM - 11:30 AM"
                  />
                </label>
                <div className="flex justify-end space-x-4">
                  <button 
                    onClick={() => setRescheduleModalVisible(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmReschedule}
                    disabled={sessionToReschedule && sessionToReschedule.id === reschedulingSessionId}
                    className={`px-4 py-2 rounded transition-colors ${
                      sessionToReschedule && sessionToReschedule.id === reschedulingSessionId
                        ? 'bg-blue-300 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                  >
                    {sessionToReschedule && sessionToReschedule.id === reschedulingSessionId ? "Rescheduling..." : "Confirm Reschedule"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Information Modal */}
          {infoModalVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Information</h2>
                <p className="mb-6 text-gray-700">{infoModalMessage}</p>
                <div className="flex justify-end">
                  <button 
                    onClick={() => setInfoModalVisible(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ----- Booking Modal (Steps) ----- */}
          {bookingModalVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 w-full max-w-2xl shadow-lg relative">
                <button
                  className="absolute top-4 right-4"
                  onClick={closeBookingModal}
                >
                  <FiXCircle className="text-red-500 text-2xl" />
                </button>
                {/* Step 1: Select Session Type */}
                {bookingStep === 'selectType' && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Select Session Type</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {connectionTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleSessionTypeSelect(type)}
                          className="bg-white border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`${connectionTypeColors[type.id].bg} rounded-full p-3`}>
                              <FiUser className={`${connectionTypeColors[type.id].text} text-2xl`} />
                            </div>
                            <div>
                              <h3 className="text-xl font-medium text-gray-800">{type.label}</h3>
                              <p className="text-sm text-gray-600">{type.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Select Doubt Type (for Mentor Connect) */}
                {bookingStep === 'selectDoubtType' && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Select Doubt Type</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button
                        onClick={() => {
                          setDoubtType('assignment');
                          setBookingStep('assignmentDetails');
                        }}
                        className="bg-white border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 rounded-full p-3">
                            <FiFileText className="text-blue-500 text-2xl" />
                          </div>
                          <div>
                            <h3 className="text-xl font-medium text-gray-800">Assignment Related Doubt</h3>
                            <p className="text-sm text-gray-600">Get help with specific assignments or questions</p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setDoubtType('practice');
                          setBookingStep('practiceDoubtDetails');
                        }}
                        className="bg-white border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-green-100 rounded-full p-3">
                            <FiMic className="text-green-500 text-2xl" />
                          </div>
                          <div>
                            <h3 className="text-xl font-medium text-gray-800">Practice Doubt</h3>
                            <p className="text-sm text-gray-600">Record and explain your doubt in detail</p>
                          </div>
                        </div>
                      </button>
                    </div>
                    <button
                      className="mt-6 text-blue-600 hover:underline"
                      onClick={() => setBookingStep('selectType')}
                    >
                      Back
                    </button>
                  </div>
                )}

                {/* Step 3: Assignment Details */}
                {bookingStep === 'assignmentDetails' && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Assignment Details</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assignment/Question ID
                        </label>
                        <input
                          type="text"
                          value={assignmentId}
                          onChange={(e) => setAssignmentId(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter assignment or question ID"
                        />
                      </div>
                      <div className="flex justify-between mt-6">
                        <button
                          onClick={() => setBookingStep('selectDoubtType')}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setBookingStep('showMentorSlot')}
                          disabled={!assignmentId.trim()}
                          className={`${
                            !assignmentId.trim() ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                          } text-white font-medium py-2 px-6 rounded transition-colors`}
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Practice Doubt Details */}
                {bookingStep === 'practiceDoubtDetails' && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Practice Doubt Details</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Describe Your Doubt
                        </label>
                        <textarea
                          value={practiceDoubt}
                          onChange={(e) => setPracticeDoubt(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Please describe your doubt in detail..."
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-between mt-6">
                        <button
                          onClick={() => setBookingStep('selectDoubtType')}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setBookingStep('showMentorSlot')}
                          disabled={!practiceDoubt.trim()}
                          className={`${
                            !practiceDoubt.trim() ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                          } text-white font-medium py-2 px-6 rounded transition-colors`}
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Show Mentor Connect Slot */}
                {bookingStep === 'showMentorSlot' && (
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Session Details</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <FiUser className="text-blue-500" />
                        <span className="font-medium text-gray-700">Instructor:</span>
                        <span className="text-gray-800">Jane Smith (Mentor)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiCalendar className="text-blue-500" />
                        <span className="font-medium text-gray-700">Date:</span>
                        <span className="text-gray-800">16-04-2024</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiClock className="text-blue-500" />
                        <span className="font-medium text-gray-700">Time:</span>
                        <span className="text-gray-800">11:00 AM - 11:30 AM</span>
                      </div>
                      {doubtType === 'assignment' && (
                        <div>
                          <span className="font-medium text-gray-700">Assignment ID:</span>
                          <span className="ml-2 text-gray-800">{assignmentId}</span>
                        </div>
                      )}
                      {doubtType === 'practice' && (
                        <div>
                          <span className="font-medium text-gray-700">Doubt Description:</span>
                          <p className="mt-1 text-gray-600">{practiceDoubt}</p>
                        </div>
                      )}
                      <div className="mt-4">
                        <a
                          href="#"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiVideo className="mr-2" />
                          Join Meeting
                        </a>
                      </div>
                    </div>
                    <button
                      className="mt-6 text-blue-600 hover:underline"
                      onClick={() => {
                        if (doubtType === 'assignment') {
                          setBookingStep('assignmentDetails');
                        } else {
                          setBookingStep('practiceDoubtDetails');
                        }
                      }}
                    >
                      Back
                    </button>
                  </div>
                )}

                {/* Step 6: Select Session Mode */}
                {bookingStep === 'selectMode' && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Select Session Mode</h2>
                    <div className="flex space-x-6">
                      <button
                        onClick={() => {
                          setSelectedSessionMode('Private');
                          setBookingStep('confirm');
                        }}
                        className="flex-1 border rounded-lg p-6 text-center hover:bg-gray-100 transition-all"
                      >
                        <span className="block text-2xl font-semibold text-gray-800">Private</span>
                        <span className="block text-sm text-gray-600 mt-1">
                          One-to-one session offering personalized attention.
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSessionMode('Public');
                          setBookingStep('confirm');
                        }}
                        className="flex-1 border rounded-lg p-6 text-center hover:bg-gray-100 transition-all"
                      >
                        <span className="block text-2xl font-semibold text-gray-800">Public</span>
                        <span className="block text-sm text-gray-600 mt-1">
                          One-to-many session where multiple participants join.
                        </span>
                      </button>
                    </div>
                    <button
                      className="mt-6 text-blue-600 hover:underline"
                      onClick={() => setBookingStep('selectSlot')}
                    >
                      Back
                    </button>
                  </div>
                )}

                {/* Step 7: Confirm Booking */}
                {bookingStep === 'confirm' && (
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Confirm Booking</h2>
                    <div className="space-y-4">
                      <div>
                        <span className="font-medium text-gray-700">Session Type:</span> {selectedSessionType.label}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Mode:</span> {selectedSessionMode}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">With:</span> {selectedMentor.name}
                        {getDisplayRole(selectedMentor, selectedSessionType) && (
                          <> ({getDisplayRole(selectedMentor, selectedSessionType)})</>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiCalendar className="text-blue-500" />
                        <span className="font-medium text-gray-700">Date:</span> {selectedSlot.date}
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiClock className="text-blue-500" />
                        <span className="font-medium text-gray-700">Time:</span> {selectedSlot.time}
                      </div>
                      {doubtType === 'assignment' && (
                        <div>
                          <span className="font-medium text-gray-700">Assignment ID:</span> {assignmentId}
                        </div>
                      )}
                      {doubtType === 'practice' && (
                        <div>
                          <span className="font-medium text-gray-700">Doubt Description:</span>
                          <p className="mt-1 text-gray-600">{practiceDoubt}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => setBookingStep('selectSlot')}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={confirmBooking}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
                      >
                        Confirm Booking
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 8: Booking Success */}
                {bookingStep === 'success' && (
                  <div className="flex flex-col items-center justify-center">
                    <FiCheckCircle className="text-green-500 text-5xl mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Booking Confirmed!</h2>
                    <div className="mt-4 border p-4 rounded-lg w-full bg-blue-50">
                      <p>
                        <span className="font-medium text-gray-700">Session Type:</span> {selectedSessionType.label}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Mode:</span> {selectedSessionMode}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">With:</span> {selectedMentor.name}
                        {getDisplayRole(selectedMentor, selectedSessionType) && (
                          <> ({getDisplayRole(selectedMentor, selectedSessionType)})</>
                        )}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Date:</span> {selectedSlot.date}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Time:</span> {selectedSlot.time}
                      </p>
                      {doubtType === 'assignment' && (
                        <div>
                          <span className="font-medium text-gray-700">Assignment ID:</span> {assignmentId}
                        </div>
                      )}
                      {doubtType === 'practice' && (
                        <div>
                          <span className="font-medium text-gray-700">Doubt Description:</span>
                          <p className="mt-1 text-gray-600">{practiceDoubt}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Show Dost/EC Connect Slot */}
                {bookingStep === 'showDostSlot' && (
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Session Details</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <FiUser className="text-blue-500" />
                        <span className="font-medium text-gray-700">Instructor:</span>
                        <span className="text-gray-800">John Doe (EC)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiCalendar className="text-blue-500" />
                        <span className="font-medium text-gray-700">Date:</span>
                        <span className="text-gray-800">15-04-2024</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiClock className="text-blue-500" />
                        <span className="font-medium text-gray-700">Time:</span>
                        <span className="text-gray-800">10:00 AM - 10:30 AM</span>
                      </div>
                      <div className="mt-4">
                        <a
                          href="#"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiVideo className="mr-2" />
                          Join Meeting
                        </a>
                      </div>
                    </div>
                    <button
                      className="mt-6 text-blue-600 hover:underline"
                      onClick={() => setBookingStep('selectType')}
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}