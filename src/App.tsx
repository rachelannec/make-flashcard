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
  difficulty?: 'easy' | 'medium' | 'hard' | null
  reviewCount: number
  lastReviewed?: Date
  masteryLevel: number // 0-100, where 100 is mastered
}

interface StudyStats{
  totalCards: number
  easyCards: number
  mediumCards: number
  hardCards: number
  masteredCards: number
  studyStreak: number
}

function App() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isProcessing,setIsProcessing] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studyMode, setStudyMode] = useState<'all' | 'difficult' | 'review'>('all')
  const [stats, setStats] = useState<StudyStats>({
    totalCards: 0,
    easyCards: 0,
    mediumCards: 0,
    hardCards: 0,
    masteredCards: 0,
    studyStreak: 0
  });

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

      // add default difficulty props
      const enhancedFlashcards: Flashcard[] = generatedFlashcards.map(card => ({
        ...card,
        difficulty: null,
        reviewCount: 0,
        masteryLevel: 0
      }));

      setFlashcards(enhancedFlashcards);
      setCurrentCard(0);
      setShowAnswer(false);
      updateStats(enhancedFlashcards);
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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'text/markdown': ['.md']
    }, 
    maxFiles: 1
  });

  // difficulty rating
  const rateDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
    const updatedCards = [...flashcards];
    const card= updatedCards[currentCard];

    card.difficulty = difficulty;
    card.reviewCount += 1;
    card.lastReviewed = new Date();

    // update mastery level based on difficulty
    switch (difficulty) {
      case 'easy':
        card.masteryLevel = Math.min(100, card.masteryLevel + 20);
        break;
      case 'medium':
        card.masteryLevel = Math.min(100, card.masteryLevel + 10);
        break;
      case 'hard':
        card.masteryLevel = Math.max(0, card.masteryLevel - 5);
        break;
    }

    setFlashcards(updatedCards);
    updateStats(updatedCards);

    setTimeout(() => {
      nextCard();
    }, 1000);
  }

  const updateStats = (cards: Flashcard[]) => {
    const newStats: StudyStats = {
      totalCards: cards.length,
      easyCards: cards.filter(c => c.difficulty === 'easy').length,
      mediumCards: cards.filter(c => c.difficulty === 'medium').length,
      hardCards: cards.filter(c => c.difficulty === 'hard').length,
      masteredCards: cards.filter(c => c.masteryLevel >= 80).length,
      studyStreak: 0 // We'll implement this later
    };
    setStats(newStats);
  };

  const getFilteredCards = () => {
    switch (studyMode) {
      case 'difficult':
        return flashcards.filter(card => card.difficulty === 'hard' || card.masteryLevel < 50);
      case 'review':
        return flashcards.filter(card => card.reviewCount > 0 && card.masteryLevel < 80);
      default:
        return flashcards;
    }
  };

  const filteredCards = getFilteredCards();
  const currentFilteredCard = filteredCards[currentCard];


  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % filteredCards.length);
    setShowAnswer(false);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    setShowAnswer(false);
  };



  return(
    <div className='App'>
      <header className="app-header">
        <div className="title-header">
          <img src="/logo.png" alt="Flashcard Logo" />
          <h1>Flashcard Generator</h1>
        </div>
        <p>Upload you files and generate flashcard for active recall!</p>
        
      </header>

      <main>
        {flashcards.length === 0 ? (
            <div className="upload-section">
              <h2>Upload Your Files</h2>
              <p>Supported formats: PDF, DOCX, PPTX, TXT, MD, CSV</p>

              <div {...getRootProps()} className={`upload-area ${isDragActive ? 'drag-active' : ''}`}>
                <input {...getInputProps()} />
                {isProcessing ? (
                  <div className="processing">
                    <p>Processing your file...</p>
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
            <div className="study-container">
              

              {/* Flashcard Section */}
              <div className="flashcard-section">
                <div className="flashcard-counter">
                  Card {currentCard + 1} of {filteredCards.length}
                  {currentFilteredCard?.masteryLevel !== undefined && (
                    <div className="mastery-bar">
                      <div 
                        className="mastery-fill" 
                        style={{ width: `${currentFilteredCard.masteryLevel}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                <div className="flashcard">
                  <div className="card-content">
                    <h3>Question:</h3>
                    <p>{currentFilteredCard?.question}</p>
                    
                    {showAnswer && (
                      <>
                        <h3>Answer:</h3>
                        <strong>{currentFilteredCard?.answer}</strong>
                      </>
                    )}
                  </div>
                  
                  <div className="card-actions">
                    <button onClick={() => setShowAnswer(!showAnswer)}>
                      {showAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                    
                    {showAnswer && (
                      <div className="difficulty-rating">
                        <p>How difficult was this card?</p>
                        <div className="difficulty-buttons">
                          <button 
                            className="easy-btn"
                            onClick={() => rateDifficulty('easy')}
                          >
                            😊 Easy
                          </button>
                          <button 
                            className="medium-btn"
                            onClick={() => rateDifficulty('medium')}
                          >
                            🤔 Medium
                          </button>
                          <button 
                            className="hard-btn"
                            onClick={() => rateDifficulty('hard')}
                          >
                            😅 Hard
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="navigation">
                      <button onClick={prevCard}>← Previous</button>
                      <button onClick={nextCard}>Next →</button>
                    </div>
                    
                    <button onClick={() => {
                      setFlashcards([]);
                      setCurrentCard(0);
                      setShowAnswer(false);
                      setStudyMode('all');
                    }}>
                      Upload New File
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Study Stats Panel */}
              <div className="stats-panel">
                <h3>Study Stats</h3>
                <div className="stats-grid">
                  <span className="stat-number">{stats.totalCards}</span>
                  <span className="stat-label">Total Cards</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{stats.masteredCards}</span>
                  <span className="stat-label">Mastered</span>
                </div>
                <div className="stat-item easy">
                  <span className="stat-number">{stats.easyCards}</span>
                  <span className="stat-label">Easy</span>
                </div>
                <div className="stat-item medium">
                  <span className="stat-number">{stats.mediumCards}</span>
                  <span className="stat-label">Medium</span>
                </div>
                <div className="stat-item hard">
                  <span className="stat-number">{stats.hardCards}</span>
                  <span className="stat-label">Hard</span>
                </div>
              </div>
              
              {/* Study Mode Selector */}
              <div className="study-mode">
                <h4>Study Mode</h4>
                <div className="mode-buttons">
                  <button
                    className={studyMode === 'all' ? 'active' : ''}
                    onClick={() => {
                      setStudyMode('all');
                      setCurrentCard(0);
                    }}
                  >
                      All Cards
                    </button>
                    <button 
                    className={studyMode === 'difficult' ? 'active' : ''}
                    onClick={() => {
                      setStudyMode('difficult');
                      setCurrentCard(0);
                    }}
                  >
                    Difficult Only
                  </button>
                  <button 
                    className={studyMode === 'review' ? 'active' : ''}
                    onClick={() => {
                      setStudyMode('review');
                      setCurrentCard(0);
                    }}
                  >
                    Review Mode
                  </button>
                </div>
              </div>

              
          </div>

                  
            
          )
          
        }
        
      </main>
      
      <footer className="app-footer">
        <h6>AI can make mistake. Please check for accuracy</h6>
      </footer>
    </div>
  )
}

export default App
