import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import JSZip from 'jszip';
// npm install pdfjs-dist@3.11.174 - for pdf (the cdn did not work so...)
// npm install mammoth - for docx
// npm install pizzip jszip 

// set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export async function extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await extractTextFromDOCX(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || fileName.endsWith('.pptx')) {
      return await extractTextFromPPTX(file);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await extractTextFromTXT(file); 
    } else if (fileType.startsWith('text/') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
      return await extractTextFromTXT(file);
    } else {
      throw new Error(`Unsupported file format: ${fileType}`);
    }
}



async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('🔄 Starting PDF text extraction...');
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true 
    });
    
    const pdf = await loadingTask.promise;
    console.log(`📄 PDF loaded with ${pdf.numPages} pages`);
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`📖 Processing page ${i}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
      fullText += pageText + '\n';
    }
    
    console.log(`✅ Extracted ${fullText.length} characters from PDF`);
    return fullText.trim();
  } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
  }
  
}

async function extractTextFromDOCX(file: File): Promise<string> {
  try{
    console.log('🔄 Starting DOCX text extraction...');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    console.log(`✅ Extracted ${result.value.length} characters from DOCX`);
    return result.value.trim();
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

async function extractTextFromPPTX(file: File): Promise<string>{
  try {
    console.log('🔄 Starting PPTX text extraction...');
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
  

    let fullText = '';
    let slideCount =0;

    // extract text from slides
    for(const filename in zip.files) {
      if (filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')) {
        slideCount++;
        const slideXml = await zip.files[filename].async('text');
        const slideText= extractTextFromXML(slideXml);
        if (slideText.trim()){
          fullText += `\n=== Slide ${slideCount} ===\n${slideText}`;
        }
      }
    }

    // extract from notes
    for (const filename in zip.files){
      if(filename.startsWith('ppt/notesSlides/notesSlide') && filename.endsWith('.xml')){
        const noteXml = await zip.files[filename].async('text');
        const noteText = extractTextFromXML(noteXml);
        if(noteText.trim()){
          fullText += `\n=== Notes for Slide ${slideCount} ===\n${noteText}`;
        }
      }
    }

    console.log(`✅ Extracted ${fullText.length} characters from PPTX with ${slideCount} slides`);
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PPTX:', error);
    throw new Error('Failed to extract text from PPTX');

  }
}

async function extractTextFromTXT(file: File): Promise<string>{
  try {
    console.log('🔄 Starting TXT text extraction...');
    const text = await file.text();
    console.log(`✅ Extracted ${text.length} characters from TXT`);
    return text.trim();
  } catch (error) {
    console.error('Error extracting text from TXT:', error);
    throw new Error('Failed to extract text from TXT');
  }
}

// helper function
function extractTextFromXML(xmlString: string): string {
  // remove xml tags and extract text content
  const textRegex = /<a:t[^>]*>(.*?)<\/a:t>/g;
  const matches =[];
  let match;

  while ((match = textRegex.exec(xmlString)) !== null){
    matches.push(match[1]);
  }

  return matches.join(' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}