import React, { useState } from 'react';
import Modal from './Modal';
import { toast } from 'react-hot-toast';

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

   return (
      <Modal isOpen={isOpen} onClose={onClose}>
         <div className="bg-white/20 backdrop-blur-md p-3 sm:p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 sm:mb-5">
               <h2 className="text-lg sm:text-xl font-bold text-white">Set Reminder</h2>
               <button onClick={onClose} className="text-white hover:text-red-300 transition-colors">
                  <svg
                     xmlns="http://www.w3.org/2000/svg"
                     className="h-5 w-5 sm:h-6 sm:w-6"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                  >
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               {/* Task Information */}
               {task && (
                  <div className="p-3 bg-white/10 rounded-lg">
                     <p className="text-white font-medium">Task: {task.task}</p>
                     <p className="text-white/80 text-sm mt-1">
                        Due: {task.date} at {task.time}
                     </p>
                  </div>
               )}

               {/* Preset Reminders */}
               <div>
                  <label className="block text-white text-sm font-medium mb-2">When to remind you?</label>
                  <div className="space-y-2">
                     {[
                        { value: '10min', label: '10 minutes from now' },
                        { value: '1hour', label: '1 hour from now' },
                        { value: '1day', label: '1 day from now' },
                        { value: 'attime', label: 'At time of task' },
                        { value: 'custom', label: 'Custom date and time' },
                     ].map((option) => (
                        <label
                           key={option.value}
                           className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all ${
                              selectedOption === option.value
                                 ? 'bg-[#9406E6]/30 border border-[#9406E6]'
                                 : 'hover:bg-white/10'
                           }`}
                        >
                           <input
                              type="radio"
                              name="reminderOption"
                              value={option.value}
                              checked={selectedOption === option.value}
                              onChange={() => setSelectedOption(option.value)}
                              className="w-4 h-4 text-[#9406E6] focus:ring-[#9406E6]"
                           />
                           <span className="text-white">{option.label}</span>
                        </label>
                     ))}
                  </div>
               </div>

               {/* Custom Date/Time Picker (only visible when custom option is selected) */}
               {selectedOption === 'custom' && (
                  <div className="p-3 bg-white/10 rounded-lg">
                     <label className="block text-white text-sm font-medium mb-2">Set custom date and time</label>
                     <input
                        type="datetime-local"
                        value={customDateTime}
                        onChange={(e) => setCustomDateTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6]"
                        required
                     />
                  </div>
               )}

               {/* Action Buttons */}
               <div className="flex justify-end gap-2 pt-4">
                  <button
                     type="button"
                     onClick={onClose}
                     className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className="px-4 py-2 bg-[#9406E6] text-white rounded-lg hover:bg-[#7D05C3] transition-colors"
                  >
                     Set Reminder
                  </button>
               </div>
            </form>
         </div>
      </Modal>
   );
};

export default ReminderModal;
