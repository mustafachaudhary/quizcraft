import {
  addQuestion,
  addQuestions,
  createPublishedQuiz,
  createQuiz,
  makeAgent,
  publishQuiz,
  registerUser,
} from './helpers.js';

describe('quiz management and discovery', () => {
  test('creates a private draft and requires ten questions before publishing', async () => {
    const agent = makeAgent();
    await registerUser(agent);

    const quiz = await createQuiz(agent, { title: 'A Brand New Quiz' });
    expect(quiz.isPublic).toBe(false);

    const emptyPublish = await agent
      .patch(`/api/quizzes/${quiz.id}`)
      .send({ isPublic: true });

    expect(emptyPublish.status).toBe(400);
    expect(emptyPublish.body.fields.isPublic).toBeDefined();
    expect(emptyPublish.body.error).toMatch(/at least 10 questions/);

    await addQuestions(agent, quiz.id, 9);

    const shortPublish = await agent
      .patch(`/api/quizzes/${quiz.id}`)
      .send({ isPublic: true });

    expect(shortPublish.status).toBe(400);
    expect(shortPublish.body.fields.isPublic).toMatch(/1 more question/);

    const question = await addQuestion(agent, quiz.id);
    expect(question.text).toMatch(/Red Planet/);

    const published = await publishQuiz(agent, quiz);
    expect(published.isPublic).toBe(true);
  });

  test('shows correct answers only in the owner management response', async () => {
    const owner = makeAgent();
    await registerUser(owner, 'owner');
    const { quiz } = await createPublishedQuiz(owner);

    const publicDetail = await makeAgent().get(`/api/quizzes/${quiz.id}`);
    expect(publicDetail.status).toBe(200);
    expect(publicDetail.body.quiz.isOwner).toBe(false);
    expect(publicDetail.body.quiz.questions).toBeUndefined();

    const manage = await owner.get(`/api/quizzes/${quiz.id}/manage`);
    expect(manage.status).toBe(200);
    expect(manage.body.quiz.questions).toHaveLength(10);
    expect(manage.body.quiz.questions[0].options).toHaveLength(4);
    expect(
      manage.body.quiz.questions[0].options.filter((option) => option.isCorrect),
    ).toHaveLength(1);
  });

  test('keeps a public quiz at ten questions', async () => {
    const owner = makeAgent();
    await registerUser(owner, 'owner');
    const { quiz, questions } = await createPublishedQuiz(owner);

    const blocked = await owner.delete(
      `/api/quizzes/${quiz.id}/questions/${questions[0].id}`,
    );
    expect(blocked.status).toBe(400);
    expect(blocked.body.error).toMatch(/unpublish/i);

    const unpublish = await owner
      .patch(`/api/quizzes/${quiz.id}`)
      .send({ isPublic: false });
    expect(unpublish.status).toBe(200);

    const removed = await owner.delete(
      `/api/quizzes/${quiz.id}/questions/${questions[0].id}`,
    );
    expect(removed.status).toBe(204);
  });

  test('rejects changes from a user who does not own the quiz', async () => {
    const owner = makeAgent();
    await registerUser(owner, 'owner');
    const quiz = await createQuiz(owner);
    await addQuestion(owner, quiz.id);

    const other = makeAgent();
    await registerUser(other, 'other');

    const patch = await other
      .patch(`/api/quizzes/${quiz.id}`)
      .send({ title: 'Hijacked Quiz' });
    expect(patch.status).toBe(403);

    const remove = await other.delete(`/api/quizzes/${quiz.id}`);
    expect(remove.status).toBe(403);

    const add = await other
      .post(`/api/quizzes/${quiz.id}/questions`)
      .send({ text: 'x' });
    expect(add.status).toBe(403);

    const manage = await other.get(`/api/quizzes/${quiz.id}/manage`);
    expect(manage.status).toBe(403);
  });

  test('hides private quizzes from other users and from discovery', async () => {
    const owner = makeAgent();
    await registerUser(owner, 'owner');
    const quiz = await createQuiz(owner, { title: 'Secret Draft' });
    await addQuestions(owner, quiz.id, 10);

    const other = makeAgent();
    await registerUser(other, 'other');

    const otherDetail = await other.get(`/api/quizzes/${quiz.id}`);
    expect(otherDetail.status).toBe(404);

    const ownerDetail = await owner.get(`/api/quizzes/${quiz.id}`);
    expect(ownerDetail.status).toBe(200);
    expect(ownerDetail.body.quiz.isOwner).toBe(true);

    const list = await makeAgent().get('/api/quizzes');
    expect(list.body.quizzes.map((item) => item.id)).not.toContain(quiz.id);

    await publishQuiz(owner, quiz);
    const publicList = await makeAgent().get('/api/quizzes');
    expect(publicList.body.quizzes.map((item) => item.id)).toContain(quiz.id);
  });

  test('searches titles and filters by category and difficulty', async () => {
    const owner = makeAgent();
    await registerUser(owner, 'owner');

    const volcano = await createQuiz(owner, {
      title: 'Volcanoes of the Ring of Fire',
      category: 'Science',
      difficulty: 'hard',
    });
    await addQuestions(owner, volcano.id, 10);
    await publishQuiz(owner, volcano);

    const kings = await createQuiz(owner, {
      title: 'Kings and Queens',
      category: 'History',
      difficulty: 'easy',
    });
    await addQuestions(owner, kings.id, 10);
    await publishQuiz(owner, kings);

    const search = await makeAgent().get('/api/quizzes?q=volcano');
    expect(search.body.quizzes).toHaveLength(1);
    expect(search.body.quizzes[0].title).toMatch(/Volcanoes/);

    const history = await makeAgent().get('/api/quizzes?category=History');
    expect(history.body.quizzes).toHaveLength(1);
    expect(history.body.quizzes[0].title).toBe('Kings and Queens');

    const hard = await makeAgent().get('/api/quizzes?difficulty=hard');
    expect(hard.body.quizzes).toHaveLength(1);
    expect(hard.body.quizzes[0].title).toMatch(/Volcanoes/);

    const noMatch = await makeAgent().get('/api/quizzes?q=dinosaurs');
    expect(noMatch.body.quizzes).toHaveLength(0);
  });

  test('validates question shape and the single correct answer', async () => {
    const agent = makeAgent();
    await registerUser(agent);
    const quiz = await createQuiz(agent);

    const noCorrect = await agent
      .post(`/api/quizzes/${quiz.id}/questions`)
      .send({
        text: 'A question with no correct answer?',
        options: [
          { text: 'A', isCorrect: false },
          { text: 'B', isCorrect: false },
          { text: 'C', isCorrect: false },
          { text: 'D', isCorrect: false },
        ],
      });
    expect(noCorrect.status).toBe(400);
    expect(noCorrect.body.fields.correct).toBeDefined();

    const threeOptions = await agent
      .post(`/api/quizzes/${quiz.id}/questions`)
      .send({
        text: 'A question with too few answers?',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
          { text: 'C', isCorrect: false },
        ],
      });
    expect(threeOptions.status).toBe(400);
    expect(threeOptions.body.fields.options).toBeDefined();
  });

  test('edits and deletes an owned question, then the quiz', async () => {
    const agent = makeAgent();
    await registerUser(agent);
    const quiz = await createQuiz(agent);
    const question = await addQuestion(agent, quiz.id);

    const edit = await agent
      .patch(`/api/quizzes/${quiz.id}/questions/${question.id}`)
      .send({
        text: 'Which planet is closest to the Sun?',
        explanation: 'Mercury orbits closer than Venus.',
        options: [
          { text: 'Mercury', isCorrect: true },
          { text: 'Venus', isCorrect: false },
          { text: 'Earth', isCorrect: false },
          { text: 'Mars', isCorrect: false },
        ],
      });
    expect(edit.status).toBe(200);
    expect(edit.body.question.text).toMatch(/closest to the Sun/);

    const removeQuestion = await agent.delete(
      `/api/quizzes/${quiz.id}/questions/${question.id}`,
    );
    expect(removeQuestion.status).toBe(204);

    const removeQuiz = await agent.delete(`/api/quizzes/${quiz.id}`);
    expect(removeQuiz.status).toBe(204);

    const detail = await agent.get(`/api/quizzes/${quiz.id}`);
    expect(detail.status).toBe(404);
  });
});
