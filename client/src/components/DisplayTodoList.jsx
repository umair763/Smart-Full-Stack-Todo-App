'use client';

import { useState, useEffect } from 'react';
import { FiTrash2, FiMoreVertical, FiPlus, FiEye, FiDownload, FiLink } from 'react-icons/fi';
import {
   HiCalendar,
   HiClock,
   HiCheck,
   HiChevronUp,
   HiChevronDown as HiChevronDownIcon,
   HiPencilAlt,
} from 'react-icons/hi';
import EditTaskModal from './EditTaskModal';
import Subtask from './Subtask';
import SubtaskModal from './SubtaskModal';
import { useSocket } from '../app/context/SocketContext';
import { toast } from 'react-hot-toast';
import NoteModal from './NoteModal';
import AttachmentModal from './AttachmentModal';
import DependencyModal from './DependencyModal';
import DependencyTree from './DependencyTree';
import ReminderModal from './ReminderModal';
import { useTheme } from '../app/context/ThemeContext';
import { useAuth } from '../app/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineClock, HiOutlineCalendar, HiOutlineTag, HiOutlineCheckCircle } from 'react-icons/hi';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function DisplayTodoList({ list, isexceeded, onDelete, onUpdate, onStatusChange, dependencies, onDependencyChange }) {
   const { token } = useAuth();
   const { isDark } = useTheme();
   const [completed, setCompleted] = useState(list.completed || false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [isUpdating, setIsUpdating] = useState(false);
   const [showSubtasks, setShowSubtasks] = useState(false);
   const [subtasks, setSubtasks] = useState([]);
   const [showSubtaskModal, setShowSubtaskModal] = useState(false);
   const [currentSubtask, setCurrentSubtask] = useState(null);
   const [showMoreOptions, setShowMoreOptions] = useState(false);
   const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
   const { socket, isConnected } = useSocket();
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
   const [socketUpdateReceived, setSocketUpdateReceived] = useState(false);
   const [expandedTaskId, setExpandedTaskId] = useState(null);
   const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
   const [selectedTask, setSelectedTask] = useState(null);
   const [completedTasks, setCompletedTasks] = useState(new Set());
   const [completedSubtasks, setCompletedSubtasks] = useState(new Set());
   const [isLoading, setIsLoading] = useState(false);

   // Initialize editedTask with the list props
   const [editedTask, setEditedTask] = useState({
      task: list.task,
      date: list.date,
      time: list.time,
      color: list.color,
      priority: list.priority || 'medium',
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

   // Handle socket events for subtask changes (only if socket is connected)
   useEffect(() => {
      if (!socket || !isConnected) {
         console.log('Socket not available, skipping socket listeners');
         return;
      }

      // Handle subtask created event
      const handleSubtaskCreated = (data) => {
         const currentUserId = localStorage.getItem('userId');
         if (data.parentTaskId === list._id && data.userId === currentUserId) {
            console.log('Handling subtask created event:', data);
            setSocketUpdateReceived(true);

            setSubtasks((prev) => {
               const exists = prev.some((st) => st._id === data.subtask._id);
               if (exists) {
                  console.log('Subtask already exists, skipping duplicate');
                  return prev;
               }

               const newSubtasks = [...prev, data.subtask];
               return sortSubtasksByPriority(newSubtasks);
            });

            onUpdate(list._id, {
               ...list,
               subtaskCount: (list.subtaskCount || 0) + 1,
               completedSubtasks: list.completedSubtasks || 0,
            });

            setShowSubtasks(true);
         }
      };

      // Handle subtask status changed event
      const handleSubtaskStatusChanged = (data) => {
         const currentUserId = localStorage.getItem('userId');
         if (data.parentTaskId === list._id && data.userId === currentUserId) {
            console.log('Handling subtask status changed event:', data);

            setSubtasks((prev) => {
               const updatedSubtasks = prev.map((st) =>
                  st._id === data.subtaskId ? { ...st, status: data.status } : st
               );
               return sortSubtasksByPriority(updatedSubtasks);
            });

            onUpdate(list._id, {
               ...list,
               subtaskCount: data.subtaskCount,
               completedSubtasks: data.completedSubtasks,
            });
         }
      };

      // Handle subtask updated event
      const handleSubtaskUpdated = (data) => {
         const currentUserId = localStorage.getItem('userId');
         if (data.parentTaskId === list._id && data.userId === currentUserId) {
            console.log('Handling subtask updated event:', data);

            setSubtasks((prev) => {
               const updatedSubtasks = prev.map((st) => (st._id === data.subtask._id ? data.subtask : st));
               return sortSubtasksByPriority(updatedSubtasks);
            });
         }
      };

      // Handle subtask deleted event
      const handleSubtaskDeleted = (data) => {
         const currentUserId = localStorage.getItem('userId');
         if (data.parentTaskId === list._id && data.userId === currentUserId) {
            console.log('Handling subtask deleted event:', data);

            setSubtasks((prev) => {
               const filteredSubtasks = prev.filter((st) => st._id !== data.subtaskId);
               return sortSubtasksByPriority(filteredSubtasks);
            });

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
            if (onDependencyChange) {
               onDependencyChange();
            }
         }
      };

      // Handle dependency deleted event
      const handleDependencyDeleted = (data) => {
         if (data.dependentTaskId === list._id || data.prerequisiteTaskId === list._id) {
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
   }, [socket, isConnected, list._id, onDependencyChange, onUpdate, list]);

   // Fetch subtasks from the server with retry logic
   const fetchSubtasks = async (retryCount = 0) => {
      setIsLoadingSubtasks(true);
      try {
         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/subtasks`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         console.log('Subtasks fetch response.ok:', response.ok);

         if (!response.ok) {
            throw new Error(`Failed to fetch subtasks: ${response.status}`);
         }

         const data = await response.json();
         console.log('Subtasks raw data:', data);
         const sortedSubtasks = sortSubtasksByPriority(data);
         console.log('Subtasks sorted data:', sortedSubtasks);
         setSubtasks(sortedSubtasks);
      } catch (error) {
         console.error('Error fetching subtasks:', error);

         // Retry logic
         if (retryCount < 2) {
            console.log(`Retrying subtasks fetch (${retryCount + 1}/3)...`);
            setTimeout(() => fetchSubtasks(retryCount + 1), 1000 * (retryCount + 1));
         } else {
            toast.error('Failed to load subtasks');
         }
      } finally {
         setIsLoadingSubtasks(false);
      }
   };

   // Fetch task dependencies with retry logic
   const fetchTaskDependencies = async (retryCount = 0) => {
      setIsLoadingDependencies(true);
      try {
         const response = await fetch(`${BACKEND_URL}/api/dependencies/task/${list._id}`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to fetch dependencies: ${response.status}`);
         }

         const data = await response.json();
         setTaskDependencies(data);
         setHasDependencies(data.prerequisites.length > 0 || data.dependents.length > 0);
      } catch (error) {
         console.error('Error fetching dependencies:', error);

         // Retry logic
         if (retryCount < 2) {
            console.log(`Retrying dependencies fetch (${retryCount + 1}/3)...`);
            setTimeout(() => fetchTaskDependencies(retryCount + 1), 1000 * (retryCount + 1));
         } else {
            toast.error('Failed to load dependencies');
         }
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

   // Handle task status toggle with retry logic
   async function handleTaskStatusToggle() {
      if (isUpdating) return;

      setIsUpdating(true);

      try {
         const newStatus = !completed;
         setCompleted(newStatus);

         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/status`, {
            method: 'PATCH',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: newStatus }),
         });

         if (!response.ok) {
            throw new Error(`Failed to update task status: ${response.status}`);
         }

         // Success - the UI is already updated optimistically
         console.log('Task status updated successfully');
      } catch (error) {
         console.error('Error updating task status:', error);
         setCompleted(!completed); // Revert on error

         if (onStatusChange) {
            onStatusChange(list._id, completed, error.message);
         }

         toast.error('Failed to update task status');
      } finally {
         setIsUpdating(false);
      }
   }

   function handleEdit() {
      setShowEditModal(true);
   }

   function handleDelete() {
      onDelete(list._id);
   }

   function handleSaveTask(taskId, updatedTaskData) {
      onUpdate(taskId, updatedTaskData);
      setShowEditModal(false);
   }

   // Toggle subtasks visibility
   const toggleSubtasks = (e) => {
      e.stopPropagation();
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

   // Save a new subtask with retry logic
   const handleSaveSubtask = async (subtaskData, subtaskId = null) => {
      try {
         setSocketUpdateReceived(false);
         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/subtasks`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(subtaskData),
         });

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || (subtaskId ? 'Failed to update subtask' : 'Failed to create subtask'));
         }

         const data = await response.json();

         if (!subtaskId) {
            setShowSubtasks(true);
         }

         setShowSubtaskModal(false);
         toast.success(subtaskId ? 'Subtask updated successfully' : 'Subtask created successfully');

         // Fallback: If socket events don't update the UI within 2 seconds, refetch data
         setTimeout(() => {
            if (!subtaskId && !socketUpdateReceived) {
               console.log('Socket event may have failed, refetching subtasks...');
               fetchSubtasks();
            }
         }, 2000);
      } catch (error) {
         console.error('Error saving subtask:', error);
         toast.error(error.message || 'Failed to save subtask');
      }
   };

   // Handle subtask deletion with retry logic
   const handleDeleteSubtask = async (subtaskId) => {
      try {
         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/subtasks/${subtaskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to delete subtask: ${response.status}`);
         }

         setSubtasks((prevSubtasks) => prevSubtasks.filter((st) => st._id !== subtaskId));
         toast.success('Subtask deleted successfully');
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
      if (!errorMessage) {
         try {
            const updatedSubtasks = subtasks.map((st) => {
               if (st._id === subtaskId) {
                  return { ...st, status: !currentStatus };
               }
               return st;
            });

            setSubtasks(updatedSubtasks);

            const totalSubtasks = updatedSubtasks.length;
            const completedCount = updatedSubtasks.filter((st) => st.status).length;

            const parentTaskUpdate = {
               ...list,
               subtaskCount: totalSubtasks,
               completedSubtasks: completedCount,
            };

            if (onUpdate) {
               onUpdate(list._id, parentTaskUpdate);
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

         const reminderDateTime = new Date(reminderTime);
         if (reminderDateTime <= new Date()) {
            toast.error('Reminder time must be in the future');
            return;
         }

         const response = await fetch(`${BACKEND_URL}/api/reminders`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
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

   // Fetch notes for the task with retry logic
   const fetchNotes = async (retryCount = 0) => {
      setIsLoadingNotes(true);
      try {
         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/notes`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to fetch notes: ${response.status}`);
         }

         const data = await response.json();
         setNotes(data);
      } catch (error) {
         console.error('Error fetching notes:', error);

         if (retryCount < 2) {
            setTimeout(() => fetchNotes(retryCount + 1), 1000 * (retryCount + 1));
         } else {
            toast.error('Failed to load notes');
         }
      } finally {
         setIsLoadingNotes(false);
      }
   };

   // Fetch attachments for the task with retry logic
   const fetchAttachments = async (retryCount = 0) => {
      setIsLoadingAttachments(true);
      try {
         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/attachments`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to fetch attachments: ${response.status}`);
         }

         const data = await response.json();
         setAttachments(data);
         setHasAttachments(data && data.length > 0);
      } catch (error) {
         console.error('Error fetching attachments:', error);

         if (retryCount < 2) {
            setTimeout(() => fetchAttachments(retryCount + 1), 1000 * (retryCount + 1));
         }
         // Don't show error toast on initial load
      } finally {
         setIsLoadingAttachments(false);
      }
   };

   // Handle note creation
   const handleCreateNote = async (content) => {
      try {
         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/notes`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
         });

         if (!response.ok) {
            throw new Error(`Failed to create note: ${response.status}`);
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

         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/attachments`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
            },
            body: formData,
         });

         if (!response.ok) {
            throw new Error(`Failed to upload attachment: ${response.status}`);
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
         const response = await fetch(`${BACKEND_URL}/api/attachments/${attachmentId}/download`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to download attachment: ${response.status}`);
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
      <div className="space-y-4">
         <motion.div
            key={list._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border ${
               isDark
                  ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800/50'
                  : 'border-gray-200 bg-white hover:bg-gray-50/50'
            } transition-all duration-300`}
         >
            {/* Task Header */}
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center space-x-3">
                  <button
                     onClick={handleTaskStatusToggle}
                     className={`p-1.5 rounded-full transition-colors ${
                        isDark
                           ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-300'
                           : 'hover:bg-gray-100 text-gray-500 hover:text-gray-600'
                     }`}
                  >
                     <HiOutlineCheckCircle
                        className={`w-5 h-5 ${completed ? (isDark ? 'text-green-400' : 'text-green-500') : ''}`}
                     />
                  </button>
                  <h3
                     className={`text-lg font-semibold ${
                        completed
                           ? isDark
                              ? 'line-through text-gray-500'
                              : 'line-through text-gray-400'
                           : isDark
                           ? 'text-gray-100'
                           : 'text-gray-900'
                     }`}
                  >
                     {list.task}
                  </h3>
               </div>
               <div className="flex items-center space-x-2">
                  <button
                     onClick={() => setExpandedTaskId(list._id)}
                     className={`p-1.5 rounded-full transition-colors ${
                        isDark
                           ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-300'
                           : 'hover:bg-gray-100 text-gray-500 hover:text-gray-600'
                     }`}
                  >
                     <svg
                        className={`w-5 h-5 transform transition-transform ${
                           expandedTaskId === list._id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                  </button>
               </div>
            </div>

            {/* Task Details */}
            <div className={`space-y-3 ${expandedTaskId === list._id ? 'block' : 'hidden'}`}>
               <div
                  className={`p-3 rounded-lg border ${
                     isDark ? 'border-gray-700 bg-gray-800/50 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
                  }`}
               >
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{list.description}</p>
               </div>

               {/* Task Metadata */}
               <div className={`grid grid-cols-2 gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex items-center space-x-2">
                     <HiOutlineClock className="w-4 h-4" />
                     <span>{list.time || 'No time set'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                     <HiOutlineCalendar className="w-4 h-4" />
                     <span>{list.date || 'No date set'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                     <HiOutlineTag className="w-4 h-4" />
                     <span>{list.priority || 'No priority set'}</span>
                  </div>
               </div>

               {/* Subtasks Section */}
               <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                     <h4 className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subtasks</h4>
                     <button
                        onClick={handleAddSubtask}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                           isDark
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-purple-500 hover:bg-purple-600 text-white'
                        }`}
                     >
                        Add Subtask
                     </button>
                  </div>

                  <div className="space-y-2">
                     {subtasks.map((subtask, index) => (
                        <Subtask
                           key={subtask._id}
                           subtask={subtask}
                           onUpdate={handleEditSubtask}
                           onDelete={handleDeleteSubtask}
                           isCompleted={completedSubtasks.has(subtask._id)}
                           onCompletionChange={(completed) =>
                              handleSubtaskStatusChange(subtask._id, completedSubtasks.has(subtask._id), '')
                           }
                        />
                     ))}
                  </div>
               </div>
            </div>
         </motion.div>

         {/* Subtask Modal */}
         <SubtaskModal
            isOpen={isSubtaskModalOpen}
            onClose={() => setIsSubtaskModalOpen(false)}
            onSave={handleSaveSubtask}
            parentTaskId={selectedTask?._id}
            parentTask={selectedTask}
         />
      </div>
   );
}

export default DisplayTodoList;
