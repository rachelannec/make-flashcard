import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
// npm install pdfjs-dist

// set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export async function extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
        return await extractTextFromPDF(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await extractTextFromDOCX(file);
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
