import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/vitest.setup';
import { fetchAllBooksForUser } from './fetch-books';
import { API_BASE_URL } from '@/lib/constants';

const API_BOOKS_URL = `${API_BASE_URL}/auth/api/books/status`;

describe('fetchAllBooksForUser resilience', () => {
  const jwt = 'test-jwt';

  it('should handle partial failures (one endpoint 500)', async () => {
    server.use(
      http.get(`${API_BOOKS_URL}/todo`, () => {
        return HttpResponse.json([{ id: 1, title: 'Todo Book', author: 'Author 1' }]);
      }),
      http.get(`${API_BOOKS_URL}/progress`, () => {
        return new HttpResponse(null, { status: 500 });
      }),
      http.get(`${API_BOOKS_URL}/completed`, () => {
        return HttpResponse.json([{ id: 2, title: 'Done Book', author: 'Author 2' }]);
      })
    );

    const result = await fetchAllBooksForUser(jwt);

    expect(result.todo.kind).toBe('ok');
    if (result.todo.kind === 'ok') {
      expect(result.todo.books).toHaveLength(1);
    }

    expect(result.progress.kind).toBe('http_error');
    if (result.progress.kind === 'http_error') {
      expect(result.progress.status).toBe(500);
    }

    expect(result.completed.kind).toBe('ok');
    if (result.completed.kind === 'ok') {
      expect(result.completed.books).toHaveLength(1);
    }
  });

  it('should handle timeout/network error', async () => {
    server.use(
      http.get(`${API_BOOKS_URL}/todo`, () => {
        return HttpResponse.error();
      }),
      http.get(`${API_BOOKS_URL}/progress`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${API_BOOKS_URL}/completed`, () => {
        return HttpResponse.json([]);
      })
    );

    const result = await fetchAllBooksForUser(jwt);

    expect(result.todo.kind).toBe('network_error');
    expect(result.progress.kind).toBe('ok');
    expect(result.completed.kind).toBe('ok');
  });

  it('should handle 404 error', async () => {
    server.use(
      http.get(`${API_BOOKS_URL}/todo`, () => {
        return new HttpResponse(null, { status: 404 });
      }),
      http.get(`${API_BOOKS_URL}/progress`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${API_BOOKS_URL}/completed`, () => {
        return HttpResponse.json([]);
      })
    );

    const result = await fetchAllBooksForUser(jwt);

    expect(result.todo.kind).toBe('http_error');
    if (result.todo.kind === 'http_error') {
      expect(result.todo.status).toBe(404);
    }
  });
});
