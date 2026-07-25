import { describe, expect, test } from 'bun:test';
import { getWebSocketUrl } from './wsclient';

describe('getWebSocketUrl', () => {
  test('derives the WebSocket endpoint from the API origin', () => {
    expect(getWebSocketUrl('token with spaces')).toBe(
      'ws://localhost:5790/api/v1/ws?token=token+with+spaces'
    );
  });
});

