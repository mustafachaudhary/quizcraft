import { Link } from 'react-router-dom';
import { difficultyLabel, pluralise } from '../constants.js';
import { Tag } from './Tag.jsx';

export function QuizRow({ quiz, showAttempts = false }) {
  return (
    <li className="quiz-row">
      <div className="quiz-row__main">
        <Link className="quiz-row__title" to={`/quizzes/${quiz.id}`}>
          {quiz.title}
        </Link>
        {quiz.description ? (
          <p className="quiz-row__description">{quiz.description}</p>
        ) : null}
        <div className="quiz-row__meta">
          <Tag>{quiz.category}</Tag>
          <Tag tone="outline">{difficultyLabel(quiz.difficulty)}</Tag>
          <span>{pluralise(quiz.questionCount, 'question')}</span>
          <span>by {quiz.creatorUsername}</span>
          {showAttempts && quiz.attemptCount > 0 ? (
            <span>{pluralise(quiz.attemptCount, 'attempt')}</span>
          ) : null}
        </div>
      </div>

      <div className="quiz-row__side">
        <span className="quiz-row__count num">{quiz.questionCount}</span>
        <span className="quiz-row__count-label">questions</span>
        <Link className="text-link" to={`/quizzes/${quiz.id}`}>
          Take it
        </Link>
      </div>
    </li>
  );
}
