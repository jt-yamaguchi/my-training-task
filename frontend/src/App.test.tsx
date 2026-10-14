import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { Category, Task } from './api/types';

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
    category: null,
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
    category: null,
    createdAt: '2026-01-01T00:00:00+09:00',
    completedAt: null,
  },
];

const seedCategories: Category[] = [
  { id: 1, name: '仕事' },
  { id: 2, name: '私用' },
  { id: 3, name: '勉強' },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// fetch をモックする。カテゴリ一覧の取得(GET /api/categories)には常に seedCategories を返し、
// それ以外の呼び出しには responses を順に返す(使い切った後は最後の1つを繰り返す)。
// Response の本文は1回しか読めないため、呼ばれるたびに新しい Response を作る関数で渡す
function mockFetch(...responses: Array<() => Response>) {
  let index = 0;
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    if (input === '/api/categories' && init === undefined) {
      return Promise.resolve(jsonResponse(seedCategories));
    }
    const response = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return Promise.resolve(response());
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('タスク一覧が表示される', async () => {
    mockFetch(() => jsonResponse(seedTasks));

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
      category: null,
      createdAt: '2026-01-02T00:00:00+09:00',
      completedAt: null,
    };
    const fetchMock = mockFetch(
      () => jsonResponse(seedTasks),
      () => jsonResponse(created, 201),
      () => jsonResponse([...seedTasks, created]),
    );

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
    mockFetch(() => jsonResponse(seedTasks));

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
      category: null,
      createdAt: '2026-01-02T00:00:00+09:00',
      completedAt: null,
    };
    const fetchMock = mockFetch(
      () => jsonResponse(seedTasks),
      () => jsonResponse(created, 201),
      () => jsonResponse([...seedTasks, created]),
    );

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
    const fetchMock = mockFetch(() => jsonResponse(seedTasks));

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');

    await user.selectOptions(screen.getByLabelText('並び順'), 'PRIORITY');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/tasks?sort=PRIORITY');
    });
  });

  it('完了を切り替えても優先度は維持される', async () => {
    const fetchMock = mockFetch(() => jsonResponse(seedTasks));

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
    mockFetch(() => jsonResponse({ message: 'サーバーエラー' }, 500));

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
    mockFetch(() => jsonResponse([doneTask, seedTasks[1]]));

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
    category: null,
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
    category: null,
    createdAt: '2026-10-01T00:00:00+09:00',
    completedAt: null,
  };

  it('一覧に期限が表示される', async () => {
    mockFetch(() => jsonResponse([pastTask, futureTask, seedTasks[1]]));

    render(<App />);
    await screen.findByText('昨日が期限のタスク');

    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText(/期限: 2026\/10\/14/)).toBeInTheDocument();
    expect(within(items[1]).getByText(/期限: 2026\/10\/16/)).toBeInTheDocument();
    // 期限なしのタスクには期限を表示しない
    expect(within(items[2]).queryByText(/期限:/)).not.toBeInTheDocument();
  });

  it('期限が過去日のタスクは強調表示され、未来日のタスクは強調表示されない', async () => {
    mockFetch(() => jsonResponse([pastTask, futureTask]));

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
    const fetchMock = mockFetch(
      () => jsonResponse(seedTasks),
      () => jsonResponse(created, 201),
      () => jsonResponse([...seedTasks, created]),
    );

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

describe('カテゴリ', () => {
  const workTask: Task = {
    ...seedTasks[1],
    id: 21,
    title: '仕事のタスク',
    category: { id: 1, name: '仕事' },
  };

  // カテゴリの追加・削除を再現するモック。追加・削除の結果がカテゴリ一覧の再取得に反映される
  function mockCategoryApi(tasks: Task[]) {
    let categories = [...seedCategories];
    return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url = String(input);
      if (url === '/api/categories' && init?.method === 'POST') {
        const { name } = JSON.parse(String(init.body)) as { name: string };
        if (categories.some((c) => c.name === name)) {
          return Promise.resolve(
            jsonResponse({ message: `同じ名前のカテゴリが既にあります: ${name}` }, 409),
          );
        }
        const created: Category = { id: 4, name };
        categories = [...categories, created];
        return Promise.resolve(jsonResponse(created, 201));
      }
      if (url.startsWith('/api/categories/') && init?.method === 'DELETE') {
        const id = Number(url.split('/').pop());
        categories = categories.filter((c) => c.id !== id);
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url === '/api/categories') {
        return Promise.resolve(jsonResponse(categories));
      }
      return Promise.resolve(jsonResponse(tasks));
    });
  }

  // カテゴリ一覧の取得が終わるまで待つ
  async function waitForCategories() {
    await within(screen.getByLabelText('カテゴリで絞り込み')).findByRole('option', {
      name: '仕事',
    });
  }

  it('カテゴリ付きのタスクにはカテゴリ名が表示され、カテゴリなしのタスクには表示されない', async () => {
    mockFetch(() => jsonResponse([workTask, seedTasks[0]]));

    render(<App />);
    const workItem = (await screen.findByText('仕事のタスク')).closest('li');
    const noCategoryItem = screen.getByText('環境構築を完了する').closest('li');

    expect(workItem).not.toBeNull();
    expect(noCategoryItem).not.toBeNull();
    expect(within(workItem as HTMLElement).getByText('仕事')).toBeInTheDocument();
    expect(noCategoryItem).not.toHaveTextContent('仕事');
  });

  it('追加フォームでカテゴリを選択できる', async () => {
    const created: Task = { ...workTask, id: 22 };
    const fetchMock = mockFetch(
      () => jsonResponse(seedTasks),
      () => jsonResponse(created, 201),
      () => jsonResponse([...seedTasks, created]),
    );

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');
    await waitForCategories();

    // 初期値は「カテゴリなし」
    expect(screen.getByLabelText('カテゴリ')).toHaveValue('');

    await user.type(screen.getByLabelText('タスク名'), '仕事のタスク');
    await user.selectOptions(screen.getByLabelText('カテゴリ'), '1');
    await user.click(screen.getByRole('button', { name: '追加する' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"categoryId":1'),
        }),
      );
    });
  });

  it('カテゴリを選ばずに追加するとカテゴリなしで登録される', async () => {
    const created: Task = { ...seedTasks[1], id: 23, title: 'カテゴリなしのタスク' };
    const fetchMock = mockFetch(
      () => jsonResponse(seedTasks),
      () => jsonResponse(created, 201),
      () => jsonResponse([...seedTasks, created]),
    );

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');

    await user.type(screen.getByLabelText('タスク名'), 'カテゴリなしのタスク');
    await user.click(screen.getByRole('button', { name: '追加する' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"categoryId":null'),
        }),
      );
    });
  });

  it('絞り込みでカテゴリを選ぶとcategoryId付きで一覧を取得し、「すべて」に戻すと外れる', async () => {
    const fetchMock = mockFetch(() => jsonResponse(seedTasks));

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');
    await waitForCategories();

    await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '1');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/tasks?sort=ID&categoryId=1');
    });

    fetchMock.mockClear();
    await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/tasks?sort=ID');
    });
  });

  it('完了を切り替えてもカテゴリは維持される', async () => {
    const fetchMock = mockFetch(() => jsonResponse([workTask]));

    const user = userEvent.setup();
    render(<App />);
    const workItem = (await screen.findByText('仕事のタスク')).closest('li') as HTMLElement;

    await user.click(within(workItem).getByRole('checkbox'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks/21',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"categoryId":1'),
        }),
      );
    });
  });

  it('カテゴリを追加できる', async () => {
    const fetchMock = mockCategoryApi(seedTasks);

    const user = userEvent.setup();
    render(<App />);
    await waitForCategories();

    await user.type(screen.getByLabelText('カテゴリ名'), '趣味');
    await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));

    expect(
      await screen.findByRole('button', { name: 'カテゴリ「趣味」を削除' }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/categories',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: '趣味' }) }),
    );
    expect(screen.getByLabelText('カテゴリ名')).toHaveValue('');
  });

  it('同じ名前のカテゴリを追加するとエラーメッセージが表示される', async () => {
    mockCategoryApi(seedTasks);

    const user = userEvent.setup();
    render(<App />);
    await waitForCategories();

    await user.type(screen.getByLabelText('カテゴリ名'), '仕事');
    await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));

    expect(await screen.findByText('同じ名前のカテゴリが既にあります: 仕事')).toBeInTheDocument();
    // 入力内容は残す(修正して再度追加できるように)
    expect(screen.getByLabelText('カテゴリ名')).toHaveValue('仕事');
  });

  it('確認で了承するとカテゴリが削除される', async () => {
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchMock = mockCategoryApi(seedTasks);

    const user = userEvent.setup();
    render(<App />);
    await waitForCategories();

    await user.click(screen.getByRole('button', { name: 'カテゴリ「勉強」を削除' }));

    // 使用中のタスクがカテゴリなしになることを確認で伝える
    expect(confirmMock).toHaveBeenCalledWith(expect.stringContaining('カテゴリなし'));
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'カテゴリ「勉強」を削除' }),
      ).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/categories/3',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('確認でキャンセルするとカテゴリは削除されない', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fetchMock = mockCategoryApi(seedTasks);

    const user = userEvent.setup();
    render(<App />);
    await waitForCategories();

    await user.click(screen.getByRole('button', { name: 'カテゴリ「勉強」を削除' }));

    expect(screen.getByRole('button', { name: 'カテゴリ「勉強」を削除' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/categories/3',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('絞り込み中のカテゴリを削除すると「すべて」に戻る', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchMock = mockCategoryApi(seedTasks);

    const user = userEvent.setup();
    render(<App />);
    await waitForCategories();

    await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '1');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/tasks?sort=ID&categoryId=1');
    });

    fetchMock.mockClear();
    await user.click(screen.getByRole('button', { name: 'カテゴリ「仕事」を削除' }));

    await waitFor(() => {
      expect(screen.getByLabelText('カテゴリで絞り込み')).toHaveValue('');
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/tasks?sort=ID');
    });
  });
});
