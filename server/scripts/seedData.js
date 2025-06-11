import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import User from "../models/User.js";
import Task from "../models/Task.js";
import Subtask from "../models/Subtask.js";
import Dependency from "../models/Dependency.js";
import Note from "../models/Note.js";

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(
            "mongodb+srv://MuhammadUmair:umair%4011167@cluster0.jjtx3.mongodb.net/SmartTodoApp?retryWrites=true&w=majority&appName=Cluster0"
        );
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Helper function to generate random date within a range
const getRandomDate = (startDays, endDays) => {
    const start = new Date();
    start.setDate(start.getDate() + startDays);
    const end = new Date();
    end.setDate(end.getDate() + endDays);

    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime);
};

// Helper function to format date as DD/MM/YYYY
const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Helper function to format time as HH:MM AM/PM
const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${hours}:${minutes} ${ampm}`;
};

// Helper function to get random element from array
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get random number in range
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Realistic task data
const taskTemplates = [
    {
        category: "Work",
        tasks: [
            "Complete quarterly financial report",
            "Prepare presentation for board meeting",
            "Review and update project documentation",
            "Conduct team performance reviews",
            "Implement new security protocols",
            "Optimize database performance",
            "Design user interface mockups",
            "Test new software features",
            "Update company website content",
            "Organize team building event",
        ],
    },
    {
        category: "Personal",
        tasks: [
            "Plan weekend family trip",
            "Organize home office space",
            "Learn new programming language",
            "Complete online certification course",
            "Update personal portfolio website",
            "Plan healthy meal prep for the week",
            "Schedule annual health checkup",
            "Organize digital photo collection",
            "Research investment opportunities",
            "Plan birthday party for friend",
        ],
    },
];

// Subtask templates for different task types
const subtaskTemplates = {
    "Complete quarterly financial report": [
        "Gather revenue data from all departments",
        "Analyze expense reports and receipts",
        "Create charts and graphs for visualization",
        "Write executive summary",
        "Review with accounting team",
        "Format document according to company standards",
    ],
    "Prepare presentation for board meeting": [
        "Research market trends and competitors",
        "Create PowerPoint slides",
        "Prepare speaker notes",
        "Practice presentation timing",
        "Set up meeting room and equipment",
    ],
    "Plan weekend family trip": [
        "Research destination options",
        "Book accommodation",
        "Plan travel itinerary",
        "Pack luggage and essentials",
        "Arrange pet care while away",
    ],
    "Implement new security protocols": [
        "Audit current security measures",
        "Research best practices and standards",
        "Draft new security policy document",
        "Train staff on new procedures",
        "Test security implementation",
    ],
    "Design user interface mockups": [
        "Conduct user research and interviews",
        "Create wireframes for key screens",
        "Design high-fidelity mockups",
        "Get feedback from stakeholders",
        "Iterate based on feedback",
    ],
    "Learn new programming language": [
        "Choose appropriate learning resources",
        "Set up development environment",
        "Complete basic syntax tutorials",
        "Build practice projects",
        "Join community forums and groups",
    ],
    "Organize home office space": [
        "Declutter and remove unnecessary items",
        "Purchase new organizational supplies",
        "Set up proper lighting and ergonomics",
        "Organize cables and electronics",
        "Create filing system for documents",
    ],
    "Update company website content": [
        "Audit existing content for accuracy",
        "Write new content for updated sections",
        "Optimize content for search engines",
        "Update images and graphics",
        "Test website functionality across browsers",
    ],
    "Plan healthy meal prep for the week": [
        "Research healthy recipe options",
        "Create shopping list for ingredients",
        "Purchase groceries and supplies",
        "Prepare and cook meals in batches",
        "Store meals in proper containers",
    ],
    "Complete online certification course": [
        "Register for the certification program",
        "Create study schedule and timeline",
        "Complete all required modules",
        "Take practice exams",
        "Schedule and take final certification exam",
    ],
};

// Note templates for different task types
const noteTemplates = {
    "Complete quarterly financial report": [
        "Remember to include the new revenue streams from Q3",
        "Check with Sarah about the marketing budget discrepancies",
        "Don't forget to highlight the 15% growth in online sales",
        "Need to verify the expense categories with accounting",
        "Include comparison with last year's Q4 performance",
    ],
    "Prepare presentation for board meeting": [
        "Focus on the key metrics that show growth",
        "Prepare backup slides for potential questions",
        "Practice the 10-minute version in case time is short",
        "Include the competitive analysis from last month",
        "Make sure to address the budget concerns raised last time",
    ],
    "Learn new programming language": [
        "Start with the official documentation and tutorials",
        "Join the community Discord for help and networking",
        "Set aside 2 hours daily for consistent practice",
        "Build a small project to apply what I'm learning",
        "Keep notes on syntax differences from languages I know",
    ],
    "Plan weekend family trip": [
        "Check weather forecast before finalizing outdoor activities",
        "Book restaurants in advance, especially for Saturday dinner",
        "Pack extra clothes for the kids in case of spills",
        "Download offline maps in case of poor cell service",
        "Bring portable chargers and entertainment for the car ride",
    ],
    "Organize home office space": [
        "Measure the desk area before buying new organizers",
        "Consider ergonomic improvements for better posture",
        "Set up better lighting to reduce eye strain",
        "Create a filing system for important documents",
        "Add some plants to improve air quality and mood",
    ],
    "Design user interface mockups": [
        "Focus on mobile-first design approach",
        "Ensure accessibility standards are met",
        "Use consistent color scheme throughout",
        "Get feedback from actual users, not just stakeholders",
        "Consider dark mode option for better user experience",
    ],
    "Implement new security protocols": [
        "Test all protocols in staging environment first",
        "Document all changes for the security audit",
        "Train the IT team on new procedures before rollout",
        "Set up monitoring alerts for security events",
        "Schedule regular reviews of security measures",
    ],
    "Update company website content": [
        "Optimize images for faster loading times",
        "Update all contact information and team photos",
        "Check all links to ensure they're still working",
        "Add new testimonials from recent clients",
        "Improve SEO with better meta descriptions",
    ],
    "Plan healthy meal prep for the week": [
        "Focus on high-protein meals for better satiety",
        "Prep vegetables on Sunday to save time during the week",
        "Include variety to avoid getting bored with meals",
        "Portion control is key - use proper containers",
        "Don't forget healthy snacks for between meals",
    ],
    "Complete online certification course": [
        "Set up a dedicated study schedule with specific goals",
        "Take notes on key concepts for later review",
        "Join study groups or forums for additional support",
        "Practice with real-world examples when possible",
        "Schedule the exam as soon as I feel ready",
    ],
};

// Priority levels
const priorities = ["High", "Medium", "Low"];
const colors = ["red", "yellow", "green"];

// Clear existing data
const clearDatabase = async () => {
    try {
        await Task.deleteMany({});
        await Subtask.deleteMany({});
        await Dependency.deleteMany({});
        await Note.deleteMany({});
        console.log("🧹 Cleared existing tasks, subtasks, dependencies, and notes");
    } catch (error) {
        console.error("❌ Error clearing database:", error);
    }
};

// Get specific user by ID or Google ID
const getSpecificUser = async () => {
    try {
        const targetUserId = "683ef352a928fc6c5e04e674";
        const targetGoogleId = "111573823086976239495";

        // Try to find user by MongoDB ObjectId first
        let user = await User.findById(targetUserId);

        // If not found by ID, try to find by Google ID
        if (!user) {
            user = await User.findOne({ googleId: targetGoogleId });
        }

        if (!user) {
            console.log("❌ Target user not found!");
            console.log(`📝 Looking for user with:`);
            console.log(`   • User ID: ${targetUserId}`);
            console.log(`   • Google ID: ${targetGoogleId}`);
            console.log("\n💡 Please ensure this user exists in your database.");
            throw new Error("Target user not found. Please check the user ID and Google ID.");
        }

        console.log(`👤 Using target user: ${user.email} (${user.username || "No username"})`);
        console.log(`   • User ID: ${user._id}`);
        console.log(`   • Google ID: ${user.googleId || "No Google ID"}`);
        return user;
    } catch (error) {
        console.error("❌ Error getting target user:", error);
        throw error;
    }
};

// Create tasks
const createTasks = async (userId) => {
    const tasks = [];
    const allTaskNames = [];

    // Collect all task names
    taskTemplates.forEach((category) => {
        allTaskNames.push(...category.tasks);
    });

    console.log("📝 Creating 60 tasks across different time periods...");

    // Create tasks for different time periods to show meaningful insights
    const timeDistribution = [
        // Past 3 months (40 tasks) - for historical data
        { period: "past3months", count: 40, startDays: -90, endDays: -1, completionRate: 0.7 },
        // Current week (10 tasks) - for current activity
        { period: "currentWeek", count: 10, startDays: -3, endDays: 3, completionRate: 0.4 },
        // Future (10 tasks) - for upcoming tasks
        { period: "future", count: 10, startDays: 4, endDays: 30, completionRate: 0.1 },
    ];

    let taskIndex = 0;

    for (const timePeriod of timeDistribution) {
        console.log(`\n📅 Creating ${timePeriod.count} tasks for ${timePeriod.period}...`);

        // Shuffle task names for this period
        const shuffledTasks = [...allTaskNames].sort(() => 0.5 - Math.random());

        for (let i = 0; i < timePeriod.count; i++) {
            const taskName = shuffledTasks[i % shuffledTasks.length];
            const priority = getRandomElement(priorities);
            const color = colors[priorities.indexOf(priority)];

            // Generate date within the specified range
            const taskDate = getRandomDate(timePeriod.startDays, timePeriod.endDays);

            // Determine completion status based on period
            let isCompleted;
            if (timePeriod.period === "past3months") {
                // Higher completion rate for past tasks, with some variation
                isCompleted = Math.random() < timePeriod.completionRate;
            } else if (timePeriod.period === "currentWeek") {
                // Moderate completion rate for current tasks
                isCompleted = Math.random() < timePeriod.completionRate;
            } else {
                // Low completion rate for future tasks
                isCompleted = Math.random() < timePeriod.completionRate;
            }

            const task = new Task({
                task: `${taskName} (${timePeriod.period})`,
                date: formatDate(taskDate),
                time: formatTime(taskDate),
                priority: priority,
                color: color,
                completed: isCompleted,
                userId: userId,
                subtaskCount: 0,
                completedSubtasks: 0,
            });

            await task.save();
            tasks.push(task);
            taskIndex++;

            console.log(
                `  ✓ Created task ${taskIndex}: ${task.task} (${priority} priority, ${isCompleted ? "Completed" : "Pending"})`
            );
        }
    }

    // Create additional tasks for specific days to ensure weekly/monthly charts have data
    console.log("\n📊 Creating specific tasks for chart visualization...");

    // Create tasks for each day of the past week
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Create 2-4 tasks per day
        const tasksPerDay = getRandomNumber(2, 4);

        for (let j = 0; j < tasksPerDay; j++) {
            const taskName = getRandomElement(allTaskNames);
            const priority = getRandomElement(priorities);
            const color = colors[priorities.indexOf(priority)];

            // Random time during the day
            const hour = getRandomNumber(8, 18);
            const minute = getRandomNumber(0, 59);
            date.setHours(hour, minute, 0, 0);

            // Higher completion rate for older days
            const daysAgo = i;
            const completionRate = Math.max(0.3, 0.9 - daysAgo * 0.1);
            const isCompleted = Math.random() < completionRate;

            const task = new Task({
                task: `Daily: ${taskName}`,
                date: formatDate(date),
                time: formatTime(date),
                priority: priority,
                color: color,
                completed: isCompleted,
                userId: userId,
                subtaskCount: 0,
                completedSubtasks: 0,
            });

            await task.save();
            tasks.push(task);
            taskIndex++;
        }

        console.log(`  ✓ Created ${tasksPerDay} tasks for ${formatDate(date)}`);
    }

    // Create tasks for each week of the past month
    console.log("\n📅 Creating weekly distribution tasks...");
    for (let week = 0; week < 4; week++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - week * 7 - 7);

        // Create 3-6 tasks per week
        const tasksPerWeek = getRandomNumber(3, 6);

        for (let j = 0; j < tasksPerWeek; j++) {
            const taskDate = new Date(weekStart);
            taskDate.setDate(taskDate.getDate() + getRandomNumber(0, 6)); // Random day in the week

            const taskName = getRandomElement(allTaskNames);
            const priority = getRandomElement(priorities);
            const color = colors[priorities.indexOf(priority)];

            // Completion rate decreases for older weeks
            const completionRate = Math.max(0.4, 0.8 - week * 0.1);
            const isCompleted = Math.random() < completionRate;

            const task = new Task({
                task: `Weekly: ${taskName}`,
                date: formatDate(taskDate),
                time: formatTime(taskDate),
                priority: priority,
                color: color,
                completed: isCompleted,
                userId: userId,
                subtaskCount: 0,
                completedSubtasks: 0,
            });

            await task.save();
            tasks.push(task);
            taskIndex++;
        }

        console.log(`  ✓ Created ${tasksPerWeek} tasks for week ${week + 1}`);
    }

    // Create tasks for each month of the past year
    console.log("\n📆 Creating monthly distribution tasks...");
    for (let month = 0; month < 12; month++) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - month);
        monthDate.setDate(getRandomNumber(1, 28)); // Safe day range for all months

        // Create 2-5 tasks per month
        const tasksPerMonth = getRandomNumber(2, 5);

        for (let j = 0; j < tasksPerMonth; j++) {
            const taskDate = new Date(monthDate);
            taskDate.setDate(getRandomNumber(1, 28));

            const taskName = getRandomElement(allTaskNames);
            const priority = getRandomElement(priorities);
            const color = colors[priorities.indexOf(priority)];

            // Completion rate decreases for older months
            const completionRate = Math.max(0.5, 0.9 - month * 0.03);
            const isCompleted = Math.random() < completionRate;

            const task = new Task({
                task: `Monthly: ${taskName}`,
                date: formatDate(taskDate),
                time: formatTime(taskDate),
                priority: priority,
                color: color,
                completed: isCompleted,
                userId: userId,
                subtaskCount: 0,
                completedSubtasks: 0,
            });

            await task.save();
            tasks.push(task);
            taskIndex++;
        }

        const monthName = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        console.log(`  ✓ Created ${tasksPerMonth} tasks for ${monthName}`);
    }

    console.log(`\n🎯 Total tasks created: ${tasks.length}`);
    console.log(`📊 Distribution:`);
    console.log(`   • Past 3 months: 40 tasks (70% completion rate)`);
    console.log(`   • Current week: 10 tasks (40% completion rate)`);
    console.log(`   • Future: 10 tasks (10% completion rate)`);
    console.log(`   • Daily distribution: ${7 * 3} tasks (for weekly charts)`);
    console.log(`   • Weekly distribution: ${4 * 4} tasks (for monthly charts)`);
    console.log(`   • Monthly distribution: ${12 * 3} tasks (for yearly charts)`);

    return tasks;
};

// Create subtasks for selected tasks
const createSubtasks = async (tasks) => {
    console.log("📋 Creating subtasks for 10 tasks (4-6 subtasks each)...");

    // Select exactly 10 tasks to have subtasks
    const tasksWithSubtasks = tasks.sort(() => 0.5 - Math.random()).slice(0, 10);

    for (const task of tasksWithSubtasks) {
        const subtaskCount = getRandomNumber(4, 6); // Changed to 4-6 subtasks
        const subtaskList = subtaskTemplates[task.task] || [
            "Research and gather information",
            "Create initial draft or prototype",
            "Review and get feedback",
            "Make necessary revisions",
            "Finalize and complete",
        ];

        // Shuffle and take required number of subtasks
        const selectedSubtasks = subtaskList.sort(() => 0.5 - Math.random()).slice(0, subtaskCount);

        let completedCount = 0;

        for (let i = 0; i < selectedSubtasks.length; i++) {
            const subtaskName = selectedSubtasks[i];
            const isCompleted = Math.random() < 0.3; // 30% chance of being completed

            if (isCompleted) completedCount++;

            // Generate subtask date (should be before or same as parent task)
            const parentDate = new Date(task.date.split("/").reverse().join("-"));
            const subtaskDate = getRandomDate(-5, 0); // 0-5 days before today

            // Ensure subtask date is not after parent task date
            if (subtaskDate > parentDate) {
                subtaskDate.setTime(parentDate.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000);
            }

            const subtask = new Subtask({
                title: subtaskName,
                description: `Subtask for: ${task.task}`,
                date: formatDate(subtaskDate),
                time: formatTime(subtaskDate),
                priority: getRandomElement(priorities),
                status: isCompleted,
                taskId: task._id,
            });

            try {
                await subtask.save();

                // Add subtask to parent task's subtasks array
                task.subtasks.push(subtask._id);

                console.log(`    - Saved subtask: ${subtaskName}`);
            } catch (error) {
                console.error(`    ❌ Failed to save subtask: ${subtaskName}`, error.message);
                throw error;
            }
        }

        // Save the updated task with subtasks array
        try {
            await task.save();
            console.log(`    ✓ Updated task with ${task.subtasks.length} subtasks (${completedCount} completed)`);
        } catch (error) {
            console.error(`    ❌ Failed to update task:`, error.message);
            throw error;
        }

        console.log(`  ✓ Created ${selectedSubtasks.length} subtasks for: ${task.task} (${completedCount} completed)`);
    }
};

// Create notes for selected tasks
const createNotes = async (tasks, userId) => {
    console.log("📝 Creating notes for 7 tasks...");

    // Select 7 random tasks to have notes
    const tasksWithNotes = tasks.sort(() => 0.5 - Math.random()).slice(0, 7);

    let totalNotesCreated = 0;

    for (const task of tasksWithNotes) {
        const noteCount = getRandomNumber(2, 3); // 2-3 notes per task
        const noteList = noteTemplates[task.task] || [
            "Important considerations for this task",
            "Key points to remember during execution",
            "Additional resources and references needed",
            "Potential challenges and how to address them",
            "Success criteria and completion checklist",
        ];

        // Shuffle and take required number of notes
        const selectedNotes = noteList.sort(() => 0.5 - Math.random()).slice(0, noteCount);

        for (const noteContent of selectedNotes) {
            const note = new Note({
                taskId: task._id,
                userId: userId,
                content: noteContent,
            });

            await note.save();
            totalNotesCreated++;
        }

        console.log(`  ✓ Created ${selectedNotes.length} notes for: ${task.task}`);
    }

    console.log(`📋 Total notes created: ${totalNotesCreated}`);
};

// Create dependencies between tasks
const createDependencies = async (tasks) => {
    console.log("🔗 Creating 7 task dependencies...");

    // Sort tasks by date to create logical dependencies
    const sortedTasks = tasks.sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateA - dateB;
    });

    const dependencyPairs = [
        // Work-related dependencies
        ["Review and update project documentation", "Prepare presentation for board meeting"],
        ["Complete quarterly financial report", "Conduct team performance reviews"],
        ["Implement new security protocols", "Test new software features"],
        ["Design user interface mockups", "Update company website content"],

        // Personal dependencies
        ["Research investment opportunities", "Complete online certification course"],
        ["Organize home office space", "Learn new programming language"],
        ["Schedule annual health checkup", "Plan healthy meal prep for the week"],
    ];

    let dependenciesCreated = 0;

    for (const [prerequisiteName, dependentName] of dependencyPairs) {
        if (dependenciesCreated >= 7) break;

        const prerequisiteTask = tasks.find((t) => t.task === prerequisiteName);
        const dependentTask = tasks.find((t) => t.task === dependentName);

        if (prerequisiteTask && dependentTask) {
            // Ensure prerequisite task has earlier or same date as dependent task
            const prereqDate = new Date(prerequisiteTask.date.split("/").reverse().join("-"));
            const depDate = new Date(dependentTask.date.split("/").reverse().join("-"));

            if (prereqDate <= depDate) {
                const dependency = new Dependency({
                    prerequisiteTaskId: prerequisiteTask._id,
                    dependentTaskId: dependentTask._id,
                    userId: prerequisiteTask.userId,
                });

                await dependency.save();
                dependenciesCreated++;

                console.log(`  ✓ Created dependency: "${prerequisiteName}" → "${dependentName}"`);
            }
        }
    }

    // Create additional random dependencies if needed
    while (dependenciesCreated < 7 && sortedTasks.length > 1) {
        const prerequisiteIndex = getRandomNumber(0, sortedTasks.length - 2);
        const dependentIndex = getRandomNumber(prerequisiteIndex + 1, sortedTasks.length - 1);

        const prerequisiteTask = sortedTasks[prerequisiteIndex];
        const dependentTask = sortedTasks[dependentIndex];

        // Check if dependency already exists
        const existingDependency = await Dependency.findOne({
            prerequisiteTaskId: prerequisiteTask._id,
            dependentTaskId: dependentTask._id,
        });

        if (!existingDependency) {
            const dependency = new Dependency({
                prerequisiteTaskId: prerequisiteTask._id,
                dependentTaskId: dependentTask._id,
                userId: prerequisiteTask.userId,
            });

            await dependency.save();
            dependenciesCreated++;

            console.log(`  ✓ Created random dependency: "${prerequisiteTask.task}" → "${dependentTask.task}"`);
        }
    }

    console.log(`🎯 Total dependencies created: ${dependenciesCreated}`);
};

// Main seeding function
const seedDatabase = async () => {
    try {
        console.log("🌱 Starting database seeding...\n");

        // Connect to database
        await connectDB();

        // Clear existing data
        await clearDatabase();

        // Get specific target user
        const user = await getSpecificUser();

        // Create tasks
        const tasks = await createTasks(user._id);

        // Create subtasks
        await createSubtasks(tasks);

        // Create notes
        await createNotes(tasks, user._id);

        // Create dependencies
        await createDependencies(tasks);

        console.log("\n🎉 Database seeding completed successfully!");
        console.log("\n📊 Summary:");
        console.log(`   • ${tasks.length} tasks created across different time periods`);
        console.log(`   • 10 tasks with subtasks (4-6 subtasks each)`);
        console.log(`   • 7 tasks with notes (2-3 notes each)`);
        console.log(`   • 7 task dependencies created`);
        console.log(`   • Using target user: ${user.email}`);
        console.log("\n📈 Data Distribution for Insights:");
        console.log(`   • Historical data: Past 3 months with 70% completion rate`);
        console.log(`   • Current activity: This week with 40% completion rate`);
        console.log(`   • Future tasks: Next month with 10% completion rate`);
        console.log(`   • Daily data: Last 7 days for weekly charts`);
        console.log(`   • Weekly data: Last 4 weeks for monthly charts`);
        console.log(`   • Monthly data: Last 12 months for yearly charts`);
        console.log("\n🚀 You can now test the Insights page with rich, realistic data!");
        console.log("💡 All chart views (weekly, monthly, yearly) should now display meaningful visualizations!");
    } catch (error) {
        console.error("❌ Error seeding database:", error);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log("🔌 Database connection closed");
        process.exit(0);
    }
};

// Run the seeding script
seedDatabase();
