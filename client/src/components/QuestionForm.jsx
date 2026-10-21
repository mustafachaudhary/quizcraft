import { useState } from 'react';

function emptyOptions() {
  return [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ];
}

export function QuestionForm({ initialQuestion, onSave, onCancel, saving, error }) {
  const [text, setText] = useState(initialQuestion?.text || '');
  const [explanation, setExplanation] = useState(
    initialQuestion?.explanation || '',
  );
  const [options, setOptions] = useState(() => {
    if (!initialQuestion) return emptyOptions();

    const existing = initialQuestion.options.map((option) => ({
      text: option.text,
      isCorrect: option.isCorrect,
    }));

    while (existing.length < 4) {
      existing.push({ text: '', isCorrect: false });
    }

    return existing;
  });
  const [localError, setLocalError] = useState('');

  function updateOption(index, changes) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...changes } : option,
      ),
    );
  }

  function markCorrect(index) {
    setOptions((current) =>
      current.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index,
      })),
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    setLocalError('');

    if (text.trim().length < 5) {
      setLocalError('Write a question of at least 5 characters.');
      return;
    }

    if (options.some((option) => !option.text.trim())) {
      setLocalError('Fill in all four answers.');
      return;
    }

    if (options.filter((option) => option.isCorrect).length !== 1) {
      setLocalError('Mark exactly one answer as correct.');
      return;
    }

    onSave({
      text: text.trim(),
      explanation: explanation.trim(),
      options: options.map((option) => ({
        text: option.text.trim(),
        isCorrect: option.isCorrect,
      })),
    });
  }

  const fields = error?.fields || {};

  return (
    <form className="question-form well" onSubmit={handleSubmit}>
      <div className="question-form__head">
        <h3>{initialQuestion ? 'Edit question' : 'Add a question'}</h3>
        <button
          type="button"
          className="button button--quiet button--small"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

      {localError ? (
        <p className="form-alert" role="alert">
          {localError}
        </p>
      ) : null}

      {error && !error.fields ? (
        <p className="form-alert" role="alert">
          {error.message}
        </p>
      ) : null}

      <label className="field">
        <span className="field__label">Question</span>
        <textarea
          className="field__input"
          rows="3"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask something worth answering."
          autoFocus
          aria-invalid={Boolean(fields.text)}
        />
        {fields.text ? <span className="field__error">{fields.text}</span> : null}
      </label>

      <fieldset className="option-editor">
        <legend className="field__label">Four answers, one correct</legend>

        {options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);

          return (
            <div className="option-editor__row" key={letter}>
              <span className="option-editor__letter" aria-hidden="true">
                {letter}
              </span>
              <label className="field option-editor__field">
                <span className="visually-hidden">Answer {letter}</span>
                <input
                  className="field__input"
                  value={option.text}
                  onChange={(event) =>
                    updateOption(index, { text: event.target.value })
                  }
                  placeholder={`Answer ${letter}`}
                />
              </label>
              <label className="option-editor__correct">
                <input
                  type="radio"
                  name="correct-option"
                  checked={option.isCorrect}
                  onChange={() => markCorrect(index)}
                  aria-label={`Mark answer ${letter} as correct`}
                />
                <span>Correct</span>
              </label>
            </div>
          );
        })}

        {fields.options || fields.correct ? (
          <p className="field__error">
            {fields.options || fields.correct}
          </p>
        ) : null}
      </fieldset>

      <label className="field">
        <span className="field__label">
          Explanation <span className="field__optional">optional</span>
        </span>
        <textarea
          className="field__input"
          rows="2"
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
          placeholder="Say why the answer is right."
          aria-invalid={Boolean(fields.explanation)}
        />
        {fields.explanation ? (
          <span className="field__error">{fields.explanation}</span>
        ) : null}
      </label>

      <div className="question-form__actions">
        <button type="submit" className="button" disabled={saving}>
          {saving
            ? 'Saving'
            : initialQuestion
              ? 'Save changes'
              : 'Add question'}
        </button>
      </div>
    </form>
  );
}
