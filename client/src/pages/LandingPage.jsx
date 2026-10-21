import { Link } from 'react-router-dom';
import { SampleQuestion } from '../components/SampleQuestion.jsx';
import { QuizRow } from '../components/QuizRow.jsx';
import { LoadingBlock, ErrorNotice, EmptyState } from '../components/PageState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi, useDocumentTitle } from '../hooks.js';
import { pluralise } from '../constants.js';

const STEPS = [
  {
    title: 'Write the questions',
    body: 'Four answers each, one marked correct. Add a short explanation when the answer deserves one.',
  },
  {
    title: 'Publish, or keep it private',
    body: 'A draft belongs to you. Ten questions and it can join the public shelf, where anyone can find it.',
  },
  {
    title: 'Take it one question at a time',
    body: 'The server checks each answer as it arrives. The score is the same for everyone who takes it.',
  },
];

export function LandingPage() {
  useDocumentTitle('Make a quiz');
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi('/quizzes');
  const quizzes = data?.quizzes ?? [];
  const recent = quizzes.slice(0, 5);

  return (
    <>
      <section className="landing-hero">
        <div className="container">
          <div className="landing-hero__intro">
            <h1>
              <span className="hero-copy__line">Write a question.</span>
              <span className="hero-copy__line">Find out who knows.</span>
            </h1>
          </div>

          <div className="landing-hero__grid">
            <div className="hero-copy">
              <p className="hero-copy__lede">
                Four answers, one right answer, and a score the server keeps.
              </p>
              <div className="hero-actions">
                <Link className="button button--large" to="/discover">
                  Take a quiz
                </Link>
                <Link
                  className="link-bar"
                  to={user ? '/quizzes/new' : '/register'}
                >
                  {user ? 'Build another quiz' : 'Build your own'}
                </Link>
              </div>
            </div>

            <figure className="slip">
              <SampleQuestion />
              <figcaption className="slip__caption">
                A question from Everyday Science, one of the public quizzes.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="container steps-section" aria-labelledby="steps-title">
        <div className="steps-section__intro">
          <h2 id="steps-title">
            Three moves,
            <br />
            one score.
          </h2>
          <p>
            No timers, no team spreadsheets. A quiz is a small, fair test with a
            clear result at the end.
          </p>
        </div>

        <ol className="steps">
          {STEPS.map((step) => (
            <li className="step" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="statement" aria-labelledby="statement-title">
        <div className="container statement__inner">
          <div>
            <h2 id="statement-title">The server keeps score.</h2>
            <p>
              The browser shows one question at a time. Answers are checked and
              counted on the back end, so the score is the same on a laptop or a
              phone.
            </p>
          </div>
          <Link className="button button--paper" to="/discover">
            Find one to take
          </Link>
        </div>
      </section>

      <section className="container shelf" aria-labelledby="shelf-title">
        <div className="section-head">
          <div>
            <h2 id="shelf-title">On the shelf</h2>
            <p>
              {loading
                ? 'Collecting the public quizzes.'
                : `${pluralise(quizzes.length, 'public quiz', 'public quizzes')}, each one ready to take.`}
            </p>
          </div>
          <Link className="link-bar" to="/discover">
            Browse all quizzes
          </Link>
        </div>

        {loading ? <LoadingBlock rows={5} label="Loading quizzes" /> : null}

        {error && !loading ? (
          <ErrorNotice
            title="The shelf did not load."
            message={error.message}
            onRetry={reload}
          />
        ) : null}

        {!loading && !error && recent.length === 0 ? (
          <EmptyState
            title="Nothing on the shelf yet."
            action={
              <Link className="button" to={user ? '/quizzes/new' : '/register'}>
                Write the first quiz
              </Link>
            }
          >
            <p>Public quizzes appear here as soon as someone publishes one.</p>
          </EmptyState>
        ) : null}

        {recent.length > 0 ? (
          <ul className="quiz-list">
            {recent.map((quiz) => (
              <QuizRow quiz={quiz} key={quiz.id} />
            ))}
          </ul>
        ) : null}
      </section>

      <section className="closing">
        <div className="container closing__inner">
          <div>
            <h2>Your turn.</h2>
            <p>
              Start with one question. Add nine more, publish when it is ready,
              or keep it on your desk until it is.
            </p>
          </div>
          <div className="closing__actions">
            <Link className="button button--large" to={user ? '/quizzes/new' : '/register'}>
              {user ? 'Create a quiz' : 'Make an account'}
            </Link>
            <Link className="closing__quiet" to="/discover">
              Take someone else’s first
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
