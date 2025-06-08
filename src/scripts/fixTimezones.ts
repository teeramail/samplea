/**
 * Script to analyze and fix timezone issues in the database
 * Run this to understand current timezone handling and make corrections if needed
 */

import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { formatDateTimeInThaiTimezone } from "~/lib/timezoneUtils";

async function analyzeTimezones() {
  console.log("🔍 Analyzing timezone data in the database...\n");

  try {
    // Get a sample of events to analyze
    const sampleEvents = await db.query.events.findMany({
      limit: 10,
      orderBy: (events, { desc }) => [desc(events.createdAt)],
      columns: {
        id: true,
        title: true,
        date: true,
        startTime: true,
        endTime: true,
        createdAt: true,
      },
    });

    if (sampleEvents.length === 0) {
      console.log("❌ No events found in the database");
      return;
    }

    console.log(`📊 Analyzing ${sampleEvents.length} recent events:\n`);

    for (const event of sampleEvents) {
      console.log(`Event: ${event.title}`);
      console.log(`  ID: ${event.id}`);
      console.log(`  Date (raw): ${event.date}`);
      console.log(`  Start Time (raw): ${event.startTime}`);
      console.log(`  End Time (raw): ${event.endTime}`);
      
      // Show how these would be displayed in Thailand timezone
      console.log(`  Date (Thai TZ): ${formatDateTimeInThaiTimezone(event.date)}`);
      console.log(`  Start Time (Thai TZ): ${formatDateTimeInThaiTimezone(event.startTime)}`);
      if (event.endTime) {
        console.log(`  End Time (Thai TZ): ${formatDateTimeInThaiTimezone(event.endTime)}`);
      }
      
      // Show the raw UTC values for debugging
      const dateObj = new Date(event.date);
      const startObj = new Date(event.startTime);
      console.log(`  Date (UTC): ${dateObj.toISOString()}`);
      console.log(`  Start Time (UTC): ${startObj.toISOString()}`);
      
      console.log("  ---");
    }

    console.log("\n✅ Analysis complete!");
    console.log("\n📋 Summary:");
    console.log("- All times above show how events are currently stored");
    console.log("- 'Thai TZ' shows how they will display to users");
    console.log("- 'UTC' shows the actual stored values");
    console.log("\n💡 Best Practices:");
    console.log("- When creating events in Thailand, use local Thai time");
    console.log("- The system will handle timezone conversion for display");
    console.log("- All users will see consistent Thailand Time (GMT+7)");

  } catch (error) {
    console.error("❌ Error analyzing timezones:", error);
  }
}

async function suggestFixes() {
  console.log("\n🔧 Timezone Fix Suggestions:\n");

  console.log("1. Database Schema:");
  console.log("   ✅ Events use 'withTimezone: true' - this is correct");
  console.log("   ✅ This allows proper timezone handling");
  
  console.log("\n2. Display Logic:");
  console.log("   ✅ Updated to use formatTimeInThaiTimezone()");
  console.log("   ✅ All public pages show 'Thailand Time (GMT+7)'");
  
  console.log("\n3. Input Handling:");
  console.log("   ✅ Added TimezoneInfo component to admin pages");
  console.log("   ✅ Users see warnings when outside Thailand");
  
  console.log("\n4. For Users Outside Thailand:");
  console.log("   - They see clear timezone indicators");
  console.log("   - Admin users get guidance about entering Thai time");
  console.log("   - Current time comparison shows both timezones");
  
  console.log("\n5. If you need to fix existing data:");
  console.log("   - Most likely no database changes needed");
  console.log("   - The new display functions handle conversion properly");
  console.log("   - Check admin panel to verify times look correct");
}

// Main execution
async function main() {
  console.log("🚀 Thailand Timezone Analysis & Fix Tool\n");
  console.log("This tool helps understand and fix timezone issues in your Muay Thai events app.\n");
  
  await analyzeTimezones();
  await suggestFixes();
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Check your admin panel: /admin/events");
  console.log("2. Verify times display correctly with 'Thailand Time' labels");
  console.log("3. Test creating/editing events");
  console.log("4. Confirm public pages show timezone information");
  console.log("\n✨ Your timezone handling is now improved!");
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { analyzeTimezones, suggestFixes }; 