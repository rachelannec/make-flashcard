import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { extractTextFromFile } from './service/fileProcessService' 
import { generateFlashcards } from './service/geminiService'
import './App.css'

// npm install pdf-parse mammoth file-saver react-dropzone
// npm install @types/file-saver --save-dev

interface Flashcard {
  id: string
  question: string
  answer: string
}

function App() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isProcessing,setIsProcessing] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop =useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const file=acceptedFiles[0];
      console.log('Processing file: ', file.name);

      // extract text frim the file
      const text = await extractTextFromFile(file);
      console.log('Extracted text length:', text.length);

      // generate cards using gemini
      const generatedFlashcards = await generateFlashcards(text);
      console.log('Generated flashcards:', generatedFlashcards);

      setFlashcards(generatedFlashcards);
      setCurrentCard(0);
      setShowAnswer(false);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process file. Try again.');
    } finally{
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }, 
    maxFiles: 1
  });

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setShowAnswer(false);
  };



  return(
    <div className='App'>
      <header className="app-header">
        <h1>📚 Flashcard Generator</h1>
        <p>Upload you files and generate flashcard for active recall!</p>
      </header>

      <main>
        {flashcards.length === 0 ? (
            <div className="upload-section">
              <h2>Upload Your Files</h2>
              <p>Suppoted formats: PDF, DOCX</p>
              
              <div {...getRootProps()} className={`upload-area ${isDragActive ? 'drag-active' : ''}`}>
                <input {...getInputProps()} />
                {isProcessing ? (
                  <div className="processing">
                    <p>🔄 Processing your file...</p>
                    <p>Generating flashcards with AI...</p>
                  </div>
                ) : (
                  <p>
                    {isDragActive 
                      ? 'Drop the file here...' 
                      : 'Drag and drop a file here, or click to browse'}
                  </p>
                )}
              </div>
              {error && (
                <div className="error-message">
                  <p>❌ {error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flashcard-section">
              <div className="flashcard-counter">
                Card {currentCard+1} of {flashcards.length}
              </div>
              <div className="flashcard">
                <div className="card-content">
                  <h3>Question:</h3>
                  <p>{flashcards[currentCard].question}</p>

                  {showAnswer && (
                    <>
                      <h3>Answer:</h3>
                      <p>{flashcards[currentCard].answer}</p>
                    </>
                  )}
                </div>

                <div className="card-action">
                  <button onClick={() => setShowAnswer(!showAnswer)}>
                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                  </button>

                  <div className="navigation">
                    <button onClick={prevCard}>Previous</button>
                    <button onClick={nextCard}>Next</button>
                  </div>

                  <button onClick={() => {
                    setFlashcards([]);
                    setCurrentCard(0);
                    setShowAnswer(false);
                    setError(null);
                  }}>Upload New File</button>
                </div>
              </div>
            </div>
          )
        }
      </main>

    </div>
  )
}

export default App
