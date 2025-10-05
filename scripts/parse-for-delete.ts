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
      
      if (line.startsWith('**Description**:') || line.startsWith('Description:')) {
        description = line.replace('**Description**:', '').replace('Description:', '').trim();
      } else if (line.startsWith('**Year**:') || line.startsWith('Year:')) {
        year = line.replace('**Year**:', '').replace('Year:', '').trim();
      } else if (line.startsWith('**Authors/Scientists**:') || line.startsWith('**Authors**:') || line.startsWith('Authors/Scientists:') || line.startsWith('Authors:')) {
        authors = line.replace('**Authors/Scientists**:', '').replace('**Authors**:', '').replace('Authors/Scientists:', '').replace('Authors:', '').trim();
      } else if (line.startsWith('**Institution**:') || line.startsWith('Institution:')) {
        institution = line.replace('**Institution**:', '').replace('Institution:', '').trim();
      } else if (line.startsWith('**Mission**:') || line.startsWith('Mission:')) {
        mission = line.replace('**Mission**:', '').replace('Mission:', '').trim();
      } else if (line.startsWith('**OSD number**:') || line.startsWith('**OSD Number**:') || line.startsWith('OSD number:') || line.startsWith('OSD Number:')) {
        osdStudyNumber = line.replace('**OSD number**:', '').replace('**OSD Number**:', '').replace('OSD number:', '').replace('OSD Number:', '').trim();
      } else if (line.startsWith('**Tags**:') || line.startsWith('Tags:')) {
        const tagString = line.replace('**Tags**:', '').replace('Tags:', '').trim();
        tags = tagString.split(',').map(t => t.trim()).filter(t => t.length > 0);
      } else if (line.startsWith('**OSD link**:') || line.startsWith('**OSD Link**:') || line.startsWith('OSD link:') || line.startsWith('OSD Link:')) {
        const link = line.replace('**OSD link**:', '').replace('**OSD Link**:', '').replace('OSD link:', '').replace('OSD Link:', '').trim();
        if (link) nasaOsdrLinks.push(link);
      }
    }
    
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

function parseCompressedResearchFile(filePath: string): ResearchEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries: ResearchEntry[] = [];
  
  const sections = content.split(/\n\d+\.\s/);
  
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i].trim();
    
    const titleMatch = section.match(/^([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const descMatch = section.match(/Description:\s*([^Y]+?)(?:Year:|$)/);
    const description = descMatch ? descMatch[1].trim() : '';
    
    const yearMatch = section.match(/Year:\s*(\d{4})/);
    const year = yearMatch ? yearMatch[1] : '';
    
    const authorsMatch = section.match(/(?:Authors\/Scientists|Authors):\s*([^I]+?)(?:Institution:|$)/);
    const authors = authorsMatch ? authorsMatch[1].trim() : '';
    
    const institutionMatch = section.match(/Institution:\s*([^M]+?)(?:Mission:|$)/);
    const institution = institutionMatch ? institutionMatch[1].trim() : '';
    
    const missionMatch = section.match(/Mission:\s*([^O]+?)(?:OSD number:|$)/);
    const mission = missionMatch ? missionMatch[1].trim() : '';
    
    const osdMatch = section.match(/OSD number:\s*([^T]+?)(?:Tags:|$)/);
    const osdStudyNumber = osdMatch ? osdMatch[1].trim() : '';
    
    const tagsMatch = section.match(/Tags:\s*([^O]+?)(?:OSD link:|$)/);
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
    
    const linkMatch = section.match(/OSD link:\s*(https?:\/\/[^\s]+)/);
    const nasaOsdrLinks = linkMatch ? [linkMatch[1].trim()] : [];
    
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

async function parseForDelete() {
  const files = [
    { path: 'cellbiology.txt', parser: parseResearchFile },
    { path: 'molecular.txt', parser: parseCompressedResearchFile }
  ];
  
  const allEntries: ResearchEntry[] = [];
  
  for (const file of files) {
    const filePath = path.join(process.cwd(), file.path);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${file.path} not found, skipping...`);
      continue;
    }
    
    try {
      const entries = file.parser(filePath);
      allEntries.push(...entries);
      console.log(`✓ Parsed ${entries.length} entries from ${file.path}`);
    } catch (error) {
      console.error(`✗ Error parsing ${file.path}:`, error);
    }
  }
  
  console.log(`\nTotal: ${allEntries.length} research entries to delete`);
  
  fs.writeFileSync(
    path.join(process.cwd(), 'research-import.json'),
    JSON.stringify(allEntries, null, 2)
  );
  
  console.log('Research data exported to research-import.json for deletion');
}

parseForDelete().catch(console.error);
