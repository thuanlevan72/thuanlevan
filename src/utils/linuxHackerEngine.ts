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
  { id: 2, shortName: '2. Bash Script', title: '2. Bash Scripting', subtitle: 'Tự động hóa, chmod +x, pipe đa tầng |, biến môi trường', color: '#38BDF8' },
  { id: 3, shortName: '3. SysAdmin', title: '3. System Administration', subtitle: 'Tiến trình, ổ đĩa, systemd, cron (ps, kill, df, du, rm)', color: '#FBBF24' },
  { id: 4, shortName: '4. Networking', title: '4. Networking', subtitle: 'Cổng socket, định tuyến IP & thông tuyến (ss, ip, ping)', color: '#22D3EE' },
  { id: 5, shortName: '5. Docker', title: '5. Docker & Container', subtitle: 'Quản lý container (docker ps, logs, exec, restart)', color: '#60A5FA' },
  { id: 6, shortName: '6. Web & Deploy', title: '6. Web Server & Deployment', subtitle: 'Cấu hình Nginx, kiểm tra HTTP, deploy (nginx -t, curl, pm2)', color: '#C084FC' },
  { id: 7, shortName: '7. Security', title: '7. Linux Security', subtitle: 'Tường lửa UFW allow/deny, SSH 600, giải mã Base64', color: '#FB7185' },
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
  { key: 'ls', domainId: 1, cmd: 'ls -la', title: 'Liệt kê tệp & tệp ẩn', desc: 'Hiển thị tệp ẩn (.) và thư mục con kèm phân quyền Unix.' },
  { key: 'cd', domainId: 1, cmd: 'cd / pwd', title: 'Điều hướng thư mục', desc: 'Di chuyển theo cấu trúc cây thư mục thực và xác định vị trí.' },
  { key: 'cat', domainId: 1, cmd: 'cat / tail', title: 'Đọc & soi đuôi log', desc: 'Đọc nhanh nội dung hoặc N dòng cuối cùng mới nhất của syslog.' },
  { key: 'grep', domainId: 1, cmd: 'grep <từ>', title: 'Lọc log cực nhanh', desc: 'Tìm chính xác dòng lỗi giữa hàng nghìn dòng log production.' },
  { key: 'find', domainId: 1, cmd: 'find / -name', title: 'Tìm tệp toàn hệ thống', desc: 'Quét đệ quy mọi thư mục để định vị file cấu hình hoặc key.' },
  { key: 'chmod', domainId: 2, cmd: 'chmod +x', title: 'Cấp quyền chạy script', desc: 'Bật cờ thực thi (x) cho Bash script trước khi chạy ./script.sh.' },
  { key: 'pipe', domainId: 2, cmd: 'cmd1 | cmd2 | wc -l', title: 'Ống dẫn Unix Pipe đa tầng', desc: 'Nối nhiều lệnh liên tiếp (grep | wc -l, echo | base64 -d).' },
  { key: 'env', domainId: 2, cmd: 'env / export', title: 'Biến môi trường Shell', desc: 'Kiểm tra biến env rò rỉ hoặc đặt export cấu hình runtime.' },
  { key: 'ps', domainId: 3, cmd: 'ps aux', title: 'Giám sát tiến trình', desc: 'Soi PID, User, %CPU để phát hiện tiến trình treo hoặc chiếm CPU.' },
  { key: 'kill', domainId: 3, cmd: 'kill -9 PID', title: 'Ngắt tiến trình treo', desc: 'Gửi tín hiệu SIGKILL chấm dứt ngay tiến trình gây nghẽn.' },
  { key: 'df', domainId: 3, cmd: 'df -h / du -sh / rm', title: 'Dung lượng đĩa & Dọn rác', desc: 'Kiểm tra phân vùng đầy 99%, đo kích thước file (du -sh) và xóa.' },
  { key: 'systemctl', domainId: 3, cmd: 'systemctl / crontab', title: 'Systemd & Lịch Cron', desc: 'Kiểm tra service systemd bị kẹt, đọc crontab và khởi động lại.' },
  { key: 'ss', domainId: 4, cmd: 'ss -tulpn', title: 'Quét cổng Socket mạng', desc: 'Liệt kê socket TCP/UDP đang lắng nghe trên server.' },
  { key: 'ip', domainId: 4, cmd: 'ip a / ping', title: 'Card mạng & Ping', desc: 'Kiểm tra địa chỉ IP eth0 và độ trễ kết nối tới gateway.' },
  { key: 'docker_ps', domainId: 5, cmd: 'docker ps / logs', title: 'Soi Container & Logs', desc: 'Kiểm tra trạng thái container unhealthy và đọc stdout log.' },
  { key: 'docker_exec', domainId: 5, cmd: 'docker exec / restart', title: 'Gỡ kẹt Container', desc: 'Chạy lệnh vào trong container cô lập hoặc restart phục hồi.' },
  { key: 'nginx', domainId: 6, cmd: 'nginx -t / reload', title: 'Kiểm thử Nginx & Reload', desc: 'Kiểm tra cú pháp app.conf trước khi reload không downtime.' },
  { key: 'curl', domainId: 6, cmd: 'curl -I / git / pm2', title: 'Healthcheck HTTP & PM2', desc: 'Xác minh HTTP 200 OK sau deploy git pull & pm2 restart.' },
  { key: 'ufw', domainId: 7, cmd: 'ufw status / deny / allow', title: 'Tường lửa UFW & SSH 600', desc: 'Chặn IP tấn công SSH brute-force bằng ufw deny và siết chmod 600.' },
  { key: 'base64', domainId: 7, cmd: 'base64 -d / auth.log', title: 'Giải mã & Truy vết SSH', desc: 'Giải mã payload Base64 và phân tích đăng nhập thất bại auth.log.' },
  { key: 'kubectl', domainId: 8, cmd: 'kubectl get/logs/scale', title: 'Điều phối Kubernetes', desc: 'Xử lý Pod CrashLoopBackOff, xem logs và scale replica.' },
  { key: 'terraform', domainId: 8, cmd: 'terraform apply', title: 'Infrastructure as Code', desc: 'Đồng bộ và khôi phục tài nguyên Cloud an toàn với Terraform.' },
];

export interface LinuxMissionDefinition {
  id: number;
  domainId: KnowledgeDomainId;
  codeName: string;
  title: string;
  subtitle: string;
  briefing: string;
  ubuntuTopic: string;
  productionLesson: string;
  baseTracePerSec: number;
  initialCwd: string;
  targetToken: string;
  requireTokenVerify: boolean;
  requireTargetDir?: string;
  requireExecFile?: string;
  requireServiceRestart?: string;
  requireSafeEnvVar?: string;
  requireJunkClean?: boolean;
  requireBase64Decode?: string;
  requireDockerInspectOrRestart?: string;
  requireNginxValidate?: boolean;
  requirePm2Restart?: boolean;
  requireUfwHarden?: boolean;
  requireChmod600?: string;
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
  commandHistory: string[];
  files: VirtualFile[];
  processes: VirtualProcess[];
  ports: VirtualPort[];
  bridges: AsciiBridgeNode[];
  containers: VirtualContainer[];
  k8sPods: VirtualK8sPod[];
  ufwRules: string[];
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
  pm2Restarted: boolean;
  ufwHardened: boolean;
  sshKeyHardened: boolean;
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

const MAN_PAGES: Record<string, string> = {
  ls: 'ls [-la] [dir] — Liệt kê file và thư mục con. Cờ -a hiện tệp ẩn (.), -l hiện chi tiết quyền.',
  cd: 'cd <dir> — Di chuyển tới thư mục đích (hỗ trợ .., ~, đường dẫn tuyệt đối hoặc tương đối).',
  pwd: 'pwd — In đường dẫn thư mục làm việc hiện tại.',
  cat: 'cat <file> — Hiển thị toàn bộ nội dung tệp văn bản.',
  tail: 'tail [-n N] <file> — Xem N dòng cuối cùng của file log đang ghi.',
  head: 'head [-n N] <file> — Xem N dòng đầu tiên của file.',
  grep: 'grep <từ_khóa> [file] — Lọc các dòng khớp chuỗi tìm kiếm (hoặc dùng sau dấu pipe |).',
  find: 'find <thư_mục> -name <mẫu> — Quét đệ quy toàn cây thư mục tìm file theo mẫu (vd *.log).',
  chmod: 'chmod +x <script> | chmod 600 <key> — Cấp quyền chạy script hoặc siết quyền đọc/ghi cho chủ sở hữu.',
  ps: 'ps aux — Liệt kê tiến trình đang chạy kèm PID, User và %CPU.',
  kill: 'kill -9 <PID> — Gửi tín hiệu SIGKILL ngắt ngay lập tức tiến trình bị treo/quá tải.',
  df: 'df -h — Kiểm tra dung lượng trống/đầy của các phân vùng đĩa.',
  du: 'du -sh [path] — Đo dung lượng thực tế từng file/thư mục để tìm file rác.',
  rm: 'rm <file> — Xóa tệp rác đang gây đầy ổ đĩa.',
  systemctl: 'systemctl <status|restart|reload> <service> — Quản lý dịch vụ nền systemd trên Ubuntu.',
  crontab: 'crontab -l — Xem lịch tác vụ chạy ngầm định kỳ của user.',
  ss: 'ss -tulpn — Kiểm tra cổng TCP/UDP và tiến trình đang lắng nghe.',
  ip: 'ip a — Hiển thị giao diện mạng và địa chỉ IP trên máy chủ.',
  ping: 'ping <host> — Kiểm tra kết nối mạng và độ trễ.',
  docker: 'docker ps | docker logs <tên> | docker exec <tên> <cmd> | docker restart <tên>',
  nginx: 'nginx -t — Kiểm tra lỗi cú pháp file cấu hình Nginx trước khi reload.',
  curl: 'curl -I <url> — Gửi HTTP HEAD request kiểm tra mã trạng thái web server.',
  git: 'git pull — Đồng bộ mã nguồn mới nhất từ remote repository.',
  pm2: 'pm2 status | pm2 restart <app> — Giám sát và reload ứng dụng Node.js production.',
  ufw: 'ufw status | ufw allow <port> | ufw deny [from <ip>|<port>] — Cấu hình tường lửa Ubuntu.',
  base64: 'echo <payload> | base64 -d — Giải mã dữ liệu Base64 về văn bản gốc.',
  kubectl: 'kubectl get pods | kubectl logs <pod> | kubectl scale --replicas=3',
  terraform: 'terraform apply — Áp dụng cấu hình Infrastructure as Code lên cụm Cloud.',
  verify: 'verify <MÃ> (hoặc crack <MÃ>) — Xác nhận mã token trích xuất được để khép lại sự cố.',
};

export const LINUX_MISSIONS: readonly LinuxMissionDefinition[] = [
  // === 1. LINUX FUNDAMENTALS ===
  {
    id: 1,
    domainId: 1,
    codeName: 'INC-01-HIDDEN-LOG',
    title: 'Sự Cố 01 · Truy Vết File Log Ẩn',
    subtitle: 'Linux Cơ Bản: ls -la, cat & grep',
    briefing:
      'Cổng xác thực production vừa báo lỗi đột ngột nhưng thư mục /home/ubuntu trông trống rỗng. Liệt kê cả tệp ẩn, lọc dòng chứa lỗi CRITICAL_ERR và xác nhận mã bằng "verify <MÃ>".',
    ubuntuTopic: 'Tệp ẩn (ls -la) & lọc log nhiễu (grep)',
    productionLesson:
      'Trên Linux, tệp và thư mục bắt đầu bằng dấu chấm (như .env, .ssh, .auth_noise.log) bị ẩn khỏi "ls" thường. Luôn dùng "ls -la" khi điều tra sự cố cấu hình hoặc rà soát thư mục máy chủ.',
    baseTracePerSec: 1.0,
    initialCwd: '/home/ubuntu',
    targetToken: 'ERR_B74A',
    requireTokenVerify: true,
    files: [
      {
        path: '/home/ubuntu/readme.txt',
        name: 'readme.txt',
        dir: '/home/ubuntu',
        permissions: '-rw-r--r--',
        owner: 'ubuntu',
        size: '412B',
        content: 'Runbook sự cố: Nhật ký lỗi xác thực nằm trong tệp ẩn tại /home/ubuntu. Lọc log và verify mã token.',
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
          '[00:01:02] 0x8F2A :: healthcheck=OK :: worker=node-01',
          '[00:01:04] [WARN] retry auth upstream latency=120ms',
          '[00:01:05] [CRITICAL_ERR] AUTH_GATE_FAULT => TOKEN=[ERR_B74A] :: session_drop',
          '[00:01:06] 0x44A0 :: metrics_flush=OK :: irq_balance=nominal',
        ].join('\n'),
      },
    ],
    processes: [
      { pid: 101, user: 'root', cpu: '0.2', mem: '0.5', command: '/sbin/init --splash', isThreat: false, killed: false, traceBoostPerSec: 0 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'ls -la', syntax: 'ls -la', meaning: 'Hiển thị cả tệp ẩn bắt đầu bằng dấu chấm (.) và quyền file.' },
      { cmd: 'grep ERR .auth_noise.log', syntax: 'grep <từ> <file>', meaning: 'Lọc nhanh dòng lỗi ERR mà không cần cuộn hàng nghìn dòng log.' },
      { cmd: 'verify ERR_B74A', syntax: 'verify <MÃ>', meaning: 'Xác nhận mã lỗi vừa truy xuất để hoàn tất xử lý.' },
    ],
    quickCommands: ['ls -la', 'grep ERR .auth_noise.log', 'verify ERR_B74A'],
  },
  {
    id: 2,
    domainId: 1,
    codeName: 'INC-02-BACKUP-VAULT',
    title: 'Sự Cố 02 · Định Vị File Backup Thất Lạc',
    subtitle: 'Linux Cơ Bản: find, cd, pwd & tail',
    briefing:
      'Dịch vụ backup tự động sinh file .log ở phân vùng /var nhưng bạn chưa biết thư mục cụ thể. Tìm file *.log trên hệ thống, di chuyển tới thư mục đó và đọc 3 dòng cuối log để verify mã khôi phục.',
    ubuntuTopic: 'Tìm file đệ quy (find), điều hướng cây thư mục (cd) & tail -n',
    productionLesson:
      'Dùng "find / -name ..." để định vị file log/config khi tiếp nhận server lạ, và dùng "tail -n" thay vì "cat" với file log nhiều GB để tránh treo SSH terminal.',
    baseTracePerSec: 1.1,
    initialCwd: '/home/ubuntu',
    requireTargetDir: '/var/backups/secret',
    targetToken: 'BAK_209K',
    requireTokenVerify: true,
    files: [
      {
        path: '/home/ubuntu/notes.md',
        name: 'notes.md',
        dir: '/home/ubuntu',
        permissions: '-rw-r--r--',
        owner: 'ubuntu',
        size: '280B',
        content: 'Backup log không nằm trong /home/ubuntu mà ở dưới /var/backups/... Hãy dùng find để truy vết.',
      },
      {
        path: '/var/backups/secret/backup.log',
        name: 'backup.log',
        dir: '/var/backups/secret',
        permissions: '-rw-r-----',
        owner: 'root',
        size: '6.8K',
        highlightCode: 'BAK_209K',
        content: [
          '[18:00:01] rsync: syncing /etc/ssl -> /var/backups/secret [ok]',
          '[18:05:11] rsync: checksum verified 1244 files',
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
      { cmd: 'find / -name *.log', syntax: 'find / -name *.log', meaning: 'Quét toàn cây thư mục Linux theo mẫu tên tập tin.' },
      { cmd: 'cd /var/backups/secret', syntax: 'cd <đường_dẫn>', meaning: 'Chuyển thư mục làm việc tới vị trí vừa tìm thấy.' },
      { cmd: 'tail -n 3 backup.log', syntax: 'tail -n 3 <file>', meaning: 'Chỉ đọc 3 dòng mới nhất ở cuối tệp log.' },
    ],
    quickCommands: ['find / -name *.log', 'cd /var/backups/secret', 'tail -n 3 backup.log', 'verify BAK_209K'],
  },

  // === 2. BASH SCRIPTING ===
  {
    id: 3,
    domainId: 2,
    codeName: 'INC-03-CHMOD-EXEC',
    title: 'Sự Cố 03 · Script Khôi Phục Thiếu Quyền Chạy',
    subtitle: 'Bash Scripting: ls -l, chmod +x & ./script.sh',
    briefing:
      'Kịch bản giải mã decrypt.sh vừa được đẩy từ Git xuống nên bị mất quyền thực thi (-rw-r--r--). Kiểm tra quyền, cấp cờ +x, chạy script và xác nhận mã khôi phục.',
    ubuntuTopic: 'Phân quyền thực thi script (chmod +x, ./)',
    productionLesson:
      'Script mới tạo hoặc checkout qua file archive thường thiếu bit thực thi (x), gây lỗi "Permission denied". Luôn kiểm tra "ls -l" và dùng "chmod +x" cho đúng script thay vì lạm dụng 777.',
    baseTracePerSec: 1.25,
    initialCwd: '/home/ubuntu/scripts',
    targetToken: 'HEX_9X3',
    requireTokenVerify: true,
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
        content: '#!/bin/bash\n# Cấp quyền thực thi trước khi chạy ./decrypt.sh',
        execOutput: '>>> BASH AUTOMATION OK\n0x00B4 :: [DECRYPTED_KEY] => TOKEN=[HEX_9X3]',
      },
    ],
    processes: [
      { pid: 330, user: 'root', cpu: '0.9', mem: '1.4', command: '/usr/sbin/auditd', isThreat: false, killed: false, traceBoostPerSec: 0 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'ls -l', syntax: 'ls -l', meaning: 'Soi cột quyền (-rw-r--r--) để biết file có bit thực thi (x) chưa.' },
      { cmd: 'chmod +x decrypt.sh', syntax: 'chmod +x <script>', meaning: 'Bật quyền thực thi an toàn cho script.' },
      { cmd: './decrypt.sh', syntax: './decrypt.sh', meaning: 'Thực thi script ngay trong thư mục hiện tại.' },
    ],
    quickCommands: ['ls -l', 'chmod +x decrypt.sh', './decrypt.sh', 'verify HEX_9X3'],
  },
  {
    id: 4,
    domainId: 2,
    codeName: 'INC-04-ENV-PIPE',
    title: 'Sự Cố 04 · Biến Môi Trường & Tiến Trình Rò Rỉ',
    subtitle: 'Bash Scripting: env | grep, export & kill -9',
    briefing:
      'Auditor phát hiện cấu hình bí mật nằm trong biến môi trường tiến trình shell đang bị theo dõi (PID 577). Lọc biến môi trường qua pipe, bật export SAFE_MODE=1, ngắt PID 577 và xác nhận mã TOKEN.',
    ubuntuTopic: 'Biến môi trường (env, export) & ống dẫn Pipe (|)',
    productionLesson:
      'Kết hợp "env | grep" giúp rà nhanh biến cấu hình runtime, nhưng tuyệt đối không hardcode secret plaintext vào script — hãy quản lý qua biến môi trường an toàn.',
    baseTracePerSec: 1.4,
    initialCwd: '/home/ubuntu',
    targetToken: 'ENV_308R',
    requireTokenVerify: true,
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
        content: '# Runtime shell environment config. Kiểm tra bằng "env | grep TOKEN".',
      },
    ],
    processes: [
      { pid: 577, user: 'secops', cpu: '38.4', mem: '3.0', command: '/usr/bin/env-auditor', isThreat: true, killed: false, traceBoostPerSec: 1.15 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'env | grep TOKEN', syntax: 'env | grep <từ>', meaning: 'Truyền danh sách biến môi trường qua pipe để lọc nhanh.' },
      { cmd: 'export SAFE_MODE=1', syntax: 'export TÊN=GIÁ_TRỊ', meaning: 'Bật chế độ bảo vệ phiên làm việc giảm 35% tốc độ cảnh báo.' },
      { cmd: 'kill -9 577', syntax: 'kill -9 <PID>', meaning: 'Ngắt tiến trình rò rỉ tài nguyên.' },
    ],
    quickCommands: ['env | grep TOKEN', 'export SAFE_MODE=1', 'kill -9 577', 'verify ENV_308R'],
  },

  // === 3. SYSTEM ADMINISTRATION ===
  {
    id: 5,
    domainId: 3,
    codeName: 'INC-05-DISK-CPU',
    title: 'Sự Cố 05 · Server Đầy 99% Đĩa & Nghẽn CPU',
    subtitle: 'SysAdmin: ps aux, kill -9, df -h, du -sh & rm',
    briefing:
      'Cảnh báo đỏ: Phân vùng / đầy 99% không ghi được log mới và tiến trình PID 404 đang ăn 74.5% CPU! Điều tra bằng ps aux, ngắt PID 404, soi ổ đĩa với df -h / du -sh và dọn tệp rác phình to.',
    ubuntuTopic: 'Xử lý treo CPU (ps, kill -9) & đầy ổ đĩa production (df -h, du -sh, rm)',
    productionLesson:
      'Trong production, ổ đĩa đầy 99% làm hỏng database/log ngay lập tức. Quy trình chuẩn là "df -h" xem phân vùng đầy -> "du -sh *" tìm file phình to -> "kill" tiến trình đang giữ file -> "rm" dọn sạch.',
    baseTracePerSec: 1.15,
    initialCwd: '/tmp',
    targetToken: 'SYS_404Z',
    requireTokenVerify: false,
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
        content: 'Tệp dump rác 48.2GB đang chiếm cạn phân vùng root!',
      },
      {
        path: '/tmp/syslog.vault',
        name: 'syslog.vault',
        dir: '/tmp',
        permissions: '-rw-r--r--',
        owner: 'root',
        size: '1.1K',
        highlightCode: 'SYS_404Z',
        content: 'Nov 19 systemd-journald: disk space critical on /tmp :: TOKEN=[SYS_404Z]',
      },
    ],
    processes: [
      { pid: 404, user: 'secops', cpu: '74.5', mem: '9.2', command: '/usr/bin/trace-watchdog', isThreat: true, killed: false, traceBoostPerSec: 2.0 },
    ],
    ports: [],
    bridges: [],
    lessonTips: [
      { cmd: 'ps aux', syntax: 'ps aux', meaning: 'Tìm tiến trình chiếm %CPU cao bất thường.' },
      { cmd: 'df -h && du -sh', syntax: 'df -h / du -sh', meaning: 'Xem % đầy ổ đĩa và dung lượng từng file trong thư mục.' },
      { cmd: 'kill -9 404 && rm malware_bomb.tmp', syntax: 'kill -9 <PID> && rm <file>', meaning: 'Ngắt tiến trình rồi xóa tệp rác giải phóng 48.2GB.' },
    ],
    quickCommands: ['ps aux', 'df -h', 'du -sh', 'kill -9 404', 'rm malware_bomb.tmp'],
  },
  {
    id: 6,
    domainId: 3,
    codeName: 'INC-06-SYSTEMD-CRON',
    title: 'Sự Cố 06 · Cronjob Làm Kẹt Dịch Vụ Systemd',
    subtitle: 'SysAdmin: crontab -l, systemctl status/restart',
    briefing:
      'Dịch vụ nginx-shield đang bị kẹt deadlock không thể restart! Kiểm tra lịch cron bằng "crontab -l", xem trạng thái service bằng "systemctl status nginx-shield", hạ tiến trình kẹt rồi khởi động lại service.',
    ubuntuTopic: 'Gỡ kẹt dịch vụ Systemd & rà soát Crontab',
    productionLesson:
      'Khi "systemctl restart" bị treo hoặc báo locked, hãy kiểm tra "systemctl status", "crontab -l" và "ps aux" để hạ tiến trình con bị zombie/deadlock trước khi khởi động lại dịch vụ.',
    baseTracePerSec: 1.4,
    initialCwd: '/etc/systemd',
    targetToken: 'SVC_61M',
    requireTokenVerify: false,
    requireServiceRestart: 'nginx-shield',
    crontabLines: [
      '*/1 * * * * /usr/local/bin/deadlock-trigger --pid=709',
      '# Phát hiện cronjob tạo tiến trình khóa PID 709!',
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
      { cmd: 'crontab -l', syntax: 'crontab -l', meaning: 'Kiểm tra các tác vụ chạy ngầm định kỳ trên máy chủ.' },
      { cmd: 'systemctl status nginx-shield', syntax: 'systemctl status <svc>', meaning: 'Đọc trạng thái lỗi và PID đang giữ dịch vụ.' },
      { cmd: 'kill -9 709 && systemctl restart nginx-shield', syntax: 'kill -9 <PID> && systemctl restart <svc>', meaning: 'Gỡ khóa deadlock và khởi động lại service sạch sẽ.' },
    ],
    quickCommands: ['crontab -l', 'systemctl status nginx-shield', 'kill -9 709', 'systemctl restart nginx-shield'],
  },

  // === 4. NETWORKING ===
  {
    id: 7,
    domainId: 4,
    codeName: 'INC-07-SOCKET-NAT',
    title: 'Sự Cố 07 · Kiểm Tra Cổng Socket & Thông Tuyến',
    subtitle: 'Networking: ss -tulpn, bypass -p & Nối Cầu ASCII',
    briefing:
      'Traffic từ cổng HTTP :80 sang kênh TLS :443 bị đứt gãy sau nâng cấp mạng! Quét socket bằng "ss -tulpn", mở thông cổng :80 và nối đủ 2 điểm cầu mạng ASCII để khôi phục lưu lượng.',
    ubuntuTopic: 'Kiểm tra cổng Socket (ss -tulpn) & khôi phục tuyến cổng',
    productionLesson:
      'Lệnh "ss -tulpn" thay thế netstat cũ trên Ubuntu 24.04, giúp xác định tức thì dịch vụ nào đang listen trên port nào và trạng thái kết nối mạng.',
    baseTracePerSec: 1.4,
    initialCwd: '/etc/net',
    targetToken: 'PORT_80X',
    requireTokenVerify: false,
    files: [
      {
        path: '/etc/net/firewall.rules',
        name: 'firewall.rules',
        dir: '/etc/net',
        permissions: '-rw-r--r--',
        owner: 'root',
        size: '880B',
        content: '[NET_CHECK] Cổng HTTP 80 cần bypass và nối tuyến sang TLS :443 · key=[PORT_80X]',
      },
    ],
    processes: [],
    ports: [
      { port: 22, proto: 'tcp', service: 'openssh', state: 'LOCKED', bypassed: false, needsBypass: false, note: 'Bảo vệ RSA-4096' },
      { port: 80, proto: 'tcp', service: 'nginx-proxy', state: 'VULN', bypassed: false, needsBypass: true, note: 'Cổng cần mở thông tuyến' },
    ],
    bridges: [
      { id: 'B1', port: 80, label: 'Cổng HTTP :80', connected: false, requiresBypassPort: 80 },
      { id: 'B2', port: 443, label: 'Kênh TLS :443', connected: false },
    ],
    lessonTips: [
      { cmd: 'ss -tulpn', syntax: 'ss -tulpn', meaning: 'Liệt kê toàn bộ socket TCP/UDP đang lắng nghe trên server.' },
      { cmd: 'bypass -p 80', syntax: 'bypass -p <cổng>', meaning: 'Thông chốt cổng bị nghẽn trước khi nối cầu.' },
      { cmd: 'link 80 && link 443', syntax: 'link <port>', meaning: 'Khôi phục mạch kết nối HTTP :80 -> HTTPS :443.' },
    ],
    quickCommands: ['ss -tulpn', 'bypass -p 80', 'link 80', 'link 443'],
  },
  {
    id: 8,
    domainId: 4,
    codeName: 'INC-08-PROXY-ROUTE',
    title: 'Sự Cố 08 · Săn Packet Sniffer & Khôi Phục Tunnel',
    subtitle: 'Networking: ip a, ping, find .key & Tunnel :3128',
    briefing:
      'Một tiến trình nghe lén gói tin (PID 812) đang chạy trên eth0 và chặn đường hầm Squid Proxy :3128 -> SSH :22! Kiểm tra card mạng (ip a), tìm khóa tunnel, hạ PID 812 và khôi phục tuyến :3128 -> :22.',
    ubuntuTopic: 'Kiểm tra giao diện mạng (ip a, ping) & thông tuyến Proxy :3128',
    productionLesson:
      'Khi nghi ngờ mất gói hoặc nghe lén trên interface, kiểm tra cấu hình bằng "ip a", đo độ trễ bằng "ping" và rà tiến trình sniffer bằng "ps aux".',
    baseTracePerSec: 1.45,
    initialCwd: '/home/ubuntu',
    targetToken: 'SSH_77V',
    requireTokenVerify: false,
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
      { cmd: 'ip a', syntax: 'ip a (hoặc ping)', meaning: 'Xem địa chỉ IP và card mạng eth0 đang hoạt động.' },
      { cmd: 'kill -9 812', syntax: 'kill -9 812', meaning: 'Dừng tiến trình nghe lén gói tin trên eth0.' },
      { cmd: 'bypass -p 3128 && link 3128 && link 22', syntax: 'bypass & link', meaning: 'Thông tuyến lại đường hầm Proxy :3128 -> SSH :22.' },
    ],
    quickCommands: ['ip a', 'find / -name *.key', 'kill -9 812', 'bypass -p 3128', 'link 3128', 'link 22'],
  },

  // === 5. DOCKER & CONTAINER ===
  {
    id: 9,
    domainId: 5,
    codeName: 'INC-09-DOCKER-LEAK',
    title: 'Sự Cố 09 · Điều Tra Container Unhealthy Rò Rỉ Log',
    subtitle: 'Docker & Container: docker ps & docker logs',
    briefing:
      'Microservice Docker "api-vault" chuyển trạng thái unhealthy và in khóa bí mật ra stdout! Liệt kê container bằng "docker ps", đọc nhật ký với "docker logs api-vault" rồi xác nhận mã bằng "verify <MÃ>".',
    ubuntuTopic: 'Giám sát & đọc nhật ký Container (docker ps, docker logs)',
    productionLesson:
      'Không bao giờ in secret/token ra stdout log trong container. Trong thực chiến, "docker ps" + "docker logs <container>" là bước đầu tiên khi thấy trạng thái unhealthy.',
    baseTracePerSec: 1.45,
    initialCwd: '/srv/docker',
    targetToken: 'DCK_109P',
    requireTokenVerify: true,
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
        status: 'Up 3 hours (healthy)',
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
      { cmd: 'docker ps', syntax: 'docker ps', meaning: 'Xem tất cả container, port ánh xạ và health status.' },
      { cmd: 'docker logs api-vault', syntax: 'docker logs <tên>', meaning: 'Soi log bên trong container để phát hiện cảnh báo.' },
      { cmd: 'verify DCK_109P', syntax: 'verify DCK_109P', meaning: 'Xác nhận mã rò rỉ vừa phát hiện.' },
    ],
    quickCommands: ['docker ps', 'docker logs api-vault', 'verify DCK_109P'],
  },
  {
    id: 10,
    domainId: 5,
    codeName: 'INC-10-DOCKER-STALL',
    title: 'Sự Cố 10 · Phục Hồi Container Stalled & Loop PID',
    subtitle: 'Docker & Container: docker exec, restart & bypass :5000',
    briefing:
      'Container "auth-worker" đang bị stalled (đứng hình) do containerd-shim loop PID 642 ngốn CPU! Kiểm tra bên trong bằng "docker exec auth-worker cat /secret.key", hạ PID 642, chạy "docker restart auth-worker" và thông cổng 5000.',
    ubuntuTopic: 'Can thiệp trực tiếp vào Container (docker exec, docker restart)',
    productionLesson:
      'Dùng "docker exec" để chẩn đoán tệp/mạng bên trong namespace của container trước khi "docker restart" khôi phục dịch vụ.',
    baseTracePerSec: 1.5,
    initialCwd: '/srv/docker',
    targetToken: 'CNT_55X',
    requireTokenVerify: false,
    requireDockerInspectOrRestart: 'auth-worker',
    containers: [
      {
        id: '9e4b11c2',
        name: 'auth-worker',
        image: 'ubuntu:24.04',
        status: 'Up 9 mins (stalled)',
        ports: '5000/tcp',
        restarted: false,
        logs: 'Waiting for container restart... worker heartbeat stalled.',
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
      { cmd: 'docker exec auth-worker cat /secret.key', syntax: 'docker exec <tên> <lệnh>', meaning: 'Đọc file cấu hình nằm cô lập trong container.' },
      { cmd: 'kill -9 642 && docker restart auth-worker', syntax: 'kill & docker restart', meaning: 'Ngắt loop shim và khởi động lại sạch sẽ container.' },
      { cmd: 'bypass -p 5000 && link 5000', syntax: 'bypass -p 5000 && link 5000', meaning: 'Mở thông luồng traffic API :5000.' },
    ],
    quickCommands: ['docker ps', 'docker exec auth-worker cat /secret.key', 'kill -9 642', 'docker restart auth-worker', 'bypass -p 5000', 'link 5000'],
  },

  // === 6. WEB SERVER & DEPLOYMENT ===
  {
    id: 11,
    domainId: 6,
    codeName: 'INC-11-NGINX-502',
    title: 'Sự Cố 11 · Khắc Phục Lỗi 502 Bad Gateway Nginx',
    subtitle: 'Web Server: curl -I, nginx -t & systemctl reload nginx',
    briefing:
      'Người dùng truy cập website đang gặp lỗi HTTP 502 Bad Gateway! Kiểm tra HTTP Header bằng "curl -I http://localhost", test cú pháp bằng "nginx -t", reload không downtime "systemctl reload nginx" và thông cổng 80.',
    ubuntuTopic: 'Kiểm thử cấu hình Nginx (nginx -t) & reload không rớt kết nối',
    productionLesson:
      'Quy tắc vàng trước khi reload Web Server: luôn chạy "nginx -t" kiểm tra cú pháp trước để không đánh sập toàn bộ site, sau đó dùng "reload" thay vì "restart" để giữ kết nối đang mở.',
    baseTracePerSec: 1.5,
    initialCwd: '/etc/nginx/sites-enabled',
    targetToken: 'NGX_808W',
    requireTokenVerify: false,
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
      { cmd: 'curl -I http://localhost', syntax: 'curl -I <url>', meaning: 'Kiểm tra nhanh mã phản hồi HTTP (502 vs 200 OK).' },
      { cmd: 'nginx -t', syntax: 'nginx -t', meaning: 'Xác thực cú pháp file cấu hình Nginx trước khi áp dụng.' },
      { cmd: 'systemctl reload nginx', syntax: 'systemctl reload nginx', meaning: 'Áp dụng cấu hình web mới mượt mà không downtime.' },
    ],
    quickCommands: ['curl -I http://localhost', 'nginx -t', 'systemctl reload nginx', 'bypass -p 80', 'link 80'],
  },
  {
    id: 12,
    domainId: 6,
    codeName: 'INC-12-PM2-DEPLOY',
    title: 'Sự Cố 12 · Hotfix Memory Leak & Reload PM2',
    subtitle: 'Deployment: git pull, pm2 status, kill -9 & pm2 restart',
    briefing:
      'Bản build Node.js cũ (PID 722) bị rò rỉ bộ nhớ tăng vọt 61% CPU! Kéo bản vá với "git pull", kiểm tra "pm2 status", hạ PID 722 bị treo rồi chạy "pm2 restart app" để đưa app về trạng thái ổn định.',
    ubuntuTopic: 'Triển khai bản vá Zero-Downtime với Git & PM2',
    productionLesson:
      'Sau khi kéo mã nguồn hotfix (git pull), phải kiểm tra trạng thái process manager (pm2 status) và khởi động lại app sạch sẽ để giải phóng worker rò rỉ bộ nhớ.',
    baseTracePerSec: 1.5,
    initialCwd: '/var/www/app',
    targetToken: 'DEP_99G',
    requireTokenVerify: false,
    requirePm2Restart: true,
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
      { cmd: 'git pull && pm2 status', syntax: 'git pull && pm2 status', meaning: 'Đồng bộ bản vá và kiểm tra process Node.js đang chạy.' },
      { cmd: 'kill -9 722', syntax: 'kill -9 722', meaning: 'Ngắt worker Node cũ đang rò rỉ RAM/CPU.' },
      { cmd: 'pm2 restart app', syntax: 'pm2 restart <tên>', meaning: 'Nạp bản build mới phục vụ người dùng.' },
    ],
    quickCommands: ['git pull', 'pm2 status', 'kill -9 722', 'pm2 restart app'],
  },

  // === 7. LINUX SECURITY ===
  {
    id: 13,
    domainId: 7,
    codeName: 'INC-13-SSH-UFW',
    title: 'Sự Cố 13 · Chặn Brute-Force SSH & Siết Quyền Key',
    subtitle: 'Linux Security: auth.log, ufw deny & chmod 600',
    briefing:
      'Tài khoản root đang bị dò mật khẩu SSH liên tục (PID 805)! Đọc "/var/log/auth.log" tìm IP tấn công, chặn ngay IP đó bằng "ufw deny from 185.220.101.9", siết quyền khóa riêng tư "chmod 600 id_rsa" và hạ PID 805.',
    ubuntuTopic: 'Phòng thủ tường lửa UFW (ufw deny/allow) & bảo mật SSH Key 600',
    productionLesson:
      'OpenSSH sẽ từ chối khóa riêng tư có quyền quá mở (-rw-rw-rw-). Luôn đặt "chmod 600 id_rsa" và dùng UFW ("ufw deny from <IP>") để chặn đứng IP vét cạn mật khẩu trong auth.log.',
    baseTracePerSec: 1.55,
    initialCwd: '/home/ubuntu/.ssh',
    targetToken: 'SEC_600S',
    requireTokenVerify: false,
    requireUfwHarden: true,
    requireChmod600: '/home/ubuntu/.ssh/id_rsa',
    ufwRules: [
      '22/tcp                     ALLOW       Anywhere',
      '80,443/tcp                 ALLOW       Anywhere',
    ],
    files: [
      {
        path: '/home/ubuntu/.ssh/id_rsa',
        name: 'id_rsa',
        dir: '/home/ubuntu/.ssh',
        permissions: '-rw-rw-rw-',
        owner: 'ubuntu',
        size: '1.6K',
        content: 'CẢNH BÁO: Quyền -rw-rw-rw- không an toàn! Chạy "chmod 600 id_rsa" ngay.',
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
      { cmd: 'grep Failed /var/log/auth.log', syntax: 'grep Failed /var/log/auth.log', meaning: 'Truy ra địa chỉ IP đang tấn công dò mật khẩu SSH.' },
      { cmd: 'ufw deny from 185.220.101.9', syntax: 'ufw deny from <IP>', meaning: 'Chặn đứng lưu lượng từ IP tấn công trên tường lửa UFW.' },
      { cmd: 'chmod 600 id_rsa && kill -9 805', syntax: 'chmod 600 <key>', meaning: 'Siết quyền khóa SSH chỉ chủ sở hữu đọc và diệt tiến trình dò.' },
    ],
    quickCommands: ['ufw status', 'grep Failed /var/log/auth.log', 'ufw deny from 185.220.101.9', 'chmod 600 id_rsa', 'kill -9 805'],
  },
  {
    id: 14,
    domainId: 7,
    codeName: 'INC-14-BASE64-DB',
    title: 'Sự Cố 14 · Giải Mã Credential Base64 & Mở Cổng DB',
    subtitle: 'Linux Security: ls -la, echo ... | base64 -d & bypass :5432',
    briefing:
      'Chuỗi xác thực PostgreSQL bị mã hóa Base64 nằm trong tệp ẩn .cipher tại /etc/postgres! Đọc file ẩn, giải mã bằng pipe "echo QjY0XzQ0Qw== | base64 -d", diệt PID 825, thông tunnel :5432 -> :22 và verify mã giải được.',
    ubuntuTopic: 'Giải mã Base64 qua Pipe (|) & bảo mật kết nối PostgreSQL',
    productionLesson:
      'Base64 KHÔNG phải là mã hóa bảo mật (như trong Kubernetes Secrets hay header Basic Auth) — bất kỳ ai cũng giải mã lại được chỉ với "echo ... | base64 -d". Luôn bọc kết nối DB qua SSH/TLS tunnel.',
    baseTracePerSec: 1.65,
    initialCwd: '/etc/postgres',
    targetToken: 'B64_44C',
    requireTokenVerify: true,
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
        content: 'PAYLOAD_BASE64="QjY0XzQ0Qw=="\nGiải mã trên CLI bằng pipe | base64 -d.',
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
      { cmd: 'ls -la && cat .cipher', syntax: 'ls -la && cat .cipher', meaning: 'Đọc tệp ẩn chứa chuỗi mã hóa Base64.' },
      { cmd: 'echo QjY0XzQ0Qw== | base64 -d', syntax: 'echo <mã> | base64 -d', meaning: 'Giải mã Base64 ngay trên dòng lệnh.' },
      { cmd: 'kill -9 825 && bypass -p 5432 && link 5432 && link 22 && verify B64_44C', syntax: 'bypass & link & verify', meaning: 'Thông tunnel DB an toàn và xác nhận mã giải được.' },
    ],
    quickCommands: ['ls -la', 'cat .cipher', 'echo QjY0XzQ0Qw== | base64 -d', 'kill -9 825', 'bypass -p 5432', 'link 5432', 'link 22', 'verify B64_44C'],
  },

  // === 8. DEVOPS & CLOUD ===
  {
    id: 15,
    domainId: 8,
    codeName: 'INC-15-K8S-OOM',
    title: 'Sự Cố 15 · Khắc Phục Pod CrashLoopBackOff Kubernetes',
    subtitle: 'DevOps & Cloud: kubectl get pods, logs & scale',
    briefing:
      'Pod "edge-api" trên cụm Kubernetes bị CrashLoopBackOff (OOMKilled) khiến tải dồn sang các nút khác! Chạy "kubectl get pods", đọc "kubectl logs edge-api", hạ kube-probe-loop PID 880 và "kubectl scale --replicas=3" để cân bằng tải.',
    ubuntuTopic: 'Khắc phục Pod lỗi Kubernetes (kubectl get, logs, scale)',
    productionLesson:
      'Khi Pod bị CrashLoopBackOff do OOMKilled hoặc quá tải, quy trình SRE là: "kubectl get pods" -> "kubectl logs" tìm nguyên nhân -> mở rộng replicas/limits để khôi phục SLA.',
    baseTracePerSec: 1.6,
    initialCwd: '/home/ubuntu/k8s',
    targetToken: 'K8S_33N',
    requireTokenVerify: false,
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
      { cmd: 'kubectl get pods', syntax: 'kubectl get pods', meaning: 'Xem danh sách Pod và số lần restart bất thường.' },
      { cmd: 'kubectl logs edge-api', syntax: 'kubectl logs <tên_pod>', meaning: 'Đọc nguyên nhân sập Pod (OOMKilled / panic).' },
      { cmd: 'kill -9 880 && kubectl scale --replicas=3', syntax: 'kubectl scale --replicas=3', meaning: 'Mở rộng lên 3 replica đưa toàn cụm về trạng thái Running.' },
    ],
    quickCommands: ['kubectl get pods', 'kubectl logs edge-api', 'kill -9 880', 'kubectl scale --replicas=3'],
  },
  {
    id: 16,
    domainId: 8,
    codeName: 'INC-16-DR-FAILOVER',
    title: 'Sự Cố 16 · Tổng Lực Khôi Phục Hạ Tầng Disaster Recovery',
    subtitle: 'Final Boss: Tổng Hợp 8 Lĩnh Vực Linux → Cloud IaC',
    briefing:
      'Sự cố toàn cụm Production! Diệt 2 tiến trình kẹt (PID 901, 909), xóa tệp khóa ổ đĩa "rm trace_lock.tmp", bật quyền chạy "./override.sh", chạy "terraform apply", thông cổng :22 và nối đủ 3 cầu mạng để khôi phục toàn hệ thống!',
    ubuntuTopic: 'Diễn tập Disaster Recovery tổng hợp từ Linux Kernel tới Cloud IaC',
    productionLesson:
      'Trong sự cố DR đa tầng, kỹ sư SRE phải giữ bình tĩnh ghép nối tuần tự: giải tỏa CPU/Disk -> chạy script recovery -> tái tạo hạ tầng bằng IaC (terraform apply) -> thông luồng mạng ingress.',
    baseTracePerSec: 1.3,
    initialCwd: '/root',
    targetToken: 'ROOT_000',
    requireTokenVerify: false,
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
        content: 'Tệp khóa 64GB đang làm nghẽn I/O phân vùng /root!',
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
        content: '#!/bin/bash\n# Khôi phục trạng thái kernel & đồng bộ cụm DR.',
        execOutput: '>>> KERNEL + CLOUD RECOVERY SCRIPT OK! DR_KEY=[ROOT_000]',
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
      { cmd: 'kill -9 901 && kill -9 909 && rm trace_lock.tmp', syntax: 'kill & rm', meaning: 'Giải phóng ngay CPU và 64GB I/O ổ đĩa.' },
      { cmd: 'chmod +x override.sh && ./override.sh', syntax: 'chmod +x & ./', meaning: 'Thực thi kịch bản khôi phục hệ thống.' },
      { cmd: 'terraform apply && bypass -p 22', syntax: 'terraform apply', meaning: 'Đồng bộ hạ tầng Cloud IaC và nối 3 mạch mạng (:22, :443, :9000).' },
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
    ],
  },
];

let logSeq = 1;
function nextLogId(): string {
  logSeq += 1;
  return `log-${logSeq}`;
}

export function normalizeVfsPath(cwd: string, rawDest: string): string {
  const dest = rawDest.trim();
  if (!dest || dest === '~') return '/home/ubuntu';
  const joined = dest.startsWith('~/')
    ? `/home/ubuntu/${dest.slice(2)}`
    : dest.startsWith('/')
      ? dest
      : `${cwd === '/' ? '' : cwd}/${dest}`;
  const segments: string[] = [];
  for (const part of joined.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      segments.pop();
    } else {
      segments.push(part);
    }
  }
  return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}

export function getSubdirectoriesInCwd(
  files: readonly VirtualFile[],
  dir: string
): string[] {
  const prefix = dir === '/' ? '/' : `${dir}/`;
  const subdirs = new Set<string>();
  for (const f of files) {
    if (f.deleted) continue;
    if (f.dir !== dir && f.dir.startsWith(prefix)) {
      const rest = f.dir.slice(prefix.length);
      const childName = rest.split('/')[0];
      if (childName) subdirs.add(childName);
    }
  }
  return Array.from(subdirs).sort();
}

function directoryExistsInVfs(
  state: Pick<MissionRuntimeState, 'files' | 'missionIndex'>,
  targetDir: string
): boolean {
  const def = LINUX_MISSIONS[state.missionIndex];
  if (
    targetDir === '/' ||
    targetDir === '/home' ||
    targetDir === '/home/ubuntu' ||
    targetDir === def.initialCwd ||
    targetDir === def.requireTargetDir
  ) {
    return true;
  }
  const prefix = `${targetDir}/`;
  return state.files.some(
    (f) => !f.deleted && (f.dir === targetDir || f.dir.startsWith(prefix))
  );
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
    commandHistory: [],
    files: def.files.map((f) => ({ ...f })),
    processes: def.processes.map((p) => ({ ...p })),
    ports: def.ports.map((pt) => ({ ...pt })),
    bridges: def.bridges.map((b) => ({ ...b })),
    containers: (def.containers ?? []).map((c) => ({ ...c })),
    k8sPods: (def.k8sPods ?? []).map((k) => ({ ...k })),
    ufwRules: [...(def.ufwRules ?? ['22/tcp                     LIMIT       Anywhere', '80,443/tcp                 ALLOW       Anywhere'])],
    envVars: { ...(def.envVars ?? { SHELL: '/bin/bash', USER: 'ubuntu', HOST: 'prod-node' }) },
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
    pm2Restarted: !def.requirePm2Restart,
    ufwHardened: !def.requireUfwHarden,
    sshKeyHardened: !def.requireChmod600,
    k8sScaled: !def.requireK8sScale,
    terraformApplied: !def.requireTerraformApply,
    crackedToken: !def.requireTokenVerify,
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
        text: `Lĩnh vực [${domainInfo?.title ?? 'Ubuntu'}]: ${def.ubuntuTopic}`,
      },
      {
        id: nextLogId(),
        kind: 'hint',
        text: `Tình huống: ${def.briefing}`,
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
  return mode === 'practice' ? rawRate * 0.28 : rawRate;
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
    steps.push({ id: 'visit-dir', label: `Di chuyển tới thư mục đích (cd ${def.requireTargetDir})`, done: state.visitedTargetDir });
  }

  const activeThreats = state.processes.filter((p) => p.isThreat);
  if (activeThreats.length > 0) {
    const killedCount = activeThreats.filter((p) => p.killed).length;
    steps.push({
      id: 'kill-threats',
      label: `Ngắt tiến trình quá tải/lỗi (ps aux → kill -9 PID) [${killedCount}/${activeThreats.length}]`,
      done: killedCount === activeThreats.length,
    });
  }

  if (def.requireJunkClean) {
    const junkFile = state.files.find((f) => f.isJunkBomb);
    steps.push({ id: 'clean-junk', label: `Dọn tệp rác làm đầy ổ đĩa (rm ${junkFile?.name ?? 'malware_bomb.tmp'})`, done: state.cleanedJunk });
  }

  if (def.requireSafeEnvVar) {
    steps.push({ id: 'set-env', label: `Thiết lập biến bảo vệ (export ${def.requireSafeEnvVar})`, done: state.safeEnvSet });
  }

  if (def.requireExecFile) {
    const fileName = def.requireExecFile.split('/').pop() ?? 'decrypt.sh';
    steps.push({ id: 'exec-script', label: `Cấp quyền & chạy script (chmod +x ${fileName} → ./${fileName})`, done: state.executedScript });
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

  if (def.requirePm2Restart) {
    steps.push({ id: 'pm2-restart', label: `Nạp bản vá & khởi động lại app (pm2 restart app)`, done: state.pm2Restarted });
  }

  if (def.requireUfwHarden) {
    steps.push({ id: 'ufw-harden', label: `Chặn IP brute-force trên UFW (ufw deny from 185.220.101.9)`, done: state.ufwHardened });
  }

  if (def.requireChmod600) {
    steps.push({ id: 'ssh-chmod', label: `Siết quyền khóa SSH (chmod 600 id_rsa)`, done: state.sshKeyHardened });
  }

  if (def.requireBase64Decode) {
    steps.push({ id: 'decode-b64', label: `Giải mã chuỗi Base64 (echo ... | base64 -d)`, done: state.decodedCipher });
  }

  if (def.requireK8sScale) {
    steps.push({ id: 'k8s-scale', label: `Mở rộng cụm Kubernetes (kubectl scale --replicas=3)`, done: state.k8sScaled });
  }

  if (def.requireTerraformApply) {
    steps.push({ id: 'tf-apply', label: `Đồng bộ hạ tầng Cloud IaC (terraform apply)`, done: state.terraformApplied });
  }

  const bypassPorts = state.ports.filter((p) => p.needsBypass);
  if (bypassPorts.length > 0) {
    const bypassedCount = bypassPorts.filter((p) => p.bypassed).length;
    steps.push({
      id: 'bypass-ports',
      label: `Mở thông cổng sự cố (bypass -p ${bypassPorts[0].port})`,
      done: bypassedCount === bypassPorts.length,
    });
  }

  if (state.bridges.length > 0) {
    const linkedCount = state.bridges.filter((b) => b.connected).length;
    steps.push({
      id: 'ascii-bridges',
      label: `Khôi phục mạch nối cổng mạng [${linkedCount}/${state.bridges.length}]`,
      done: linkedCount === state.bridges.length,
    });
  }

  if (def.requireTokenVerify) {
    steps.push({
      id: 'verify-token',
      label: `Trích xuất & xác nhận mã (verify ${def.targetToken})`,
      done: state.crackedToken,
    });
  }

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
    return { command: `kill -9 ${aliveThreat.pid}`, reason: `Ngắt tiến trình PID ${aliveThreat.pid} để hạ tải CPU & -14% SLA Alert.` };
  }

  if (def.requireJunkClean && !state.cleanedJunk) {
    const junk = state.files.find((f) => f.isJunkBomb && !f.deleted);
    return { command: `rm ${junk?.name ?? 'malware_bomb.tmp'}`, reason: 'Xóa tệp rác giải phóng dung lượng đĩa (-18% SLA Alert).' };
  }

  if (def.requireSafeEnvVar && !state.safeEnvSet) {
    return { command: `export ${def.requireSafeEnvVar}`, reason: 'Thiết lập biến môi trường bảo vệ để giảm tốc độ cảnh báo.' };
  }

  if (def.requireExecFile && !state.executedScript) {
    const f = state.files.find((item) => item.path === def.requireExecFile);
    const name = f?.name ?? 'decrypt.sh';
    if (!f?.executable) {
      return { command: `chmod +x ${name}`, reason: `Cấp quyền thực thi (+x) trước khi chạy ${name}.` };
    }
    return { command: `./${name}`, reason: `Chạy ${name} để thực thi kịch bản khôi phục.` };
  }

  if (def.requireServiceRestart && !state.restartedService) {
    return { command: `systemctl restart ${def.requireServiceRestart}`, reason: `Khởi động lại dịch vụ ${def.requireServiceRestart}.` };
  }

  if (def.requireDockerInspectOrRestart && !state.dockerHandled) {
    return { command: `docker restart ${def.requireDockerInspectOrRestart}`, reason: `Khởi động lại container ${def.requireDockerInspectOrRestart}.` };
  }

  if (def.requireNginxValidate && !state.nginxValidated) {
    return { command: 'nginx -t', reason: 'Kiểm tra cú pháp app.conf trước khi reload Nginx.' };
  }

  if (def.requirePm2Restart && !state.pm2Restarted) {
    return { command: 'pm2 restart app', reason: 'Khởi động lại process Node app để áp dụng bản vá.' };
  }

  if (def.requireUfwHarden && !state.ufwHardened) {
    return { command: 'ufw deny from 185.220.101.9', reason: 'Chặn IP brute-force trên tường lửa UFW.' };
  }

  if (def.requireChmod600 && !state.sshKeyHardened) {
    return { command: 'chmod 600 id_rsa', reason: 'Siết quyền đọc/ghi khóa riêng tư SSH về 600.' };
  }

  if (def.requireBase64Decode && !state.decodedCipher) {
    return { command: `echo ${def.requireBase64Decode} | base64 -d`, reason: 'Giải mã chuỗi Base64 qua pipe để lấy mã gốc.' };
  }

  if (def.requireK8sScale && !state.k8sScaled) {
    return { command: 'kubectl scale --replicas=3', reason: 'Mở rộng cụm Kubernetes lên 3 replica để khôi phục Pod.' };
  }

  if (def.requireTerraformApply && !state.terraformApplied) {
    return { command: 'terraform apply', reason: 'Đồng bộ hạ tầng Cloud với Terraform.' };
  }

  const lockedPort = state.ports.find((p) => p.needsBypass && !p.bypassed);
  if (lockedPort) {
    return { command: `bypass -p ${lockedPort.port}`, reason: `Thông cổng sự cố ${lockedPort.port} (${lockedPort.service}).` };
  }

  const openBridge = state.bridges.find((b) => !b.connected);
  if (openBridge) {
    return { command: `link ${openBridge.port}`, reason: `Khôi phục mạch nối cổng :${openBridge.port}.` };
  }

  const quickProbe = def.quickCommands.find(
    (c) => !c.startsWith('verify ') && !c.startsWith('crack ') && !state.learnedCommands.includes(c.split(/\s+/)[0])
  );
  if (def.requireTokenVerify && !state.crackedToken && quickProbe && state.validCommandsCount === 0) {
    return { command: quickProbe, reason: `Dùng "${quickProbe}" để soi dữ liệu log/cấu hình.` };
  }

  return { command: `verify ${def.targetToken}`, reason: `Xác nhận mã "${def.targetToken}" để đóng sự cố!` };
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
  const resolvedPath = cleanArg.startsWith('/') ? normalizeVfsPath('/', cleanArg) : normalizeVfsPath(cwd, cleanArg);
  return (
    files.find((f) => !f.deleted && f.path === resolvedPath) ??
    files.find((f) => !f.deleted && f.dir === cwd && f.name === cleanArg) ??
    files.find((f) => !f.deleted && f.path === cleanArg)
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
    crak: 'verify',
    verfy: 'verify',
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
          logs: [...state.logs, { id: nextLogId(), kind: 'warn', text: `[THIẾU EP] Cần ${cost} EP để gia hạn SLA 6s (đang có ${state.exploitPoints} EP).` }],
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
        logs: [...state.logs, { id: nextLogId(), kind: 'ascii', text: '[SLA FREEZE] Đã tạm đóng băng đồng hồ cảnh báo SLA 6.0s! (-30 EP)' }],
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
          logs: [...state.logs, { id: nextLogId(), kind: 'warn', text: `[THIẾU EP] Cần ${cost} EP để kích hoạt Mitigation -22% (đang có ${state.exploitPoints} EP).` }],
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
        logs: [...state.logs, { id: nextLogId(), kind: 'success', text: '[MITIGATION OK] Điều hướng tải dự phòng! SLA Alert giảm -22%. (-40 EP)' }],
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
        logs: [...state.logs, { id: nextLogId(), kind: 'hint', text: `[RUNBOOK] Hãy kiểm tra lại bước: ${smart.reason}` }],
      },
    };
  }
  const def = LINUX_MISSIONS[state.missionIndex];
  const safeReason = smart.reason.replace(def.targetToken, '<MÃ_ĐỌC_TỪ_LOG>');
  return {
    fx: 'hit',
    missionCleared: false,
    nextState: {
      ...state,
      exploitPoints: state.exploitPoints - cost,
      logs: [
        ...state.logs,
        {
          id: nextLogId(),
          kind: 'hint',
          text:
            mode === 'practice'
              ? `[GỢI Ý SANDBOX] Thử lệnh: "${smart.command}" — ${smart.reason} (Miễn phí Sandbox)`
              : `[GỢI Ý THỰC CHIẾN] Hướng xử lý: ${safeReason} (Gợi ý lệnh bắt đầu: "${smart.command.split(' ')[0]}") (-15 EP)`,
        },
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
          logs: [...state.logs, { id: nextLogId(), kind: 'error', text: `[TƯỜNG LỬA CHẶN] Cổng :${target.requiresBypassPort} đang khóa — chạy "bypass -p ${target.requiresBypassPort}" trước.` }],
        },
      };
    }
  }

  if (target.connected) {
    return {
      fx: 'tick',
      missionCleared: false,
      nextState: { ...state, logs: [...state.logs, { id: nextLogId(), kind: 'info', text: `Cổng :${target.port} đã kết nối ổn định.` }] },
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
      { id: nextLogId(), kind: 'ascii', text: `[LINK OK] ${renderAsciiPatchDiagram(nextBridges, state.ports)}` },
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

function produceStageOutput(
  state: MissionRuntimeState,
  stageRaw: string
): { ok: true; text: string; learned?: string[]; markDecoded?: string } | { ok: false; err: string } {
  const toks = stageRaw.trim().split(/\s+/);
  const raw0 = toks[0]?.toLowerCase() ?? '';
  const cmd = raw0 === 'sudo' && toks.length > 1 ? toks[1].toLowerCase() : raw0;
  const args = raw0 === 'sudo' && toks.length > 1 ? toks.slice(2) : toks.slice(1);

  if (cmd === 'echo') {
    return { ok: true, text: args.join(' ').replace(/^["']|["']$/g, '') };
  }
  if (cmd === 'env' || cmd === 'printenv') {
    return {
      ok: true,
      text: Object.entries(state.envVars).map(([k, v]) => `${k}=${v}`).join('\n'),
      learned: ['env'],
    };
  }
  if (cmd === 'ps') {
    const header = 'PID   USER     %CPU  %MEM  COMMAND';
    const rows = state.processes
      .filter((p) => !p.killed)
      .map((p) => `${String(p.pid).padEnd(6)}${p.user.padEnd(9)}${p.cpu.padEnd(6)}${p.mem.padEnd(6)}${p.command}${p.isThreat ? '  <-- [CẢNH BÁO]' : ''}`);
    return { ok: true, text: [header, ...rows].join('\n'), learned: ['ps'] };
  }
  if (cmd === 'ss' || cmd === 'scan') {
    const rows = state.ports.map((p) => `${p.proto.padEnd(7)}${String(p.port).padEnd(8)}${(p.bypassed ? 'BYPASSED' : p.state).padEnd(8)}${p.service.padEnd(15)}${p.note}`);
    return { ok: true, text: rows.length > 0 ? rows.join('\n') : 'tcp    22      OPEN    openssh', learned: ['ss'] };
  }
  if (cmd === 'ufw') {
    return { ok: true, text: `Status: active\n${state.ufwRules.join('\n')}`, learned: ['ufw'] };
  }
  if (cmd === 'docker' && args[0]?.toLowerCase() === 'logs') {
    const c = state.containers.find((x) => x.name === (args[1] ?? ''));
    if (!c) return { ok: false, err: `docker: No such container: ${args[1] ?? ''}` };
    return { ok: true, text: c.logs, learned: ['docker_ps'] };
  }
  if (cmd === 'kubectl' && args[0]?.toLowerCase() === 'logs') {
    const pod = state.k8sPods.find((p) => p.name.includes(args[1] ?? ''));
    if (!pod) return { ok: false, err: `kubectl: pod "${args[1] ?? ''}" not found` };
    return { ok: true, text: pod.logs, learned: ['kubectl'] };
  }
  if (cmd === 'cat' || cmd === 'head' || cmd === 'tail' || cmd === 'grep') {
    if (cmd === 'grep') {
      const cleanArgs = args.filter((a) => !a.startsWith('-'));
      const pattern = cleanArgs[0]?.replace(/^["']|["']$/g, '') ?? '';
      const fName = cleanArgs[1];
      const scope = fName
        ? [resolveFileMatch(state.files, state.cwd, fName)].filter((x): x is VirtualFile => Boolean(x))
        : state.files.filter((f) => !f.deleted);
      if (!pattern || scope.length === 0) return { ok: false, err: 'grep: kiểm tra từ khóa và tên tệp.' };
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const lines: string[] = [];
      for (const f of scope) {
        const body = f.requiresExecToReveal && !f.executable ? f.content : f.execOutput ? `${f.content}\n${f.execOutput}` : f.content;
        for (const l of body.split('\n')) {
          if (regex.test(l)) lines.push(l);
        }
      }
      return { ok: true, text: lines.join('\n'), learned: ['grep'] };
    }
    const fTarget = args.find((a) => !a.startsWith('-') && !/^\d+$/.test(a)) ?? '';
    const file = resolveFileMatch(state.files, state.cwd, fTarget);
    if (!file) return { ok: false, err: `${cmd}: ${fTarget}: No such file or directory` };
    const nIdx = args.indexOf('-n');
    const nCount = nIdx !== -1 && /^\d+$/.test(args[nIdx + 1] ?? '') ? Number(args[nIdx + 1]) : 4;
    const rawLines = file.content.split('\n');
    const out = cmd === 'tail' ? rawLines.slice(-nCount).join('\n') : cmd === 'head' ? rawLines.slice(0, nCount).join('\n') : file.content;
    return { ok: true, text: out, learned: ['cat'] };
  }
  return { ok: false, err: `Pipe stage "${cmd}" chưa được hỗ trợ ở đầu ống dẫn.` };
}

function applyPipeFilter(
  inputText: string,
  filterRaw: string
): { ok: true; text: string; learned?: string[]; decodedPayload?: string } | { ok: false; err: string } {
  const toks = filterRaw.trim().split(/\s+/);
  const cmd = toks[0]?.toLowerCase() ?? '';
  const args = toks.slice(1);
  const lines = inputText ? inputText.split('\n') : [];

  if (cmd === 'grep') {
    const invert = args.some((a) => a === '-v');
    const pattern = args.filter((a) => !a.startsWith('-'))[0]?.replace(/^["']|["']$/g, '') ?? '';
    if (!pattern) return { ok: false, err: 'grep: thiếu từ khóa lọc.' };
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const filtered = lines.filter((l) => (invert ? !regex.test(l) : regex.test(l)));
    return { ok: true, text: filtered.join('\n'), learned: ['grep', 'pipe'] };
  }
  if (cmd === 'wc') {
    if (args.includes('-l') || args.length === 0) {
      return { ok: true, text: `${lines.filter((l) => l.length > 0).length} dòng`, learned: ['pipe'] };
    }
    return { ok: true, text: `${inputText.split(/\s+/).filter(Boolean).length} từ`, learned: ['pipe'] };
  }
  if (cmd === 'head' || cmd === 'tail') {
    const nIdx = args.indexOf('-n');
    const count = nIdx !== -1 && /^\d+$/.test(args[nIdx + 1] ?? '') ? Number(args[nIdx + 1]) : 5;
    const sliced = cmd === 'head' ? lines.slice(0, count) : lines.slice(-count);
    return { ok: true, text: sliced.join('\n'), learned: ['pipe'] };
  }
  if (cmd === 'sort') {
    return { ok: true, text: [...lines].sort().join('\n'), learned: ['pipe'] };
  }
  if (cmd === 'uniq') {
    return { ok: true, text: Array.from(new Set(lines)).join('\n'), learned: ['pipe'] };
  }
  if (cmd === 'base64') {
    const decoded = decodeBase64Str(inputText);
    if (!decoded) return { ok: false, err: 'base64: invalid input' };
    return { ok: true, text: `[BASE64 DECODED] => TOKEN=[${decoded}]`, learned: ['base64', 'pipe'], decodedPayload: decoded };
  }
  return { ok: false, err: `Pipe filter "${cmd}" không hợp lệ (hỗ trợ: grep, wc -l, head, tail, sort, uniq, base64 -d).` };
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
  const promptEcho = `ubuntu@prod-node:${state.cwd}$ ${trimmed}`;

  // Record command into runtime history
  const nextHistory = state.commandHistory[0] === trimmed
    ? state.commandHistory
    : [trimmed, ...state.commandHistory].slice(0, 40);

  if (trimmed.includes('&&')) {
    const parts = trimmed.split('&&').map((s) => s.trim()).filter(Boolean);
    let current = { ...state, commandHistory: nextHistory };
    let cleared = false;
    let lastFx: CommandOutcome['fx'] = 'tick';
    for (const part of parts) {
      const outcome = executeHackerCommand(current, part);
      current = outcome.nextState;
      lastFx = outcome.fx;
      // Short-circuit && just like real Bash: abort remaining chain if command fails!
      if (outcome.fx === 'error') {
        break;
      }
      if (outcome.missionCleared) {
        cleared = true;
        break;
      }
    }
    return { nextState: current, missionCleared: cleared, fx: lastFx };
  }

  // Multi-stage Unix Pipe (|)
  if (trimmed.includes('|')) {
    const segments = trimmed.split('|').map((s) => s.trim()).filter(Boolean);
    if (segments.length >= 2) {
      const firstStage = produceStageOutput(state, segments[0]);
      if (!firstStage.ok) {
        return {
          fx: 'error',
          missionCleared: false,
          nextState: {
            ...state,
            commandHistory: nextHistory,
            commandsExecuted: state.commandsExecuted + 1,
            mistakesCount: state.mistakesCount + 1,
            logs: [
              ...state.logs,
              { id: nextLogId(), kind: 'cmd' as const, text: promptEcho },
              { id: nextLogId(), kind: 'error' as const, text: firstStage.err },
            ].slice(-150),
          },
        };
      }

      let pipeData = firstStage.text;
      let learnedSet = new Set<string>([...state.learnedCommands, ...(firstStage.learned ?? []), 'pipe']);
      let decodedCipherMatch = state.decodedCipher;

      for (let i = 1; i < segments.length; i++) {
        const res = applyPipeFilter(pipeData, segments[i]);
        if (!res.ok) {
          return {
            fx: 'error',
            missionCleared: false,
            nextState: {
              ...state,
              commandHistory: nextHistory,
              commandsExecuted: state.commandsExecuted + 1,
              mistakesCount: state.mistakesCount + 1,
              logs: [
                ...state.logs,
                { id: nextLogId(), kind: 'cmd' as const, text: promptEcho },
                { id: nextLogId(), kind: 'error' as const, text: res.err },
              ].slice(-150),
            },
          };
        }
        pipeData = res.text;
        for (const tag of res.learned ?? []) learnedSet.add(tag);
        if (res.decodedPayload) {
          if (
            (def.requireBase64Decode && firstStage.text.includes(def.requireBase64Decode)) ||
            res.decodedPayload === def.targetToken
          ) {
            decodedCipherMatch = true;
          }
        }
      }

      const nextCombo = state.combo + 1;
      const merged: MissionRuntimeState = {
        ...state,
        commandHistory: nextHistory,
        combo: nextCombo,
        maxCombo: Math.max(state.maxCombo, nextCombo),
        exploitPoints: state.exploitPoints + 20,
        score: state.score + 85 + nextCombo * 12,
        commandsExecuted: state.commandsExecuted + 1,
        validCommandsCount: state.validCommandsCount + 1,
        decodedCipher: decodedCipherMatch,
        learnedCommands: Array.from(learnedSet),
        logs: [
          ...state.logs,
          { id: nextLogId(), kind: 'cmd' as const, text: promptEcho },
          {
            id: nextLogId(),
            kind: pipeData.length > 0 ? ('success' as const) : ('warn' as const),
            text: pipeData.length > 0 ? pipeData : '(Không khớp dòng nào)',
          },
        ].slice(-150),
      };
      return { fx: 'hit', missionCleared: false, nextState: merged };
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
      ? [{ id: nextLogId(), kind: 'ascii', text: `★ COMBO x${nextCombo} STREAK! Đóng băng SLA 2.5s & +22 EP!` }]
      : [];

    const merged: MissionRuntimeState = {
      ...state,
      ...updates,
      commandHistory: nextHistory,
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
        commandHistory: nextHistory,
        commandsExecuted: state.commandsExecuted + 1,
        logs: [{ id: nextLogId(), kind: 'info', text: `Terminal đã dọn sạch (Ctrl+L). [${def.codeName}] ${def.title}` }],
      },
    };
  }

  if (cmd === 'history') {
    const entries = [...nextHistory]
      .reverse()
      .map((line, i) => `  ${String(i + 1).padStart(2, ' ')}  ${line}`);
    return appendCmdLog(
      [{ kind: 'info', text: entries.length > 0 ? entries.join('\n') : '(Chưa có lịch sử lệnh)' }],
      {},
      'tick',
      true
    );
  }

  if (cmd === 'freeze' || cmd === 'cloak' || cmd === 'hint') {
    return useHackerPowerup({ ...state, commandHistory: nextHistory }, cmd);
  }

  if (cmd === 'man') {
    const topic = (args[0] ?? '').toLowerCase();
    if (topic && MAN_PAGES[topic]) {
      return appendCmdLog([{ kind: 'hint', text: `MAN(${topic.toUpperCase()}) :: ${MAN_PAGES[topic]}` }], {}, 'tick', true);
    }
    if (topic) {
      return appendCmdLog([{ kind: 'warn', text: `No manual entry for ${topic}` }], {}, 'tick', false);
    }
    const tips = def.lessonTips.map((t) => `  • ${t.syntax.padEnd(28, ' ')} → ${t.meaning}`).join('\n');
    return appendCmdLog([{ kind: 'hint', text: `=== RUNBOOK (${def.codeName}) ===\n${tips}` }], {}, 'tick', true);
  }

  if (cmd === 'help') {
    const tips = def.lessonTips.map((t) => `  • ${t.syntax.padEnd(28, ' ')} → ${t.meaning}`).join('\n');
    return appendCmdLog([{ kind: 'hint', text: `=== RUNBOOK SỰ CỐ (${def.codeName}) ===\n${tips}` }], {}, 'tick', true);
  }

  if (cmd === 'pwd') {
    return appendCmdLog([{ kind: 'info', text: state.cwd }], {}, 'tick', true, 'cd');
  }

  if (cmd === 'cd') {
    const dest = args[0] ?? '/home/ubuntu';
    const nextCwd = normalizeVfsPath(state.cwd, dest);
    if (!directoryExistsInVfs(state, nextCwd)) {
      return appendCmdLog(
        [{ kind: 'error', text: `bash: cd: ${dest}: No such file or directory` }],
        { tracePercent: Math.min(100, state.tracePercent + 2) },
        'error',
        false
      );
    }
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
    const pathArg = args.find((a) => !a.startsWith('-'));
    const targetDir = pathArg ? normalizeVfsPath(state.cwd, pathArg) : state.cwd;

    if (!directoryExistsInVfs(state, targetDir)) {
      return appendCmdLog(
        [{ kind: 'error', text: `ls: cannot access '${pathArg}': No such file or directory` }],
        {},
        'error',
        false
      );
    }

    const activeFiles = state.files.filter((f) => !f.deleted && f.dir === targetDir);
    const childDirs = getSubdirectoriesInCwd(state.files, targetDir);
    const visibleDirs = childDirs.filter((d) => showAll || !d.startsWith('.'));
    const visibleFiles = activeFiles.filter((f) => showAll || !f.hidden);

    if (visibleDirs.length === 0 && visibleFiles.length === 0) {
      return appendCmdLog(
        [{ kind: 'warn', text: '(Thư mục trống hoặc file đang bị ẩn — thử gõ "ls -la"!)' }],
        {},
        'tick',
        true,
        'ls'
      );
    }

    const dirLines = visibleDirs.map((d) =>
      longFmt ? `drwxr-xr-x 2 ubuntu   4.0K   ${d}/` : `${d}/`
    );
    const fileLines = visibleFiles.map((f) =>
      longFmt ? `${f.permissions} 1 ${f.owner.padEnd(8)} ${f.size.padStart(6)} ${f.name}` : f.name
    );
    return appendCmdLog(
      [{ kind: 'info', text: [...dirLines, ...fileLines].join('\n') }],
      { score: state.score + 15 },
      'hit',
      true,
      'ls'
    );
  }

  if (cmd === 'du') {
    const targetDir = state.cwd;
    const filesHere = state.files.filter((f) => !f.deleted && (f.dir === targetDir || f.dir.startsWith(`${targetDir}/`)));
    const lines = filesHere.map((f) => `${f.size.padEnd(7)} ${f.path}`);
    return appendCmdLog(
      [{ kind: 'info', text: lines.length > 0 ? lines.join('\n') : '4.0K    .' }],
      { score: state.score + 25 },
      'hit',
      true,
      'df'
    );
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
      : state.files.filter((f) => !f.deleted && f.dir === state.cwd);
    if (scopeFiles.length === 0) {
      return appendCmdLog([{ kind: 'error', text: `grep: ${targetName ?? '.'}: Không tìm thấy tệp phù hợp` }], {}, 'error', false);
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
      [{ kind: 'success', text: matchedReq ? `[SAFE_MODE=1] Tốc độ SLA Alert giảm 35% & hạ -12%!` : `Đặt ${k}=${val}` }],
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
      [{ kind: pct >= 90 ? 'warn' : 'info', text: `Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme0n1p1   64G   ${pct >= 90 ? '63G' : '20G'}  ${pct >= 90 ? '1G' : '44G'}  ${pct}% /` }],
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
      return appendCmdLog([{ kind: 'error', text: `rm: Chỉ được xóa tệp rác gây đầy đĩa (vd: rm malware_bomb.tmp)` }], {}, 'error', false);
    }
    const nextFiles = state.files.map((f) => (f.path === file.path ? { ...f, deleted: true } : f));
    return appendCmdLog(
      [{ kind: 'success', text: `[DISK CLEANED] Đã xóa ${file.name}! Dung lượng về 28% & SLA Alert giảm -18%!` }],
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
    return appendCmdLog([{ kind: 'info', text: (def.crontabLines ?? ['# Không có cronjob bất thường.']).join('\n') }], { score: state.score + 30 }, 'hit', true, 'systemctl');
  }

  if (cmd === 'ip' || cmd === 'ping') {
    const txt =
      cmd === 'ip'
        ? '2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500 state UP\n    inet 10.42.0.14/24 brd 10.42.0.255 scope global eth0'
        : 'PING 10.42.0.1: 56 data bytes\n64 bytes from 10.42.0.1: icmp_seq=1 ttl=64 time=0.42 ms';
    return appendCmdLog([{ kind: 'info', text: txt }], { score: state.score + 25 }, 'hit', true, 'ip');
  }

  // Domain 5: Docker CLI
  if (cmd === 'docker') {
    const sub = (args[0] ?? 'ps').toLowerCase();
    if (sub === 'ps') {
      if (state.containers.length === 0) {
        return appendCmdLog([{ kind: 'info', text: 'CONTAINER ID   IMAGE   STATUS   NAMES\n(Không có container trên máy chủ này)' }], {}, 'tick', true, 'docker_ps');
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
      ? 'HTTP/1.1 502 Bad Gateway\nServer: nginx/1.24.0 (Gợi ý: chạy "nginx -t" & "systemctl reload nginx")'
      : `HTTP/1.1 200 OK\nServer: nginx/1.24.0\nX-Deploy-Verify: ${def.targetToken}`;
    return appendCmdLog([{ kind: 'success', text: out }], { score: state.score + 45 }, 'hit', true, 'curl');
  }
  if (cmd === 'git') {
    return appendCmdLog(
      [{ kind: 'success', text: 'remote: Enumerating objects: 14, done.\nUpdating a1f82c..99d04e\nFast-forward -> hotfix release.env applied!' }],
      { score: state.score + 55 },
      'hit',
      true,
      'curl'
    );
  }
  if (cmd === 'pm2') {
    const sub = (args[0] ?? 'status').toLowerCase();
    if (sub === 'restart' || sub === 'reload') {
      return appendCmdLog(
        [{ kind: 'success', text: `[PM2] Process app restarted cleanly (online · v2.4.1)` }],
        { pm2Restarted: true, score: state.score + 85 },
        'link',
        true,
        'curl'
      );
    }
    return appendCmdLog(
      [{ kind: 'info', text: `┌────┬─────┬────────┬────────┐\n│ id │ app │ status │ memory │\n│ 0  │ app │ online │ 64.2mb │\n└────┴─────┴────────┴────────┘` }],
      { score: state.score + 40 },
      'hit',
      true,
      'curl'
    );
  }

  // Domain 7: Security UFW (status / allow / deny)
  if (cmd === 'ufw') {
    const sub = (args[0] ?? 'status').toLowerCase();
    if (sub === 'allow' || sub === 'deny') {
      const targetStr = args.slice(1).join(' ').trim();
      if (!targetStr) {
        return appendCmdLog([{ kind: 'error', text: `Cú pháp: ufw ${sub} <cổng|from <IP>>` }], {}, 'error', false);
      }
      const action = sub === 'allow' ? 'ALLOW      ' : 'DENY       ';
      const ruleText = targetStr.startsWith('from ')
        ? `Anywhere                   ${action} ${targetStr.replace(/^from\s+/, '')}`
        : `${targetStr.padEnd(26, ' ')} ${action} Anywhere`;
      const nextRules = state.ufwRules.includes(ruleText) ? state.ufwRules : [...state.ufwRules, ruleText];
      const blockedAttacker = sub === 'deny' && (targetStr.includes('185.220.101.9') || targetStr.includes('22'));
      return appendCmdLog(
        [{ kind: 'success', text: `Rule added (${sub.toUpperCase()} ${targetStr})` }],
        {
          ufwRules: nextRules,
          ufwHardened: state.ufwHardened || blockedAttacker,
          score: state.score + (blockedAttacker ? 85 : 35),
        },
        'hit',
        true,
        'ufw'
      );
    }
    return appendCmdLog(
      [{ kind: 'info', text: `Status: active\nTo                         Action      From\n--                         ------      ----\n${state.ufwRules.join('\n')}` }],
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
    const rows = state.processes.filter((p) => !p.killed).map((p) => `${String(p.pid).padEnd(6)}${p.user.padEnd(9)}${p.cpu.padEnd(6)}${p.mem.padEnd(6)}${p.command}${p.isThreat ? '  <-- [CẢNH BÁO!]' : ''}`);
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
      [{ kind: proc.isThreat ? 'success' : 'warn', text: proc.isThreat ? `[SIGKILL OK] Đã ngắt PID ${pidNum}! SLA Alert giảm -14%.` : `Đã tắt PID ${pidNum}.` }],
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
      const hardenedTarget = Boolean(def.requireChmod600 && file.path === def.requireChmod600);
      return appendCmdLog(
        [{ kind: 'success', text: `[SSH HARDENED] Đã đặt quyền an toàn 600 (-rw-------) cho ${file.name}!` }],
        { files: nextFiles, sshKeyHardened: state.sshKeyHardened || hardenedTarget, score: state.score + 75 },
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
      [{ kind: 'success', text: `[PORT OK] Đã mở thông cổng ${portNum}! Hãy nối mạch "link ${portNum}".` }],
      { ports: nextPorts, score: state.score + 85 },
      'link',
      true,
      'ss'
    );
  }

  if (cmd === 'link' || cmd === 'connect' || cmd === 'bridge') {
    const target = args[0] ?? '';
    return toggleAsciiBridgeNode(
      { ...state, commandHistory: nextHistory, commandsExecuted: state.commandsExecuted + 1, logs: [...state.logs, { id: nextLogId(), kind: 'cmd', text: promptEcho }] },
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
        [{ kind: 'success', text: `[NGINX RELOADED] Cấu hình mới đã áp dụng không downtime!` }],
        { nginxValidated: true, score: state.score + 85 },
        'hit',
        true,
        'nginx'
      );
    }
    if (sub === 'restart' || sub === 'start') {
      const threatAlive = state.processes.some((p) => p.isThreat && !p.killed);
      if (threatAlive) {
        return appendCmdLog([{ kind: 'error', text: `[SYSTEMD LOCK] Hãy ngắt tiến trình treo ("kill -9 709") trước!` }], {}, 'error', false);
      }
      return appendCmdLog(
        [{ kind: 'success', text: `[SYSTEMD ACTIVE] ${svc} đã khởi động lại thành công!` }],
        { restartedService: true, score: state.score + 90 },
        'hit',
        true,
        'systemctl'
      );
    }
  }

  if (
    cmd === 'verify' ||
    cmd === 'crack' ||
    cmd === 'submit' ||
    cmd === 'unlock' ||
    trimmed.toUpperCase() === def.targetToken
  ) {
    const submitted = (trimmed.toUpperCase() === def.targetToken ? trimmed : args[0] ?? '').trim().toUpperCase();
    if (submitted !== def.targetToken) {
      return appendCmdLog([{ kind: 'error', text: `[SAI MÃ] "${submitted}" không khớp! (+6% SLA Alert)` }], { tracePercent: Math.min(100, state.tracePercent + 6) }, 'error', false);
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
      [{ kind: 'success', text: nextCheck.allComplete ? `[INCIDENT RESOLVED] Đã xác nhận & khép lại sự cố ${def.codeName}!` : `[VERIFY OK] Hoàn tất nốt các bước còn lại ở bảng kiểm tra!` }],
      { crackedToken: true, score: state.score + 120 },
      'hit',
      true
    );
  }

  const typoHint = suggestTypoCorrection(cmd);
  return appendCmdLog(
    [{ kind: 'error', text: typoHint ? `Ý bạn là "${typoHint}"? (+3% SLA Alert)` : `bash: ${cmd}: command not found — Gõ "man" hoặc "hint" để xem runbook. (+4% SLA Alert)` }],
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
    'du -sh',
    'df -h',
    'ps aux',
    'ss -tulpn',
    'docker ps',
    'nginx -t',
    'ufw status',
    'kubectl get pods',
    'terraform apply',
    'history',
    'man ls',
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
