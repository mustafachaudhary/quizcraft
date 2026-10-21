import request from 'supertest';
import { app } from '../server/app.js';

export function makeAgent() {
  return request.agent(app);
}

export async function registerUser(
  agent,
  username = 'alice',
  password = 'password123',
) {
  const response = await agent
    .post('/api/auth/register')
    .send({ username, password });

  if (response.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(response.body)}`);
  }

  return response.body.user;
}

export async function createQuiz(agent, overrides = {}) {
  const response = await agent.post('/api/quizzes').send({
    title: 'A Test Quiz',
    description: 'A quiz made by the test helper.',
    category: 'Science',
    difficulty: 'easy',
    ...overrides,
  });

  if (response.status !== 201) {
    throw new Error(`Quiz creation failed: ${JSON.stringify(response.body)}`);
  }

  return response.body.quiz;
}

export async function addQuestion(agent, quizId, overrides = {}) {
  const response = await agent
    .post(`/api/quizzes/${quizId}/questions`)
    .send({
      text: 'Which planet is known as the Red Planet?',
      explanation: 'Iron oxide gives Mars its red colour.',
      options: [
        { text: 'Mars', isCorrect: true },
        { text: 'Venus', isCorrect: false },
        { text: 'Jupiter', isCorrect: false },
        { text: 'Mercury', isCorrect: false },
      ],
      ...overrides,
    });

  if (response.status !== 201) {
    throw new Error(`Question creation failed: ${JSON.stringify(response.body)}`);
  }

  return response.body.question;
}

function practiceQuestion(index) {
  return {
    text: `Practice question ${index}: which option is correct?`,
    explanation: `Option A is correct for practice question ${index}.`,
    options: [
      { text: `Correct answer ${index}`, isCorrect: true },
      { text: `Wrong answer A ${index}`, isCorrect: false },
      { text: `Wrong answer B ${index}`, isCorrect: false },
      { text: `Wrong answer C ${index}`, isCorrect: false },
    ],
  };
}

export async function addQuestions(agent, quizId, count = 10, startAt = 1) {
  const questions = [];

  for (let index = 0; index < count; index += 1) {
    questions.push(
      await addQuestion(agent, quizId, practiceQuestion(startAt + index)),
    );
  }

  return questions;
}

export async function publishQuiz(agent, quiz) {
  const response = await agent
    .patch(`/api/quizzes/${quiz.id}`)
    .send({ isPublic: true });

  if (response.status !== 200) {
    throw new Error(`Publishing failed: ${JSON.stringify(response.body)}`);
  }

  return response.body.quiz;
}

export async function createPublishedQuiz(agent) {
  const quiz = await createQuiz(agent, {
    title: 'Planets and Their Neighbours',
    description: 'Ten questions to test the attempt flow.',
  });
  const first = await addQuestion(agent, quiz.id);
  const second = await addQuestion(agent, quiz.id, {
    text: 'What is the largest planet in the Solar System?',
    explanation: 'Jupiter is larger than every other planet combined.',
    options: [
      { text: 'Saturn', isCorrect: false },
      { text: 'Jupiter', isCorrect: true },
      { text: 'Neptune', isCorrect: false },
      { text: 'Earth', isCorrect: false },
    ],
  });
  const rest = await addQuestions(agent, quiz.id, 8, 3);
  await publishQuiz(agent, quiz);
  return { quiz, questions: [first, second, ...rest] };
}

export function correctOption(question) {
  return question.options.find((option) => option.isCorrect);
}

export function wrongOption(question) {
  return question.options.find((option) => !option.isCorrect);
}
