import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    dueDate: null,
    overdue: false,
    createdAt: '2026-01-01T00:00:00+09:00',
    completedAt: null,
  },
  {
    id: 2,
    title: 'CLAUDE.md を読む',
    description: '開発ルールの理解',
    done: false,
    priority: 'LOW',
    dueDate: null,
    overdue: false,
    createdAt: '2026-01-01T00:00:00+09:00',
    completedAt: null,
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
      dueDate: null,
      overdue: false,
      createdAt: '2026-01-02T00:00:00+09:00',
      completedAt: null,
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
      dueDate: null,
      overdue: false,
      createdAt: '2026-01-02T00:00:00+09:00',
      completedAt: null,
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

describe('完了日時', () => {
  const doneTask: Task = {
    ...seedTasks[0],
    completedAt: '2026-09-30T14:05:00+09:00',
  };

  it('完了済みタスクには完了日時が表示され、未完了タスクには表示されない', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([doneTask, seedTasks[1]]));

    render(<App />);
    await screen.findByText('環境構築を完了する');

    // 表示形式はタイムゾーンに依存するため、日時の値ではなく表示の有無で検証する
    const [doneItem, notDoneItem] = screen.getAllByRole('listitem');
    expect(within(doneItem).getByText(/完了:/)).toBeInTheDocument();
    expect(within(notDoneItem).queryByText(/完了:/)).not.toBeInTheDocument();
  });
});

describe('期限', () => {
  // テスト内の「今日」を 2026-10-15 に固定する(Date のみ偽装し、setTimeout 等は本物のまま)。
  // 期限切れ判定はAPIが行うため、モックの overdue は「今日」を基準にAPIが返す値と一致させている
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-15T09:00:00+09:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const pastTask: Task = {
    id: 11,
    title: '昨日が期限のタスク',
    description: null,
    done: false,
    priority: 'MEDIUM',
    dueDate: '2026-10-14',
    overdue: true,
    createdAt: '2026-10-01T00:00:00+09:00',
    completedAt: null,
  };
  const futureTask: Task = {
    id: 12,
    title: '明日が期限のタスク',
    description: null,
    done: false,
    priority: 'MEDIUM',
    dueDate: '2026-10-16',
    overdue: false,
    createdAt: '2026-10-01T00:00:00+09:00',
    completedAt: null,
  };

  it('一覧に期限が表示される', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([pastTask, futureTask, seedTasks[1]]),
    );

    render(<App />);
    await screen.findByText('昨日が期限のタスク');

    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText(/期限: 2026\/10\/14/)).toBeInTheDocument();
    expect(within(items[1]).getByText(/期限: 2026\/10\/16/)).toBeInTheDocument();
    // 期限なしのタスクには期限を表示しない
    expect(within(items[2]).queryByText(/期限:/)).not.toBeInTheDocument();
  });

  it('期限が過去日のタスクは強調表示され、未来日のタスクは強調表示されない', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([pastTask, futureTask]));

    render(<App />);
    await screen.findByText('昨日が期限のタスク');

    const [pastItem, futureItem] = screen.getAllByRole('listitem');
    expect(pastItem).toHaveClass('overdue');
    expect(within(pastItem).getByText('期限切れ')).toBeInTheDocument();
    expect(futureItem).not.toHaveClass('overdue');
    expect(within(futureItem).queryByText('期限切れ')).not.toBeInTheDocument();
  });

  it('追加フォームで期限を指定できる', async () => {
    const created: Task = { ...futureTask, id: 13, title: '期限付きタスク' };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(seedTasks))
      .mockResolvedValueOnce(jsonResponse(created, 201))
      .mockResolvedValueOnce(jsonResponse([...seedTasks, created]));

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');

    await user.type(screen.getByLabelText('タスク名'), '期限付きタスク');
    await user.type(screen.getByLabelText('期限'), '2026-10-16');
    await user.click(screen.getByRole('button', { name: '追加する' }));

    expect(await screen.findByText('期限付きタスク')).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"dueDate":"2026-10-16"'),
        }),
      );
    });
  });
});
