import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { Env } from '../config/env';
import { AI_CLIENT } from './ai.constants';
import { AiSummariesRepository } from './ai-summaries.repository';
import { GeminiAiClient } from './gemini-ai-client';

// Provides the AI tools for other modules to import (applications/ uses them).
// AI_CLIENT is built from config, so the key and model name never live in
// source. AiSummariesRepository uses PG_POOL from the global DatabaseModule.
@Module({
  providers: [
    {
      provide: AI_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const ai = new GoogleGenAI({ apiKey: config.get('GEMINI_API_KEY', { infer: true }) });
        return new GeminiAiClient(ai.models, config.get('AI_MODEL', { infer: true }));
      },
    },
    AiSummariesRepository,
  ],
  exports: [AI_CLIENT, AiSummariesRepository],
})
export class AiModule {}
