import { useState } from 'react'
import './App.css'

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
              <p>Suppoted formats: PDF, DOCX, PPTX</p>
              <div className="upload-area">
                <p>Drag and drop the file here or click to browse</p>
              </div>
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
                    {showAnswer ? 'Hide Answer' : 'SHow Answer'}
                  </button>
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
