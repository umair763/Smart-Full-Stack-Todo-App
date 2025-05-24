'use client';

import { useState, useEffect } from 'react';
import {
   FiEdit2,
   FiTrash2,
   FiMoreVertical,
   FiChevronDown,
   FiChevronRight,
   FiPlus,
   FiEye,
   FiDownload,
   FiLink,
} from 'react-icons/fi';
import EditTaskModal from './EditTaskModal';
import Subtask from './Subtask';
import SubtaskModal from './SubtaskModal';
import { useSocket } from '../app/context/SocketContext';
import { toast } from 'react-hot-toast';
import NoteModal from './NoteModal';
import AttachmentModal from './AttachmentModal';
import DependencyModal from './DependencyModal';
import DependencyTree from './DependencyTree';
import ReminderModal from './ReminderModal'; // Declare the ReminderModal variable

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function DisplayTodoList({ list, isexceeded, onDelete, onUpdate, onStatusChange, dependencies, onDependencyChange }) {
   const [completed, setCompleted] = useState(list.completed || false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [isUpdating, setIsUpdating] = useState(false);
   const [showSubtasks, setShowSubtasks] = useState(false);
   const [subtasks, setSubtasks] = useState([]);
   const [showSubtaskModal, setShowSubtaskModal] = useState(false);
   const [currentSubtask, setCurrentSubtask] = useState(null);
   const [showMoreOptions, setShowMoreOptions] = useState(false);
   const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
   const { socket } = useSocket();
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
   const [showNoteModal, setShowNoteModal] = useState(false);
   const [showAttachmentModal, setShowAttachmentModal] = useState(false);
   const [showNoteView, setShowNoteView] = useState(false);
   const [noteViewAnimating, setNoteViewAnimating] = useState(false);
   const [notes, setNotes] = useState([]);
   const [attachments, setAttachments] = useState([]);
   const [isLoadingNotes, setIsLoadingNotes] = useState(false);
   const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
   const [showDependencyModal, setShowDependencyModal] = useState(false);
   const [showDependencyTree, setShowDependencyTree] = useState(false);
   const [taskDependencies, setTaskDependencies] = useState({ prerequisites: [], dependents: [] });
   const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);
   const [hasDependencies, setHasDependencies] = useState(false);
   const [hasAttachments, setHasAttachments] = useState(false);

   // Initialize editedTask with the list props
   const [editedTask, setEditedTask] = useState({
      task: list.task,
      date: list.date,
      time: list.time,
      color: list.color,
      priority: list.priority || 'medium', // Default to medium if not set
   });

   // Sync the component state with the list prop
   useEffect(() => {
      setCompleted(list.completed || false);
   }, [list.completed]);

   // Fetch subtasks when expanding
   useEffect(() => {
      if (showSubtasks && subtasks.length === 0 && !isLoadingSubtasks) {
         fetchSubtasks();
      }
   }, [showSubtasks]);

   // Check if task has dependencies
   useEffect(() => {
      if (dependencies) {
         const hasPrerequisites = dependencies.some(
            (dep) => dep.dependentTaskId === list._id || (dep.dependentTaskId && dep.dependentTaskId._id === list._id)
         );

         const hasDependents = dependencies.some(
            (dep) =>
               dep.prerequisiteTaskId === list._id ||
               (dep.prerequisiteTaskId && dep.prerequisiteTaskId._id === list._id)
         );

         setHasDependencies(hasPrerequisites || hasDependents);
      }
   }, [dependencies, list._id]);

   // Handle socket events for subtask changes
   useEffect(() => {
      if (!socket) return;

      // Handle subtask created event
      const handleSubtaskCreated = (data) => {
         if (data.taskId === list._id) {
            setSubtasks((prev) => {
               const newSubtasks = [...prev, data.subtask];
               return sortSubtasksByPriority(newSubtasks);
            });
            // Update parent task counts
            onUpdate(list._id, {
               ...list,
               subtaskCount: (list.subtaskCount || 0) + 1,
               completedSubtasks: list.completedSubtasks || 0,
            });
         }
      };

      // Handle subtask status changed event
      const handleSubtaskStatusChanged = (data) => {
         if (data.data && data.data.parentTaskId === list._id) {
            // Update the subtask in local state
            setSubtasks((prev) => {
               const updatedSubtasks = prev.map((st) =>
                  st._id === data.data.subtaskId ? { ...st, status: data.data.status } : st
               );
               return sortSubtasksByPriority(updatedSubtasks);
            });

            // Update parent task with new completion counts
            onUpdate(list._id, {
               ...list,
               subtaskCount: data.data.subtaskCount,
               completedSubtasks: data.data.completedSubtasks,
            });
         }
      };

      // Handle subtask updated event
      const handleSubtaskUpdated = (data) => {
         if (data.subtask && data.subtask.taskId === list._id) {
            setSubtasks((prev) => {
               const updatedSubtasks = prev.map((st) => (st._id === data.subtask._id ? data.subtask : st));
               return sortSubtasksByPriority(updatedSubtasks);
            });
         }
      };

      // Handle subtask deleted event
      const handleSubtaskDeleted = (data) => {
         if (data.parentTaskId === list._id) {
            setSubtasks((prev) => {
               const filteredSubtasks = prev.filter((st) => st._id !== data.subtaskId);
               return sortSubtasksByPriority(filteredSubtasks);
            });
            // Update parent task counts
            onUpdate(list._id, {
               ...list,
               subtaskCount: Math.max((list.subtaskCount || 0) - 1, 0),
               completedSubtasks: Math.max((list.completedSubtasks || 0) - 1, 0),
            });
         }
      };

      // Handle dependency created event
      const handleDependencyCreated = (data) => {
         if (data.dependentTaskId === list._id || data.prerequisiteTaskId === list._id) {
            // Refresh dependencies if this task is involved
            if (onDependencyChange) {
               onDependencyChange();
            }
         }
      };

      // Handle dependency deleted event
      const handleDependencyDeleted = (data) => {
         if (data.dependentTaskId === list._id || data.prerequisiteTaskId === list._id) {
            // Refresh dependencies if this task is involved
            if (onDependencyChange) {
               onDependencyChange();
            }
         }
      };

      // Register socket listeners
      socket.on('subtaskCreated', handleSubtaskCreated);
      socket.on('subtaskStatusChanged', handleSubtaskStatusChanged);
      socket.on('subtaskUpdated', handleSubtaskUpdated);
      socket.on('subtaskDeleted', handleSubtaskDeleted);
      socket.on('dependencyCreated', handleDependencyCreated);
      socket.on('dependencyDeleted', handleDependencyDeleted);

      // Clean up listeners on unmount
      return () => {
         socket.off('subtaskCreated', handleSubtaskCreated);
         socket.off('subtaskStatusChanged', handleSubtaskStatusChanged);
         socket.off('subtaskUpdated', handleSubtaskUpdated);
         socket.off('subtaskDeleted', handleSubtaskDeleted);
         socket.off('dependencyCreated', handleDependencyCreated);
         socket.off('dependencyDeleted', handleDependencyDeleted);
      };
   }, [socket, list._id, onDependencyChange, onUpdate, list]);

   // Fetch subtasks from the server
   const fetchSubtasks = async () => {
      setIsLoadingSubtasks(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/subtasks`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch subtasks');
         }

         const data = await response.json();
         // Sort subtasks by priority (High > Medium > Low)
         const sortedSubtasks = sortSubtasksByPriority(data);
         setSubtasks(sortedSubtasks);
      } catch (error) {
         console.error('Error fetching subtasks:', error);
         toast.error('Failed to load subtasks');
      } finally {
         setIsLoadingSubtasks(false);
      }
   };

   // Fetch task dependencies
   const fetchTaskDependencies = async () => {
      setIsLoadingDependencies(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/dependencies/task/${list._id}`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch dependencies');
         }

         const data = await response.json();
         setTaskDependencies(data);
         setHasDependencies(data.prerequisites.length > 0 || data.dependents.length > 0);
      } catch (error) {
         console.error('Error fetching dependencies:', error);
         toast.error('Failed to load dependencies');
      } finally {
         setIsLoadingDependencies(false);
      }
   };

   // Helper function to sort subtasks by priority
   const sortSubtasksByPriority = (subtasks) => {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return [...subtasks].sort((a, b) => {
         return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      });
   };

   // Handle task status toggle
   async function handleTaskStatusToggle() {
      // Prevent multiple rapid toggling
      if (isUpdating) return;

      setIsUpdating(true);

      try {
         // Optimistically update UI first
         const newStatus = !completed;
         setCompleted(newStatus);

         // Use the dedicated endpoint for status updates
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/status`, {
            method: 'PATCH',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: newStatus }),
         });

         if (!response.ok) {
            throw new Error('Failed to update task status');
         }

         // The UI will be updated through Socket.io notification
      } catch (error) {
         // Revert UI state if the update fails
         console.error('Error updating task status:', error);
         setCompleted(!completed);

         // Show notification (handled by parent)
         if (onStatusChange) {
            onStatusChange(list._id, completed, error.message);
         }
      } finally {
         setIsUpdating(false);
      }
   }

   function handleEdit() {
      setShowEditModal(true);
   }

   function handleDelete() {
      if (window.confirm('Are you sure you want to delete this task?')) {
         onDelete(list._id);
      }
   }

   function handleSaveTask(updatedTask) {
      // Call the parent component's update function
      onUpdate(list._id, updatedTask);
      setShowEditModal(false);
   }

   // Toggle subtasks visibility
   const toggleSubtasks = (e) => {
      e.stopPropagation(); // Prevent event bubbling
      if (list.subtaskCount > 0) {
         setShowSubtasks(!showSubtasks);
         if (!showSubtasks && subtasks.length === 0) {
            fetchSubtasks();
         }
      }
   };

   // Toggle the more options menu
   const toggleMoreOptions = (e) => {
      e.stopPropagation();
      setShowMoreOptions(!showMoreOptions);
   };

   // Open subtask modal for adding a new subtask
   const handleAddSubtask = () => {
      setCurrentSubtask(null);
      setShowSubtaskModal(true);
      setShowMoreOptions(false);
   };

   // Open dependency modal for adding a new dependency
   const handleAddDependency = () => {
      setShowDependencyModal(true);
      setIsMenuOpen(false);
   };

   // Open dependency tree view
   const handleViewDependencies = () => {
      fetchTaskDependencies();
      setShowDependencyTree(true);
      setIsMenuOpen(false);
   };

   // Handle adding a new dependency
   const handleDependencyAdded = (newDependency) => {
      if (onDependencyChange) {
         onDependencyChange();
      }
   };

   // Save a new subtask
   const handleSaveSubtask = async (subtaskData, subtaskId = null) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         // Format the subtask data
         const formattedData = {
            ...subtaskData,
            taskId: list._id,
            status: false,
         };

         let response;
         if (subtaskId) {
            // Update existing subtask
            response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/subtasks/${subtaskId}`, {
               method: 'PUT',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify(formattedData),
            });
         } else {
            // Create new subtask
            response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/subtasks`, {
               method: 'POST',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify(formattedData),
            });
         }

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || (subtaskId ? 'Failed to update subtask' : 'Failed to create subtask'));
         }

         const data = await response.json();

         if (subtaskId) {
            // Update the subtask in the local state
            const updatedSubtasks = subtasks.map((st) => (st._id === subtaskId ? data : st));
            setSubtasks(sortSubtasksByPriority(updatedSubtasks));
         } else {
            // Add the new subtask to the local state and re-sort
            const newSubtasks = [...subtasks, data];
            setSubtasks(sortSubtasksByPriority(newSubtasks));
            // Show subtasks if they were hidden
            setShowSubtasks(true);
         }

         // Close the modal
         setShowSubtaskModal(false);
      } catch (error) {
         console.error('Error saving subtask:', error);
         toast.error(error.message || 'Failed to save subtask');
      }
   };

   // Handle subtask deletion
   const handleDeleteSubtask = async (subtaskId) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/subtasks/${subtaskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete subtask');
         }

         // Remove the subtask from the local state
         setSubtasks((prevSubtasks) => prevSubtasks.filter((st) => st._id !== subtaskId));
      } catch (error) {
         console.error('Error deleting subtask:', error);
         toast.error('Failed to delete subtask');
      }
   };

   // Handle subtask edit
   const handleEditSubtask = (subtask) => {
      setCurrentSubtask(subtask);
      setShowSubtaskModal(true);
   };

   // Handle subtask status change
   const handleSubtaskStatusChange = async (subtaskId, currentStatus, errorMessage) => {
      // If there was no error, update the parent task's completion summary
      if (!errorMessage) {
         try {
            // Find the subtask in our local state and update its status
            const updatedSubtasks = subtasks.map((st) => {
               if (st._id === subtaskId) {
                  return { ...st, status: !currentStatus };
               }
               return st;
            });

            setSubtasks(updatedSubtasks);

            // Calculate new completion counts
            const totalSubtasks = updatedSubtasks.length;
            const completedCount = updatedSubtasks.filter((st) => st.status).length;

            // Update the parent task locally for immediate UI feedback
            const updatedTask = {
               ...list,
               subtaskCount: totalSubtasks,
               completedSubtasks: completedCount,
            };

            // Call the parent update handler to update in parent components
            if (onUpdate) {
               onUpdate(list._id, updatedTask);
            }
         } catch (error) {
            console.error('Error updating subtask status locally:', error);
         }
      } else {
         console.log(`Subtask ${subtaskId} status change failed. Error: ${errorMessage}`);
      }
   };

   const handleSetReminder = async (taskId, reminderTime) => {
      try {
         console.log('DisplayTodoList - Setting reminder for task:', { taskId, reminderTime });

         if (!taskId || !reminderTime) {
            console.error('Missing required data:', { taskId, reminderTime });
            toast.error('Task ID and reminder time are required');
            return;
         }

         // Validate that reminder time is in the future
         const reminderDateTime = new Date(reminderTime);
         if (reminderDateTime <= new Date()) {
            toast.error('Reminder time must be in the future');
            return;
         }

         const response = await fetch(`${API_BASE_URL}/api/reminders`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
               taskId,
               reminderTime,
               userId: list.userId,
            }),
         });

         const data = await response.json();

         if (!response.ok) {
            console.error('Failed to set reminder:', data);
            throw new Error(data.message || 'Failed to set reminder');
         }

         console.log('Reminder set successfully:', data);
         toast.success('Reminder set successfully!');
         setIsReminderModalOpen(false);
      } catch (error) {
         console.error('Error setting reminder:', error);
         toast.error(error.message || 'Failed to set reminder. Please try again.');
      }
   };

   // Fetch notes when note view is opened
   useEffect(() => {
      if (showNoteView) {
         fetchNotes();
      }
   }, [showNoteView]);

   // Fetch attachments when component mounts
   useEffect(() => {
      fetchAttachments();
   }, []);

   // Fetch notes for the task
   const fetchNotes = async () => {
      setIsLoadingNotes(true);
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/notes`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch notes');
         }

         const data = await response.json();
         setNotes(data);
      } catch (error) {
         console.error('Error fetching notes:', error);
         toast.error('Failed to load notes');
      } finally {
         setIsLoadingNotes(false);
      }
   };

   // Fetch attachments for the task
   const fetchAttachments = async () => {
      setIsLoadingAttachments(true);
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/attachments`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch attachments');
         }

         const data = await response.json();
         setAttachments(data);
         setHasAttachments(data && data.length > 0);
      } catch (error) {
         console.error('Error fetching attachments:', error);
         // Don't show error toast on initial load
      } finally {
         setIsLoadingAttachments(false);
      }
   };

   // Handle note creation
   const handleCreateNote = async (content) => {
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/notes`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
         });

         if (!response.ok) {
            throw new Error('Failed to create note');
         }

         const newNote = await response.json();
         setNotes((prev) => [newNote, ...prev]);
         toast.success('Note added successfully');
         setShowNoteModal(false);
      } catch (error) {
         console.error('Error creating note:', error);
         toast.error('Failed to add note');
      }
   };

   // Handle attachment upload
   const handleUploadAttachment = async (file) => {
      try {
         const formData = new FormData();
         formData.append('file', file);

         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/attachments`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
            },
            body: formData,
         });

         if (!response.ok) {
            throw new Error('Failed to upload attachment');
         }

         const data = await response.json();
         setAttachments([data]);
         setHasAttachments(true);
         toast.success('File uploaded successfully');
         setShowAttachmentModal(false);
      } catch (error) {
         console.error('Error uploading attachment:', error);
         toast.error('Failed to upload file');
      }
   };

   // Handle attachment download
   const handleDownloadAttachment = async (attachmentId) => {
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/attachments/${attachmentId}/download`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to download attachment');
         }

         const blob = await response.blob();
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = attachments.find((a) => a._id === attachmentId)?.originalname || 'download';
         document.body.appendChild(a);
         a.click();
         window.URL.revokeObjectURL(url);
         document.body.removeChild(a);
      } catch (error) {
         console.error('Error downloading attachment:', error);
         toast.error('Failed to download file');
      }
   };

   // Get priority color class
   const getPriorityColorClass = () => {
      switch (list.priority?.toLowerCase()) {
         case 'high':
            return 'border-red-500';
         case 'medium':
            return 'border-yellow-500';
         case 'low':
            return 'border-green-500';
         default:
            return '';
      }
   };

   // Handle note view toggle with smooth animation
   const toggleNoteView = () => {
      if (showNoteView) {
         setNoteViewAnimating(true);
         setTimeout(() => {
            setShowNoteView(false);
            setNoteViewAnimating(false);
         }, 200);
      } else {
         setShowNoteView(true);
         setNoteViewAnimating(true);
         setTimeout(() => setNoteViewAnimating(false), 300);
      }
   };

   return (
      <>
         {/* Enhanced Mobile-First Card Design */}
         <div
            className={`relative w-full mb-3 sm:mb-2 rounded-xl sm:rounded-lg bg-gradient-to-r from-white to-gray-50 shadow-md sm:shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-lg ${
               hasDependencies ? 'border-l-4 border-l-[#9406E6]' : ''
            } ${getPriorityColorClass()}`}
         >
            {/* Mobile Layout (< 640px) - Card Style */}
            <div className="sm:hidden p-4">
               {/* Header Section - Task Name & Priority */}
               <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-2 flex-1 min-w-0">
                     {/* Priority Radio Button */}
                     <input
                        type="radio"
                        className={`w-4 h-4 rounded-full cursor-pointer appearance-none flex-shrink-0 mt-1 ${
                           list.color === 'red'
                              ? 'bg-red-600 border-red-600'
                              : list.color === 'yellow'
                              ? 'bg-yellow-400 border-yellow-400'
                              : 'bg-green-600 border-green-600'
                        }`}
                     />

                     <div className="flex-1 min-w-0">
                        {/* Task Name */}
                        <h3
                           className={`${
                              completed ? 'line-through text-gray-500' : 'text-gray-900'
                           } font-semibold text-base leading-tight mb-1 transition-all`}
                        >
                           {list.task}
                        </h3>

                        {/* Priority Badge */}
                        {list.priority && (
                           <span
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                 list.priority.toLowerCase() === 'high'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : list.priority.toLowerCase() === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : 'bg-green-100 text-green-800 border border-green-200'
                              }`}
                           >
                              {list.priority}
                           </span>
                        )}
                     </div>
                  </div>

                  {/* Completion Status */}
                  <button
                     onClick={handleTaskStatusToggle}
                     className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                        completed
                           ? 'bg-[#9406E6] text-white shadow-md'
                           : 'border-2 border-[#9406E6] hover:bg-[#9406E6]/10'
                     }`}
                     disabled={isUpdating}
                     title={completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                     {completed && (
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-4 w-4"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                     )}
                  </button>
               </div>

               {/* Subtask Progress */}
               {list.subtaskCount > 0 && (
                  <div className="mb-3">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Subtasks Progress</span>
                        <span className="text-sm text-gray-500">
                           {list.completedSubtasks}/{list.subtaskCount}
                        </span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                           className="bg-gradient-to-r from-[#9406E6] to-[#C724B1] h-2.5 rounded-full transition-all duration-300"
                           style={{ width: `${(list.completedSubtasks / list.subtaskCount) * 100}%` }}
                        ></div>
                     </div>
                  </div>
               )}

               {/* Date & Time Section */}
               <div className="mb-3">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                           </svg>
                        </div>
                        <div>
                           <p
                              className={`${
                                 completed ? 'line-through text-gray-500' : 'text-gray-900'
                              } font-medium text-sm`}
                           >
                              {list.date}
                           </p>
                           <p className={`${completed ? 'line-through text-gray-500' : 'text-gray-600'} text-sm`}>
                              {list.time}
                           </p>
                        </div>
                     </div>

                     {isexceeded && !completed && (
                        <div className="bg-red-100 border border-red-200 text-red-800 px-2 py-1 rounded-lg">
                           <p className="text-xs font-semibold">Overdue</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Action Buttons Row */}
               <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  {/* Left Actions */}
                  <div className="flex items-center space-x-3">
                     {/* Subtask Toggle */}
                     {list.subtaskCount > 0 && (
                        <button
                           onClick={toggleSubtasks}
                           className="flex items-center space-x-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
                           title={showSubtasks ? 'Hide subtasks' : 'Show subtasks'}
                        >
                           <span>Subtasks</span>
                           {showSubtasks ? (
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-4 w-4"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                              >
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                           ) : (
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-4 w-4"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                 />
                              </svg>
                           )}
                           <span className="bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                              {list.completedSubtasks}/{list.subtaskCount}
                           </span>
                        </button>
                     )}

                     {/* Dependency Indicator */}
                     {hasDependencies && (
                        <button
                           onClick={handleViewDependencies}
                           className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                           title="View dependencies"
                        >
                           <FiLink className="h-4 w-4" />
                           <span>Deps</span>
                        </button>
                     )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-2">
                     {/* Edit */}
                     <button
                        onClick={handleEdit}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                        title="Edit task"
                     >
                        <FiEdit2 className="h-4 w-4" />
                     </button>

                     {/* Delete */}
                     <button
                        onClick={handleDelete}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                        title="Delete task"
                     >
                        <FiTrash2 className="h-4 w-4" />
                     </button>

                     {/* Notes */}
                     <button
                        onClick={toggleNoteView}
                        className={`group relative p-2 rounded-lg transition-all duration-300 ease-out ${
                           showNoteView
                              ? 'bg-yellow-100 text-yellow-800 shadow-lg scale-105'
                              : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 hover:scale-105 hover:shadow-md'
                        }`}
                        title={showNoteView ? 'Hide notes' : 'View notes'}
                     >
                        <div className="relative">
                           <FiEye
                              className={`h-4 w-4 transition-all duration-300 ease-out ${
                                 showNoteView ? 'scale-110' : 'group-hover:scale-110'
                              }`}
                           />
                           {notes.length > 0 && (
                              <div
                                 className={`absolute -top-1 -right-1 w-2 h-2 rounded-full transition-all duration-300 ${
                                    showNoteView ? 'bg-yellow-600 scale-125' : 'bg-yellow-500 group-hover:scale-110'
                                 }`}
                              ></div>
                           )}
                        </div>
                     </button>

                     {/* Download */}
                     {hasAttachments && attachments.length > 0 && (
                        <button
                           onClick={() => handleDownloadAttachment(attachments[0]._id)}
                           className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                           title="Download attachment"
                        >
                           <FiDownload className="h-4 w-4" />
                        </button>
                     )}

                     {/* More Options */}
                     <div className="relative">
                        <button
                           onClick={() => setIsMenuOpen(!isMenuOpen)}
                           className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                           title="More options"
                        >
                           <FiMoreVertical className="h-4 w-4" />
                        </button>

                        {/* Enhanced Mobile Dropdown */}
                        {isMenuOpen && (
                           <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-10 border border-gray-200">
                              <button
                                 onClick={() => {
                                    setIsReminderModalOpen(true);
                                    setIsMenuOpen(false);
                                 }}
                                 className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                              >
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-3 text-blue-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                 </svg>
                                 Set Reminder
                              </button>
                              <button
                                 onClick={handleAddSubtask}
                                 className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                              >
                                 <FiPlus className="mr-3 h-5 w-5 text-green-500" />
                                 Add Subtask
                              </button>
                              <button
                                 onClick={() => {
                                    setShowNoteModal(true);
                                    setIsMenuOpen(false);
                                 }}
                                 className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                              >
                                 <FiPlus className="mr-3 h-5 w-5 text-yellow-500" />
                                 Add Note
                              </button>
                              <button
                                 onClick={() => {
                                    setShowAttachmentModal(true);
                                    setIsMenuOpen(false);
                                 }}
                                 className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                              >
                                 <FiPlus className="mr-3 h-5 w-5 text-purple-500" />
                                 Add Attachment
                              </button>
                              <button
                                 onClick={handleAddDependency}
                                 className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                              >
                                 <FiLink className="mr-3 h-5 w-5 text-indigo-500" />
                                 Add Dependency
                              </button>
                              {hasDependencies && (
                                 <button
                                    onClick={handleViewDependencies}
                                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                                 >
                                    <FiEye className="mr-3 h-5 w-5 text-gray-500" />
                                    View Dependencies
                                 </button>
                              )}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Desktop Layout (>= 640px) - Original Grid Layout Enhanced */}
            <div className="hidden sm:grid grid-cols-[25px,1fr,auto] md:grid-cols-[30px,1fr,auto] w-full px-3 md:px-4 py-3 items-center gap-3">
               {/* Priority Radio Button */}
               <input
                  type="radio"
                  className={`w-4 h-4 md:w-5 md:h-5 rounded-full cursor-pointer appearance-none flex-shrink-0 ${
                     list.color === 'red'
                        ? 'bg-red-600 border-red-600'
                        : list.color === 'yellow'
                        ? 'bg-yellow-400 border-yellow-400'
                        : 'bg-green-600 border-green-600'
                  }`}
               />

               {/* Main Content Section */}
               <div className="flex flex-col min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                     {/* Expand/collapse button for subtasks */}
                     {list.subtaskCount > 0 && (
                        <button
                           onClick={toggleSubtasks}
                           className="text-gray-600 hover:text-[#9406E6] transition-colors flex-shrink-0"
                           title={showSubtasks ? 'Collapse subtasks' : 'Expand subtasks'}
                        >
                           {showSubtasks ? (
                              <FiChevronDown className="h-4 w-4" />
                           ) : (
                              <FiChevronRight className="h-4 w-4" />
                           )}
                        </button>
                     )}

                     {/* Task Name */}
                     <p
                        className={`${
                           completed ? 'line-through text-gray-600' : ''
                        } font-bold text-left text-sm md:text-base lg:text-lg transition-all truncate flex-1 min-w-0`}
                     >
                        {list.task}
                     </p>

                     {/* Priority badge */}
                     {list.priority && (
                        <span
                           className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                              list.priority.toLowerCase() === 'high'
                                 ? 'bg-red-100 text-red-800'
                                 : list.priority.toLowerCase() === 'medium'
                                 ? 'bg-yellow-100 text-yellow-800'
                                 : 'bg-green-100 text-green-800'
                           }`}
                        >
                           {list.priority}
                        </span>
                     )}

                     {/* Dependency indicator */}
                     {hasDependencies && (
                        <button
                           onClick={handleViewDependencies}
                           className="text-[#9406E6] hover:text-[#7D05C3] flex-shrink-0"
                           title="View dependencies"
                        >
                           <FiLink className="h-4 w-4" />
                        </button>
                     )}
                  </div>

                  {/* Subtask progress indicator */}
                  {list.subtaskCount > 0 && (
                     <div className="flex items-center text-xs text-gray-600 mt-1 gap-2">
                        <div className="w-20 md:w-24 bg-gray-200 rounded-full h-2 md:h-2.5 flex-shrink-0">
                           <div
                              className="bg-[#9406E6] h-full rounded-full transition-all duration-300"
                              style={{ width: `${(list.completedSubtasks / list.subtaskCount) * 100}%` }}
                           ></div>
                        </div>
                        <span className="whitespace-nowrap">
                           {list.completedSubtasks}/{list.subtaskCount} done
                        </span>
                     </div>
                  )}
               </div>

               {/* Right Section - Date, Time & Actions */}
               <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
                  {/* Date and Time Section */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 text-right">
                     <div className="flex flex-col items-end">
                        <p
                           className={`${
                              completed ? 'line-through text-gray-600' : ''
                           } font-bold text-xs md:text-sm transition-all whitespace-nowrap`}
                        >
                           {list.date}
                        </p>
                        {isexceeded && !completed && (
                           <p className="font-bold text-[10px] md:text-xs text-red-700 whitespace-nowrap">
                              Deadline exceeded
                           </p>
                        )}
                     </div>
                     <p
                        className={`${
                           completed ? 'line-through text-gray-600' : ''
                        } font-bold text-xs md:text-sm transition-all whitespace-nowrap`}
                     >
                        {list.time}
                     </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                     {/* Edit button */}
                     <button
                        onClick={handleEdit}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                        title="Edit task"
                     >
                        <FiEdit2 className="h-4 w-4 md:h-5 md:w-5" />
                     </button>

                     {/* Delete button */}
                     <button
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                        title="Delete task"
                     >
                        <FiTrash2 className="h-4 w-4 md:h-5 md:w-5" />
                     </button>

                     {/* Completion checkbox */}
                     <button
                        onClick={handleTaskStatusToggle}
                        className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                           completed ? 'bg-[#9406E6] text-white' : 'border-2 border-[#9406E6] hover:bg-[#9406E6]/20'
                        }`}
                        disabled={isUpdating}
                        title={completed ? 'Mark as incomplete' : 'Mark as complete'}
                     >
                        {completed && (
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 md:h-4 md:w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                        )}
                     </button>

                     {/* View notes button */}
                     <button
                        onClick={toggleNoteView}
                        className={`group relative p-1 rounded transition-all duration-300 ease-out ${
                           showNoteView
                              ? 'text-yellow-800 bg-yellow-100 shadow-md scale-105'
                              : 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 hover:scale-105'
                        }`}
                        title={showNoteView ? 'Hide notes' : 'View notes'}
                     >
                        <div className="relative">
                           <FiEye
                              className={`h-4 w-4 md:h-5 md:w-5 transition-all duration-300 ease-out ${
                                 showNoteView ? 'scale-110' : 'group-hover:scale-110'
                              }`}
                           />
                           {notes.length > 0 && (
                              <div
                                 className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                    showNoteView ? 'bg-yellow-600 scale-125' : 'bg-yellow-500 group-hover:scale-110'
                                 }`}
                              ></div>
                           )}
                        </div>
                     </button>

                     {/* Download attachment button - only show if attachments exist */}
                     {hasAttachments && attachments.length > 0 && (
                        <button
                           onClick={() => handleDownloadAttachment(attachments[0]._id)}
                           className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                           title="Download attachment"
                        >
                           <FiDownload className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                     )}

                     {/* More options (three dots) */}
                     <div className="relative">
                        <button
                           onClick={() => setIsMenuOpen(!isMenuOpen)}
                           className="text-gray-600 hover:text-gray-800 p-1 rounded transition-colors"
                           title="More options"
                        >
                           <FiMoreVertical className="h-4 w-4 md:h-5 md:w-5" />
                        </button>

                        {/* Dropdown menu */}
                        {isMenuOpen && (
                           <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                              <button
                                 onClick={() => {
                                    setIsReminderModalOpen(true);
                                    setIsMenuOpen(false);
                                 }}
                                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                 </svg>
                                 Set Reminder
                              </button>
                              <button
                                 onClick={handleAddSubtask}
                                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                 <FiPlus className="mr-2 h-4 w-4" />
                                 Add Subtask
                              </button>
                              <button
                                 onClick={() => {
                                    setShowNoteModal(true);
                                    setIsMenuOpen(false);
                                 }}
                                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                 <FiPlus className="mr-2 h-4 w-4" />
                                 Add Note
                              </button>
                              <button
                                 onClick={() => {
                                    setShowAttachmentModal(true);
                                    setIsMenuOpen(false);
                                 }}
                                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                 <FiPlus className="mr-2 h-4 w-4" />
                                 Add Attachment
                              </button>
                              <button
                                 onClick={handleAddDependency}
                                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                 <FiLink className="mr-2 h-4 w-4" />
                                 Add Dependency
                              </button>
                              {hasDependencies && (
                                 <button
                                    onClick={handleViewDependencies}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                 >
                                    <FiEye className="mr-2 h-4 w-4" />
                                    View Dependencies
                                 </button>
                              )}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Enhanced Subtasks Section - Modern Tree Structure */}
         {showSubtasks && list.subtaskCount > 0 && (
            <div className="w-full mb-3">
               {/* Mobile Subtasks Layout (< 640px) */}
               <div className="sm:hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-xl p-2 ml-4 border-l-4 border-gradient-to-b from-purple-500 to-indigo-600 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center">
                        <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2.5}
                                 d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                              />
                           </svg>
                        </div>
                        Subtasks Tree
                     </h4>
                     <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {list.completedSubtasks}/{list.subtaskCount}
                     </div>
                  </div>

                  {isLoadingSubtasks ? (
                     <div className="flex items-center justify-center py-4">
                        <div className="relative">
                           <div className="animate-spin rounded-full h-6 w-6 border-3 border-purple-200"></div>
                           <div className="animate-spin rounded-full h-6 w-6 border-t-3 border-purple-600 absolute top-0 left-0"></div>
                        </div>
                        <span className="ml-2 text-purple-700 text-xs font-medium">Loading...</span>
                     </div>
                  ) : subtasks.length > 0 ? (
                     <div className="space-y-1.5">
                        {subtasks.map((subtask, index) => (
                           <div
                              key={subtask._id}
                              className="relative bg-white/80 backdrop-blur-sm rounded-lg p-1.5 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/90"
                              style={{
                                 animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
                              }}
                           >
                              {/* Modern Tree Node Indicator */}
                              <div className="absolute left-[-10px] top-1/2 transform -translate-y-1/2">
                                 <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                 </div>
                              </div>
                              <Subtask
                                 subtask={subtask}
                                 onDelete={handleDeleteSubtask}
                                 onUpdate={handleEditSubtask}
                                 onStatusChange={handleSubtaskStatusChange}
                              />
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center py-4 bg-white/60 backdrop-blur-sm rounded-lg border border-white/50">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={1.5}
                                 d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                              />
                           </svg>
                        </div>
                        <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-1">
                           Empty Tree
                        </h4>
                        <p className="text-purple-600 text-xs font-medium">No subtasks in this branch</p>
                     </div>
                  )}
               </div>

               {/* Desktop Subtasks Layout (>= 640px) - Modern Tree Structure */}
               <div className="hidden sm:block relative pl-10 mb-3 group">
                  {/* Modern Vertical Tree Trunk */}
                  <div className="absolute left-[20px] top-0 bottom-4 w-[2px] bg-gradient-to-b from-purple-400 via-indigo-500 to-purple-600 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:w-[3px]">
                     {/* Animated pulse effect */}
                     <div className="absolute inset-0 bg-gradient-to-b from-purple-300 to-indigo-400 rounded-full animate-pulse opacity-50"></div>
                  </div>

                  {/* Tree Header */}
                  <div className="absolute left-[-8px] top-[-20px] flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-lg border border-white/20">
                     <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-3 w-3"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                           />
                        </svg>
                     </div>
                     <span className="text-xs font-bold">Subtasks Tree</span>
                     <div className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                        {list.completedSubtasks}/{list.subtaskCount}
                     </div>
                  </div>

                  {isLoadingSubtasks ? (
                     <div className="flex items-center justify-center py-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl ml-6 border border-purple-200/50 shadow-inner">
                        <div className="relative">
                           <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-200"></div>
                           <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-purple-600 absolute top-0 left-0"></div>
                           <div className="animate-ping absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        </div>
                        <span className="ml-3 text-purple-700 text-xs font-medium">Loading tree...</span>
                     </div>
                  ) : (
                     <div className="pt-4">
                        {subtasks.map((subtask, index) => (
                           <div
                              key={subtask._id}
                              className="relative mb-2 flex items-start group/item"
                              style={{
                                 animation: `slideInRight 0.3s ease-out ${index * 0.05}s both`,
                              }}
                           >
                              {/* Modern Tree Branch Connection */}
                              <div className="absolute left-[-28px] top-[16px] flex items-center z-20">
                                 {/* Horizontal branch */}
                                 <div className="w-[20px] h-[2px] bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full shadow-sm group-hover/item:shadow-md transition-all duration-300 group-hover/item:w-[24px]">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-indigo-400 rounded-full animate-pulse opacity-50"></div>
                                 </div>

                                 {/* Modern Tree Node */}
                                 <div className="relative ml-1">
                                    <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full border-2 border-white shadow-lg group-hover/item:scale-110 transition-transform duration-300 flex items-center justify-center">
                                       <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                    </div>
                                    {/* Glowing effect */}
                                    <div className="absolute inset-0 w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-20"></div>
                                 </div>
                              </div>

                              {/* Subtask Container */}
                              <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/90 group-hover/item:translate-x-1">
                                 <div
                                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${
                                       subtask.priority === 'High'
                                          ? 'bg-gradient-to-b from-red-400 to-red-600'
                                          : subtask.priority === 'Medium'
                                          ? 'bg-gradient-to-b from-yellow-400 to-orange-500'
                                          : 'bg-gradient-to-b from-green-400 to-green-600'
                                    }`}
                                 ></div>

                                 <div className="relative z-10">
                                    <Subtask
                                       subtask={subtask}
                                       onDelete={handleDeleteSubtask}
                                       onUpdate={handleEditSubtask}
                                       onStatusChange={handleSubtaskStatusChange}
                                    />
                                 </div>

                                 {/* Hover glow effect */}
                                 <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400/0 via-purple-400/10 to-indigo-400/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Edit Task Modal */}
         {showEditModal && (
            <EditTaskModal task={list} onClose={() => setShowEditModal(false)} onSave={handleSaveTask} />
         )}

         {/* Subtask Modal */}
         {showSubtaskModal && (
            <SubtaskModal
               isOpen={showSubtaskModal}
               onClose={() => setShowSubtaskModal(false)}
               onSave={handleSaveSubtask}
               parentTaskId={list._id}
               parentTask={list}
               subtask={currentSubtask}
            />
         )}

         {/* Reminder Modal */}
         <ReminderModal
            isOpen={isReminderModalOpen}
            onClose={() => {
               setIsReminderModalOpen(false);
               console.log('DisplayTodoList - Closing reminder modal, current task:', list);
            }}
            task={list}
            onSetReminder={(taskId, reminderTime) => {
               console.log('DisplayTodoList - Setting reminder for task:', { taskId, reminderTime });
               handleSetReminder(taskId, reminderTime);
            }}
         />

         {/* Dependency Modal */}
         <DependencyModal
            isOpen={showDependencyModal}
            onClose={() => setShowDependencyModal(false)}
            task={list}
            onAddDependency={handleDependencyAdded}
         />

         {/* Dependency Tree View */}
         {showDependencyTree && (
            <div className="ml-6 sm:ml-8 mb-4 bg-purple-50 rounded-lg">
               <DependencyTree taskId={list._id} onClose={() => setShowDependencyTree(false)} />
            </div>
         )}

         {/* Notes View with innovative animations */}
         <div
            className={`overflow-hidden transition-all duration-500 ease-out ${
               showNoteView ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
         >
            <div
               className={`ml-6 sm:ml-8 mb-4 transition-all duration-500 ease-out transform ${
                  showNoteView ? 'translate-y-0 scale-100' : '-translate-y-4 scale-95'
               }`}
            >
               <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 rounded-xl p-4 border border-yellow-200 shadow-lg backdrop-blur-sm">
                  {/* Header with icon */}
                  <div
                     className={`flex items-center mb-4 transition-all duration-700 ease-out ${
                        showNoteView ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                     }`}
                  >
                     <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-5 w-5 text-white"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                           />
                        </svg>
                     </div>
                     <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-700 to-orange-600 bg-clip-text text-transparent">
                        Notes
                     </h3>
                     {notes.length > 0 && (
                        <span className="ml-auto bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                           {notes.length}
                        </span>
                     )}
                  </div>

                  {/* Content */}
                  <div
                     className={`transition-all duration-700 ease-out ${
                        showNoteView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                     }`}
                  >
                     {isLoadingNotes ? (
                        <div className="flex items-center justify-center py-6">
                           <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-300 border-t-yellow-600"></div>
                           <span className="ml-3 text-yellow-700 text-sm font-medium">Loading notes...</span>
                        </div>
                     ) : notes.length > 0 ? (
                        <div className="space-y-3">
                           {notes.map((note, index) => (
                              <div
                                 key={note._id}
                                 className={`group bg-white rounded-lg p-3 shadow-sm border border-yellow-200/50 hover:shadow-md hover:border-yellow-300 transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                                    showNoteView ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                                 }`}
                                 style={{
                                    transitionDelay: showNoteView ? `${index * 100}ms` : '0ms',
                                 }}
                              >
                                 <p className="text-gray-800 text-sm leading-relaxed mb-2">{note.content}</p>
                                 <div className="flex items-center text-xs text-gray-500">
                                    <svg
                                       xmlns="http://www.w3.org/2000/svg"
                                       className="h-3 w-3 mr-1 opacity-70"
                                       fill="none"
                                       viewBox="0 0 24 24"
                                       stroke="currentColor"
                                    >
                                       <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                       />
                                    </svg>
                                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center py-8">
                           <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-8 w-8 text-white"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                 />
                              </svg>
                           </div>
                           <h4 className="text-lg font-semibold text-yellow-800 mb-2">No notes yet</h4>
                           <p className="text-yellow-600 text-sm mb-4">Start capturing your thoughts and ideas</p>
                           <button
                              onClick={() => {
                                 setShowNoteModal(true);
                                 setIsMenuOpen(false);
                              }}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                           >
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-4 w-4 mr-2"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                 />
                              </svg>
                              Add First Note
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* Note Modal */}
         {showNoteModal && (
            <NoteModal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} onSubmit={handleCreateNote} />
         )}

         {/* Attachment Modal */}
         {showAttachmentModal && (
            <AttachmentModal
               isOpen={showAttachmentModal}
               onClose={() => setShowAttachmentModal(false)}
               onSubmit={handleUploadAttachment}
            />
         )}
      </>
   );
}

export default DisplayTodoList;
