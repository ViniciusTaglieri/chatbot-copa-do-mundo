interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Qual país tem mais títulos de Copa do Mundo?",
    options: ["Alemanha", "Brasil", "Itália", "Argentina"],
    correctAnswer: 1,
    explanation: "O Brasil é o maior campeão com 5 títulos (1958, 1962, 1970, 1994, 2002).",
  },
  {
    question: "Em que ano o Brasil sediou a Copa do Mundo pela última vez?",
    options: ["1950", "2014", "1978", "2006"],
    correctAnswer: 1,
    explanation: "O Brasil sediou a Copa em 2014, quando a Alemanha foi campeã.",
  },
  {
    question: "Qual jogador tem mais gols em Copas do Mundo?",
    options: ["Ronaldo Fenômeno", "Pelé", "Miroslav Klose", "Just Fontaine"],
    correctAnswer: 2,
    explanation: "Miroslav Klose tem 16 gols em Copas, seguido por Ronaldo com 15.",
  },
  {
    question: "Quantas Copas do Mundo já foram realizadas até 2022?",
    options: ["20", "22", "18", "25"],
    correctAnswer: 1,
    explanation: "A Copa de 2022 no Catar foi a 22ª edição do torneio.",
  },
  {
    question: "Qual seleção foi campeã da Copa de 1998?",
    options: ["Brasil", "França", "Itália", "Argentina"],
    correctAnswer: 1,
    explanation: "A França venceu o Brasil por 3 a 0 na final de 1998, em Paris.",
  },
]

let currentQuestionIndex = -1
let sessionQuestions: QuizQuestion[] = []

export function startQuiz(): { question: string; options: string[] } {
  sessionQuestions = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5)
  currentQuestionIndex = 0

  const q = sessionQuestions[0]
  return {
    question: q.question,
    options: q.options,
  }
}

export function answerQuiz(
  userAnswer: string
): { correct: boolean; explanation: string; finished: boolean; nextQuestion?: { question: string; options: string[] } } {
  const currentQuestion = sessionQuestions[currentQuestionIndex]
  if (!currentQuestion) {
    return { correct: false, explanation: "Quiz não iniciado.", finished: true }
  }

  const answerIndex = parseInt(userAnswer)
  const isCorrect = answerIndex === currentQuestion.correctAnswer

  currentQuestionIndex++

  if (currentQuestionIndex >= sessionQuestions.length) {
    sessionQuestions = []
    currentQuestionIndex = -1
    return {
      correct: isCorrect,
      explanation: currentQuestion.explanation,
      finished: true,
    }
  }

  const nextQ = sessionQuestions[currentQuestionIndex]
  return {
    correct: isCorrect,
    explanation: currentQuestion.explanation,
    finished: false,
    nextQuestion: {
      question: nextQ.question,
      options: nextQ.options,
    },
  }
}

export function isQuizActive(): boolean {
  return currentQuestionIndex >= 0 && currentQuestionIndex < sessionQuestions.length
}
