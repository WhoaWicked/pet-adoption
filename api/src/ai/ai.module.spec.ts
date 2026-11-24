import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { PG_POOL } from '../database/database.constants';
import { AiClient } from './ai-client.interface';
import { AI_CLIENT } from './ai.constants';
import { AiModule } from './ai.module';
import { AiSummariesRepository } from './ai-summaries.repository';
import { GeminiAiClient } from './gemini-ai-client';

// Stands in for the global DatabaseModule so no Postgres is needed.
@Global()
@Module({
  providers: [{ provide: PG_POOL, useValue: { query: jest.fn() } }],
  exports: [PG_POOL],
})
class FakeDatabaseModule {}

// Dummy config values: nothing here talks to Gemini.
const fakeConfig = ConfigModule.forRoot({
  isGlobal: true,
  ignoreEnvFile: true,
  load: [() => ({ GEMINI_API_KEY: 'dummy-key', AI_MODEL: 'dummy-model' })],
});

describe('AiModule', () => {
  it('provides a GeminiAiClient and the repository by default', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [fakeConfig, FakeDatabaseModule, AiModule],
    }).compile();

    expect(moduleRef.get(AI_CLIENT)).toBeInstanceOf(GeminiAiClient);
    expect(moduleRef.get(AiSummariesRepository)).toBeInstanceOf(AiSummariesRepository);
  });

  it('lets tests override AI_CLIENT with a fake', async () => {
    const fake: AiClient = { generate: jest.fn().mockResolvedValue('fake answer') };
    const moduleRef = await Test.createTestingModule({
      imports: [fakeConfig, FakeDatabaseModule, AiModule],
    })
      .overrideProvider(AI_CLIENT)
      .useValue(fake)
      .compile();

    const client = moduleRef.get<AiClient>(AI_CLIENT);
    expect(client).toBe(fake);
    await expect(client.generate('p', new AbortController().signal)).resolves.toBe('fake answer');
  });
});
