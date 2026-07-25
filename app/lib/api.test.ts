import { afterEach, describe, expect, test } from 'bun:test';
import {
  ApiError,
  apiUpload,
  parseApiResponse,
  resolveApiAssetUrl,
} from './api';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('parseApiResponse', () => {
  test('unwraps a successful data envelope', async () => {
    const response = new Response(
      JSON.stringify({ success: true, data: { id: 7 } }),
      { status: 200 }
    );

    await expect(parseApiResponse<{ id: number }>(response, '/example')).resolves.toEqual({ id: 7 });
  });

  test('supports message-only and 204 success responses', async () => {
    const messageOnly = new Response(
      JSON.stringify({ success: true, message: 'done' }),
      { status: 200 }
    );
    const noContent = new Response(null, { status: 204 });

    await expect(parseApiResponse<void>(messageOnly, '/message')).resolves.toBeUndefined();
    await expect(parseApiResponse<void>(noContent, '/empty')).resolves.toBeUndefined();
  });

  test('preserves the API error status and message', async () => {
    const response = new Response(
      JSON.stringify({ success: false, message: 'quantity must be positive' }),
      { status: 400 }
    );

    try {
      await parseApiResponse(response, '/price');
      throw new Error('Expected parseApiResponse to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).message).toBe('quantity must be positive');
    }
  });

  test('reports malformed non-envelope JSON', async () => {
    const response = new Response('<html>proxy error</html>', { status: 502 });
    await expect(parseApiResponse(response, '/broken')).rejects.toThrow('invalid JSON');
  });
});

describe('API assets and uploads', () => {
  test('resolves backend-relative assets and preserves absolute URLs', () => {
    expect(resolveApiAssetUrl('/uploads/example.png')).toBe(
      'http://localhost:5790/uploads/example.png'
    );
    expect(resolveApiAssetUrl('https://cdn.example.com/example.png')).toBe(
      'https://cdn.example.com/example.png'
    );
    expect(resolveApiAssetUrl(null)).toBeNull();
  });

  test('uploads multipart data without forcing a JSON content type', async () => {
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      expect(init?.body).toBeInstanceOf(FormData);
      expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
      return new Response(
        JSON.stringify({
          success: true,
          data: { url: '/uploads/file.txt', filename: 'file.txt' },
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const result = await apiUpload(new File(['hello'], 'file.txt', { type: 'text/plain' }));
    expect(result).toEqual({ url: '/uploads/file.txt', filename: 'file.txt' });
  });
});

