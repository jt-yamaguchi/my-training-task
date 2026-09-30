import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { Task } from './api/types';

// fetch をモックしてAPIなしでコンポーネントを検証する。
// 新しい画面のテストはこのファイルの書き方を模倣すること。
const seedTasks: Task[] = [
  {
    id: 1,
    title: '環境構築を完了する',
    description: null,
    done: true,
    priority: 'HIGH',
    createdAt: '2026-01-01T00:00:00+09:00',
  },
  {
    id: 2,
    title: 'CLAUDE.md を読む',
    description: '開発ルールの理解',
    done: false,
    priority: 'LOW',
    createdAt: '2026-01-01T00:00:00+09:00',
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('タスク一覧が表示される', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(seedTasks));

    render(<App />);

    expect(await screen.findByText('環境構築を完了する')).toBeInTheDocument();
    expect(screen.getByText('CLAUDE.md を読む')).toBeInTheDocument();
    expect(screen.getByText('残り 1 件')).toBeInTheDocument();
  });

  it('タスクを追加するとAPIが呼ばれ一覧が更新される', async () => {
    const created: Task = {
      id: 3,
      title: '新しいタスク',
      description: null,
      done: false,
      priority: 'MEDIUM',
      createdAt: '2026-01-02T00:00:00+09:00',
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(seedTasks))
      .mockResolvedValueOnce(jsonResponse(created, 201))
      .mockResolvedValueOnce(jsonResponse([...seedTasks, created]));

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');

    await user.type(screen.getByLabelText('タスク名'), '新しいタスク');
    await user.click(screen.getByRole('button', { name: '追加する' }));

    expect(await screen.findByText('新しいタスク')).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('一覧に優先度が表示される', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(seedTasks));

    render(<App />);
    await screen.findByText('環境構築を完了する');

    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText('高')).toBeInTheDocument();
    expect(within(items[1]).getByText('低')).toBeInTheDocument();
  });

  it('追加フォームで優先度を選択できる', async () => {
    const created: Task = {
      id: 3,
      title: '急ぎのタスク',
      description: null,
      done: false,
      priority: 'HIGH',
      createdAt: '2026-01-02T00:00:00+09:00',
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(seedTasks))
      .mockResolvedValueOnce(jsonResponse(created, 201))
      .mockResolvedValueOnce(jsonResponse([...seedTasks, created]));

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');

    // 初期値は「中」
    expect(screen.getByLabelText('優先度')).toHaveValue('MEDIUM');

    await user.type(screen.getByLabelText('タスク名'), '急ぎのタスク');
    await user.selectOptions(screen.getByLabelText('優先度'), 'HIGH');
    await user.click(screen.getByRole('button', { name: '追加する' }));

    expect(await screen.findByText('急ぎのタスク')).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"priority":"HIGH"'),
        }),
      );
    });
  });

  it('並び順を優先度順にするとsort=PRIORITYで一覧を取得する', async () => {
    // 一覧の再取得でも使うため、呼ばれるたびに新しい Response を返す
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(jsonResponse(seedTasks)));

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');

    await user.selectOptions(screen.getByLabelText('並び順'), 'PRIORITY');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/tasks?sort=PRIORITY');
    });
  });

  it('完了を切り替えても優先度は維持される', async () => {
    // 一覧の再取得でも使うため、呼ばれるたびに新しい Response を返す
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(jsonResponse(seedTasks)));

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');

    await user.click(within(screen.getAllByRole('listitem')[1]).getByRole('checkbox'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks/2',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"priority":"LOW"'),
        }),
      );
    });
  });

  it('API失敗時にエラーメッセージが表示される', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'サーバーエラー' }, 500),
    );

    render(<App />);

    expect(await screen.findByText('サーバーエラー')).toBeInTheDocument();
  });
});
