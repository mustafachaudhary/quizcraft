import { useState } from 'react';
import { Icon } from './Icon.jsx';

const QUESTION = {
  text: 'Which sea has no coastline?',
  options: [
    'The Sargasso Sea',
    'The Dead Sea',
    'The Caspian Sea',
    'The Red Sea',
  ],
  correctIndex: 0,
  explanation:
    'The Sargasso Sea is bounded by ocean currents rather than land. The Dead Sea and the Caspian Sea are lakes.',
};

export function SampleQuestion() {
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;
  const isCorrect = selected === QUESTION.correctIndex;

  function choose(index) {
    if (answered) return;
    setSelected(index);
  }

  return (
    <section className="sample" aria-label="Sample quiz question">
      <h2 className="sample__question">{QUESTION.text}</h2>

      <div className="sample__options">
        {QUESTION.options.map((option, index) => {
          const correct = index === QUESTION.correctIndex;
          const chosen = index === selected;
          let stateClass = '';

          if (answered && correct) stateClass = ' is-correct';
          if (answered && chosen && !correct) stateClass = ' is-wrong';
          if (answered && !chosen && !correct) stateClass = ' is-muted';

          return (
            <button
              type="button"
              className={`sample-option${stateClass}`}
              key={option}
              onClick={() => choose(index)}
              disabled={answered}
              aria-pressed={chosen}
            >
              <span className="sample-option__letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="sample-option__text">{option}</span>
              {answered && correct ? (
                <span className="sample-option__state">
                  <Icon name="check" size={16} />
                  Correct
                </span>
              ) : null}
              {answered && chosen && !correct ? (
                <span className="sample-option__state">
                  <Icon name="x" size={16} />
                  Your answer
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="sample__feedback" aria-live="polite">
        {answered ? (
          <>
            <p className="sample__verdict">
              {isCorrect ? 'Correct.' : 'Not quite.'}{' '}
              <span>{QUESTION.explanation}</span>
            </p>
            <button
              type="button"
              className="text-link sample__again"
              onClick={() => setSelected(null)}
            >
              Try it again
            </button>
          </>
        ) : (
          <p className="sample__hint">Pick an answer. No account needed.</p>
        )}
      </div>
    </section>
  );
}
