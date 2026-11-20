import { GeminiSupportService } from './gemini-support.service';
import { decryptSupportKey, encryptSupportKey } from './support-secrets';
import { rankSupportArticles } from './support-knowledge.service';
const key = 'fixture-gemini-key-never-real';
const source = {
  id: 'article-a',
  question: '¿Cómo ingreso productos?',
  answer: 'Completa los campos requeridos en Productos.',
  version: 2,
  aliases: ['crear producto'],
  category: 'Primeros pasos',
  sortOrder: 0,
};
describe('Grounded support assistant', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });
  it('encrypts a saved API key with authenticated random encryption', () => {
    const previous = process.env.SUPPORT_ENCRYPTION_KEY;
    process.env.SUPPORT_ENCRYPTION_KEY = 'fixture-encryption-master-secret';
    try {
      const encrypted = encryptSupportKey(key);
      expect(encrypted).not.toContain(key);
      expect(decryptSupportKey(encrypted)).toBe(key);
      expect(encryptSupportKey(key)).not.toBe(encrypted);
      const parts = encrypted.split('.');
      parts[2] = Buffer.alloc(16).toString('base64');
      expect(() => decryptSupportKey(parts.join('.'))).toThrow();
    } finally {
      if (previous === undefined) delete process.env.SUPPORT_ENCRYPTION_KEY;
      else process.env.SUPPORT_ENCRYPTION_KEY = previous;
    }
  });
  it('recognizes alternative questions without accents and ignores generic filler', () => {
    expect(rankSupportArticles('CREAR PRÓDUCTO', [source])[0].exact).toBe(true);
    expect(rankSupportArticles('necesito ayuda', [source])).toEqual([]);
  });
  it('finds a relevant topic using words from its answer', () => { expect(rankSupportArticles('campos requeridos', [source])[0].article.id).toBe(source.id); });
  it('lists only models supporting generation and never puts the key in the URL', async () => {
    const mock = jest.fn(async (_url: any, _init?: any) => ({
      ok: true,
      json: async () => ({
        models: [
          {
            name: 'models/gemini-fixture',
            displayName: 'Fixture',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'models/gemini-embedding',
            supportedGenerationMethods: ['embedContent'],
          },
          {
            name: 'models/../bad',
            supportedGenerationMethods: ['generateContent'],
          },
        ],
      }),
    }));
    global.fetch = mock as any;
    expect(await new GeminiSupportService().models(key)).toEqual([
      { id: 'gemini-fixture', name: 'Fixture' },
    ]);
    expect(mock.mock.calls[0][0]).not.toContain(key);
  });
  it('sanitizes provider failures without echoing secrets', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({ secret: key }),
    })) as any;
    await expect(new GeminiSupportService().models(key)).rejects.not.toThrow(
      key,
    );
  });
  function response(value: any, finishReason = 'STOP') {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason,
            content: {
              parts: [
                {
                  text:
                    typeof value === 'string' ? value : JSON.stringify(value),
                },
              ],
            },
          },
        ],
      }),
    })) as any;
  }
  const input = {
    key,
    model: 'gemini-fixture',
    question: 'Necesito cargar productos',
    history: [],
    articles: [source],
  };
  it('requires real article citations and records the version supplied to Gemini', async () => {
    response({
      action: 'answer',
      text: 'Completa los campos en Productos.',
      sourceIds: [source.id],
    });
    expect(await new GeminiSupportService().answer(input)).toMatchObject({
      action: 'answer',
      sourceVersions: { 'article-a': 2 },
    });
  });
  it.each([[], ['invented']])(
    'rejects ungrounded answers with citations %j',
    async (ids) => {
      response({ action: 'answer', text: 'Respuesta', sourceIds: ids });
      await expect(new GeminiSupportService().answer(input)).rejects.toThrow(
        'GEMINI_UNGROUNDED',
      );
    },
  );
  it('rejects incomplete or malformed JSON instead of displaying it', async () => {
    response('{invalid');
    await expect(new GeminiSupportService().answer(input)).rejects.toThrow();
    response(
      { action: 'answer', text: 'Respuesta', sourceIds: [source.id] },
      'MAX_TOKENS',
    );
    await expect(new GeminiSupportService().answer(input)).rejects.toThrow(
      'GEMINI_INCOMPLETE',
    );
  });
  it('replaces model handoff claims with the server-owned acknowledgement', async () => {
    response({
      action: 'handoff',
      text: 'Ya envié un correo y un humano está aquí.',
      sourceIds: [],
    });
    const answer = await new GeminiSupportService().answer(input);
    expect(answer.text).toContain('solicitud quedó registrada');
    expect(answer.text).not.toContain('envié un correo');
  });
  it('uses a fixed host, timeout, structured output and no executable tools', async () => {
    response({
      action: 'clarify',
      text: '¿Qué intentabas hacer?',
      sourceIds: [],
    });
    await new GeminiSupportService().answer(input);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-fixture:generateContent',
    );
    expect(options.redirect).toBe('error');
    const body = JSON.parse(options.body);
    expect(body.tools).toBeUndefined();
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.systemInstruction.parts[0].text).toContain(
      'No ejecutas acciones',
    );
    expect(options.body).not.toContain(key);
  });
});
