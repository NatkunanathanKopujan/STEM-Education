# AI Module Documentation

## Provider Architecture

The AI module uses provider abstraction under `backend/services/ai/providers`. This keeps OpenAI, Gemini, Ollama, and local providers replaceable without changing controller or route behavior.

## Configuration

Important environment variables:

- `AI_PROVIDER`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL`
- `AI_TIMEOUT`
- `AI_MAX_RETRIES`
- `AI_BATCH_SIZE`
- `MAX_TOKENS`
- `TEMPERATURE`

## Question Generation Flow

```mermaid
sequenceDiagram
  participant T as Teacher
  participant API as AI API
  participant Service as Generation Service
  participant Provider as AI Provider
  participant DB as Question Bank
  T->>API: Request generation
  API->>Service: Validate input and permissions
  Service->>Provider: Send prompt
  Provider-->>Service: Raw response
  Service->>Service: Parse, validate, retry if needed
  Service->>DB: Store approved questions
  API-->>T: Generated questions and metadata
```

## Prompt Builder

Prompt templates define structured instructions for MCQ generation, difficulty, topic, category, answer options, correct answer, and explanations.

## Duplicate Detection

Duplicate detection compares generated content against existing question bank entries to reduce repeated questions and preserve assessment quality.

## Validation

Validation checks ensure:

- Required question fields exist.
- Exactly one correct answer is selected.
- Options are structured.
- Topic/category/difficulty are acceptable.

## Retry Logic

AI retry service handles transient provider failures and invalid responses within configured retry limits.

## Cost Monitoring

AI logs and cost endpoints expose request metadata for monitoring usage. External provider cost accounting can be expanded without changing API contracts.
