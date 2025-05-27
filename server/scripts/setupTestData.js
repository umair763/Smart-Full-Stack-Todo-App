import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const setupTestData = async () => {
    try {
        console.log("🚀 Setting up complete test environment...\n");

        console.log("Step 1: Creating test user...");
        const { stdout: userOutput, stderr: userError } = await execAsync("node scripts/createTestUser.js");
        console.log(userOutput);
        if (userError) console.error(userError);

        console.log("\nStep 2: Seeding database with test data...");
        const { stdout: seedOutput, stderr: seedError } = await execAsync("node scripts/seedData.js");
        console.log(seedOutput);
        if (seedError) console.error(seedError);

        console.log("\n🎉 Complete test environment setup finished!");
        console.log("\n📝 You can now:");
        console.log("   • Login with: test@example.com / password123");
        console.log("   • Test all features with realistic data");
        console.log("   • Explore 20 tasks with subtasks, notes, and dependencies");
    } catch (error) {
        console.error("❌ Error setting up test environment:", error);
        process.exit(1);
    }
};

setupTestData();
