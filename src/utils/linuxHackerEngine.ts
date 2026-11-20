export type HackerMode = 'speed' | 'practice';

export type KnowledgeDomainId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface KnowledgeDomainDef {
  id: KnowledgeDomainId;
  shortName: string;
  title: string;
  subtitle: string;
  color: string;
}

export const KNOWLEDGE_DOMAINS: readonly KnowledgeDomainDef[] = [
  { id: 1, shortName: '1. Linux Cơ Bản', title: '1. Linux Fundamentals', subtitle: 'Tệp ẩn, thư mục, lọc log (ls, cd, grep, tail, find)', color: '#4ADE80' },
  { id: 2, shortName: '2. Bash Script', title: '2. Bash Scripting', subtitle: 'Tự động hóa, chmod +x, pipe |, biến môi trường', color: '#38BDF8' },
  { id: 3, shortName: '3. SysAdmin', title: '3. System Administration', subtitle: 'Tiến trình, ổ đĩa, systemd, cron (ps, kill, df, rm)', color: '#FBBF24' },
  { id: 4, shortName: '4. Networking', title: '4. Networking', subtitle: 'Cổng socket, kiểm tra mạng, nối mạch ASCII (ss, ip, ping)', color: '#22D3EE' },
  { id: 5, shortName: '5. Docker', title: '5. Docker & Container', subtitle: 'Quản lý container (docker ps, logs, exec, restart)', color: '#60A5FA' },
  { id: 6, shortName: '6. Web & Deploy', title: '6. Web Server & Deployment', subtitle: 'Cấu hình Nginx, kiểm tra HTTP, deploy (nginx -t, curl, pm2)', color: '#C084FC' },
  { id: 7, shortName: '7. Security', title: '7. Linux Security', subtitle: 'Tường lửa UFW, phân quyền khóa SSH 600, giải mã Base64', color: '#FB7185' },
  { id: 8, shortName: '8. DevOps Cloud', title: '8. DevOps & Cloud', subtitle: 'Kubernetes & Hạ tầng (kubectl get/logs/scale, terraform)', color: '#F97316' },
];

export interface VirtualFile {
  path: string;
  name: string;
  dir: string;
  permissions: string;
  owner: string;
  size: string;
  hidden?: boolean;
  executable?: boolean;
  requiresExecToReveal?: boolean;
  isJunkBomb?: boolean;
  deleted?: boolean;
  content: string;
  execOutput?: string;
  highlightCode?: string;
}

export interface VirtualProcess {
  pid: number;
  user: string;
  cpu: string;
  mem: string;
  command: string;
  isThreat: boolean;
  killed: boolean;
  traceBoostPerSec: number;
}

export interface VirtualPort {
  port: number;
  proto: 'tcp' | 'udp';
  service: string;
  state: 'OPEN' | 'VULN' | 'LOCKED';
  bypassed: boolean;
  needsBypass: boolean;
  note: string;
}

export interface AsciiBridgeNode {
  id: string;
  port: number;
  label: string;
  connected: boolean;
  requiresBypassPort?: number;
}

export interface VirtualContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string;
  logs: string;
  restarted: boolean;
}

export interface VirtualK8sPod {
  name: string;
  ready: string;
  status: 'Running' | 'CrashLoopBackOff' | 'Pending';
  restarts: number;
  logs: string;
}

export interface UbuntuLessonTip {
  cmd: string;
  syntax: string;
  meaning: string;
}

export interface UbuntuCodexEntry {
  key: string;
  domainId: KnowledgeDomainId;
  cmd: string;
  title: string;
  desc: string;
}

export const UBUNTU_CODEX: readonly UbuntuCodexEntry[] = [
  { key: 'ls', domainId: 1, cmd: 'ls -la', title: 'Liệt kê tệp & tệp ẩn', desc: 'Hiển thị cả tệp ẩn bắt đầu bằng dấu chấm (.) và quyền truy cập.' },
  { key: 'cd', domainId: 1, cmd: 'cd / pwd', title: 'Điều hướng thư mục', desc: 'Di chuyển giữa các thư mục Linux và kiểm tra vị trí hiện tại.' },
  { key: 'cat', domainId: 1, cmd: 'cat / tail', title: 'Đọc & soi đuôi file log', desc: 'In nội dung tệp (cat) hoặc đọc nhanh N dòng cuối (tail -n).' },
  { key: 'grep', domainId: 1, cmd: 'grep <từ>', title: 'Lọc log cực nhanh', desc: 'Tìm chính xác dòng chứa từ khóa giữa hàng nghìn dòng nhiễu.' },
  { key: 'find', domainId: 1, cmd: 'find / -name', title: 'Tìm tệp toàn hệ thống', desc: 'Quét đệ quy mọi thư mục để truy tìm khóa hoặc cấu hình thất lạc.' },
  { key: 'chmod', domainId: 2, cmd: 'chmod +x', title: 'Cấp quyền chạy script', desc: 'Thêm cờ thực thi (x) cho shell script và thực thi ./script.sh.' },
  { key: 'pipe', domainId: 2, cmd: 'cmd1 | cmd2', title: 'Ống dẫn Unix Pipe', desc: 'Truyền trực tiếp kết quả lệnh trước vào lệnh sau để lọc đa tầng.' },
  { key: 'env', domainId: 2, cmd: 'env / export', title: 'Biến môi trường Shell', desc: 'Đọc cấu hình bí mật từ env hoặc thiết lập biến với export.' },
  { key: 'ps', domainId: 3, cmd: 'ps aux', title: 'Giám sát tiến trình', desc: 'Soi toàn bộ PID, User và mức %CPU đang ngốn tài nguyên.' },
  { key: 'kill', domainId: 3, cmd: 'kill -9 PID', title: 'Tiêu diệt tiến trình', desc: 'Gửi tín hiệu SIGKILL ngắt ngay tiến trình truy vết hoặc bị treo.' },
  { key: 'df', domainId: 3, cmd: 'df -h / rm', title: 'Ổ đĩa & Dọn tệp rác', desc: 'Kiểm tra dung lượng phân vùng (df -h) và xóa tệp rác (rm).' },
  { key: 'systemctl', domainId: 3, cmd: 'systemctl', title: 'Quản trị Systemd & Cron', desc: 'Xem trạng thái/khởi động lại dịch vụ và kiểm tra crontab -l.' },
  { key: 'ss', domainId: 4, cmd: 'ss -tulpn', title: 'Quét cổng Socket mạng', desc: 'Xem các cổng TCP/UDP đang lắng nghe cùng tiến trình sở hữu.' },
  { key: 'ip', domainId: 4, cmd: 'ip a / ping', title: 'Kiểm tra IP & Kết nối', desc: 'Xem giao diện mạng eth0 và kiểm tra độ trễ gói tin.' },
  { key: 'docker_ps', domainId: 5, cmd: 'docker ps / logs', title: 'Soi Container & Log', desc: 'Liệt kê các container đang chạy và đọc nhật ký lỗi bên trong.' },
  { key: 'docker_exec', domainId: 5, cmd: 'docker exec / restart', title: 'Can thiệp Container', desc: 'Chạy lệnh trực tiếp bên trong container hoặc khởi động lại nó.' },
  { key: 'nginx', domainId: 6, cmd: 'nginx -t / reload', title: 'Kiểm tra & Nạp Web Server', desc: 'Xác thực cú pháp cấu hình Nginx trước khi reload không gián đoạn.' },
  { key: 'curl', domainId: 6, cmd: 'curl -I / pm2', title: 'Kiểm tra HTTP & Deploy', desc: 'Gửi HTTP HEAD request kiểm tra status code và quản lý tiến trình app.' },
  { key: 'ufw', domainId: 7, cmd: 'ufw status / allow', title: 'Tường lửa UFW Security', desc: 'Kiểm tra rule tường lửa, chặn cổng tấn công & siết quyền SSH 600.' },
  { key: 'base64', domainId: 7, cmd: 'base64 -d / auth.log', title: 'Giải mã & Truy vết xâm nhập', desc: 'Giải mã payload Base64 và lọc IP tấn công brute-force SSH.' },
  { key: 'kubectl', domainId: 8, cmd: 'kubectl get/logs/scale', title: 'Điều phối Kubernetes', desc: 'Kiểm tra Pod lỗi CrashLoopBackOff, xem log và scale replica.' },
  { key: 'terraform', domainId: 8, cmd: 'terraform apply', title: 'Hạ tầng dưới dạng Mã (IaC)', desc: 'Triển khai và đồng bộ cụm server đám mây bằng Terraform.' },
];

export interface LinuxMissionDefinition {
  id: number;
  domainId: KnowledgeDomainId;
  codeName: string;
  title: string;
  subtitle: string;
  briefing: string;
  ubuntuTopic: string;
  baseTracePerSec: number;
  initialCwd: string;
  targetToken: string;
  requireTargetDir?: string;
  requireExecFile?: string;
  requireServiceRestart?: string;
  requireSafeEnvVar?: string;
  requireJunkClean?: boolean;
  requireBase64Decode?: string;
  requireDockerInspectOrRestart?: string;
  requireNginxValidate?: boolean;
  requireK8sScale?: boolean;
  requireTerraformApply?: boolean;
  envVars?: Record<string, string>;
  crontabLines?: string[];
  diskUsagePct?: number;
  containers?: VirtualContainer[];
  k8sPods?: VirtualK8sPod[];
  ufwRules?: string[];
  files: VirtualFile[];
  processes: VirtualProcess[];
  ports: VirtualPort[];
  bridges: AsciiBridgeNode[];
  lessonTips: UbuntuLessonTip[];
  quickCommands: string[];
}

export interface TerminalLogLine {
  id: string;
  kind: 'cmd' | 'info' | 'success' | 'warn' | 'error' | 'noise' | 'ascii' | 'hint';
  text: string;
}

export interface MissionRuntimeState {
  missionIndex: number;
  cwd: string;
  tracePercent: number;
  traceFreezeTimer: number;
  combo: number;
  maxCombo: number;
  exploitPoints: number;
  score: number;
  commandsExecuted: number;
  validCommandsCount: number;
  mistakesCount: number;
  learnedCommands: string[];
  files: VirtualFile[];
  processes: VirtualProcess[];
  ports: VirtualPort[];
  bridges: AsciiBridgeNode[];
  containers: VirtualContainer[];
  k8sPods: VirtualK8sPod[];
  envVars: Record<string, string>;
  diskUsagePct: number;
  visitedTargetDir: boolean;
  scannedPorts: boolean;
  inspectedProcesses: boolean;
  executedScript: boolean;
  restartedService: boolean;
  safeEnvSet: boolean;
  cleanedJunk: boolean;
  decodedCipher: boolean;
  dockerHandled: boolean;
  nginxValidated: boolean;
  k8sScaled: boolean;
  terraformApplied: boolean;
  crackedToken: boolean;
  logs: TerminalLogLine[];
  missionElapsedSec: number;
}

export interface MissionObjectivesStatus {
  steps: {
    id: string;
    label: string;
    done: boolean;
  }[];
  allComplete: boolean;
}

export const LINUX_MISSIONS: readonly LinuxMissionDefinition[] = [
  // === 1. LINUX FUNDAMENTALS ===
  {
    id: 1,
    domainId: 1,
    codeName: 'L1-RECON-01',
    title: 'Màn 1 · Trinh Sát Tệp Ẩn',
    subtitle: 'Linux Cơ Bản: ls -la, cat & grep',
    briefing:
      'Đột nhập nút Ubuntu đầu tiên. Nhật ký chứa mã lỗi bị ẩn bằng dấu chấm. Gõ "ls -la" để thấy file ẩn, lọc bằng "grep ERR .auth_noise.log" rồi bẻ khóa bằng "crack <MÃ>"!',
    ubuntuTopic: 'Tệp ẩn (ls -la) & lọc log nhiễu (grep)',
    baseTracePerSec: 1.05,
    initialCwd: '/home/ubuntu',
    targetToken: 'ERR_B74A',
    files: [
      {
        path: '/home/ubuntu/readme.txt',
        name: 'readme.txt',
        dir: '/home/ubuntu',
        permissions: '-rw-r--r--',
        owner: 'ubuntu',
        size: '412B',
        content: 'File ẩn bắt đầu bằng dấu chấm (.). Dùng "ls -la" rồi "grep ERR .auth_noise.log".',
      },
      {
        path: '/home/ubuntu/.auth_noise.log',
        name: '.auth_noise.log',
        dir: '/home/ubuntu',
        permissions: '-rw-------',
        owner: 'ubuntu',
        size: '2.4K',
        hidden: true,
        highlightCode: 'ERR_B74A',
        content: [
          '[00:01:02] 0x8F2A :: NOISE ## sys_ping=OK :: dummy=WARN_102',
          '[00:01:05] [CRITICAL_ERR] AUTH_GATE_FAULT => TOKEN=[ERR_B74A] :: bypass_ready',
          '[00:01:06] 0x44A0 :: decoy=FAKE_009 :: irq_balance=nominal',
        ].join('\n'),
      },
    ],
    processes: [
      { pid: 101, user: 'root', cpu: '0.2', mem: '0.5', command: '/sbin/init --splash', isThreat: false, killed: false, traceBoostPerSec: 0 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'ls -la', syntax: 'ls -la', meaning: 'Hiển thị mọi tệp kể cả tệp ẩn bắt đầu bằng dấu chấm (.).' },
      { cmd: 'grep ERR .auth_noise.log', syntax: 'grep <từ> <file>', meaning: 'Lọc ngay dòng chứa ERR giữa hàng loạt log nhiễu.' },
      { cmd: 'crack ERR_B74A', syntax: 'crack <MÃ>', meaning: 'Nạp mã vừa tìm được để mở khóa.' },
    ],
    quickCommands: ['ls -la', 'grep ERR .auth_noise.log', 'crack ERR_B74A'],
  },
  {
    id: 2,
    domainId: 1,
    codeName: 'L1-NAV-02',
    title: 'Màn 2 · Điều Hướng & Soi Đuôi Log',
    subtitle: 'Linux Cơ Bản: cd, pwd, tail & find',
    briefing:
      'File sao lưu khóa bị giấu sâu trong cây thư mục! Dùng "find / -name *.log" hoặc "cd /var/backups/secret", rồi xem 3 dòng cuối bằng "tail -n 3 backup.log"!',
    ubuntuTopic: 'Tìm file (find), điều hướng (cd, pwd) & soi đuôi log (tail)',
    baseTracePerSec: 1.15,
    initialCwd: '/home/ubuntu',
    requireTargetDir: '/var/backups/secret',
    targetToken: 'BAK_209K',
    files: [
      {
        path: '/var/backups/secret/backup.log',
        name: 'backup.log',
        dir: '/var/backups/secret',
        permissions: '-rw-r-----',
        owner: 'root',
        size: '6.8K',
        highlightCode: 'BAK_209K',
        content: [
          '[18:00:01] rsync: syncing /etc/ssl -> /var/backups/secret [noise_01]',
          '[18:05:11] rsync: checksum verified 1244 files [decoy=FAKE_11]',
          '[18:15:09] snapshot_ok :: temp_id=0021',
          '[18:18:55] [VAULT_SEAL] BACKUP_RECOVERY_TOKEN=[BAK_209K] :: status=READY',
          '[18:19:00] backup daemon finished in 0.84s.',
        ].join('\n'),
      },
    ],
    processes: [
      { pid: 144, user: 'root', cpu: '0.5', mem: '0.9', command: '/usr/sbin/rsnapshot', isThreat: false, killed: false, traceBoostPerSec: 0 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'find / -name *.log', syntax: 'find / -name *.log', meaning: 'Tìm tập tin theo mẫu tên trên toàn cây thư mục.' },
      { cmd: 'cd /var/backups/secret', syntax: 'cd <đường_dẫn>', meaning: 'Chuyển tới thư mục mục tiêu.' },
      { cmd: 'tail -n 3 backup.log', syntax: 'tail -n 3 <file>', meaning: 'Đọc 3 dòng mới nhất ở cuối log.' },
    ],
    quickCommands: ['find / -name *.log', 'cd /var/backups/secret', 'tail -n 3 backup.log', 'crack BAK_209K'],
  },

  // === 2. BASH SCRIPTING ===
  {
    id: 3,
    domainId: 2,
    codeName: 'L2-CHMOD-03',
    title: 'Màn 3 · Tự Động Hóa Bash & Pipe',
    subtitle: 'Bash Scripting: chmod +x, ./script.sh & Pipe |',
    briefing:
      'Script tự động decrypt.sh bị khóa quyền chạy! Cấp quyền bằng "chmod +x decrypt.sh", chạy "./decrypt.sh" rồi dùng pipe "cat stream.log | grep TOKEN" hoặc đọc trực tiếp!',
    ubuntuTopic: 'Phân quyền chạy script (chmod +x, ./) & Unix Pipe (|)',
    baseTracePerSec: 1.3,
    initialCwd: '/home/ubuntu/scripts',
    targetToken: 'HEX_9X3',
    requireExecFile: '/home/ubuntu/scripts/decrypt.sh',
    files: [
      {
        path: '/home/ubuntu/scripts/decrypt.sh',
        name: 'decrypt.sh',
        dir: '/home/ubuntu/scripts',
        permissions: '-rw-r--r--',
        owner: 'ubuntu',
        size: '1.2K',
        executable: false,
        requiresExecToReveal: true,
        highlightCode: 'HEX_9X3',
        content: '#!/bin/bash\n# Cấp quyền thực thi với chmod +x decrypt.sh!',
        execOutput: '>>> BASH AUTOMATION OK\n0x00B4 :: [DECRYPTED_KEY] => TOKEN=[HEX_9X3]',
      },
    ],
    processes: [
      { pid: 330, user: 'root', cpu: '0.9', mem: '1.4', command: '/usr/sbin/auditd', isThreat: false, killed: false, traceBoostPerSec: 0 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'ls -l', syntax: 'ls -l', meaning: 'Kiểm tra cờ quyền thực thi (-rwxr-xr-x).' },
      { cmd: 'chmod +x decrypt.sh', syntax: 'chmod +x <script>', meaning: 'Mở quyền thực thi cho tập lệnh Bash.' },
      { cmd: './decrypt.sh', syntax: './decrypt.sh', meaning: 'Chạy kịch bản tự động hóa tại thư mục hiện tại.' },
    ],
    quickCommands: ['ls -l', 'chmod +x decrypt.sh', './decrypt.sh', 'crack HEX_9X3'],
  },
  {
    id: 4,
    domainId: 2,
    codeName: 'L2-ENVPIPE-04',
    title: 'Màn 4 · Biến Môi Trường & Lọc Pipe',
    subtitle: 'Bash Scripting: env, export SAFE_MODE=1 & | grep',
    briefing:
      'Quản trị viên bỏ quên mã trong biến môi trường! Dùng "env | grep TOKEN" để soi mã ngay, kích hoạt "export SAFE_MODE=1" làm chậm truy vết và bẻ khóa!',
    ubuntuTopic: 'Biến môi trường Shell (env, export) & Ống dẫn Pipe (|)',
    baseTracePerSec: 1.45,
    initialCwd: '/home/ubuntu',
    targetToken: 'ENV_308R',
    requireSafeEnvVar: 'SAFE_MODE=1',
    envVars: {
      SHELL: '/bin/bash',
      USER: 'ubuntu',
      VAULT_SECRET_TOKEN: 'ENV_308R',
      SAFE_MODE: '0',
    },
    files: [
      {
        path: '/home/ubuntu/.bashrc',
        name: '.bashrc',
        dir: '/home/ubuntu',
        permissions: '-rw-r--r--',
        owner: 'ubuntu',
        size: '840B',
        hidden: true,
        content: '# Dùng "env | grep TOKEN" và "export SAFE_MODE=1"',
      },
    ],
    processes: [
      { pid: 577, user: 'secops', cpu: '38.4', mem: '3.0', command: '/usr/bin/env-auditor', isThreat: true, killed: false, traceBoostPerSec: 1.15 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'env | grep TOKEN', syntax: 'env | grep <từ>', meaning: 'Truyền danh sách biến môi trường qua Pipe để lọc nhanh.' },
      { cmd: 'export SAFE_MODE=1', syntax: 'export TÊN=GIÁ_TRỊ', meaning: 'Đặt biến môi trường tàng hình giảm 35% tốc độ Trace.' },
      { cmd: 'kill -9 577', syntax: 'kill -9 <PID>', meaning: 'Hạ tiến trình kiểm tra môi trường.' },
    ],
    quickCommands: ['env | grep TOKEN', 'export SAFE_MODE=1', 'kill -9 577', 'crack ENV_308R'],
  },

  // === 3. SYSTEM ADMINISTRATION ===
  {
    id: 5,
    domainId: 3,
    codeName: 'L3-SYSADMIN-05',
    title: 'Màn 5 · Săn Tiến Trình & Dọn Ổ Đĩa',
    subtitle: 'SysAdmin: ps aux, kill -9, df -h & rm',
    briefing:
      'Tiến trình watchdog PID 404 đang đẩy Trace phi mã và ổ đĩa /tmp đầy 99%! Dùng "ps aux", "kill -9 404", "df -h", xóa rác bằng "rm malware_bomb.tmp" rồi đọc khóa!',
    ubuntuTopic: 'Quản trị tiến trình (ps, kill -9) & dung lượng đĩa (df -h, rm)',
    baseTracePerSec: 1.15,
    initialCwd: '/tmp',
    targetToken: 'SYS_404Z',
    requireJunkClean: true,
    diskUsagePct: 99,
    files: [
      {
        path: '/tmp/malware_bomb.tmp',
        name: 'malware_bomb.tmp',
        dir: '/tmp',
        permissions: '-rw-rw-rw-',
        owner: 'secops',
        size: '48.2G',
        isJunkBomb: true,
        content: 'FILE RÁC 48.2GB! Xóa bằng "rm malware_bomb.tmp".',
      },
      {
        path: '/tmp/syslog.vault',
        name: 'syslog.vault',
        dir: '/tmp',
        permissions: '-rw-r--r--',
        owner: 'root',
        size: '1.1K',
        highlightCode: 'SYS_404Z',
        content: 'Nov 19 auth-vault: [OK] ADMIN_RECOVERY_TOKEN=[SYS_404Z]',
      },
    ],
    processes: [
      { pid: 404, user: 'secops', cpu: '74.5', mem: '9.2', command: '/usr/bin/trace-watchdog', isThreat: true, killed: false, traceBoostPerSec: 2.0 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'ps aux', syntax: 'ps aux', meaning: 'Soi toàn bộ tiến trình đang ăn CPU cao bất thường.' },
      { cmd: 'kill -9 404', syntax: 'kill -9 <PID>', meaning: 'Diệt tức thì tiến trình truy vết PID 404 (-14% Trace).' },
      { cmd: 'df -h', syntax: 'df -h', meaning: 'Kiểm tra phân vùng nào đầy 99% trước khi dùng "rm".' },
    ],
    quickCommands: ['ps aux', 'kill -9 404', 'df -h', 'rm malware_bomb.tmp', 'cat syslog.vault', 'crack SYS_404Z'],
  },
  {
    id: 6,
    domainId: 3,
    codeName: 'L3-SYSTEMD-06',
    title: 'Màn 6 · Cấp Cứu Dịch Vụ Systemd & Cron',
    subtitle: 'SysAdmin: systemctl status/restart & crontab -l',
    briefing:
      'Cronjob ngầm treo dịch vụ systemd nginx-shield tại PID 709! Kiểm tra "crontab -l" & "systemctl status nginx-shield", hạ PID 709 rồi "systemctl restart nginx-shield"!',
    ubuntuTopic: 'Quản trị dịch vụ Systemd & tác vụ hẹn giờ Crontab',
    baseTracePerSec: 1.45,
    initialCwd: '/etc/systemd',
    targetToken: 'SVC_61M',
    requireServiceRestart: 'nginx-shield',
    crontabLines: [
      '*/1 * * * * /usr/local/bin/deadlock-trigger --pid=709',
      '# Dùng kill -9 709 rồi systemctl restart nginx-shield',
    ],
    files: [
      {
        path: '/etc/systemd/journal.err',
        name: 'journal.err',
        dir: '/etc/systemd',
        permissions: '-rw-r--r--',
        owner: 'root',
        size: '1.9K',
        highlightCode: 'SVC_61M',
        content: 'systemd[1]: nginx-shield.service locked by PID 709. Token=[SVC_61M] after restart.',
      },
    ],
    processes: [
      { pid: 709, user: 'root', cpu: '89.2', mem: '12.4', command: 'nginx-shield --deadlock-beacon', isThreat: true, killed: false, traceBoostPerSec: 1.7 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'crontab -l', syntax: 'crontab -l', meaning: 'Liệt kê các lịch chạy tự động trên hệ thống.' },
      { cmd: 'systemctl status nginx-shield', syntax: 'systemctl status <svc>', meaning: 'Kiểm tra lỗi và trạng thái dịch vụ.' },
      { cmd: 'systemctl restart nginx-shield', syntax: 'systemctl restart <svc>', meaning: 'Khởi động lại dịch vụ sau khi diệt PID 709.' },
    ],
    quickCommands: ['crontab -l', 'systemctl status nginx-shield', 'kill -9 709', 'systemctl restart nginx-shield', 'crack SVC_61M'],
  },

  // === 4. NETWORKING ===
  {
    id: 7,
    domainId: 4,
    codeName: 'L4-NETPORT-07',
    title: 'Màn 7 · Quét Cổng Socket & Nối Mạch',
    subtitle: 'Networking: ss -tulpn, bypass -p & Cầu ASCII',
    briefing:
      'Tường lửa đang khóa đường truyền lõi. Chạy "ss -tulpn" soi cổng đang mở, thông cổng lỗ hổng bằng "bypass -p 80" và nối mạch ASCII :80 -> :443!',
    ubuntuTopic: 'Kiểm tra Socket mạng (ss -tulpn) & thông tuyến cổng',
    baseTracePerSec: 1.45,
    initialCwd: '/etc/net',
    targetToken: 'PORT_80X',
    files: [
      {
        path: '/etc/net/firewall.rules',
        name: 'firewall.rules',
        dir: '/etc/net',
        permissions: '-rw-r--r--',
        owner: 'root',
        size: '880B',
        content: '[PORT_LOG] Cổng HTTP 80 hở · bypass_key=[PORT_80X]',
      },
    ],
    processes: [],
    ports: [
      { port: 22, proto: 'tcp', service: 'openssh', state: 'LOCKED', bypassed: false, needsBypass: false, note: 'Bảo vệ RSA-4096' },
      { port: 80, proto: 'tcp', service: 'nginx-proxy', state: 'VULN', bypassed: false, needsBypass: true, note: 'Hở lỗ hổng · Token: PORT_80X' },
    ],
    bridges: [
      { id: 'B1', port: 80, label: 'Cổng HTTP :80', connected: false, requiresBypassPort: 80 },
      { id: 'B2', port: 443, label: 'Kênh Tunnel :443', connected: false },
    ],
    lessonTips: [
      { cmd: 'ss -tulpn', syntax: 'ss -tulpn', meaning: 'Xem toàn bộ cổng TCP/UDP đang lắng nghe trên Linux.' },
      { cmd: 'bypass -p 80', syntax: 'bypass -p <cổng>', meaning: 'Xuyên tường lửa qua cổng VULN.' },
      { cmd: 'link 80', syntax: 'link <cổng>', meaning: 'Nối dây cầu mạng ASCII qua cổng vừa mở.' },
    ],
    quickCommands: ['ss -tulpn', 'bypass -p 80', 'link 80', 'link 443', 'crack PORT_80X'],
  },
  {
    id: 8,
    domainId: 4,
    codeName: 'L4-ROUTE-08',
    title: 'Màn 8 · Định Tuyến IP & Proxy Tunnel',
    subtitle: 'Networking: ip a, ping, find .key & ASCII Bridge',
    briefing:
      'Kiểm tra cấu hình card mạng bằng "ip a", tìm khóa tunnel bằng "find / -name *.key", diệt sniffer PID 812, bypass cổng 3128 và nối cầu ASCII!',
    ubuntuTopic: 'Giao diện mạng (ip a, ping) & định tuyến Proxy 3128',
    baseTracePerSec: 1.5,
    initialCwd: '/home/ubuntu',
    targetToken: 'SSH_77V',
    files: [
      {
        path: '/opt/vault/node7.key',
        name: 'node7.key',
        dir: '/opt/vault',
        permissions: '-r--------',
        owner: 'ubuntu',
        size: '512B',
        highlightCode: 'SSH_77V',
        content: 'PORT_OPEN=3128 :: SQUID_TUNNEL :: TOKEN=[SSH_77V]',
      },
    ],
    processes: [
      { pid: 812, user: 'secops', cpu: '52.0', mem: '4.4', command: '/usr/bin/packet-sniffer --eth0', isThreat: true, killed: false, traceBoostPerSec: 1.5 },
    ],
    ports: [
      { port: 3128, proto: 'tcp', service: 'squid-proxy', state: 'VULN', bypassed: false, needsBypass: true, note: 'Proxy Tunnel' },
    ],
    bridges: [
      { id: 'B1', port: 3128, label: 'Proxy :3128', connected: false, requiresBypassPort: 3128 },
      { id: 'B2', port: 22, label: 'SSH :22', connected: false },
    ],
    lessonTips: [
      { cmd: 'ip a', syntax: 'ip a (hoặc ping)', meaning: 'Xem địa chỉ IP & card mạng đang gắn.' },
      { cmd: 'find / -name *.key', syntax: 'find / -name *.key', meaning: 'Định vị tệp khóa tunnel trên server.' },
      { cmd: 'bypass -p 3128', syntax: 'bypass -p 3128', meaning: 'Thông chốt Proxy :3128 -> :22.' },
    ],
    quickCommands: ['ip a', 'find / -name *.key', 'cat /opt/vault/node7.key', 'kill -9 812', 'bypass -p 3128', 'link 3128', 'link 22', 'crack SSH_77V'],
  },

  // === 5. DOCKER & CONTAINER ===
  {
    id: 9,
    domainId: 5,
    codeName: 'L5-DOCKER-09',
    title: 'Màn 9 · Điều Tra Container Docker Lỗi',
    subtitle: 'Docker & Container: docker ps & docker logs',
    briefing:
      'Microservice đóng gói trong Docker đang rò rỉ khóa xác thực! Liệt kê container bằng "docker ps", xem nhật ký bằng "docker logs api-vault" rồi giải khóa!',
    ubuntuTopic: 'Quản lý vòng đời Container (docker ps, docker logs)',
    baseTracePerSec: 1.5,
    initialCwd: '/srv/docker',
    targetToken: 'DCK_109P',
    containers: [
      {
        id: 'c8a291f0',
        name: 'api-vault',
        image: 'node:20-alpine',
        status: 'Up 42 mins (unhealthy)',
        ports: '0.0.0.0:3000->3000/tcp',
        restarted: false,
        logs: '[api-vault] WARN: vault_token_leak => TOKEN=[DCK_109P]\n[api-vault] Ready on :3000',
      },
      {
        id: 'f12c88a1',
        name: 'redis-cache',
        image: 'redis:7.2',
        status: 'Up 3 hours',
        ports: '6379/tcp',
        restarted: false,
        logs: 'Ready to accept connections tcp',
      },
    ],
    files: [
      {
        path: '/srv/docker/docker-compose.yml',
        name: 'docker-compose.yml',
        dir: '/srv/docker',
        permissions: '-rw-r--r--',
        owner: 'ubuntu',
        size: '620B',
        content: 'services:\n  api-vault:\n    image: node:20-alpine\n    ports: ["3000:3000"]',
      },
    ],
    processes: [],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'docker ps', syntax: 'docker ps', meaning: 'Xem tất cả container đang chạy, tên, image và cổng ánh xạ.' },
      { cmd: 'docker logs api-vault', syntax: 'docker logs <tên>', meaning: 'Đọc stdout/stderr bên trong container để truy lỗi ngay.' },
      { cmd: 'crack DCK_109P', syntax: 'crack DCK_109P', meaning: 'Nạp mã rò rỉ từ log Docker.' },
    ],
    quickCommands: ['docker ps', 'docker logs api-vault', 'cat docker-compose.yml', 'crack DCK_109P'],
  },
  {
    id: 10,
    domainId: 5,
    codeName: 'L5-EXEC-10',
    title: 'Màn 10 · Đột Nhập Shell Container Docker',
    subtitle: 'Docker & Container: docker exec & docker restart',
    briefing:
      'Khóa bí mật nằm bên trong container "auth-worker" đang treo! Dùng "docker exec auth-worker cat /secret.key", khởi động lại bằng "docker restart auth-worker" rồi thông cổng 5000!',
    ubuntuTopic: 'Thực thi lệnh trong container (docker exec) & phục hồi (restart)',
    baseTracePerSec: 1.55,
    initialCwd: '/srv/docker',
    targetToken: 'CNT_55X',
    requireDockerInspectOrRestart: 'auth-worker',
    containers: [
      {
        id: '9e4b11c2',
        name: 'auth-worker',
        image: 'ubuntu:24.04',
        status: 'Up 9 mins (stalled)',
        ports: '5000/tcp',
        restarted: false,
        logs: 'Waiting for container restart... secret stored at /secret.key',
      },
    ],
    files: [
      {
        path: '/secret.key',
        name: 'secret.key',
        dir: '/',
        permissions: '-r--------',
        owner: 'root',
        size: '128B',
        highlightCode: 'CNT_55X',
        content: 'CONTAINER_SECRET_TOKEN=[CNT_55X] :: restart auth-worker to unlock port 5000',
      },
    ],
    processes: [
      { pid: 642, user: 'root', cpu: '44.0', mem: '5.1', command: 'containerd-shim --loop', isThreat: true, killed: false, traceBoostPerSec: 1.2 },
    ],
    ports: [
      { port: 5000, proto: 'tcp', service: 'docker-api', state: 'VULN', bypassed: false, needsBypass: true, note: 'Cổng container API' },
    ],
    bridges: [
      { id: 'B1', port: 5000, label: 'Container :5000', connected: false, requiresBypassPort: 5000 },
    ],
    lessonTips: [
      { cmd: 'docker exec auth-worker cat /secret.key', syntax: 'docker exec <tên> <lệnh>', meaning: 'Chạy trực tiếp một lệnh Linux ngay trong container cô lập.' },
      { cmd: 'docker restart auth-worker', syntax: 'docker restart <tên>', meaning: 'Khởi động lại sạch sẽ container đang kẹt.' },
      { cmd: 'bypass -p 5000 && link 5000', syntax: 'bypass -p 5000 && link 5000', meaning: 'Thông chốt cổng container API.' },
    ],
    quickCommands: ['docker ps', 'docker exec auth-worker cat /secret.key', 'docker restart auth-worker', 'kill -9 642', 'bypass -p 5000', 'link 5000', 'crack CNT_55X'],
  },

  // === 6. WEB SERVER & DEPLOYMENT ===
  {
    id: 11,
    domainId: 6,
    codeName: 'L6-NGINX-11',
    title: 'Màn 11 · Sửa Lỗi Web Server Nginx',
    subtitle: 'Web Server: nginx -t, curl -I & reload nginx',
    briefing:
      'Trang web production đang báo lỗi 502! Kiểm tra cú pháp bằng "nginx -t", gửi request thử "curl -I http://localhost:80", nạp lại cấu hình "systemctl reload nginx" để lấy khóa!',
    ubuntuTopic: 'Kiểm thử cấu hình Nginx (nginx -t) & reload không downtime',
    baseTracePerSec: 1.55,
    initialCwd: '/etc/nginx/sites-enabled',
    targetToken: 'NGX_808W',
    requireNginxValidate: true,
    files: [
      {
        path: '/etc/nginx/sites-enabled/app.conf',
        name: 'app.conf',
        dir: '/etc/nginx/sites-enabled',
        permissions: '-rw-r--r--',
        owner: 'root',
        size: '780B',
        highlightCode: 'NGX_808W',
        content: 'server {\n  listen 80;\n  proxy_pass http://127.0.0.1:8080;\n  # DEPLOY_HEADER_KEY=[NGX_808W]\n}',
      },
    ],
    processes: [],
    ports: [
      { port: 80, proto: 'tcp', service: 'nginx-web', state: 'VULN', bypassed: false, needsBypass: true, note: 'Cổng HTTP Public' },
    ],
    bridges: [
      { id: 'B1', port: 80, label: 'Nginx :80', connected: false, requiresBypassPort: 80 },
    ],
    lessonTips: [
      { cmd: 'nginx -t', syntax: 'nginx -t', meaning: 'Kiểm tra file cấu hình Nginx xem có lỗi cú pháp trước khi nạp.' },
      { cmd: 'curl -I http://localhost', syntax: 'curl -I <url>', meaning: 'Kiểm tra HTTP Header trả về (200 OK / 502 Bad Gateway).' },
      { cmd: 'systemctl reload nginx', syntax: 'systemctl reload nginx', meaning: 'Áp dụng cấu hình web mới mà không rớt kết nối người dùng.' },
    ],
    quickCommands: ['nginx -t', 'cat app.conf', 'curl -I http://localhost', 'systemctl reload nginx', 'bypass -p 80', 'link 80', 'crack NGX_808W'],
  },
  {
    id: 12,
    domainId: 6,
    codeName: 'L6-DEPLOY-12',
    title: 'Màn 12 · Zero-Downtime Deploy App Node',
    subtitle: 'Deployment: git pull, pm2 status & curl -I',
    briefing:
      'Bản vá bảo mật mới đã có trên Git! Kéo code bằng "git pull", kiểm tra tiến trình Node bằng "pm2 status", khởi động lại "pm2 restart app" và bẻ khóa!',
    ubuntuTopic: 'Triển khai ứng dụng thực tế với Git, PM2 & Curl check',
    baseTracePerSec: 1.6,
    initialCwd: '/var/www/app',
    targetToken: 'DEP_99G',
    files: [
      {
        path: '/var/www/app/release.env',
        name: 'release.env',
        dir: '/var/www/app',
        permissions: '-rw-r--r--',
        owner: 'ubuntu',
        size: '310B',
        highlightCode: 'DEP_99G',
        content: 'APP_VERSION=v2.4.1\nDEPLOY_VERIFY_TOKEN=[DEP_99G]',
      },
    ],
    processes: [
      { pid: 722, user: 'ubuntu', cpu: '61.2', mem: '7.0', command: 'node old-leaky-build.js', isThreat: true, killed: false, traceBoostPerSec: 1.4 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'git pull', syntax: 'git pull', meaning: 'Cập nhật mã nguồn mới nhất từ kho Git xuống server Ubuntu.' },
      { cmd: 'pm2 status', syntax: 'pm2 status', meaning: 'Xem trạng thái các tiến trình Node.js đang phục vụ production.' },
      { cmd: 'pm2 restart app', syntax: 'pm2 restart <tên>', meaning: 'Khởi động lại ứng dụng sau khi pull code mới.' },
    ],
    quickCommands: ['git pull', 'pm2 status', 'kill -9 722', 'pm2 restart app', 'cat release.env', 'crack DEP_99G'],
  },

  // === 7. LINUX SECURITY ===
  {
    id: 13,
    domainId: 7,
    codeName: 'L7-UFWSEC-13',
    title: 'Màn 13 · Chặn Tấn Công SSH & Siết Quyền',
    subtitle: 'Linux Security: ufw status, grep auth.log & chmod 600',
    briefing:
      'Tin tặc đang vét cạn mật khẩu SSH! Kiểm tra tường lửa bằng "ufw status", lọc kẻ tấn công trong auth.log, siết quyền khóa riêng tư "chmod 600 id_rsa" và mở khóa!',
    ubuntuTopic: 'Phân tích xâm nhập (auth.log), tường lửa UFW & bảo vệ khóa SSH 600',
    baseTracePerSec: 1.65,
    initialCwd: '/home/ubuntu/.ssh',
    targetToken: 'SEC_600S',
    files: [
      {
        path: '/home/ubuntu/.ssh/id_rsa',
        name: 'id_rsa',
        dir: '/home/ubuntu/.ssh',
        permissions: '-rw-rw-rw-',
        owner: 'ubuntu',
        size: '1.6K',
        content: 'Cảnh báo: Quyền id_rsa quá lỏng! Hãy chạy "chmod 600 id_rsa" để chỉ chủ sở hữu đọc được.',
      },
      {
        path: '/var/log/auth.log',
        name: 'auth.log',
        dir: '/var/log',
        permissions: '-rw-r-----',
        owner: 'syslog',
        size: '5.4K',
        highlightCode: 'SEC_600S',
        content: [
          'sshd[2201]: Accepted publickey for ubuntu from 10.0.0.5',
          'sshd[2299]: Failed password for root from 185.220.101.9 :: ALERT_CODE=[SEC_600S]',
          'sshd[2304]: Connection closed by authenticating user root',
        ].join('\n'),
      },
    ],
    processes: [
      { pid: 805, user: 'root', cpu: '68.0', mem: '5.5', command: 'hydra-bruteforce-probe', isThreat: true, killed: false, traceBoostPerSec: 1.65 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'ufw status', syntax: 'ufw status', meaning: 'Kiểm tra danh sách cổng đang bật/chặn của tường lửa Ubuntu.' },
      { cmd: 'grep Failed /var/log/auth.log', syntax: 'grep Failed /var/log/auth.log', meaning: 'Truy vết các đợt dò mật khẩu trái phép qua SSH.' },
      { cmd: 'chmod 600 id_rsa', syntax: 'chmod 600 <key>', meaning: 'Bắt buộc khóa riêng tư SSH chỉ chủ sở hữu mới được đọc/ghi.' },
    ],
    quickCommands: ['ufw status', 'chmod 600 id_rsa', 'grep Failed /var/log/auth.log', 'kill -9 805', 'crack SEC_600S'],
  },
  {
    id: 14,
    domainId: 7,
    codeName: 'L7-CIPHER-14',
    title: 'Màn 14 · Phá Mật Mã Base64 & Cổng DB',
    subtitle: 'Linux Security: ls -la, echo ... | base64 -d & bypass',
    briefing:
      'Mật mã khóa Database bị mã hóa Base64 giấu trong file ẩn .cipher! Giải mã bằng "echo QjY0XzQ0Qw== | base64 -d", diệt PID 825, bypass cổng PostgreSQL 5432 và nối mạch ASCII!',
    ubuntuTopic: 'Giải mã Base64 trên terminal & bảo vệ cổng DB 5432',
    baseTracePerSec: 1.75,
    initialCwd: '/etc/postgres',
    targetToken: 'B64_44C',
    requireBase64Decode: 'QjY0XzQ0Qw==',
    files: [
      {
        path: '/etc/postgres/.cipher',
        name: '.cipher',
        dir: '/etc/postgres',
        permissions: '-rw-------',
        owner: 'postgres',
        size: '340B',
        hidden: true,
        highlightCode: 'QjY0XzQ0Qw==',
        content: 'PAYLOAD_BASE64="QjY0XzQ0Qw=="\nGiải mã bằng: echo QjY0XzQ0Qw== | base64 -d',
      },
    ],
    processes: [
      { pid: 825, user: 'secops', cpu: '48.1', mem: '4.0', command: '/usr/bin/cipher-watcher', isThreat: true, killed: false, traceBoostPerSec: 1.5 },
    ],
    ports: [
      { port: 5432, proto: 'tcp', service: 'postgresql', state: 'VULN', bypassed: false, needsBypass: true, note: 'Cổng DB mở tunnel' },
    ],
    bridges: [
      { id: 'B1', port: 5432, label: 'Postgres :5432', connected: false, requiresBypassPort: 5432 },
      { id: 'B2', port: 22, label: 'SSH Gateway :22', connected: false },
    ],
    lessonTips: [
      { cmd: 'echo QjY0XzQ0Qw== | base64 -d', syntax: 'echo <mã> | base64 -d', meaning: 'Giải mã chuỗi Base64 về văn bản gốc ngay trên dòng lệnh.' },
      { cmd: 'kill -9 825', syntax: 'kill -9 825', meaning: 'Hạ tiến trình giám sát mật mã.' },
      { cmd: 'bypass -p 5432 && link 5432', syntax: 'bypass -p 5432', meaning: 'Xuyên cổng PostgreSQL và nối cầu ASCII.' },
    ],
    quickCommands: ['ls -la', 'cat .cipher', 'echo QjY0XzQ0Qw== | base64 -d', 'kill -9 825', 'bypass -p 5432', 'link 5432', 'link 22', 'crack B64_44C'],
  },

  // === 8. DEVOPS & CLOUD ===
  {
    id: 15,
    domainId: 8,
    codeName: 'L8-K8S-15',
    title: 'Màn 15 · Giải Cứu Cụm Kubernetes',
    subtitle: 'DevOps & Cloud: kubectl get pods, logs & scale',
    briefing:
      'Một Pod trên cụm Kubernetes bị CrashLoopBackOff! Dùng "kubectl get pods" để định vị, xem log bằng "kubectl logs edge-api", mở rộng cụm với "kubectl scale --replicas=3" rồi crack khóa!',
    ubuntuTopic: 'Điều phối cụm Cloud với Kubernetes (kubectl get, logs, scale)',
    baseTracePerSec: 1.7,
    initialCwd: '/home/ubuntu/k8s',
    targetToken: 'K8S_33N',
    requireK8sScale: true,
    k8sPods: [
      {
        name: 'edge-api',
        ready: '0/1',
        status: 'CrashLoopBackOff',
        restarts: 7,
        logs: '[POD edge-api] OOMKilled :: CLUSTER_RECOVERY_KEY=[K8S_33N] · Scale to >=3 replicas!',
      },
      {
        name: 'ingress-gw',
        ready: '1/1',
        status: 'Running',
        restarts: 0,
        logs: 'Ingress TLS routing nominal.',
      },
    ],
    files: [
      {
        path: '/home/ubuntu/k8s/deploy.yaml',
        name: 'deploy.yaml',
        dir: '/home/ubuntu/k8s',
        permissions: '-rw-r--r--',
        owner: 'ubuntu',
        size: '540B',
        content: 'kind: Deployment\nmetadata:\n  name: edge-api\nspec:\n  replicas: 1',
      },
    ],
    processes: [
      { pid: 880, user: 'kube', cpu: '55.2', mem: '6.3', command: 'kube-probe-loop', isThreat: true, killed: false, traceBoostPerSec: 1.4 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'kubectl get pods', syntax: 'kubectl get pods', meaning: 'Kiểm tra trạng thái các Pod trong cụm Kubernetes.' },
      { cmd: 'kubectl logs edge-api', syntax: 'kubectl logs <tên_pod>', meaning: 'Soi nhật ký lỗi khiến Pod bị CrashLoopBackOff.' },
      { cmd: 'kubectl scale --replicas=3', syntax: 'kubectl scale --replicas=3', meaning: 'Tăng số lượng bản sao Pod để phục hồi tải Cloud.' },
    ],
    quickCommands: ['kubectl get pods', 'kubectl logs edge-api', 'kubectl scale --replicas=3', 'kill -9 880', 'crack K8S_33N'],
  },
  {
    id: 16,
    domainId: 8,
    codeName: 'L8-ROOTCLOUD-16',
    title: 'Màn 16 · Tổng Lực Hạ Tầng Cloud & Root',
    subtitle: 'Final Boss: Tổng Hợp 8 Lĩnh Vực Linux → Cloud',
    briefing:
      'Trận đánh cuối! Diệt PID 901 & 909, xóa bom đĩa "rm trace_lock.tmp", mở quyền chạy "./override.sh", triển khai hạ tầng "terraform apply", bypass cổng 22, nối 3 cầu ASCII và crack ROOT_000!',
    ubuntuTopic: 'Tổng hợp toàn bộ 8 lĩnh vực từ Linux cơ bản tới Cloud IaC',
    baseTracePerSec: 1.35,
    initialCwd: '/root',
    targetToken: 'ROOT_000',
    requireExecFile: '/root/override.sh',
    requireJunkClean: true,
    requireTerraformApply: true,
    diskUsagePct: 98,
    files: [
      {
        path: '/root/trace_lock.tmp',
        name: 'trace_lock.tmp',
        dir: '/root',
        permissions: '-rw-rw-rw-',
        owner: 'root',
        size: '64.0G',
        isJunkBomb: true,
        content: 'Tệp khóa ổ đĩa lõi — Xóa bằng "rm trace_lock.tmp"!',
      },
      {
        path: '/root/override.sh',
        name: 'override.sh',
        dir: '/root',
        permissions: '-rw-r--r--',
        owner: 'root',
        size: '2.1K',
        executable: false,
        requiresExecToReveal: true,
        highlightCode: 'ROOT_000',
        content: '#!/bin/bash\n# Chạy chmod +x override.sh && ./override.sh',
        execOutput: '>>> KERNEL + CLOUD OVERRIDE OK! TOKEN=[ROOT_000]',
      },
    ],
    processes: [
      { pid: 901, user: 'root', cpu: '71.4', mem: '9.8', command: '/sbin/trace-guardian --core', isThreat: true, killed: false, traceBoostPerSec: 1.7 },
      { pid: 909, user: 'root', cpu: '66.0', mem: '7.5', command: '/sbin/trace-beacon --uplink', isThreat: true, killed: false, traceBoostPerSec: 1.6 },
    ],
    ports: [
      { port: 22, proto: 'tcp', service: 'root-ssh', state: 'VULN', bypassed: false, needsBypass: true, note: 'Cổng SSH Root' },
      { port: 443, proto: 'tcp', service: 'cloud-tls', state: 'OPEN', bypassed: false, needsBypass: false, note: 'TLS Ingress' },
      { port: 9000, proto: 'tcp', service: 'k8s-bus', state: 'OPEN', bypassed: false, needsBypass: false, note: 'Cloud Control Bus' },
    ],
    bridges: [
      { id: 'B1', port: 22, label: 'Root SSH :22', connected: false, requiresBypassPort: 22 },
      { id: 'B2', port: 443, label: 'Cloud TLS :443', connected: false },
      { id: 'B3', port: 9000, label: 'Control Bus :9000', connected: false },
    ],
    lessonTips: [
      { cmd: 'kill -9 901 && kill -9 909', syntax: 'kill -9 901 && kill -9 909', meaning: 'Diệt song song cả 2 tiến trình truy vết.' },
      { cmd: 'terraform apply', syntax: 'terraform apply', meaning: 'Khởi tạo hạ tầng Cloud an toàn bằng Terraform IaC.' },
      { cmd: 'chmod +x override.sh && ./override.sh', syntax: 'chmod +x override.sh && ./override.sh', meaning: 'Chạy kịch bản chiếm quyền điều khiển cuối cùng.' },
    ],
    quickCommands: [
      'kill -9 901 && kill -9 909',
      'rm trace_lock.tmp',
      'chmod +x override.sh',
      './override.sh',
      'terraform apply',
      'bypass -p 22',
      'link 22',
      'link 443',
      'link 9000',
      'crack ROOT_000',
    ],
  },
];

let logSeq = 1;
function nextLogId(): string {
  logSeq += 1;
  return `log-${logSeq}`;
}

export function createInitialMissionState(
  missionIndex: number,
  carryScore = 0,
  carryLearned: string[] = [],
  carryExploitPoints = 35
): MissionRuntimeState {
  const safeIdx = Math.max(0, Math.min(LINUX_MISSIONS.length - 1, missionIndex));
  const def = LINUX_MISSIONS[safeIdx];
  const domainInfo = KNOWLEDGE_DOMAINS.find((d) => d.id === def.domainId);

  return {
    missionIndex: safeIdx,
    cwd: def.initialCwd,
    tracePercent: 0,
    traceFreezeTimer: 0,
    combo: 0,
    maxCombo: 0,
    exploitPoints: Math.max(35, carryExploitPoints),
    score: carryScore,
    commandsExecuted: 0,
    validCommandsCount: 0,
    mistakesCount: 0,
    learnedCommands: [...carryLearned],
    files: def.files.map((f) => ({ ...f })),
    processes: def.processes.map((p) => ({ ...p })),
    ports: def.ports.map((pt) => ({ ...pt })),
    bridges: def.bridges.map((b) => ({ ...b })),
    containers: (def.containers ?? []).map((c) => ({ ...c })),
    k8sPods: (def.k8sPods ?? []).map((k) => ({ ...k })),
    envVars: { ...(def.envVars ?? { SHELL: '/bin/bash', USER: 'ubuntu', HOST: 'sec-node' }) },
    diskUsagePct: def.diskUsagePct ?? 34,
    visitedTargetDir: !def.requireTargetDir,
    scannedPorts: def.ports.length === 0,
    inspectedProcesses: !def.processes.some((p) => p.isThreat),
    executedScript: !def.requireExecFile,
    restartedService: !def.requireServiceRestart,
    safeEnvSet: !def.requireSafeEnvVar,
    cleanedJunk: !def.requireJunkClean,
    decodedCipher: !def.requireBase64Decode,
    dockerHandled: !def.requireDockerInspectOrRestart,
    nginxValidated: !def.requireNginxValidate,
    k8sScaled: !def.requireK8sScale,
    terraformApplied: !def.requireTerraformApply,
    crackedToken: false,
    missionElapsedSec: 0,
    logs: [
      {
        id: nextLogId(),
        kind: 'ascii',
        text: `═══ [${def.codeName}] ${def.title.toUpperCase()} ═══`,
      },
      {
        id: nextLogId(),
        kind: 'info',
        text: `Chủ đề [${domainInfo?.title ?? 'Ubuntu'}]: ${def.ubuntuTopic}`,
      },
      {
        id: nextLogId(),
        kind: 'hint',
        text: `Nhiệm vụ: ${def.briefing}`,
      },
    ],
  };
}

export function computeTraceRatePerSec(
  state: MissionRuntimeState,
  mode: HackerMode
): number {
  const def = LINUX_MISSIONS[state.missionIndex];
  const threatBoost = state.processes
    .filter((p) => p.isThreat && !p.killed)
    .reduce((acc, p) => acc + p.traceBoostPerSec, 0);
  const junkPenalty = def.requireJunkClean && !state.cleanedJunk ? 0.55 : 0;
  const envDiscount = def.requireSafeEnvVar && state.safeEnvSet ? 0.65 : 1;
  const rawRate = (def.baseTracePerSec + threatBoost + junkPenalty) * envDiscount;
  return mode === 'practice' ? rawRate * 0.25 : rawRate;
}

export function tickMissionTrace(
  state: MissionRuntimeState,
  dtSec: number,
  mode: HackerMode
): MissionRuntimeState {
  const clampedDt = Math.max(0, Math.min(dtSec, 0.2));
  if (state.traceFreezeTimer > 0) {
    return {
      ...state,
      traceFreezeTimer: Math.max(0, state.traceFreezeTimer - clampedDt),
      missionElapsedSec: state.missionElapsedSec + clampedDt,
    };
  }
  const rate = computeTraceRatePerSec(state, mode);
  const nextTrace = Math.min(100, state.tracePercent + rate * clampedDt);
  return {
    ...state,
    tracePercent: nextTrace,
    missionElapsedSec: state.missionElapsedSec + clampedDt,
  };
}

export function getMissionObjectives(state: MissionRuntimeState): MissionObjectivesStatus {
  const def = LINUX_MISSIONS[state.missionIndex];
  const steps: { id: string; label: string; done: boolean }[] = [];

  if (def.requireTargetDir) {
    steps.push({ id: 'visit-dir', label: `Di chuyển vào thư mục (cd ${def.requireTargetDir})`, done: state.visitedTargetDir });
  }

  const activeThreats = state.processes.filter((p) => p.isThreat);
  if (activeThreats.length > 0) {
    const killedCount = activeThreats.filter((p) => p.killed).length;
    steps.push({
      id: 'kill-threats',
      label: `Diệt tiến trình truy vết (ps aux → kill -9 PID) [${killedCount}/${activeThreats.length}]`,
      done: killedCount === activeThreats.length,
    });
  }

  if (def.requireJunkClean) {
    const junkFile = state.files.find((f) => f.isJunkBomb);
    steps.push({ id: 'clean-junk', label: `Xóa tệp rác ổ đĩa (rm ${junkFile?.name ?? 'malware_bomb.tmp'})`, done: state.cleanedJunk });
  }

  if (def.requireSafeEnvVar) {
    steps.push({ id: 'set-env', label: `Đặt biến an toàn (export ${def.requireSafeEnvVar})`, done: state.safeEnvSet });
  }

  if (def.requireExecFile) {
    const fileName = def.requireExecFile.split('/').pop() ?? 'script.sh';
    steps.push({ id: 'exec-script', label: `Mở quyền & chạy script (chmod +x ${fileName} → ./${fileName})`, done: state.executedScript });
  }

  if (def.requireServiceRestart) {
    steps.push({ id: 'restart-svc', label: `Khởi động lại dịch vụ (systemctl restart ${def.requireServiceRestart})`, done: state.restartedService });
  }

  if (def.requireDockerInspectOrRestart) {
    steps.push({ id: 'docker-restart', label: `Khởi động lại container (docker restart ${def.requireDockerInspectOrRestart})`, done: state.dockerHandled });
  }

  if (def.requireNginxValidate) {
    steps.push({ id: 'nginx-test', label: `Kiểm tra & nạp Nginx (nginx -t → systemctl reload nginx)`, done: state.nginxValidated });
  }

  if (def.requireBase64Decode) {
    steps.push({ id: 'decode-b64', label: `Giải mã chuỗi Base64 (echo ... | base64 -d)`, done: state.decodedCipher });
  }

  if (def.requireK8sScale) {
    steps.push({ id: 'k8s-scale', label: `Mở rộng cụm Kubernetes (kubectl scale --replicas=3)`, done: state.k8sScaled });
  }

  if (def.requireTerraformApply) {
    steps.push({ id: 'tf-apply', label: `Triển khai hạ tầng Cloud (terraform apply)`, done: state.terraformApplied });
  }

  const bypassPorts = state.ports.filter((p) => p.needsBypass);
  if (bypassPorts.length > 0) {
    const bypassedCount = bypassPorts.filter((p) => p.bypassed).length;
    steps.push({
      id: 'bypass-ports',
      label: `Xuyên tường lửa cổng VULN (bypass -p ${bypassPorts[0].port})`,
      done: bypassedCount === bypassPorts.length,
    });
  }

  if (state.bridges.length > 0) {
    const linkedCount = state.bridges.filter((b) => b.connected).length;
    steps.push({
      id: 'ascii-bridges',
      label: `Nối mạch cổng mạng ASCII [${linkedCount}/${state.bridges.length}]`,
      done: linkedCount === state.bridges.length,
    });
  }

  steps.push({
    id: 'crack-token',
    label: `Soi mã khóa & phá giải (crack ${def.targetToken})`,
    done: state.crackedToken,
  });

  return {
    steps,
    allComplete: steps.every((s) => s.done),
  };
}

export function getSmartNextHint(state: MissionRuntimeState): {
  command: string;
  reason: string;
} {
  const def = LINUX_MISSIONS[state.missionIndex];

  if (def.requireTargetDir && !state.visitedTargetDir) {
    return { command: `cd ${def.requireTargetDir}`, reason: `Di chuyển vào thư mục ${def.requireTargetDir}.` };
  }

  const aliveThreat = state.processes.find((p) => p.isThreat && !p.killed);
  if (aliveThreat) {
    return { command: `kill -9 ${aliveThreat.pid}`, reason: `Hạ tiến trình PID ${aliveThreat.pid} để giảm tốc độ Trace & -14% cảnh báo.` };
  }

  if (def.requireJunkClean && !state.cleanedJunk) {
    const junk = state.files.find((f) => f.isJunkBomb && !f.deleted);
    return { command: `rm ${junk?.name ?? 'malware_bomb.tmp'}`, reason: 'Xóa tệp rác giải phóng ổ đĩa để giảm ngay -18% Trace.' };
  }

  if (def.requireSafeEnvVar && !state.safeEnvSet) {
    return { command: `export ${def.requireSafeEnvVar}`, reason: 'Thiết lập biến môi trường an toàn làm chậm radar.' };
  }

  if (def.requireExecFile && !state.executedScript) {
    const f = state.files.find((item) => item.path === def.requireExecFile);
    const name = f?.name ?? 'decrypt.sh';
    if (!f?.executable) {
      return { command: `chmod +x ${name}`, reason: `Cấp quyền thực thi (+x) trước khi chạy ${name}.` };
    }
    return { command: `./${name}`, reason: `Thực thi ${name} để xuất token giải mã.` };
  }

  if (def.requireServiceRestart && !state.restartedService) {
    return { command: `systemctl restart ${def.requireServiceRestart}`, reason: `Khởi động lại dịch vụ ${def.requireServiceRestart}.` };
  }

  if (def.requireDockerInspectOrRestart && !state.dockerHandled) {
    return { command: `docker restart ${def.requireDockerInspectOrRestart}`, reason: `Khởi động lại container ${def.requireDockerInspectOrRestart}.` };
  }

  if (def.requireNginxValidate && !state.nginxValidated) {
    return { command: 'nginx -t', reason: 'Kiểm tra cú pháp cấu hình Nginx trước khi nạp.' };
  }

  if (def.requireBase64Decode && !state.decodedCipher) {
    return { command: `echo ${def.requireBase64Decode} | base64 -d`, reason: 'Giải mã chuỗi Base64 để lấy token gốc.' };
  }

  if (def.requireK8sScale && !state.k8sScaled) {
    return { command: 'kubectl scale --replicas=3', reason: 'Mở rộng cụm Kubernetes lên 3 replica để khôi phục Pod.' };
  }

  if (def.requireTerraformApply && !state.terraformApplied) {
    return { command: 'terraform apply', reason: 'Triển khai hạ tầng Cloud bằng Terraform IaC.' };
  }

  const lockedPort = state.ports.find((p) => p.needsBypass && !p.bypassed);
  if (lockedPort) {
    return { command: `bypass -p ${lockedPort.port}`, reason: `Mở khóa cổng ${lockedPort.port} (${lockedPort.service}).` };
  }

  const openBridge = state.bridges.find((b) => !b.connected);
  if (openBridge) {
    return { command: `link ${openBridge.port}`, reason: `Nối mạch ASCII qua cổng :${openBridge.port}.` };
  }

  const quickProbe = def.quickCommands.find(
    (c) => !c.startsWith('crack ') && !state.learnedCommands.includes(c.split(/\s+/)[0])
  );
  if (!state.crackedToken && quickProbe && state.validCommandsCount === 0) {
    return { command: quickProbe, reason: `Dùng "${quickProbe}" để soi dữ liệu mục tiêu.` };
  }

  return { command: `crack ${def.targetToken}`, reason: `Mọi bước xong xuôi! Nhập "crack ${def.targetToken}" để phá khóa.` };
}

export function computeMissionRank(tracePercent: number, mistakesCount: number): 'S' | 'A' | 'B' | 'C' {
  if (tracePercent < 30 && mistakesCount <= 1) return 'S';
  if (tracePercent < 55 && mistakesCount <= 2) return 'A';
  if (tracePercent < 80) return 'B';
  return 'C';
}

export function renderAsciiPatchDiagram(bridges: AsciiBridgeNode[], ports: VirtualPort[]): string {
  if (bridges.length === 0) return '';
  const segments = bridges.map((b) => {
    const portInfo = ports.find((p) => p.port === b.requiresBypassPort);
    const lockedByFirewall = Boolean(portInfo && portInfo.needsBypass && !portInfo.bypassed);
    if (b.connected) return `══╬[p${b.port}:OK]══▶`;
    if (lockedByFirewall) return `··╳[p${b.port}:LOCK]··`;
    return `··?[p${b.port}:WAIT]··`;
  });
  return `[ETH0] ${segments.join(' ')} [CORE]`;
}

function recordLearned(prev: string[], cmdName: string): string[] {
  return prev.includes(cmdName) ? prev : [...prev, cmdName];
}

function resolveFileMatch(files: VirtualFile[], cwd: string, targetArg: string): VirtualFile | undefined {
  const cleanArg = targetArg.trim().replace(/^["']|["']$/g, '');
  if (!cleanArg) return undefined;
  return (
    files.find((f) => !f.deleted && f.path === cleanArg) ??
    files.find((f) => !f.deleted && f.dir === cwd && f.name === cleanArg) ??
    files.find((f) => !f.deleted && f.name === cleanArg) ??
    files.find((f) => !f.deleted && f.path.endsWith(`/${cleanArg}`))
  );
}

function suggestTypoCorrection(cmd: string): string | null {
  const map: Record<string, string> = {
    sl: 'ls -la',
    gerp: 'grep',
    grpe: 'grep',
    kll: 'kill -9',
    chmd: 'chmod +x',
    systmctl: 'systemctl',
    dokcer: 'docker ps',
    dockre: 'docker ps',
    kubctl: 'kubectl get pods',
    kubetcl: 'kubectl get pods',
    ngix: 'nginx -t',
    bypas: 'bypass -p',
    crak: 'crack',
  };
  return map[cmd] ?? null;
}

function decodeBase64Str(input: string): string | null {
  try {
    const clean = input.replace(/^["']|["']$/g, '').trim();
    if (!clean) return null;
    if (typeof atob === 'function') return atob(clean);
    return Buffer.from(clean, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

export interface CommandOutcome {
  nextState: MissionRuntimeState;
  missionCleared: boolean;
  fx: 'tick' | 'hit' | 'kill' | 'link' | 'error' | 'clear_mission';
}

export function useHackerPowerup(
  state: MissionRuntimeState,
  powerup: 'freeze' | 'cloak' | 'hint',
  mode: HackerMode = 'speed'
): CommandOutcome {
  if (powerup === 'freeze') {
    const cost = 30;
    if (state.exploitPoints < cost) {
      return {
        fx: 'error',
        missionCleared: false,
        nextState: {
          ...state,
          logs: [...state.logs, { id: nextLogId(), kind: 'warn', text: `[THIẾU EP] Cần ${cost} EP để kích hoạt Đóng Băng 6s (đang có ${state.exploitPoints} EP).` }],
        },
      };
    }
    return {
      fx: 'link',
      missionCleared: false,
      nextState: {
        ...state,
        exploitPoints: state.exploitPoints - cost,
        traceFreezeTimer: Math.max(state.traceFreezeTimer, 6.0),
        logs: [...state.logs, { id: nextLogId(), kind: 'ascii', text: '[CRYO-FREEZE] Đã đóng băng TRACE trong 6.0 giây! (-30 EP)' }],
      },
    };
  }

  if (powerup === 'cloak') {
    const cost = 40;
    if (state.exploitPoints < cost) {
      return {
        fx: 'error',
        missionCleared: false,
        nextState: {
          ...state,
          logs: [...state.logs, { id: nextLogId(), kind: 'warn', text: `[THIẾU EP] Cần ${cost} EP để bật Ẩn VPN -22% (đang có ${state.exploitPoints} EP).` }],
        },
      };
    }
    return {
      fx: 'link',
      missionCleared: false,
      nextState: {
        ...state,
        exploitPoints: state.exploitPoints - cost,
        tracePercent: Math.max(0, state.tracePercent - 22),
        logs: [...state.logs, { id: nextLogId(), kind: 'success', text: '[VPN CLOAK] Đổi IP ẩn danh! Thanh Trace giảm ngay -22%. (-40 EP)' }],
      },
    };
  }

  const cost = mode === 'practice' ? 0 : 15;
  const smart = getSmartNextHint(state);
  if (state.exploitPoints < cost) {
    return {
      fx: 'tick',
      missionCleared: false,
      nextState: {
        ...state,
        logs: [...state.logs, { id: nextLogId(), kind: 'hint', text: `[RADAR] Thử lệnh "${smart.command.split(' ')[0]}" → ${smart.reason}` }],
      },
    };
  }
  return {
    fx: 'hit',
    missionCleared: false,
    nextState: {
      ...state,
      exploitPoints: state.exploitPoints - cost,
      logs: [
        ...state.logs,
        { id: nextLogId(), kind: 'hint', text: `[GỢI Ý] Bước tiếp theo: "${smart.command}" — ${smart.reason}${cost > 0 ? ` (-${cost} EP)` : ' (Miễn phí chế độ Học)'}` },
      ],
    },
  };
}

export function toggleAsciiBridgeNode(
  state: MissionRuntimeState,
  bridgeIdOrPort: string | number
): CommandOutcome {
  const def = LINUX_MISSIONS[state.missionIndex];
  const idx = state.bridges.findIndex(
    (b) => b.id.toLowerCase() === String(bridgeIdOrPort).toLowerCase() || String(b.port) === String(bridgeIdOrPort)
  );
  if (idx === -1) {
    return {
      fx: 'error',
      missionCleared: false,
      nextState: {
        ...state,
        logs: [...state.logs, { id: nextLogId(), kind: 'error', text: `[LỖI MẠCH] Không tìm thấy cổng "${bridgeIdOrPort}".` }],
      },
    };
  }

  const target = state.bridges[idx];
  if (target.requiresBypassPort) {
    const reqPort = state.ports.find((p) => p.port === target.requiresBypassPort);
    if (reqPort && reqPort.needsBypass && !reqPort.bypassed) {
      return {
        fx: 'error',
        missionCleared: false,
        nextState: {
          ...state,
          mistakesCount: state.mistakesCount + 1,
          tracePercent: Math.min(100, state.tracePercent + 4),
          logs: [...state.logs, { id: nextLogId(), kind: 'error', text: `[TƯỜNG LỬA CHẶN] Hãy gõ "bypass -p ${target.requiresBypassPort}" trước.` }],
        },
      };
    }
  }

  if (target.connected) {
    return {
      fx: 'tick',
      missionCleared: false,
      nextState: { ...state, logs: [...state.logs, { id: nextLogId(), kind: 'info', text: `Cầu ASCII :${target.port} đã thông sẵn.` }] },
    };
  }

  const nextBridges = state.bridges.map((b, i) => (i === idx ? { ...b, connected: true } : b));
  const nextCombo = state.combo + 1;
  const nextState: MissionRuntimeState = {
    ...state,
    bridges: nextBridges,
    combo: nextCombo,
    maxCombo: Math.max(state.maxCombo, nextCombo),
    exploitPoints: state.exploitPoints + 16,
    validCommandsCount: state.validCommandsCount + 1,
    score: state.score + 85 + nextCombo * 15,
    traceFreezeTimer: nextCombo % 3 === 0 ? Math.max(state.traceFreezeTimer, 2.5) : state.traceFreezeTimer,
    learnedCommands: recordLearned(state.learnedCommands, 'ss'),
    logs: [
      ...state.logs,
      { id: nextLogId(), kind: 'ascii', text: `[ASCII LINK OK] ${renderAsciiPatchDiagram(nextBridges, state.ports)}` },
    ],
  };
  const objectives = getMissionObjectives(nextState);
  if (objectives.allComplete) {
    nextState.score += Math.round((100 - nextState.tracePercent) * 6) + def.id * 120;
  }
  return {
    fx: objectives.allComplete ? 'clear_mission' : 'link',
    missionCleared: objectives.allComplete,
    nextState,
  };
}

export function executeHackerCommand(
  state: MissionRuntimeState,
  rawInput: string
): CommandOutcome {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { nextState: state, missionCleared: false, fx: 'tick' };
  }

  const def = LINUX_MISSIONS[state.missionIndex];
  const promptEcho = `ubuntu@sec-node:${state.cwd}$ ${trimmed}`;

  if (trimmed.includes('&&')) {
    const parts = trimmed.split('&&').map((s) => s.trim()).filter(Boolean);
    let current = state;
    let cleared = false;
    let lastFx: CommandOutcome['fx'] = 'tick';
    for (const part of parts) {
      const outcome = executeHackerCommand(current, part);
      current = outcome.nextState;
      lastFx = outcome.fx;
      if (outcome.missionCleared) {
        cleared = true;
        break;
      }
    }
    return { nextState: current, missionCleared: cleared, fx: lastFx };
  }

  // Unix Pipe (|)
  if (trimmed.includes('|')) {
    const segments = trimmed.split('|').map((s) => s.trim()).filter(Boolean);
    if (segments.length === 2) {
      const [left, right] = segments;
      const leftToks = left.split(/\s+/);
      const rightToks = right.split(/\s+/);

      if (leftToks[0]?.toLowerCase() === 'echo' && rightToks[0]?.toLowerCase() === 'base64') {
        const b64Payload = leftToks.slice(1).join(' ');
        const decoded = decodeBase64Str(b64Payload);
        if (!decoded) {
          return {
            fx: 'error',
            missionCleared: false,
            nextState: {
              ...state,
              commandsExecuted: state.commandsExecuted + 1,
              mistakesCount: state.mistakesCount + 1,
              logs: [...state.logs, { id: nextLogId(), kind: 'cmd', text: promptEcho }, { id: nextLogId(), kind: 'error', text: 'base64: invalid input' }],
            },
          };
        }
        const matched = Boolean((def.requireBase64Decode && b64Payload.includes(def.requireBase64Decode)) || decoded === def.targetToken);
        const nextCombo = state.combo + 1;
        return {
          fx: 'hit',
          missionCleared: false,
          nextState: {
            ...state,
            combo: nextCombo,
            maxCombo: Math.max(state.maxCombo, nextCombo),
            exploitPoints: state.exploitPoints + 20,
            score: state.score + 95 + nextCombo * 12,
            commandsExecuted: state.commandsExecuted + 1,
            validCommandsCount: state.validCommandsCount + 1,
            decodedCipher: state.decodedCipher || matched,
            learnedCommands: recordLearned(recordLearned(state.learnedCommands, 'base64'), 'pipe'),
            logs: [...state.logs, { id: nextLogId(), kind: 'cmd' as const, text: promptEcho }, { id: nextLogId(), kind: 'success' as const, text: `[BASE64 DECODED] => TOKEN=[${decoded}]` }].slice(-150),
          },
        };
      }

      if ((leftToks[0]?.toLowerCase() === 'cat' || leftToks[0]?.toLowerCase() === 'tail' || leftToks[0]?.toLowerCase() === 'head') && rightToks[0]?.toLowerCase() === 'grep') {
        const fileName = leftToks[1] ?? '';
        const pattern = rightToks.slice(1).filter((a) => !a.startsWith('-'))[0]?.replace(/^["']|["']$/g, '') ?? '';
        const file = resolveFileMatch(state.files, state.cwd, fileName);
        if (!file || !pattern) {
          return {
            fx: 'error',
            missionCleared: false,
            nextState: {
              ...state,
              commandsExecuted: state.commandsExecuted + 1,
              mistakesCount: state.mistakesCount + 1,
              logs: [...state.logs, { id: nextLogId(), kind: 'cmd' as const, text: promptEcho }, { id: nextLogId(), kind: 'error' as const, text: 'Pipe grep: Kiểm tra tên tệp và từ khóa.' }],
            },
          };
        }
        const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const matched = file.content.split('\n').filter((line) => regex.test(line));
        const nextCombo = state.combo + 1;
        return {
          fx: 'hit',
          missionCleared: false,
          nextState: {
            ...state,
            combo: nextCombo,
            maxCombo: Math.max(state.maxCombo, nextCombo),
            exploitPoints: state.exploitPoints + 20,
            score: state.score + 75 + nextCombo * 12,
            commandsExecuted: state.commandsExecuted + 1,
            validCommandsCount: state.validCommandsCount + 1,
            learnedCommands: recordLearned(recordLearned(state.learnedCommands, 'pipe'), 'grep'),
            logs: [...state.logs, { id: nextLogId(), kind: 'cmd' as const, text: promptEcho }, { id: nextLogId(), kind: matched.length > 0 ? ('success' as const) : ('warn' as const), text: matched.length > 0 ? matched.join('\n') : '(Không khớp dòng nào)' }].slice(-150),
          },
        };
      }

      if (leftToks[0]?.toLowerCase() === 'env' && rightToks[0]?.toLowerCase() === 'grep') {
        const pattern = rightToks.slice(1).filter((a) => !a.startsWith('-'))[0] ?? '';
        const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const lines = Object.entries(state.envVars).map(([k, v]) => `${k}=${v}`).filter((line) => regex.test(line));
        const nextCombo = state.combo + 1;
        return {
          fx: 'hit',
          missionCleared: false,
          nextState: {
            ...state,
            combo: nextCombo,
            maxCombo: Math.max(state.maxCombo, nextCombo),
            exploitPoints: state.exploitPoints + 16,
            score: state.score + 60,
            commandsExecuted: state.commandsExecuted + 1,
            validCommandsCount: state.validCommandsCount + 1,
            learnedCommands: recordLearned(recordLearned(state.learnedCommands, 'env'), 'pipe'),
            logs: [...state.logs, { id: nextLogId(), kind: 'cmd' as const, text: promptEcho }, { id: nextLogId(), kind: 'success' as const, text: lines.length > 0 ? lines.join('\n') : '(Không khớp biến)' }].slice(-150),
          },
        };
      }
    }
  }

  const tokens = trimmed.split(/\s+/);
  const cmdRaw = tokens[0].toLowerCase();
  const cmd = cmdRaw === 'sudo' && tokens.length > 1 ? tokens[1].toLowerCase() : cmdRaw;
  const args = cmdRaw === 'sudo' && tokens.length > 1 ? tokens.slice(2) : tokens.slice(1);

  const appendCmdLog = (
    extraLogs: Omit<TerminalLogLine, 'id'>[],
    updates: Partial<MissionRuntimeState> = {},
    fx: CommandOutcome['fx'] = 'tick',
    isValid = true,
    learnedTag?: string
  ): CommandOutcome => {
    const nextCombo = isValid ? state.combo + 1 : 0;
    const freezeTriggered = isValid && nextCombo > 0 && nextCombo % 3 === 0;
    const freezeTimer = freezeTriggered ? Math.max(state.traceFreezeTimer, 2.5) : state.traceFreezeTimer;
    const epEarned = isValid ? (freezeTriggered ? 22 : 12) : 0;

    const comboLogs: TerminalLogLine[] = freezeTriggered
      ? [{ id: nextLogId(), kind: 'ascii', text: `★ COMBO x${nextCombo} FEVER! Đóng băng Trace 2.5s & +22 EP!` }]
      : [];

    const merged: MissionRuntimeState = {
      ...state,
      ...updates,
      combo: nextCombo,
      maxCombo: Math.max(state.maxCombo, nextCombo),
      exploitPoints: (updates.exploitPoints ?? state.exploitPoints) + epEarned,
      traceFreezeTimer: freezeTimer,
      commandsExecuted: state.commandsExecuted + 1,
      validCommandsCount: state.validCommandsCount + (isValid ? 1 : 0),
      mistakesCount: state.mistakesCount + (isValid ? 0 : 1),
      learnedCommands: learnedTag
        ? recordLearned(updates.learnedCommands ?? state.learnedCommands, learnedTag)
        : (updates.learnedCommands ?? state.learnedCommands),
      logs: [
        ...state.logs,
        { id: nextLogId(), kind: 'cmd' as const, text: promptEcho },
        ...extraLogs.map((l): TerminalLogLine => ({ ...l, id: nextLogId() })),
        ...comboLogs,
      ].slice(-150),
    };

    const objectives = getMissionObjectives(merged);
    if (objectives.allComplete) {
      merged.score += Math.round((100 - merged.tracePercent) * 6) + def.id * 120;
    }

    return {
      nextState: merged,
      missionCleared: objectives.allComplete,
      fx: objectives.allComplete ? 'clear_mission' : fx,
    };
  };

  if (cmd === 'clear' || cmd === 'cls') {
    return {
      fx: 'tick',
      missionCleared: false,
      nextState: {
        ...state,
        commandsExecuted: state.commandsExecuted + 1,
        logs: [{ id: nextLogId(), kind: 'info', text: `Terminal đã dọn sạch. [${def.codeName}] Đích: ${def.title}` }],
      },
    };
  }

  if (cmd === 'freeze' || cmd === 'cloak' || cmd === 'hint') {
    return useHackerPowerup(state, cmd);
  }

  if (cmd === 'help' || cmd === 'man') {
    const tips = def.lessonTips.map((t) => `  • ${t.syntax.padEnd(28, ' ')} → ${t.meaning}`).join('\n');
    return appendCmdLog([{ kind: 'hint', text: `=== HƯỚNG DẪN (${def.codeName}) ===\n${tips}` }], {}, 'tick', true);
  }

  if (cmd === 'pwd') {
    return appendCmdLog([{ kind: 'info', text: state.cwd }], {}, 'tick', true, 'cd');
  }

  if (cmd === 'cd') {
    const dest = args[0] ?? def.initialCwd;
    let nextCwd = dest === '~' ? '/home/ubuntu' : dest === '..' ? state.cwd.split('/').slice(0, -1).join('/') || '/' : dest.startsWith('/') ? dest : `${state.cwd === '/' ? '' : state.cwd}/${dest}`;
    const reachedTarget = Boolean(def.requireTargetDir && nextCwd === def.requireTargetDir);
    return appendCmdLog(
      [{ kind: reachedTarget ? 'success' : 'info', text: reachedTarget ? `[CD OK] Đã vào ${nextCwd}` : `cwd -> ${nextCwd}` }],
      { cwd: nextCwd, visitedTargetDir: state.visitedTargetDir || reachedTarget, score: state.score + (reachedTarget ? 45 : 10) },
      reachedTarget ? 'hit' : 'tick',
      true,
      'cd'
    );
  }

  if (cmd === 'ls' || cmd === 'll' || cmd === 'dir') {
    const showAll = cmd === 'll' || args.some((a) => a.includes('a'));
    const longFmt = cmd === 'll' || args.some((a) => a.includes('l'));
    const activeFiles = state.files.filter((f) => !f.deleted);
    const inDir = activeFiles.filter((f) => f.dir === state.cwd);
    const pool = inDir.length > 0 ? inDir : activeFiles;
    const visible = pool.filter((f) => showAll || !f.hidden);
    if (visible.length === 0) {
      return appendCmdLog([{ kind: 'warn', text: '(Không thấy file thường. Gõ "ls -la" để xem file ẩn!)' }], {}, 'tick', true, 'ls');
    }
    const lines = visible.map((f) => (longFmt ? `${f.permissions} 1 ${f.owner.padEnd(8)} ${f.size.padStart(6)} ${f.path}` : f.name));
    return appendCmdLog([{ kind: 'info', text: lines.join('\n') }], { score: state.score + 15 }, 'hit', true, 'ls');
  }

  if (cmd === 'cat' || cmd === 'head' || cmd === 'tail' || cmd === 'less') {
    const target = args.find((a) => !a.startsWith('-') && !/^\d+$/.test(a));
    if (!target) {
      return appendCmdLog([{ kind: 'error', text: `Thiếu tên tệp. Ví dụ: ${cmd} readme.txt` }], {}, 'error', false);
    }
    const file = resolveFileMatch(state.files, state.cwd, target);
    if (!file) {
      return appendCmdLog([{ kind: 'error', text: `${cmd}: ${target}: Không tìm thấy tệp` }], { tracePercent: Math.min(100, state.tracePercent + 3) }, 'error', false);
    }
    const nIdx = args.indexOf('-n');
    const lineCount = nIdx !== -1 && /^\d+$/.test(args[nIdx + 1] ?? '') ? Number(args[nIdx + 1]) : 4;
    const allLines = file.content.split('\n');
    const output = cmd === 'tail' ? allLines.slice(-lineCount).join('\n') : cmd === 'head' ? allLines.slice(0, lineCount).join('\n') : file.content;
    return appendCmdLog([{ kind: 'noise', text: output }], { score: state.score + 25 }, 'hit', true, 'cat');
  }

  if (cmd === 'grep') {
    const cleanArgs = args.filter((a) => !a.startsWith('-'));
    const pattern = cleanArgs[0]?.replace(/^["']|["']$/g, '');
    const targetName = cleanArgs[1];
    if (!pattern) {
      return appendCmdLog([{ kind: 'error', text: 'Cú pháp: grep <từ_khóa> <tệp>' }], {}, 'error', false);
    }
    const scopeFiles = targetName
      ? [resolveFileMatch(state.files, state.cwd, targetName)].filter((x): x is VirtualFile => Boolean(x))
      : state.files.filter((f) => !f.deleted);
    if (scopeFiles.length === 0) {
      return appendCmdLog([{ kind: 'error', text: `grep: ${targetName}: Không tìm thấy tệp` }], {}, 'error', false);
    }
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matches: string[] = [];
    for (const f of scopeFiles) {
      const txt = f.requiresExecToReveal && !f.executable ? f.content : f.execOutput ? `${f.content}\n${f.execOutput}` : f.content;
      for (const line of txt.split('\n')) {
        if (regex.test(line)) matches.push(`${f.name}: ${line}`);
      }
    }
    return appendCmdLog(
      [{ kind: matches.length > 0 ? 'success' : 'warn', text: matches.length > 0 ? matches.join('\n') : `(Không khớp "${pattern}")` }],
      { score: state.score + (matches.length > 0 ? 45 : 0) },
      'hit',
      true,
      'grep'
    );
  }

  if (cmd === 'find') {
    const patternRaw = args.find((a) => a.includes('*') || a.includes('.')) ?? '*';
    const cleanPat = patternRaw.replace(/^["']|["']$/g, '').replace(/\*/g, '');
    const hits = state.files.filter((f) => !f.deleted && (!cleanPat || f.path.toLowerCase().includes(cleanPat.toLowerCase())));
    return appendCmdLog(
      [{ kind: hits.length > 0 ? 'success' : 'warn', text: hits.length > 0 ? hits.map((h) => h.path).join('\n') : 'Không tìm thấy.' }],
      { score: state.score + 40 },
      'hit',
      true,
      'find'
    );
  }

  if (cmd === 'env' || cmd === 'printenv') {
    return appendCmdLog(
      [{ kind: 'info', text: Object.entries(state.envVars).map(([k, v]) => `${k}=${v}`).join('\n') }],
      { score: state.score + 30 },
      'hit',
      true,
      'env'
    );
  }

  if (cmd === 'export') {
    const assign = args[0] ?? '';
    if (!assign.includes('=')) {
      return appendCmdLog([{ kind: 'error', text: 'Cú pháp: export SAFE_MODE=1' }], {}, 'error', false);
    }
    const [k, ...rest] = assign.split('=');
    const val = rest.join('=').trim();
    const matchedReq = Boolean(def.requireSafeEnvVar && `${k.trim()}=${val}`.toUpperCase() === def.requireSafeEnvVar.toUpperCase());
    return appendCmdLog(
      [{ kind: 'success', text: matchedReq ? `[SAFE_MODE=1] Trace giảm -12% & chậm đi 35%!` : `Đặt ${k}=${val}` }],
      {
        envVars: { ...state.envVars, [k.trim()]: val },
        safeEnvSet: state.safeEnvSet || matchedReq,
        tracePercent: matchedReq ? Math.max(0, state.tracePercent - 12) : state.tracePercent,
        score: state.score + (matchedReq ? 85 : 15),
      },
      'hit',
      true,
      'env'
    );
  }

  if (cmd === 'df') {
    const pct = state.diskUsagePct;
    return appendCmdLog(
      [{ kind: pct >= 90 ? 'warn' : 'info', text: `/dev/nvme0n1p1  64G  ${pct >= 90 ? '63G' : '20G'}  ${pct}% /` }],
      { score: state.score + 25 },
      'hit',
      true,
      'df'
    );
  }

  if (cmd === 'rm') {
    const target = args.find((a) => !a.startsWith('-'));
    const file = target ? resolveFileMatch(state.files, state.cwd, target) : undefined;
    if (!file || !file.isJunkBomb) {
      return appendCmdLog([{ kind: 'error', text: `rm: Chỉ xóa tệp rác bảo mật (vd: rm malware_bomb.tmp)` }], {}, 'error', false);
    }
    const nextFiles = state.files.map((f) => (f.path === file.path ? { ...f, deleted: true } : f));
    return appendCmdLog(
      [{ kind: 'success', text: `[DISK CLEANED] Đã xóa ${file.name}! Trace giảm -18%!` }],
      { files: nextFiles, diskUsagePct: 28, cleanedJunk: true, tracePercent: Math.max(0, state.tracePercent - 18), score: state.score + 95 },
      'kill',
      true,
      'df'
    );
  }

  if (cmd === 'decode' || cmd === 'base64') {
    const b64Arg = args.filter((a) => !a.startsWith('-'))[0] ?? '';
    const decoded = decodeBase64Str(b64Arg);
    if (!decoded) {
      return appendCmdLog([{ kind: 'error', text: 'Cú pháp: echo <mã> | base64 -d hoặc decode <mã>' }], {}, 'error', false);
    }
    const matched = Boolean((def.requireBase64Decode && b64Arg.includes(def.requireBase64Decode)) || decoded === def.targetToken);
    return appendCmdLog(
      [{ kind: 'success', text: `[BASE64 DECODED] => TOKEN=[${decoded}]` }],
      { decodedCipher: state.decodedCipher || matched, score: state.score + 85 },
      'hit',
      true,
      'base64'
    );
  }

  if (cmd === 'crontab') {
    return appendCmdLog([{ kind: 'info', text: (def.crontabLines ?? ['# Không có cronjob lạ.']).join('\n') }], { score: state.score + 30 }, 'hit', true, 'systemctl');
  }

  if (cmd === 'ip' || cmd === 'ping') {
    const txt =
      cmd === 'ip'
        ? '2: eth0: <BROADCAST,MULTICAST,UP> inet 10.42.0.14/24 scope global eth0'
        : '64 bytes from 10.42.0.1: icmp_seq=1 ttl=64 time=0.42 ms';
    return appendCmdLog([{ kind: 'info', text: txt }], { score: state.score + 25 }, 'hit', true, 'ip');
  }

  // Domain 5: Docker CLI
  if (cmd === 'docker') {
    const sub = (args[0] ?? 'ps').toLowerCase();
    if (sub === 'ps') {
      if (state.containers.length === 0) {
        return appendCmdLog([{ kind: 'info', text: 'CONTAINER ID   IMAGE   STATUS   NAMES\n(Không có container đang chạy trên nút này)' }], {}, 'tick', true, 'docker_ps');
      }
      const rows = state.containers.map((c) => `${c.id}   ${c.image.padEnd(15)} ${c.status.padEnd(23)} ${c.name} (${c.ports})`);
      return appendCmdLog([{ kind: 'info', text: `CONTAINER ID   IMAGE           STATUS                  NAMES\n${rows.join('\n')}` }], { score: state.score + 35 }, 'hit', true, 'docker_ps');
    }
    if (sub === 'logs') {
      const cName = args[1] ?? '';
      const c = state.containers.find((x) => x.name === cName || x.id.startsWith(cName));
      if (!c) return appendCmdLog([{ kind: 'error', text: `Error: No such container: ${cName}` }], {}, 'error', false);
      return appendCmdLog([{ kind: 'success', text: c.logs }], { score: state.score + 55 }, 'hit', true, 'docker_ps');
    }
    if (sub === 'exec') {
      const cName = args[1] ?? '';
      const c = state.containers.find((x) => x.name === cName);
      if (!c) return appendCmdLog([{ kind: 'error', text: `Error: No such container: ${cName}` }], {}, 'error', false);
      const innerCmd = args.slice(2).join(' ');
      const fileHit = state.files.find((f) => innerCmd.includes(f.name) || innerCmd.includes(f.path));
      return appendCmdLog(
        [{ kind: 'success', text: fileHit ? fileHit.content : `[docker exec ${c.name}] OK` }],
        { score: state.score + 65 },
        'hit',
        true,
        'docker_exec'
      );
    }
    if (sub === 'restart') {
      const cName = args[1] ?? '';
      const idx = state.containers.findIndex((x) => x.name === cName);
      if (idx === -1) return appendCmdLog([{ kind: 'error', text: `Error: No such container: ${cName}` }], {}, 'error', false);
      const nextContainers = state.containers.map((c, i) => (i === idx ? { ...c, status: 'Up 1 second (healthy)', restarted: true } : c));
      return appendCmdLog(
        [{ kind: 'success', text: `[DOCKER RESTART OK] Container "${cName}" đã khôi phục trạng thái healthy!` }],
        { containers: nextContainers, dockerHandled: true, score: state.score + 85 },
        'link',
        true,
        'docker_exec'
      );
    }
  }

  // Domain 6: Web Server & Deployment
  if (cmd === 'nginx') {
    return appendCmdLog(
      [{ kind: 'success', text: 'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful' }],
      { nginxValidated: true, score: state.score + 75 },
      'hit',
      true,
      'nginx'
    );
  }
  if (cmd === 'curl') {
    const out = def.requireNginxValidate && !state.nginxValidated
      ? 'HTTP/1.1 502 Bad Gateway\nServer: nginx/1.24.0 (Hãy chạy "nginx -t" & "systemctl reload nginx"!)'
      : `HTTP/1.1 200 OK\nServer: nginx/1.24.0\nX-Deploy-Verify: ${def.targetToken}`;
    return appendCmdLog([{ kind: 'success', text: out }], { score: state.score + 45 }, 'hit', true, 'curl');
  }
  if (cmd === 'git') {
    return appendCmdLog(
      [{ kind: 'success', text: 'remote: Enumerating objects: 14, done.\nUpdating a1f82c..99d04e\nFast-forward -> release.env updated!' }],
      { score: state.score + 55 },
      'hit',
      true,
      'curl'
    );
  }
  if (cmd === 'pm2') {
    const sub = (args[0] ?? 'status').toLowerCase();
    return appendCmdLog(
      [{ kind: 'success', text: sub === 'restart' ? `[PM2] Process app restarted cleanly (online · v2.4.1)` : `┌────┬─────┬────────┬────────┐\n│ id │ app │ status │ memory │\n│ 0  │ app │ online │ 64.2mb │\n└────┴─────┴────────┴────────┘` }],
      { score: state.score + 50 },
      'hit',
      true,
      'curl'
    );
  }

  // Domain 7: Security UFW
  if (cmd === 'ufw') {
    return appendCmdLog(
      [{ kind: 'info', text: 'Status: active\nTo                         Action      From\n--                         ------      ----\n22/tcp                     LIMIT       Anywhere\n80,443/tcp                 ALLOW       Anywhere' }],
      { score: state.score + 35 },
      'hit',
      true,
      'ufw'
    );
  }

  // Domain 8: DevOps & Cloud (kubectl & terraform)
  if (cmd === 'kubectl') {
    const sub = (args[0] ?? 'get').toLowerCase();
    if (sub === 'get') {
      const rows = state.k8sPods.map((p) => `${p.name.padEnd(14)} ${p.ready.padEnd(7)} ${p.status.padEnd(18)} ${p.restarts}`);
      return appendCmdLog([{ kind: 'info', text: `NAME           READY   STATUS             RESTARTS\n${rows.join('\n')}` }], { score: state.score + 35 }, 'hit', true, 'kubectl');
    }
    if (sub === 'logs') {
      const pName = args[1] ?? state.k8sPods[0]?.name ?? '';
      const pod = state.k8sPods.find((p) => p.name.includes(pName));
      return appendCmdLog([{ kind: 'success', text: pod ? pod.logs : 'No logs found.' }], { score: state.score + 60 }, 'hit', true, 'kubectl');
    }
    if (sub === 'scale') {
      const nextPods = state.k8sPods.map((p) => ({ ...p, ready: '3/3', status: 'Running' as const }));
      return appendCmdLog(
        [{ kind: 'success', text: 'deployment.apps/edge-api scaled to 3 replicas · All Pods Running (3/3)!' }],
        { k8sPods: nextPods, k8sScaled: true, score: state.score + 90 },
        'link',
        true,
        'kubectl'
      );
    }
  }

  if (cmd === 'terraform') {
    return appendCmdLog(
      [{ kind: 'success', text: 'Apply complete! Resources: 4 added, 0 changed, 0 destroyed.\nOutputs: cloud_cluster_ready = true' }],
      { terraformApplied: true, score: state.score + 95 },
      'link',
      true,
      'terraform'
    );
  }

  if (cmd === 'ps') {
    const header = 'PID   USER     %CPU  %MEM  COMMAND';
    const rows = state.processes.filter((p) => !p.killed).map((p) => `${String(p.pid).padEnd(6)}${p.user.padEnd(9)}${p.cpu.padEnd(6)}${p.mem.padEnd(6)}${p.command}${p.isThreat ? '  <-- [TRUY VẾT!]' : ''}`);
    return appendCmdLog([{ kind: 'info', text: [header, ...rows].join('\n') }], { inspectedProcesses: true, score: state.score + 25 }, 'hit', true, 'ps');
  }

  if (cmd === 'kill') {
    const pidArg = args.find((a) => /^\d+$/.test(a));
    const pidNum = pidArg ? Number(pidArg) : -1;
    const procIdx = state.processes.findIndex((p) => p.pid === pidNum && !p.killed);
    if (procIdx === -1) {
      return appendCmdLog([{ kind: 'error', text: `bash: kill: Không thấy PID ${pidArg ?? ''}` }], { tracePercent: Math.min(100, state.tracePercent + 3) }, 'error', false);
    }
    const proc = state.processes[procIdx];
    const nextProcs = state.processes.map((p, i) => (i === procIdx ? { ...p, killed: true } : p));
    return appendCmdLog(
      [{ kind: proc.isThreat ? 'success' : 'warn', text: proc.isThreat ? `[SIGKILL OK] Hạ PID ${pidNum}! Trace giảm -14%.` : `Đã tắt PID ${pidNum}.` }],
      { processes: nextProcs, tracePercent: Math.max(0, state.tracePercent - (proc.isThreat ? 14 : 0)), score: state.score + (proc.isThreat ? 95 : 15) },
      'kill',
      true,
      'kill'
    );
  }

  if (cmd === 'chmod') {
    const modeArg = args[0] ?? '';
    const fileArg = args[1] ?? args[0];
    const file = resolveFileMatch(state.files, state.cwd, fileArg);
    if (!file) {
      return appendCmdLog([{ kind: 'error', text: 'Cú pháp: chmod +x <file> hoặc chmod 600 id_rsa' }], {}, 'error', false);
    }
    if (modeArg === '600') {
      const nextFiles = state.files.map((f) => (f.path === file.path ? { ...f, permissions: '-rw-------' } : f));
      return appendCmdLog(
        [{ kind: 'success', text: `[SSH HARDENED] Đã đặt quyền an toàn 600 (-rw-------) cho ${file.name}!` }],
        { files: nextFiles, score: state.score + 75 },
        'hit',
        true,
        'ufw'
      );
    }
    const nextFiles = state.files.map((f) => (f.path === file.path ? { ...f, executable: true, permissions: '-rwxr-xr-x' } : f));
    return appendCmdLog(
      [{ kind: 'success', text: `[CHMOD +X OK] ${file.name}: -rwxr-xr-x. Giờ chạy "./${file.name}"!` }],
      { files: nextFiles, score: state.score + 55 },
      'hit',
      true,
      'chmod'
    );
  }

  if (cmd.startsWith('./') || cmd === 'bash' || cmd === 'sh') {
    const scriptName = cmd.startsWith('./') ? cmd.slice(2) : (args[0] ?? '');
    const file = resolveFileMatch(state.files, state.cwd, scriptName);
    if (!file) return appendCmdLog([{ kind: 'error', text: `bash: ./${scriptName}: Không tìm thấy tệp` }], {}, 'error', false);
    if (!file.executable) {
      return appendCmdLog([{ kind: 'error', text: `Permission denied! Gõ "chmod +x ${file.name}" trước.` }], {}, 'error', false);
    }
    return appendCmdLog([{ kind: 'noise', text: file.execOutput ?? file.content }], { executedScript: true, score: state.score + 85 }, 'hit', true, 'chmod');
  }

  if (cmd === 'scan' || cmd === 'ss' || cmd === 'nmap') {
    if (state.ports.length === 0) {
      return appendCmdLog([{ kind: 'info', text: 'PORT 22/tcp OPEN ssh' }], { scannedPorts: true }, 'hit', true, 'ss');
    }
    const rows = state.ports.map((p) => `${p.proto.padEnd(7)}${String(p.port).padEnd(8)}${(p.bypassed ? 'BYPASSED' : p.state).padEnd(8)}${p.service.padEnd(15)}${p.note}`);
    return appendCmdLog([{ kind: 'info', text: `PROTO  PORT    STATE   SERVICE        GHI CHÚ\n${rows.join('\n')}` }], { scannedPorts: true, score: state.score + 35 }, 'hit', true, 'ss');
  }

  if (cmd === 'bypass') {
    const portArg = args.find((a) => /^\d+$/.test(a));
    const portNum = portArg ? Number(portArg) : -1;
    const portIdx = state.ports.findIndex((p) => p.port === portNum);
    if (portIdx === -1) return appendCmdLog([{ kind: 'error', text: `Không thấy cổng ${portArg ?? ''}.` }], {}, 'error', false);
    const nextPorts = state.ports.map((p, i) => (i === portIdx ? { ...p, bypassed: true } : p));
    return appendCmdLog(
      [{ kind: 'success', text: `[BYPASS OK] Đã thông cổng ${portNum}! Hãy nối cầu "link ${portNum}".` }],
      { ports: nextPorts, score: state.score + 85 },
      'link',
      true,
      'ss'
    );
  }

  if (cmd === 'link' || cmd === 'connect' || cmd === 'bridge') {
    const target = args[0] ?? '';
    return toggleAsciiBridgeNode(
      { ...state, commandsExecuted: state.commandsExecuted + 1, logs: [...state.logs, { id: nextLogId(), kind: 'cmd', text: promptEcho }] },
      target
    );
  }

  if (cmd === 'systemctl' || cmd === 'journalctl') {
    const sub = (args[0] ?? 'status').toLowerCase();
    const svc = args[1] ?? def.requireServiceRestart ?? 'nginx';
    if (cmd === 'journalctl' || sub === 'status') {
      const threatAlive = state.processes.some((p) => p.isThreat && !p.killed);
      return appendCmdLog(
        [{ kind: threatAlive ? 'warn' : 'success', text: threatAlive ? `● ${svc}.service — FAILED (Treo bởi PID 709)` : `● ${svc}.service — ${state.restartedService ? 'ACTIVE' : 'READY'}` }],
        { score: state.score + 20 },
        'hit',
        true,
        'systemctl'
      );
    }
    if (sub === 'reload' && svc.includes('nginx')) {
      return appendCmdLog(
        [{ kind: 'success', text: `[NGINX RELOADED] Cấu hình mới đã áp dụng sạch sẽ! TOKEN=[${def.targetToken}]` }],
        { nginxValidated: true, score: state.score + 85 },
        'hit',
        true,
        'nginx'
      );
    }
    if (sub === 'restart' || sub === 'start') {
      const threatAlive = state.processes.some((p) => p.isThreat && !p.killed);
      if (threatAlive) {
        return appendCmdLog([{ kind: 'error', text: `[SYSTEMD LOCK] Hãy "kill -9 709" trước!` }], {}, 'error', false);
      }
      return appendCmdLog(
        [{ kind: 'success', text: `[SYSTEMD ACTIVE] ${svc} đã khởi động lại! TOKEN=[${def.targetToken}]` }],
        { restartedService: true, score: state.score + 90 },
        'hit',
        true,
        'systemctl'
      );
    }
  }

  if (cmd === 'crack' || cmd === 'submit' || cmd === 'unlock' || trimmed.toUpperCase() === def.targetToken) {
    const submitted = (trimmed.toUpperCase() === def.targetToken ? trimmed : args[0] ?? '').trim().toUpperCase();
    if (submitted !== def.targetToken) {
      return appendCmdLog([{ kind: 'error', text: `[SAI MÃ] "${submitted}" không khớp! (+6% Trace)` }], { tracePercent: Math.min(100, state.tracePercent + 6) }, 'error', false);
    }
    if (def.requireExecFile && !state.executedScript) {
      return appendCmdLog([{ kind: 'warn', text: 'Hãy chạy script ("chmod +x ... && ./...") trước!' }], {}, 'error', false);
    }
    if (def.requireServiceRestart && !state.restartedService) {
      return appendCmdLog([{ kind: 'warn', text: `Hãy "systemctl restart ${def.requireServiceRestart}" trước!` }], {}, 'error', false);
    }
    if (def.requireDockerInspectOrRestart && !state.dockerHandled) {
      return appendCmdLog([{ kind: 'warn', text: `Hãy "docker restart ${def.requireDockerInspectOrRestart}" trước!` }], {}, 'error', false);
    }
    if (def.requireNginxValidate && !state.nginxValidated) {
      return appendCmdLog([{ kind: 'warn', text: 'Hãy kiểm tra "nginx -t" hoặc "systemctl reload nginx" trước!' }], {}, 'error', false);
    }
    if (def.requireK8sScale && !state.k8sScaled) {
      return appendCmdLog([{ kind: 'warn', text: 'Hãy chạy "kubectl scale --replicas=3" trước!' }], {}, 'error', false);
    }
    if (def.requireTerraformApply && !state.terraformApplied) {
      return appendCmdLog([{ kind: 'warn', text: 'Hãy chạy "terraform apply" trước!' }], {}, 'error', false);
    }

    const updated: MissionRuntimeState = { ...state, crackedToken: true, score: state.score + 120 };
    const nextCheck = getMissionObjectives(updated);
    return appendCmdLog(
      [{ kind: 'success', text: nextCheck.allComplete ? `[BREACH SUCCESS] Phá khóa ${def.codeName} thành công!` : `[TOKEN OK] Hoàn tất nốt các bước còn lại ở bảng mục tiêu!` }],
      { crackedToken: true, score: state.score + 120 },
      'hit',
      true
    );
  }

  const typoHint = suggestTypoCorrection(cmd);
  return appendCmdLog(
    [{ kind: 'error', text: typoHint ? `Ý bạn là "${typoHint}"? (+3% Trace)` : `bash: ${cmd}: command not found — Gõ "hint" để xem gợi ý. (+4% Trace)` }],
    { tracePercent: Math.min(100, state.tracePercent + (typoHint ? 3 : 4)) },
    'error',
    false
  );
}

export function getAutocompleteSuggestion(
  input: string,
  state: MissionRuntimeState
): string | null {
  const clean = input.trimStart();
  if (!clean) return null;

  const def = LINUX_MISSIONS[state.missionIndex];
  const candidates = new Set<string>([
    ...def.quickCommands,
    'ls -la',
    'ps aux',
    'ss -tulpn',
    'docker ps',
    'nginx -t',
    'ufw status',
    'kubectl get pods',
    'terraform apply',
    'hint',
    'freeze',
    'cloak',
    ...state.files.filter((f) => !f.deleted).map((f) => `cat ${f.name}`),
    ...state.processes.filter((p) => !p.killed).map((p) => `kill -9 ${p.pid}`),
    ...state.ports.map((p) => `bypass -p ${p.port}`),
    ...state.bridges.filter((b) => !b.connected).map((b) => `link ${b.port}`),
  ]);

  const lower = clean.toLowerCase();
  for (const cand of candidates) {
    if (cand.toLowerCase().startsWith(lower) && cand.toLowerCase() !== lower) {
      return cand;
    }
  }
  return null;
}
