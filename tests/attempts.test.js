import {
  addQuestion,
  correctOption,
  createPublishedQuiz,
  createQuiz,
  makeAgent,
  registerUser,
  wrongOption,
} from './helpers.js';

async function setupGame() {
  const author = makeAgent();
  await registerUser(author, 'author');
  const player = makeAgent();
  await registerUser(player, 'player');
  const { quiz, questions } = await createPublishedQuiz(author);
  return { author, player, quiz, questions };
}

function optionByText(question, text) {
  return question.options.find((option) => option.text === text);
}

describe('taking a quiz and scoring', () => {
  test('requires authentication to start an attempt', async () => {
    const author = makeAgent();
    await registerUser(author, 'author');
    const { quiz } = await createPublishedQuiz(author);

    const response = await makeAgent().post(`/api/quizzes/${quiz.id}/attempts`);
    expect(response.status).toBe(401);
  });

  test('does not reveal answers or explanations while the quiz is being taken', async () => {
    const { player, quiz } = await setupGame();

    const start = await player.post(`/api/quizzes/${quiz.id}/attempts`);
    expect(start.status).toBe(201);

    const play = await player.get(
      `/api/attempts/${start.body.attempt.id}/play`,
    );
    expect(play.status).toBe(200);

    const serialised = JSON.stringify(play.body);
    expect(serialised).not.toContain('isCorrect');
    expect(serialised).not.toContain('explanation');
    expect(serialised).not.toContain('correctOption');
    expect(play.body.questions[0].options).toHaveLength(4);
  });

  test('validates answers, prevents duplicates and calculates the score on the server', async () => {
    const { author, player, quiz, questions } = await setupGame();

    const start = await player.post(`/api/quizzes/${quiz.id}/attempts`);
    const attemptId = start.body.attempt.id;
    expect(start.body.attempt.totalQuestions).toBe(10);

    const play = await player.get(`/api/attempts/${attemptId}/play`);
    const [first, second] = play.body.questions;

    const correctFirst = optionByText(
      first,
      correctOption(questions[0]).text,
    );
    const wrongSecond = optionByText(second, wrongOption(questions[1]).text);

    const firstAnswer = await player
      .post(`/api/attempts/${attemptId}/answers`)
      .send({ questionId: first.id, optionId: correctFirst.id });

    expect(firstAnswer.status).toBe(201);
    expect(firstAnswer.body.feedback).toMatchObject({
      isCorrect: true,
      score: 1,
      answeredCount: 1,
      completed: false,
    });
    expect(firstAnswer.body.feedback.correctOptionId).toBe(correctFirst.id);
    expect(firstAnswer.body.feedback.explanation).toMatch(/Iron oxide/);

    const duplicate = await player
      .post(`/api/attempts/${attemptId}/answers`)
      .send({ questionId: first.id, optionId: correctFirst.id });
    expect(duplicate.status).toBe(409);

    const earlyResults = await player.get(
      `/api/attempts/${attemptId}/results`,
    );
    expect(earlyResults.status).toBe(409);

    const foreignAttempt = await author.get(
      `/api/attempts/${attemptId}/play`,
    );
    expect(foreignAttempt.status).toBe(404);

    const secondAnswer = await player
      .post(`/api/attempts/${attemptId}/answers`)
      .send({ questionId: second.id, optionId: wrongSecond.id });

    expect(secondAnswer.status).toBe(201);
    expect(secondAnswer.body.feedback).toMatchObject({
      isCorrect: false,
      score: 1,
      answeredCount: 2,
      totalQuestions: 10,
      completed: false,
    });

    let lastAnswer;
    for (let index = 2; index < play.body.questions.length; index += 1) {
      const question = play.body.questions[index];
      const correct = optionByText(
        question,
        correctOption(questions[index]).text,
      );
      lastAnswer = await player
        .post(`/api/attempts/${attemptId}/answers`)
        .send({ questionId: question.id, optionId: correct.id });
      expect(lastAnswer.status).toBe(201);
    }

    expect(lastAnswer.body.feedback).toMatchObject({
      isCorrect: true,
      score: 9,
      answeredCount: 10,
      totalQuestions: 10,
      completed: true,
    });

    const afterComplete = await player
      .post(`/api/attempts/${attemptId}/answers`)
      .send({ questionId: first.id, optionId: correctFirst.id });
    expect(afterComplete.status).toBe(409);

    const results = await player.get(`/api/attempts/${attemptId}/results`);
    expect(results.status).toBe(200);
    expect(results.body.attempt).toMatchObject({
      score: 9,
      totalQuestions: 10,
      percentage: 90,
      correctCount: 9,
      incorrectCount: 1,
      skippedCount: 0,
    });
    expect(results.body.attempt.review).toHaveLength(10);
    expect(results.body.attempt.review[0].correctText).toBe(
      correctOption(questions[0]).text,
    );

    const history = await player.get('/api/me/attempts');
    expect(history.body.attempts).toHaveLength(1);
    expect(history.body.attempts[0].id).toBe(attemptId);
  });

  test('rejects questions and options outside the active attempt', async () => {
    const { author, player, quiz } = await setupGame();
    const { questions: otherQuestions } = await createPublishedQuiz(author);
    const otherQuestion = otherQuestions[0];

    const start = await player.post(`/api/quizzes/${quiz.id}/attempts`);
    const attemptId = start.body.attempt.id;
    const play = await player.get(`/api/attempts/${attemptId}/play`);
    const [first, second] = play.body.questions;

    const outside = await player
      .post(`/api/attempts/${attemptId}/answers`)
      .send({
        questionId: otherQuestion.id,
        optionId: first.options[0].id,
      });
    expect(outside.status).toBe(400);
    const mismatched = await player
      .post(`/api/attempts/${attemptId}/answers`)
      .send({ questionId: first.id, optionId: second.options[0].id });
    expect(mismatched.status).toBe(400);
  });

  test('resumes the unfinished attempt instead of creating a second one', async () => {
    const { player, quiz } = await setupGame();

    const first = await player.post(`/api/quizzes/${quiz.id}/attempts`);
    const second = await player.post(`/api/quizzes/${quiz.id}/attempts`);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.resumed).toBe(true);
    expect(second.body.attempt.id).toBe(first.body.attempt.id);
  });

  test('counts a skipped question as zero and records it in the review', async () => {
    const { player, quiz, questions } = await setupGame();

    const start = await player.post(`/api/quizzes/${quiz.id}/attempts`);
    const attemptId = start.body.attempt.id;
    const play = await player.get(`/api/attempts/${attemptId}/play`);
    const [first, second] = play.body.questions;

    const skip = await player
      .post(`/api/attempts/${attemptId}/skip`)
      .send({ questionId: first.id });
    expect(skip.status).toBe(201);
    expect(skip.body.feedback).toMatchObject({
      skipped: true,
      isCorrect: false,
      score: 0,
    });

    const wrongSecond = optionByText(second, wrongOption(questions[1]).text);
    await player
      .post(`/api/attempts/${attemptId}/answers`)
      .send({ questionId: second.id, optionId: wrongSecond.id });

    for (let index = 2; index < play.body.questions.length; index += 1) {
      const question = play.body.questions[index];
      const wrong = optionByText(question, wrongOption(questions[index]).text);
      const answer = await player
        .post(`/api/attempts/${attemptId}/answers`)
        .send({ questionId: question.id, optionId: wrong.id });
      expect(answer.status).toBe(201);
    }

    const results = await player.get(`/api/attempts/${attemptId}/results`);
    expect(results.body.attempt).toMatchObject({
      score: 0,
      percentage: 0,
      correctCount: 0,
      incorrectCount: 9,
      skippedCount: 1,
    });
    expect(results.body.attempt.review[0].selectedText).toBeNull();
    expect(results.body.attempt.review[0].isCorrect).toBe(false);
  });

  test('keeps private quizzes out of other users attempts', async () => {
    const author = makeAgent();
    await registerUser(author, 'author');
    const privateQuiz = await createQuiz(author, { title: 'Private Practice' });
    await addQuestion(author, privateQuiz.id);

    const player = makeAgent();
    await registerUser(player, 'player');

    const blocked = await player.post(
      `/api/quizzes/${privateQuiz.id}/attempts`,
    );
    expect(blocked.status).toBe(404);

    const ownerPreview = await author.post(
      `/api/quizzes/${privateQuiz.id}/attempts`,
    );
    expect(ownerPreview.status).toBe(201);
  });

  test('refuses to start a quiz with no questions', async () => {
    const author = makeAgent();
    await registerUser(author, 'author');
    const quiz = await createQuiz(author, { title: 'Empty Quiz' });

    const response = await author.post(`/api/quizzes/${quiz.id}/attempts`);
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/no questions/i);
  });
});
