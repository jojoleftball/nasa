import * as fs from 'fs';
import * as path from 'path';

interface ResearchEntry {
  title: string;
  description: string;
  year?: string;
  authors?: string;
  institution?: string;
  mission?: string;
  osdStudyNumber?: string;
  tags: string[];
  nasaOsdrLinks: string[];
  published: boolean;
}

async function importToAdmin() {
  const researchData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'research-import.json'), 'utf-8')
  ) as ResearchEntry[];

  console.log(`Importing ${researchData.length} research entries...`);

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
    console.error(await loginResponse.text());
    process.exit(1);
  }

  const cookies = loginResponse.headers.get('set-cookie');
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < researchData.length; i++) {
    const entry = researchData[i];
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        },
        body: JSON.stringify(entry),
        credentials: 'include'
      });

      if (response.ok) {
        successCount++;
        console.log(`✓ [${i + 1}/${researchData.length}] Imported: ${entry.title.substring(0, 60)}...`);
      } else {
        errorCount++;
        const error = await response.text();
        console.error(`✗ [${i + 1}/${researchData.length}] Failed: ${entry.title.substring(0, 60)}...`);
        console.error(`  Error: ${error}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`✗ [${i + 1}/${researchData.length}] Exception: ${error}`);
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${researchData.length}`);
}

importToAdmin().catch(console.error);
