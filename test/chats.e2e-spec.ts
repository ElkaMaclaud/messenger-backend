import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

interface LoginResponse {
  access_token: string;
}

interface ChatResponse {
  id: number;
}

interface MessageResponse {
  id: number;
  content: string;
  userId: number;
  chatId: number;
  createdAt: string;
}

describe('Chats E2E Tests', () => {
  let app: INestApplication;
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let privateChatId: number;
  let groupChatId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Scenario 1: Private Chat', () => {
    it('should register test users', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'e2e_user1', password: 'password123' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'e2e_user2', password: 'password123' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'e2e_user3', password: 'password123' })
        .expect(201);
    });

    it('should login users and get tokens', async () => {
      const response1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'e2e_user1', password: 'password123' })
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'e2e_user2', password: 'password123' })
        .expect(201);

      const response3 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'e2e_user3', password: 'password123' })
        .expect(201);

      user1Token = (response1.body as LoginResponse).access_token;
      user2Token = (response2.body as LoginResponse).access_token;
      user3Token = (response3.body as LoginResponse).access_token;

      expect(user1Token).toBeDefined();
      expect(user2Token).toBeDefined();
      expect(user3Token).toBeDefined();
    });

    it('should create private chat', async () => {
      const response = await request(app.getHttpServer())
        .post('/chats/private')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ targetUserId: 2 })
        .expect(201);

      privateChatId = (response.body as ChatResponse).id;
      expect(privateChatId).toBeDefined();
    });

    it('should send messages in private chat', async () => {
      await request(app.getHttpServer())
        .post(`/chats/${privateChatId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Привет от User1!' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/chats/${privateChatId}/messages`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Привет от User2!' })
        .expect(201);
    });

    it('should get private chat messages', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chats/${privateChatId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const messages = response.body as MessageResponse[];
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toContain('Привет');
    });
  });

  describe('Scenario 2: Group Chat', () => {
    it('should create group chat', async () => {
      const response = await request(app.getHttpServer())
        .post('/chats/group')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Тестовый групповой чат',
          participantIds: [2, 3],
        })
        .expect(201);

      groupChatId = (response.body as ChatResponse).id;
      expect(groupChatId).toBeDefined();
    });

    it('should send messages in group chat', async () => {
      await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Всем привет в групповом чате!' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/messages`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Привет! Рад быть здесь!' })
        .expect(201);
    });

    it('should add participant to group chat', async () => {
      await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/participants`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ userId: 3 })
        .expect(201);
    });

    it('should get group chat messages', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const messages = response.body as MessageResponse[];
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should get user chats list', async () => {
      const response = await request(app.getHttpServer())
        .get('/chats')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const chats = response.body as ChatResponse[];
      expect(Array.isArray(chats)).toBe(true);
    });
  });

  describe('Scenario 3: Security Checks', () => {
    it('should not allow access to other user chat', async () => {
      await request(app.getHttpServer())
        .get(`/chats/${privateChatId}/messages`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(403);
    });

    it('should not allow sending message to non-existent chat', async () => {
      await request(app.getHttpServer())
        .post('/chats/999/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Тестовое сообщение' })
        .expect(404);
    });
  });
});
