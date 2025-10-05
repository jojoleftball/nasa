import * as fs from 'fs';
import * as path from 'path';

async function deleteImportedEntries() {
  const baseUrl = 'http://localhost:5000';

  // Login as admin first
  const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'noone'
    }),
    credentials: 'include'
  });

  if (!loginResponse.ok) {
    console.error('Failed to login as admin');
    process.exit(1);
  }

  const cookies = loginResponse.headers.get('set-cookie');

  // Get all research entries
  const listResponse = await fetch(`${baseUrl}/api/admin/research`, {
    headers: {
      'Cookie': cookies || ''
    },
    credentials: 'include'
  });

  if (!listResponse.ok) {
    console.error('Failed to fetch research entries');
    process.exit(1);
  }

  const allEntries = await listResponse.json();
  console.log(`Total entries in database: ${allEntries.length}`);

  // Load the research-import.json to get titles we imported
  const importedData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'research-import.json'), 'utf-8')
  );
  const importedTitles = new Set(importedData.map((entry: any) => entry.title));

  console.log(`Imported titles to delete: ${importedTitles.size}`);

  // Find entries that match imported titles
  const entriesToDelete = allEntries.filter((entry: any) => 
    importedTitles.has(entry.title)
  );

  console.log(`Found ${entriesToDelete.length} entries to delete\n`);

  let deletedCount = 0;
  let errorCount = 0;

  for (const entry of entriesToDelete) {
    try {
      const response = await fetch(`${baseUrl}/api/admin/research/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Cookie': cookies || ''
        },
        credentials: 'include'
      });

      if (response.ok) {
        deletedCount++;
        console.log(`✓ Deleted: ${entry.title.substring(0, 60)}...`);
      } else {
        errorCount++;
        console.error(`✗ Failed to delete: ${entry.title.substring(0, 60)}...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`✗ Exception deleting: ${entry.title.substring(0, 60)}...`);
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n=== Deletion Complete ===`);
  console.log(`Deleted: ${deletedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${entriesToDelete.length}`);
}

deleteImportedEntries().catch(console.error);
