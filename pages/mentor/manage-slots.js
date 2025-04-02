import { useEffect, useState } from 'react';
import Sidebar from '../shared-components/Sidebar';
import Header from '../shared-components/Header';
import {
  FiCalendar,
  FiClock,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiChevronDown,
  FiAlertCircle,
  FiCheck,
} from 'react-icons/fi';

/**
 * Parse a date string in "dd-mm-yyyy" format into a Date object.
 */
const parseSlotDate = (dateStr) => {
  const [day, month, year] = dateStr.split('-');
  return new Date(year, month - 1, day);
};

/**
 * Convert a date string from "dd-mm-yyyy" to "yyyy-mm-dd" format for HTML input.
 */
const convertDateToInputValue = (dateStr) => {
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`;
};

/**
 * Generate time slots between startTime and endTime with a given slotDuration and buffer.
 * Returns an array of objects: { display, start, end }.
 */
const generateTimeSlots = (startTime, endTime, slotDuration, buffer) => {
  const slots = [];
  const toMinutes = (timeStr) => {
    const [hh, mm] = timeStr.split(':').map(Number);
    return hh * 60 + mm;
  };
  const toDisplay = (totalMins) => {
    const hh = Math.floor(totalMins / 60);
    const mm = totalMins % 60;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const displayHour = hh % 12 === 0 ? 12 : hh % 12;
    const displayMinute = mm.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${ampm}`;
  };
  let start = toMinutes(startTime);
  const end = toMinutes(endTime);
  while (start + slotDuration <= end) {
    const slotStart = start;
    const slotEnd = start + slotDuration;
    slots.push({
      display: `${toDisplay(slotStart)} - ${toDisplay(slotEnd)}`,
      start: (() => {
        const hh = Math.floor(slotStart / 60).toString().padStart(2, '0');
        const mm = (slotStart % 60).toString().padStart(2, '0');
        return `${hh}:${mm}`;
      })(),
      end: (() => {
        const hh = Math.floor(slotEnd / 60).toString().padStart(2, '0');
        const mm = (slotEnd % 60).toString().padStart(2, '0');
        return `${hh}:${mm}`;
      })(),
    });
    start = slotEnd + buffer;
  }
  return slots;
};

/**
 * Get the next n days starting from today as an array of objects.
 */
const getNextDays = (n) => {
  const today = new Date();
  const nextDays = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < n; i++) {
    const current = new Date();
    current.setDate(today.getDate() + i);
    const day = current.getDate().toString().padStart(2, '0');
    const month = (current.getMonth() + 1).toString().padStart(2, '0');
    const year = current.getFullYear();
    nextDays.push({
      day: dayNames[current.getDay()],
      date: `${day}-${month}-${year}`,
      iso: current.toISOString().split('T')[0],
    });
  }
  return nextDays;
};

/**
 * Group an array of slots by date.
 */
const groupSlotsByDate = (slotsArray) => {
  return slotsArray.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});
};

/**
 * AccordionGroup Component: Displays slots for one day in a collapsible section.
 */
function AccordionGroup({ date, slots, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const getDayName = (dateStr) => {
    const dateObj = parseSlotDate(dateStr);
    return dateObj.toLocaleString('en-US', { weekday: 'long' });
  };

  // Format time to 12-hour format with am/pm
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden border border-blue-100 transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-all duration-300 group"
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">{date}</span>
          <span className="text-sm text-gray-500 group-hover:text-blue-500 transition-colors duration-300">({getDayName(date)})</span>
          <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full transition-all duration-300 group-hover:bg-blue-200 group-hover:text-blue-700">
            {slots.length} slots
          </span>
        </div>
        <FiChevronDown 
          className={`w-4 h-4 text-blue-400 transform transition-all duration-300 ${
            isExpanded ? 'rotate-180' : ''
          } group-hover:text-blue-600`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 animate-expand">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mt-2">
            {slots.map((slot) => {
              const startTime = formatTime(slot.startTime);
              return (
                <button
                  key={`${slot.id}-${slot.startTime}`}
                  className="relative group transform transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-all duration-300 text-center border border-blue-100 group-hover:border-blue-200 group-hover:shadow-sm">
                    <span className="text-blue-600 font-medium text-xs group-hover:text-blue-700 transition-colors duration-300">
                      {startTime}
                    </span>
                  </div>
                  {slot.status === 'Open' && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full transition-all duration-300 group-hover:scale-110" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get the next occurrence of a given day from today
 * @param {string} dayName - Three letter day name (e.g., 'Mon', 'Tue')
 * @returns {string} Date in DD-MM-YYYY format
 */
const getNextDayOccurrence = (dayName) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const targetDay = days.indexOf(dayName);
  const currentDay = today.getDay();
  
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Move to next week if day has passed
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysToAdd);
  
  // Format as DD-MM-YYYY
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const yyyy = targetDate.getFullYear();
  
  return `${dd}-${mm}-${yyyy}`;
};

export default function MentorManageSlots() {
  // ----- State Management -----
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Open');
  const [successMessage, setSuccessMessage] = useState('');

  // ----- Slot Creation Modal State -----
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDays, setSelectedDays] = useState({
    Sun: { selected: false, startTime: '', endTime: '', isUnavailable: true, slots: [], isExpanded: false },
    Mon: { selected: false, startTime: '9:00', endTime: '17:00', isUnavailable: false, slots: [], isExpanded: false },
    Tue: { selected: false, startTime: '9:00', endTime: '17:00', isUnavailable: false, slots: [], isExpanded: false },
    Wed: { selected: false, startTime: '9:00', endTime: '17:00', isUnavailable: false, slots: [], isExpanded: false },
    Thu: { selected: false, startTime: '9:00', endTime: '17:00', isUnavailable: false, slots: [], isExpanded: false },
    Fri: { selected: false, startTime: '9:00', endTime: '17:00', isUnavailable: false, slots: [], isExpanded: false },
    Sat: { selected: false, startTime: '', endTime: '', isUnavailable: true, slots: [] }
  });

  // ----- Handle Time Change -----
  const handleTimeChange = (day, type, value) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value
      }
    }));
  };

  // ----- Handle Day Selection -----
  const toggleDaySelection = (day) => {
    if (selectedDays[day].isUnavailable) return;
    setSelectedDays(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        selected: !prev[day].selected
      }
    }));
  };

  // ----- Handle Adding Time Slot -----
  const handleAddTimeSlot = (day) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { startTime: '9:00', endTime: '17:00' }]
      }
    }));
  };

  // ----- Handle Time Change for Multiple Slots -----
  const handleSlotTimeChange = (day, slotIndex, type, value) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, idx) => 
          idx === slotIndex 
            ? { ...slot, [type]: value }
            : slot
        )
      }
    }));
  };

  // ----- Handle Remove Time Slot -----
  const handleRemoveTimeSlot = (day, slotIndex) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, idx) => idx !== slotIndex)
      }
    }));
  };

  // ----- Submit Slots to Backend -----
  const handleSubmitSlots = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const mentorId = "679c6adcfa0a2f65ce121758"; // Replace with actual mentor ID

      // Format the data for each selected day and their slots
      const slotsData = Object.entries(selectedDays)
        .filter(([_, value]) => value.selected)
        .flatMap(([day, value]) => {
          const slotDate = getNextDayOccurrence(day);
          
          if (value.slots.length === 0) {
            return [{
              day,
              date: slotDate,
              startTime: value.startTime,
              endTime: value.endTime,
              mentorId,
            }];
          }
          return value.slots.map(slot => ({
            day,
            date: slotDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            mentorId,
          }));
        });

      // TODO: Replace with your actual API endpoint
      const response = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/mentors/${mentorId}/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(slotsData)
      });

      if (!response.ok) throw new Error('Failed to create slots');
      
      setSuccessMessage('Slots created successfully!');
      setTimeout(() => {
        setModalVisible(false);
        setSuccessMessage('');
      }, 2000);
      
      fetchSlots();
    } catch (error) {
      console.error('Error creating slots:', error);
      setError('Failed to create slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ----- Fetch Slots from the Backend -----
  const fetchSlots = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const mentorId = "679c6adcfa0a2f65ce121758";
      const res = await fetch(`https://masai-connect-backend-w28f.vercel.app/api/slots?mentor=${mentorId}&status=${activeTab}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch slots");
      const data = await res.json();
      const fetchedSlots = data.map(slot => ({
        id: slot._id,
        date: slot.date,
        time: slot.time,
        display: slot.time,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status
      }));
      setSlots(fetchedSlots);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- Initial Fetch -----
  useEffect(() => {
    fetchSlots();
  }, [activeTab]);

  // ----- Color Coding for Slot Statuses -----
  const getStatusClasses = (status) => {
    switch (status) {
      case 'Open':
        return 'border-blue-500 bg-blue-50';
      case 'Booked':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  // ----- Filter Slots by Active Tab (client-side fallback) -----
  const filteredSlots = slots.filter((slot) => slot.status === activeTab);

  // ----- Group Filtered Slots by Date for Main View -----
  const groupedFilteredSlots = groupSlotsByDate(filteredSlots);
  const sortedFilteredDates = Object.keys(groupedFilteredSlots).sort(
    (a, b) => parseSlotDate(a) - parseSlotDate(b)
  );

  // Toggle day expansion
  const toggleDayExpansion = (day) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isExpanded: !prev[day].isExpanded
      }
    }));
  };

  // Quick time presets
  const timePresets = [
    { label: 'Morning (9 AM - 12 PM)', start: '09:00', end: '12:00' },
    { label: 'Afternoon (1 PM - 5 PM)', start: '13:00', end: '17:00' },
    { label: 'Full Day (9 AM - 5 PM)', start: '09:00', end: '17:00' },
  ];

  // Apply time preset
  const applyTimePreset = (day, preset) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        startTime: preset.start,
        endTime: preset.end,
        selected: true
      }
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar className="h-full" />
        <main className="flex-1 w-full p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Manage My Slots
              </h1>
              
              <button
                onClick={() => setModalVisible(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <FiPlus className="text-xl transform group-hover:rotate-90 transition-transform duration-300" />
                  <span>Add Slots</span>
                </div>
              </button>
            </div>

            {/* Create Slots Modal */}
            {modalVisible && (
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-modal-enter">
                <div 
                  className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-2xl transform transition-all duration-300 hover:shadow-3xl"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent transition-all duration-300 hover:from-blue-700 hover:to-blue-900">
                      Create Weekly Schedule
                    </h2>
                    <button 
                      onClick={() => setModalVisible(false)}
                      className="text-gray-400 hover:text-red-500 transition-all duration-300 transform hover:scale-110 hover:rotate-90"
                    >
                      <FiXCircle className="text-2xl" />
                    </button>
                  </div>

                  {/* Success Message */}
                  {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center space-x-2">
                      <FiCheckCircle className="text-green-500" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center space-x-2">
                      <FiAlertCircle className="text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Day Selection Grid */}
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    {Object.entries(selectedDays).map(([day, data]) => (
                      <div 
                        key={day}
                        className={`p-6 rounded-xl border transition-all duration-300 transform hover:scale-[1.01] ${
                          data.isUnavailable 
                            ? 'bg-gray-50 cursor-not-allowed border-gray-200'
                            : data.selected
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg'
                              : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-blue-200 cursor-pointer'
                        }`}
                      >
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="w-20 font-semibold text-gray-700">{day}</span>
                              {!data.isUnavailable && (
                                <button
                                  onClick={() => toggleDayExpansion(day)}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    data.isExpanded
                                      ? 'bg-blue-100 text-blue-600'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  <FiChevronDown 
                                    className={`transform transition-transform duration-200 ${
                                      data.isExpanded ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                            {!data.isUnavailable && (
                              <button
                                onClick={() => toggleDaySelection(day)}
                                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                                  data.selected
                                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {data.selected ? 'Selected' : 'Select'}
                              </button>
                            )}
                          </div>

                          {/* Expanded Content */}
                          {!data.isUnavailable && data.isExpanded && (
                            <div className="pl-24 space-y-4 animate-expand">
                              {/* Time Presets */}
                              <div className="flex flex-wrap gap-2">
                                {timePresets.map((preset, index) => (
                                  <button
                                    key={index}
                                    onClick={() => applyTimePreset(day, preset)}
                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors duration-200"
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                              </div>

                              {/* Time Slots */}
                              <div className="space-y-3">
                                {data.slots.length === 0 ? (
                                  <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
                                    <input
                                      type="time"
                                      value={data.startTime}
                                      onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                                      disabled={!data.selected}
                                    />
                                    <span className="text-gray-500">to</span>
                                    <input
                                      type="time"
                                      value={data.endTime}
                                      onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                                      disabled={!data.selected}
                                    />
                                  </div>
                                ) : (
                                  data.slots.map((slot, index) => (
                                    <div 
                                      key={index} 
                                      className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                                    >
                                      <input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(e) => handleSlotTimeChange(day, index, 'startTime', e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                                        disabled={!data.selected}
                                      />
                                      <span className="text-gray-500">to</span>
                                      <input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(e) => handleSlotTimeChange(day, index, 'endTime', e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                                        disabled={!data.selected}
                                      />
                                      <button
                                        onClick={() => handleRemoveTimeSlot(day, index)}
                                        className="text-red-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg group"
                                      >
                                        <FiTrash2 className="transform group-hover:rotate-12 transition-transform duration-200" />
                                      </button>
                                    </div>
                                  ))
                                )}
                                {data.selected && (
                                  <button
                                    onClick={() => handleAddTimeSlot(day)}
                                    className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 transition-colors group w-fit"
                                  >
                                    <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                                      <FiPlus className="text-lg transform group-hover:rotate-90 transition-transform duration-200" />
                                    </div>
                                    <span className="font-medium">Add another slot</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submit Button */}
                  <div className="mt-8 flex justify-end space-x-4 border-t pt-6">
                    <button
                      onClick={() => setModalVisible(false)}
                      className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitSlots}
                      disabled={loading}
                      className={`px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2 transform hover:-translate-y-0.5 ${
                        loading ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span>Save Schedule</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing slots display */}
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-pink-500 border-gray-300"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex space-x-6 mb-6 border-b border-blue-50 pb-2">
                  {['Open', 'Booked'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`font-medium pb-2 transition-all ${
                        activeTab === tab
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-400 hover:text-blue-500'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Main Slots List: Grouped by Date */}
                {sortedFilteredDates.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">No {activeTab.toLowerCase()} slots found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedFilteredDates.map((date) => (
                      <AccordionGroup
                        key={date}
                        date={date}
                        slots={groupedFilteredSlots[date]}
                        onEdit={() => {}}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Add these keyframes to your global CSS
const styles = `
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes expand {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-modal-enter {
  animation: modalEnter 0.3s ease-out forwards;
}

.animate-expand {
  animation: expand 0.2s ease-out forwards;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
  transition: all 0.3s ease;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
`;
