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

function parseResearchFile(filePath: string): ResearchEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries: ResearchEntry[] = [];
  
  const sections = content.split(/\n## \d+\./);
  
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i].trim();
    const lines = section.split('\n');
    
    let title = lines[0].trim();
    let description = '';
    let year = '';
    let authors = '';
    let institution = '';
    let mission = '';
    let osdStudyNumber = '';
    let tags: string[] = [];
    let nasaOsdrLinks: string[] = [];
    
    for (let j = 1; j < lines.length; j++) {
      const line = lines[j].trim();
      
      if (line.startsWith('**Description**:')) {
        description = line.replace('**Description**:', '').trim();
      } else if (line.startsWith('**Year**:')) {
        year = line.replace('**Year**:', '').trim();
      } else if (line.startsWith('**Authors/Scientists**:') || line.startsWith('**Authors**:')) {
        authors = line.replace('**Authors/Scientists**:', '').replace('**Authors**:', '').trim();
      } else if (line.startsWith('**Institution**:')) {
        institution = line.replace('**Institution**:', '').trim();
      } else if (line.startsWith('**Mission**:')) {
        mission = line.replace('**Mission**:', '').trim();
      } else if (line.startsWith('**OSD number**:') || line.startsWith('**OSD Number**:')) {
        osdStudyNumber = line.replace('**OSD number**:', '').replace('**OSD Number**:', '').trim();
      } else if (line.startsWith('**Tags**:')) {
        const tagString = line.replace('**Tags**:', '').trim();
        tags = tagString.split(',').map(t => t.trim()).filter(t => t.length > 0);
      } else if (line.startsWith('**OSD link**:') || line.startsWith('**OSD Link**:')) {
        const link = line.replace('**OSD link**:', '').replace('**OSD Link**:', '').trim();
        if (link) nasaOsdrLinks.push(link);
      }
    }
    
    // Add mission to tags if it exists and is not "N/A"
    if (mission && !mission.includes('N/A') && !mission.includes('Ground-based')) {
      const missionTag = mission.replace(/\(.*?\)/g, '').trim();
      if (missionTag && !tags.includes(missionTag)) {
        tags.push(missionTag);
      }
    }
    
    entries.push({
      title,
      description,
      year,
      authors,
      institution,
      mission,
      osdStudyNumber,
      tags,
      nasaOsdrLinks,
      published: true
    });
  }
  
  return entries;
}

async function importResearch() {
  const cellBiologyPath = path.join(process.cwd(), 'cellbiology.txt');
  const geneticsPath = path.join(process.cwd(), 'genetics.txt');
  
  const cellBiologyEntries = parseResearchFile(cellBiologyPath);
  const geneticsEntries = parseResearchFile(geneticsPath);
  
  const allEntries = [...cellBiologyEntries, ...geneticsEntries];
  
  console.log(`Found ${allEntries.length} research entries to import`);
  
  // Output as JSON for import
  fs.writeFileSync(
    path.join(process.cwd(), 'research-import.json'),
    JSON.stringify(allEntries, null, 2)
  );
  
  console.log('Research data exported to research-import.json');
  console.log('\nSample entry:');
  console.log(JSON.stringify(allEntries[0], null, 2));
}

importResearch().catch(console.error);
