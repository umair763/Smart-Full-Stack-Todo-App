# Database Seeding Script

This script populates your Smart Todo App database with realistic test data for development and testing purposes.

## 📋 What it creates:

-   **20 realistic tasks** (mix of work and personal tasks)
-   **10 tasks with subtasks** (3-5 subtasks each)
-   **7 tasks with notes** (2-3 notes each on average)
-   **7 task dependencies** (logical prerequisite relationships)

## 🚀 How to run:

### Prerequisites:    

1. **Create a user account first** by:
    - Starting the application (`npm run dev`)
    - Registering a new account through the UI
    - The script will use the first existing user it finds

### Running the script:

```bash
# Navigate to server directory
cd server

# Run the seeding script
npm run seed
```

Or directly with Node:

```bash
node scripts/seedData.js
```

## 📊 Sample Data Includes:

### Tasks:

-   **Work tasks**: Financial reports, presentations, documentation, security protocols, etc.
-   **Personal tasks**: Trip planning, home organization, learning, health checkups, etc.
-   **Mixed priorities**: High, Medium, and Low priority tasks
-   **Realistic dates**: Tasks scheduled 1-30 days in the future

### Subtasks:

-   **Logical breakdown** of parent tasks
-   **Realistic completion status** (30% chance of being completed)
-   **Proper date constraints** (subtasks due before parent tasks)

### Notes:

-   **Contextual notes** specific to each task type
-   **Practical reminders** and considerations
-   **Realistic content** that developers would actually write

### Dependencies:

-   **Logical relationships** between related tasks
-   **Proper date ordering** (prerequisite tasks due before dependent tasks)
-   **Real-world scenarios** (e.g., documentation before presentation)

## 🧹 Data Management:

The script will:

-   **Clear existing** tasks, subtasks, dependencies, and notes
-   **Preserve user accounts** (does not create or delete users)
-   **Use the first existing user** for all created data

## ⚠️ Important Notes:

1. **Specific User Required**: The target user (ID: 6835e3a79bf3cc1561507b97) must exist in the database
2. **Data Cleanup**: The script clears all existing task-related data
3. **Development Only**: This is intended for development/testing environments
4. **MongoDB Connection**: Ensure your MongoDB is running and accessible

## 🎯 Perfect for Testing:

-   **Dependency system** functionality
-   **Subtask management** features
-   **Note-taking** capabilities
-   **Task sorting and filtering**
-   **UI responsiveness** with realistic data volumes
-   **Performance** with multiple related entities

## 🔧 Customization:

You can modify the script to:

-   Change the number of tasks/subtasks/notes
-   Add more task categories
-   Adjust completion probabilities
-   Modify date ranges
-   Add custom note templates

## 📝 Example Output:

```
🌱 Starting database seeding...

✅ MongoDB connected successfully
🧹 Cleared existing tasks, subtasks, dependencies, and notes
👤 Using existing user: john@example.com (john_doe)
📝 Creating 20 tasks...
  ✓ Created task 1: Complete quarterly financial report (High priority)
  ✓ Created task 2: Plan weekend family trip (Medium priority)
  ...
📋 Creating subtasks for 10 tasks...
  ✓ Created 4 subtasks for: Complete quarterly financial report (1 completed)
  ...
📝 Creating notes for 7 tasks...
  ✓ Created 3 notes for: Learn new programming language
  ...
🔗 Creating 7 task dependencies...
  ✓ Created dependency: "Review and update project documentation" → "Prepare presentation for board meeting"
  ...

🎉 Database seeding completed successfully!

📊 Summary:
   • 20 tasks created
   • 10 tasks with subtasks (3-5 subtasks each)
   • 7 tasks with notes (2-3 notes each)
   • 7 task dependencies created
   • Using existing user: john@example.com

🚀 You can now test the application with realistic data!
```
