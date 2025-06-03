// test-mongo-connection.js
// Save this file in your project root and run: node test-mongo-connection.js

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb+srv://MuhammadUmair:umair%4011167@cluster0.jjtx3.mongodb.net/SmartTodoApp?retryWrites=true&w=majority&appName=Cluster0";

console.log("🧪 Testing MongoDB Connection...");
console.log("📍 URI (masked):", MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));

async function testConnection() {
    try {
        console.log("\n⏳ Attempting to connect...");

        const startTime = Date.now();

        // Connection options optimized for testing (FIXED VERSION)
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 5,
            bufferCommands: false,
            // REMOVED: bufferMaxEntries: 0, - This option is deprecated
            family: 4,
            retryWrites: true,
            authSource: "admin",
        });

        const connectionTime = Date.now() - startTime;
        console.log(`✅ Connection successful! (${connectionTime}ms)`);

        // Test database operations
        console.log("\n🔍 Testing database operations...");

        // Test 1: Ping
        console.log("1️⃣ Pinging database...");
        const pingStart = Date.now();
        const pingResult = await mongoose.connection.db.admin().ping();
        console.log(`   ✅ Ping successful (${Date.now() - pingStart}ms):`, pingResult);

        // Test 2: Database info
        console.log("2️⃣ Getting database info...");
        const dbName = mongoose.connection.db.databaseName;
        console.log(`   📊 Database name: ${dbName}`);
        console.log(`   🔗 Connection state: ${mongoose.connection.readyState} (1 = connected)`);
        console.log(`   🖥️  Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

        // Test 3: Collections
        console.log("3️⃣ Listing collections...");
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`   📚 Found ${collections.length} collections:`);
        collections.forEach((col) => console.log(`      - ${col.name}`));

        // Test 4: Database stats
        console.log("4️⃣ Getting database statistics...");
        try {
            const stats = await mongoose.connection.db.stats();
            console.log(`   💾 Data size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   📇 Index size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   📊 Collections: ${stats.collections}`);
            console.log(`   📄 Documents: ${stats.objects}`);
        } catch (statsError) {
            console.log(`   ⚠️  Stats error: ${statsError.message}`);
        }

        console.log("\n🎉 All tests completed successfully!");
        console.log("✅ Your MongoDB connection is working properly");
    } catch (error) {
        console.error("\n❌ Connection failed!");
        console.error("🔍 Error details:");
        console.error(`   Type: ${error.name}`);
        console.error(`   Message: ${error.message}`);

        // Provide specific help based on error type
        if (error.name === "MongoServerSelectionError") {
            console.error("\n💡 Troubleshooting tips for Server Selection Error:");
            console.error("   1. Check your internet connection");
            console.error("   2. Verify the MongoDB URI is correct");
            console.error("   3. Ensure your IP address is whitelisted in MongoDB Atlas");
            console.error("   4. Check if your firewall is blocking the connection");
        } else if (error.name === "MongoAuthenticationError") {
            console.error("\n💡 Troubleshooting tips for Authentication Error:");
            console.error("   1. Verify your username and password are correct");
            console.error("   2. Check if the user has proper permissions");
            console.error("   3. Ensure the database name in the URI is correct");
        } else if (error.name === "MongoNetworkError") {
            console.error("\n💡 Troubleshooting tips for Network Error:");
            console.error("   1. Check your internet connection");
            console.error("   2. Try using a different network");
            console.error("   3. Check if your ISP is blocking MongoDB connections");
        } else if (error.name === "MongoParseError") {
            console.error("\n💡 Troubleshooting tips for Parse Error:");
            console.error("   1. Check for deprecated connection options");
            console.error("   2. Verify your connection string format");
            console.error("   3. Update your Mongoose version if outdated");
        }

        console.error("\n🔧 General troubleshooting:");
        console.error("   1. Verify your .env file contains the correct MONGO_URI");
        console.error("   2. Check MongoDB Atlas dashboard for connection issues");
        console.error("   3. Try connecting from MongoDB Compass with the same URI");

        process.exit(1);
    } finally {
        console.log("\n🔌 Closing connection...");
        await mongoose.connection.close();
        console.log("✅ Connection closed");
        process.exit(0);
    }
}

// Handle process termination
process.on("SIGINT", async () => {
    console.log("\n🛑 Received interrupt signal");
    try {
        await mongoose.connection.close();
        console.log("✅ Connection closed gracefully");
    } catch (error) {
        console.error("❌ Error closing connection:", error.message);
    }
    process.exit(0);
});

// Run the test
testConnection();
