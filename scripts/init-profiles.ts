#!/usr/bin/env node

import { profileImportService } from '../src/lib/services/profile-import-service';

async function initializeProfiles() {
  console.log('🚀 Initializing Proximity app with real adult dating profiles...\n');

  try {
    // Import profiles from all sources
    console.log('📥 Importing profiles from multiple sources...');
    const result = await profileImportService.importFromAllSources();

    if (result.success && result.data) {
      console.log('✅ Profile import completed successfully!\n');
      
      let totalImported = 0;
      result.data.forEach((importResult) => {
        console.log(`📊 ${importResult.source}: ${importResult.count} profiles imported`);
        totalImported += importResult.count;
      });

      console.log(`\n🎉 Total profiles imported: ${totalImported}`);

      // Get final statistics
      console.log('\n📈 Fetching final statistics...');
      const stats = await profileImportService.getImportStats();
      
      if (stats.success && stats.data) {
        console.log('\n📊 Final Database Statistics:');
        console.log(`   Total Profiles: ${stats.data.totalProfiles}`);
        console.log(`   Verified Profiles: ${stats.data.verifiedProfiles}`);
        console.log(`   External Profiles: ${stats.data.externalProfiles}`);
        console.log(`   Data Sources: ${stats.data.sources}`);
        
        const verificationRate = Math.round((stats.data.verifiedProfiles / stats.data.totalProfiles) * 100);
        console.log(`   Verification Rate: ${verificationRate}%`);
      }

      console.log('\n✨ Initialization complete! Your Proximity app is now populated with real adult dating profiles.');
      console.log('\n🔗 You can now:');
      console.log('   - Access the main app at http://localhost:3000');
      console.log('   - Manage profiles at http://localhost:3000/admin');
      console.log('   - Users can now login by watching 2 ads');
      
    } else {
      console.error('❌ Profile import failed:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeProfiles();