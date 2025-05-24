import React, { useState } from 'react';
import Modal from './Modal';
import { toast } from 'react-hot-toast';
import { FiClock, FiCalendar, FiBell, FiX, FiCheck } from 'react-icons/fi';

const ReminderModal = ({ isOpen, onClose, task, onSetReminder }) => {
   const [selectedOption, setSelectedOption] = useState('10min');
   const [customDateTime, setCustomDateTime] = useState('');

   const handleSubmit = (e) => {
      e.preventDefault();

      if (!task || !task._id) {
         toast.error('Task information is missing');
         return;
      }

      let reminderTime;
      const now = new Date();

      if (selectedOption === 'custom') {
         if (!customDateTime) {
            toast.error('Please select a date and time');
            return;
         }
         reminderTime = new Date(customDateTime).toISOString();
      } else {
         // Calculate time based on presets
         switch (selectedOption) {
            case '10min':
               now.setMinutes(now.getMinutes() + 10);
               break;
            case '1hour':
               now.setHours(now.getHours() + 1);
               break;
            case '1day':
               now.setDate(now.getDate() + 1);
               break;
            case 'attime':
               // Parse task date/time and set reminder for task time
               if (task.date && task.time) {
                  const [day, month, year] = task.date.split('/');
                  let [hours, minutes, ampm] = task.time.match(/(\d+):(\d+)\s(AM|PM)/).slice(1, 4);

                  hours = parseInt(hours);
                  if (ampm === 'PM' && hours < 12) hours += 12;
                  if (ampm === 'AM' && hours === 12) hours = 0;

                  const taskDateTime = new Date(year, month - 1, day, hours, minutes);
                  now.setTime(taskDateTime.getTime());
               }
               break;
            default:
               break;
         }
         reminderTime = now.toISOString();
      }

      console.log('ReminderModal - Sending reminder data:', {
         taskId: task._id,
         reminderTime,
         selectedOption,
         customDateTime,
      });

      // Call onSetReminder with taskId and reminderTime
      onSetReminder(task._id, reminderTime);
      onClose();
   };

   const reminderOptions = [
      {
         value: '10min',
         label: '10 minutes from now',
         icon: <FiClock className="h-5 w-5" />,
         description: 'Quick reminder',
      },
      {
         value: '1hour',
         label: '1 hour from now',
         icon: <FiClock className="h-5 w-5" />,
         description: 'Plan ahead',
      },
      {
         value: '1day',
         label: '1 day from now',
         icon: <FiCalendar className="h-5 w-5" />,
         description: 'Daily reminder',
      },
      {
         value: 'attime',
         label: 'At time of task',
         icon: <FiBell className="h-5 w-5" />,
         description: 'Perfect timing',
      },
      {
         value: 'custom',
         label: 'Custom date and time',
         icon: <FiCalendar className="h-5 w-5" />,
         description: 'Set your own',
      },
   ];

   return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
         <div className="p-4 sm:p-6 lg:p-8">
            {/* Modern Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8">
               <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                     <FiBell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                     <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Set Reminder</h2>
                     <p className="text-sm text-gray-600 mt-1">Never miss an important task</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-xl transition-all duration-200 group">
                  <FiX className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
               {/* Enhanced Task Information Card */}
               {task && (
                  <div className="bg-gradient-to-r from-purple-100/60 to-indigo-100/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-purple-200/50">
                     <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                           <FiCheck className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2">{task.task}</h3>
                           <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                 <FiCalendar className="h-4 w-4" />
                                 <span>{task.date}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                 <FiClock className="h-4 w-4" />
                                 <span>{task.time}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Modern Reminder Options */}
               <div>
                  <label className="block text-gray-900 text-lg font-semibold mb-4">When should we remind you?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                     {reminderOptions.map((option) => (
                        <label
                           key={option.value}
                           className={`
                              relative flex items-center p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300
                              border-2 hover:shadow-lg group
                              ${
                                 selectedOption === option.value
                                    ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-400 shadow-md'
                                    : 'bg-white/60 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                              }
                           `}
                        >
                           <input
                              type="radio"
                              name="reminderOption"
                              value={option.value}
                              checked={selectedOption === option.value}
                              onChange={() => setSelectedOption(option.value)}
                              className="sr-only"
                           />

                           {/* Custom radio button */}
                           <div
                              className={`
                              w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-all duration-200
                              ${
                                 selectedOption === option.value
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-gray-300 group-hover:border-purple-400'
                              }
                           `}
                           >
                              {selectedOption === option.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                           </div>

                           <div
                              className={`
                              flex items-center justify-center w-10 h-10 rounded-xl mr-4 transition-all duration-200
                              ${
                                 selectedOption === option.value
                                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                              }
                           `}
                           >
                              {option.icon}
                           </div>

                           <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm sm:text-base">{option.label}</div>
                              <div className="text-xs sm:text-sm text-gray-500 mt-1">{option.description}</div>
                           </div>

                           {/* Selection indicator */}
                           {selectedOption === option.value && (
                              <div className="absolute top-3 right-3">
                                 <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                                    <FiCheck className="h-3 w-3 text-white" />
                                 </div>
                              </div>
                           )}
                        </label>
                     ))}
                  </div>
               </div>

               {/* Enhanced Custom Date/Time Picker */}
               {selectedOption === 'custom' && (
                  <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-200/50">
                     <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                           <FiCalendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                           <label className="block text-gray-900 text-lg font-semibold">Set custom date and time</label>
                           <p className="text-sm text-gray-600">Choose the perfect moment for your reminder</p>
                        </div>
                     </div>
                     <input
                        type="datetime-local"
                        value={customDateTime}
                        onChange={(e) => setCustomDateTime(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                        required
                     />
                  </div>
               )}

               {/* Enhanced Action Buttons */}
               <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                  <button
                     type="button"
                     onClick={onClose}
                     className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                  >
                     <FiBell className="h-5 w-5" />
                     <span>Set Reminder</span>
                  </button>
               </div>
            </form>
         </div>
      </Modal>
   );
};

export default ReminderModal;
