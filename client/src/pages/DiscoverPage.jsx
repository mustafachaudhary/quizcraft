import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QuizRow } from '../components/QuizRow.jsx';
import { LoadingBlock, ErrorNotice, EmptyState } from '../components/PageState.jsx';
import { useApi, useDocumentTitle } from '../hooks.js';
import { CATEGORIES, DIFFICULTIES, difficultyLabel } from '../constants.js';

export function DiscoverPage() {
  useDocumentTitle('Discover');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const difficulty = params.get('difficulty') || '';
  const [search, setSearch] = useState(q);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  if (difficulty) query.set('difficulty', difficulty);
  const suffix = query.toString();
  const { data, loading, error, reload } = useApi(
    `/quizzes${suffix ? `?${suffix}` : ''}`,
  );
  const quizzes = data?.quizzes ?? [];
  const hasFilters = Boolean(q || category || difficulty);

  function apply(next) {
    const updated = new URLSearchParams();
    if (next.q) updated.set('q', next.q);
    if (next.category) updated.set('category', next.category);
    if (next.difficulty) updated.set('difficulty', next.difficulty);
    setParams(updated, { replace: true });
  }

  function handleSubmit(event) {
    event.preventDefault();
    apply({ q: search.trim(), category, difficulty });
  }

  function clearFilters() {
    setSearch('');
    setParams(new URLSearchParams(), { replace: true });
  }

  return (
    <div className="container page">
      <header className="page-head page-head--plain">
        <div>
          <h1>Find a quiz.</h1>
          <p className="page-head__lede">
            Public quizzes from people with a question and some time to spare.
          </p>
        </div>
      </header>

      <form className="filter-bar" onSubmit={handleSubmit} role="search">
        <label className="filter-bar__search">
          <span className="field__label">Search by title</span>
          <input
            className="field__input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Sea, science, 1969"
          />
        </label>

        <label className="filter-bar__field">
          <span className="field__label">Category</span>
          <select
            className="field__input"
            value={category}
            onChange={(event) =>
              apply({
                q: search.trim(),
                category: event.target.value,
                difficulty,
              })
            }
          >
            <option value="">All categories</option>
            {CATEGORIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-bar__field">
          <span className="field__label">Difficulty</span>
          <select
            className="field__input"
            value={difficulty}
            onChange={(event) =>
              apply({
                q: search.trim(),
                category,
                difficulty: event.target.value,
              })
            }
          >
            <option value="">Any difficulty</option>
            {DIFFICULTIES.map((name) => (
              <option key={name} value={name}>
                {difficultyLabel(name)}
              </option>
            ))}
          </select>
        </label>

        <div className="filter-bar__actions">
          <button className="button" type="submit">
            Search
          </button>
          {hasFilters ? (
            <button
              className="text-link text-link--small"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </form>

      <p className="result-line" role="status">
        {loading
          ? 'Looking through the shelf.'
          : `${quizzes.length} ${quizzes.length === 1 ? 'quiz' : 'quizzes'}${
              hasFilters ? ' matched' : ' on the public shelf'
            }.`}
      </p>

      {loading ? <LoadingBlock rows={6} label="Loading quizzes" /> : null}

      {error && !loading ? (
        <ErrorNotice
          title="The shelf did not load."
          message={error.message}
          onRetry={reload}
        />
      ) : null}

      {!loading && !error && quizzes.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'Nothing matches yet.' : 'The shelf is empty.'}
          action={
            hasFilters ? (
              <button className="button" type="button" onClick={clearFilters}>
                Clear the filters
              </button>
            ) : null
          }
        >
          <p>
            {hasFilters
              ? 'Try a wider search, a different category, or any difficulty.'
              : 'Public quizzes appear here as soon as someone publishes one.'}
          </p>
        </EmptyState>
      ) : null}

      {quizzes.length > 0 ? (
        <ul className="quiz-list quiz-list--shelf">
          {quizzes.map((quiz) => (
            <QuizRow quiz={quiz} key={quiz.id} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
