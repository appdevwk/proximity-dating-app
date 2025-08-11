#!/usr/bin/env node

import { profileImportService } from '../src/lib/services/profile-import-service';

async function scrapeProfiles() {
  console.log('🕷️  Starting web scraping for public dating profiles...\n');

  try {
    // Scrape from public web sources
    console.log('📥 Scraping profiles from public web sources...');
    const result = await profileImportService.importFromPublicWeb();

    if (result.success && result.data) {
      console.log('✅ Web scraping completed successfully!\n');
      
      let totalScraped = 0;
      result.data.forEach((scrapeResult) => {
        console.log(`📊 ${scrapeResult.source}: ${scrapeResult.count} profiles scraped`);
        totalScraped += scrapeResult.count;
      });

      console.log(`\n🎉 Total profiles scraped: ${totalScraped}`);

      // Get final statistics
      console.log('\n📈 Fetching final statistics...');
      const stats = await profileImportService.getImportStats();
      
      if (stats.success && stats.data) {
        console.log('\n📊 Final Database Statistics:');
        console.log(`   Total Profiles: ${stats.data.totalProfiles}`);
        console.log(`   Verified Users: ${stats.data.verifiedUsers}`);
        console.log(`   External Profiles: ${stats.data.externalProfiles}`);
        console.log(`   Verification Rate: ${stats.data.verificationRate}%`);
      }

      console.log('\n✨ Web scraping complete! Your Proximity app now has profiles from public web sources.');
      console.log('\n🔗 You can now:');
      console.log('   - Access the main app at http://localhost:3000');
      console.log('   - Manage profiles at http://localhost:3000/admin');
      console.log('   - Users can now login by watching 2 ads');
      
    } else {
      console.error('❌ Web scraping failed:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during web scraping:', error);
    process.exit(1);
  }
}

// Run the web scraping
scrapeProfiles();