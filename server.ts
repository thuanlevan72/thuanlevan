import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';
import type { ChronosDatabase } from './src/utils/chronosTypes.ts';
import { createInitialChronosDatabase } from './src/utils/chronosSeed.ts';
import {
  computeDeepVsShallowStats,
  formatMinToHHMM,
} from './src/utils/chronosEngine.ts';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const LEGACY_DB_FILE = path.join(DATA_DIR, 'chronosflow-db.json');

let writeQueue: Promise<unknown> = Promise.resolve();

function sanitizeUserId(raw: unknown): string {
  if (typeof raw !== 'string') return 'guest-default';
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (cleaned.length < 3 || cleaned.length > 48) return 'guest-default';
  return cleaned;
}

function getUserDbFile(userId: string): string {
  return path.join(USERS_DIR, `${sanitizeUserId(userId)}.json`);
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }
}

function writeUserDbAtomic(userId: string, db: ChronosDatabase): ChronosDatabase {
  ensureDataDir();
  const safeId = sanitizeUserId(userId);
  const filePath = getUserDbFile(safeId);
  const stamped: ChronosDatabase = {
    ...db,
    userId: safeId,
    lastSavedAt: new Date().toISOString(),
  };
  const tmpFile = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(stamped, null, 2), 'utf8');
  fs.renameSync(tmpFile, filePath);
  return stamped;
}

function readOrSeedUserDb(
  userId: string,
  seedHints?: { userName?: string; userRole?: string; workspaceName?: string }
): ChronosDatabase {
  ensureDataDir();
  const safeId = sanitizeUserId(userId);
  const filePath = getUserDbFile(safeId);
  if (!fs.existsSync(filePath)) {
    const initial = createInitialChronosDatabase({
      userId: safeId,
      userName: seedHints?.userName,
      userRole: seedHints?.userRole,
      workspaceName: seedHints?.workspaceName,
    });
    return writeUserDbAtomic(safeId, initial);
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as ChronosDatabase;
    if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.blocks)) {
      throw new Error('Invalid local JSON database schema');
    }
    return { ...parsed, userId: safeId };
  } catch (err) {
    console.error(`[ChronosFlow DB] Corrupted DB for ${safeId}, backing up and re-seeding:`, err);
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, `${filePath}.bak-${Date.now()}`);
    }
    return writeUserDbAtomic(
      safeId,
      createInitialChronosDatabase({
        userId: safeId,
        userName: seedHints?.userName,
        userRole: seedHints?.userRole,
        workspaceName: seedHints?.workspaceName,
      })
    );
  }
}

function listAllUserWorkspaces(): Array<{
  userId: string;
  userName: string;
  userRole: string;
  workspaceName: string;
  lastSavedAt: string;
}> {
  ensureDataDir();
  const files = fs.readdirSync(USERS_DIR).filter((f) => f.endsWith('.json'));
  const summaries: Array<{
    userId: string;
    userName: string;
    userRole: string;
    workspaceName: string;
    lastSavedAt: string;
  }> = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(USERS_DIR, file), 'utf8');
      const parsed = JSON.parse(raw) as Partial<ChronosDatabase>;
      const uid = file.replace(/\.json$/, '');
      if (parsed && typeof parsed.userName === 'string') {
        summaries.push({
          userId: uid,
          userName: parsed.userName,
          userRole: parsed.userRole ?? 'Member',
          workspaceName: parsed.workspaceName ?? `ChronosFlow · ${parsed.userName}`,
          lastSavedAt: parsed.lastSavedAt ?? '',
        });
      }
    } catch {
      // Skip unreadable file
    }
  }

  return summaries.sort((a, b) => b.lastSavedAt.localeCompare(a.lastSavedAt));
}

function resolveUserIdFromRequest(req: express.Request): string {
  const fromQuery = typeof req.query.userId === 'string' ? req.query.userId : undefined;
  const fromHeader = req.header('x-chronos-user');
  const fromBody =
    req.body && typeof (req.body as { userId?: unknown }).userId === 'string'
      ? (req.body as { userId: string }).userId
      : undefined;
  return sanitizeUserId(fromQuery ?? fromHeader ?? fromBody ?? 'guest-default');
}

function enqueueDbTask<T>(fn: () => T | Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.catch(() => {});
  return next;
}

function isValidChronosDbPayload(body: unknown): body is ChronosDatabase {
  if (!body || typeof body !== 'object') return false;
  const candidate = body as Partial<ChronosDatabase>;
  return (
    Array.isArray(candidate.okrs) &&
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.blocks) &&
    typeof candidate.energyProfile === 'object' &&
    candidate.energyProfile !== null &&
    typeof candidate.rpg === 'object' &&
    candidate.rpg !== null
  );
}

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const DEV_BOOT_BUILT_AT = new Date().toISOString();
const DEV_BOOT_BUILD_ID = `dev-${Date.now().toString(36)}`;

function applyNoCacheHeaders(res: express.Response): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

function readServerBuildInfo(distDir: string): {
  buildId: string;
  builtAt: string;
  mode: 'production' | 'development';
} {
  if (process.env.NODE_ENV === 'production') {
    const versionFile = path.join(distDir, 'version.json');
    try {
      if (fs.existsSync(versionFile)) {
        const parsed = JSON.parse(fs.readFileSync(versionFile, 'utf8')) as {
          buildId?: string;
          builtAt?: string;
        };
        if (typeof parsed.buildId === 'string' && parsed.buildId.trim()) {
          return {
            buildId: parsed.buildId.trim(),
            builtAt:
              typeof parsed.builtAt === 'string' && parsed.builtAt.trim()
                ? parsed.builtAt.trim()
                : DEV_BOOT_BUILT_AT,
            mode: 'production',
          };
        }
      }
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        const stat = fs.statSync(indexFile);
        return {
          buildId: `prod-${Math.floor(stat.mtimeMs).toString(36)}`,
          builtAt: stat.mtime.toISOString(),
          mode: 'production',
        };
      }
    } catch {
      // Fallback to boot id
    }
    return {
      buildId: DEV_BOOT_BUILD_ID,
      builtAt: DEV_BOOT_BUILT_AT,
      mode: 'production',
    };
  }

  return {
    buildId: process.env.CHRONOS_DEV_BUILD_ID || DEV_BOOT_BUILD_ID,
    builtAt: process.env.CHRONOS_DEV_BUILT_AT || DEV_BOOT_BUILT_AT,
    mode: 'development',
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    process.env.CHRONOS_DEV_BUILD_ID ||= DEV_BOOT_BUILD_ID;
    process.env.CHRONOS_DEV_BUILT_AT ||= DEV_BOOT_BUILT_AT;
  }

  // Clean up old shared single-user DB if present so every user operates isolated under data/users/
  ensureDataDir();
  if (fs.existsSync(LEGACY_DB_FILE)) {
    try {
      fs.unlinkSync(LEGACY_DB_FILE);
    } catch {
      // Ignore cleanup failure
    }
  }

  const distDir = path.resolve(process.cwd(), 'dist');
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/version', (_req, res) => {
    applyNoCacheHeaders(res);
    res.json(readServerBuildInfo(distDir));
  });

  if (process.env.NODE_ENV !== 'production') {
    app.get('/version.json', (_req, res) => {
      applyNoCacheHeaders(res);
      res.json(readServerBuildInfo(distDir));
    });
  }

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'ChronosFlow Server (Per-User Storage)',
      usersDir: USERS_DIR,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.get('/api/users', async (_req, res) => {
    try {
      const users = await enqueueDbTask(() => listAllUserWorkspaces());
      res.json({ users });
    } catch {
      res.status(500).json({ error: 'Không thể liệt kê danh sách người dùng.' });
    }
  });

  app.get('/api/db', async (req, res) => {
    const userId = resolveUserIdFromRequest(req);
    const userName = typeof req.query.userName === 'string' ? req.query.userName : undefined;
    const userRole = typeof req.query.userRole === 'string' ? req.query.userRole : undefined;
    try {
      const db = await enqueueDbTask(() =>
        readOrSeedUserDb(userId, { userName, userRole })
      );
      res.json({
        db,
        userId,
        storagePath: `data/users/${userId}.json`,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Không thể đọc cơ sở dữ liệu JSON của người dùng.',
      });
    }
  });

  app.put('/api/db', async (req, res) => {
    const userId = resolveUserIdFromRequest(req);
    const payload = req.body as unknown;
    if (!isValidChronosDbPayload(payload)) {
      res.status(400).json({ error: 'Dữ liệu ChronosDatabase không hợp lệ.' });
      return;
    }
    try {
      const saved = await enqueueDbTask(() => writeUserDbAtomic(userId, payload));
      res.json({
        db: saved,
        userId,
        storagePath: `data/users/${userId}.json`,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Không thể ghi cơ sở dữ liệu JSON xuống ổ đĩa.',
      });
    }
  });

  app.post('/api/db/reset', async (req, res) => {
    const userId = resolveUserIdFromRequest(req);
    const body = (req.body ?? {}) as {
      userName?: string;
      userRole?: string;
      workspaceName?: string;
    };
    try {
      const fresh = await enqueueDbTask(() =>
        writeUserDbAtomic(
          userId,
          createInitialChronosDatabase({
            userId,
            userName: body.userName,
            userRole: body.userRole,
            workspaceName: body.workspaceName,
          })
        )
      );
      res.json({
        db: fresh,
        userId,
        storagePath: `data/users/${userId}.json`,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Không thể khôi phục dữ liệu mẫu.',
      });
    }
  });

  app.get('/api/export/json', async (req, res) => {
    const userId = resolveUserIdFromRequest(req);
    try {
      const db = await enqueueDbTask(() => readOrSeedUserDb(userId));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="chronosflow-${userId}-${db.baseDateISO}.json"`
      );
      res.send(JSON.stringify(db, null, 2));
    } catch {
      res.status(500).json({ error: 'Lỗi xuất file JSON.' });
    }
  });

  app.get('/api/export/csv', async (req, res) => {
    const userId = resolveUserIdFromRequest(req);
    try {
      const db = await enqueueDbTask(() => readOrSeedUserDb(userId));
      const projectMap = new Map(db.projects.map((p) => [p.id, p.name]));
      const memberMap = new Map(db.teamMembers.map((m) => [m.id, m.name]));

      const headers = [
        'Mã Task',
        'Tên công việc',
        'Dự án',
        'Người phụ trách',
        'Trạng thái',
        'Tải trí lực',
        'Ước lượng (phút)',
        'Thực tế (phút)',
        'Chênh lệch (phút)',
      ];
      const rows = db.tasks.map((t) => [
        csvEscape(t.id),
        csvEscape(t.title),
        csvEscape(projectMap.get(t.projectId) ?? t.projectId),
        csvEscape(memberMap.get(t.assigneeId) ?? t.assigneeId),
        csvEscape(t.status),
        csvEscape(t.cognitiveLoad),
        csvEscape(t.estimatedMinutes),
        csvEscape(t.actualMinutes),
        csvEscape(t.actualMinutes - t.estimatedMinutes),
      ]);

      const csvBody = '\uFEFF' + [headers.map(csvEscape).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="chronosflow-${userId}-${db.baseDateISO}.csv"`
      );
      res.send(csvBody);
    } catch {
      res.status(500).json({ error: 'Lỗi xuất báo cáo Timesheet CSV.' });
    }
  });

  app.post('/api/ai/coach', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Bộ máy Auto-Rescheduler thuật toán cục bộ vẫn hoạt động đầy đủ.',
      });
      return;
    }

    const userId = resolveUserIdFromRequest(req);
    try {
      const db = await enqueueDbTask(() => readOrSeedUserDb(userId));
      const dayOffset = typeof req.body?.dayOffset === 'number' ? req.body.dayOffset : 0;
      const dayBlocks = db.blocks
        .filter((b) => b.dayOffset === dayOffset)
        .sort((a, b) => a.startMin - b.startMin);

      const stats = computeDeepVsShallowStats(dayBlocks);
      const scheduleSummary = dayBlocks
        .map(
          (b) =>
            `- ${formatMinToHHMM(b.startMin)}–${formatMinToHHMM(b.startMin + b.durationMin)} | ${b.title} [${b.flexType}, trí lực: ${b.cognitiveLoad}]`
        )
        .join('\n');

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Bạn là cố vấn quản trị thời gian và năng lượng sinh học của ChronosFlow cho người dùng ${db.userName}.
Hãy phân tích lịch trình ngày hôm nay và đưa ra 3 gợi ý ngắn gọn, thực tế bằng tiếng Việt:
- Đỉnh cao trí tuệ: ${formatMinToHHMM(db.energyProfile.peakStartMin)} - ${formatMinToHHMM(db.energyProfile.peakEndMin)}
- Trũng năng lượng: ${formatMinToHHMM(db.energyProfile.troughStartMin)} - ${formatMinToHHMM(db.energyProfile.troughEndMin)}
- Tỷ lệ Deep Work hiện tại: ${stats.deepRatioPct}%
Lịch trình:
${scheduleSummary || '(Chưa có khối thời gian nào)'}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              energyRiskLevel: { type: Type.STRING },
            },
            required: ['headline', 'recommendations', 'energyRiskLevel'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        res.status(502).json({ error: 'Gemini API không trả về nội dung.' });
        return;
      }

      res.json(JSON.parse(text));
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Lỗi kết nối Gemini API trên máy chủ.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(distDir, {
        setHeaders: (res, filePath) => {
          const base = path.basename(filePath);
          if (
            base === 'index.html' ||
            base === 'sw.js' ||
            base === 'registerSW.js' ||
            base === 'manifest.webmanifest' ||
            base === 'version.json'
          ) {
            applyNoCacheHeaders(res);
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      applyNoCacheHeaders(res);
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ChronosFlow] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[ChronosFlow] Per-User JSON DB Dir: ${USERS_DIR}`);
  });
}

startServer().catch((err) => {
  console.error('[ChronosFlow] Fatal server startup error:', err);
  process.exit(1);
});
