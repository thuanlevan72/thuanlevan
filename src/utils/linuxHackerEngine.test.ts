import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeDomainProgressSummary,
  computeMissionRank,
  computeServerTelemetrySnapshot,
  computeTraceRatePerSec,
  createInitialMissionState,
  executeHackerCommand,
  getAutocompleteSuggestion,
  getMissionObjectives,
  getSmartNextHint,
  KNOWLEDGE_DOMAINS,
  LINUX_MISSIONS,
  MissionRuntimeState,
  renderAsciiPatchDiagram,
  tickMissionTrace,
  toggleAsciiBridgeNode,
  UBUNTU_CODEX,
  useHackerPowerup,
} from './linuxHackerEngine.ts';

function recentLogText(state: MissionRuntimeState, count = 3): string {
  return state.logs.slice(-count).map((l) => l.text).join('\n');
}

test('LINUX_MISSIONS covers all 8 required domains across 16 production incidents with lessons', () => {
  assert.equal(KNOWLEDGE_DOMAINS.length, 8);
  assert.equal(LINUX_MISSIONS.length, 16);
  const tokens = new Set(LINUX_MISSIONS.map((m) => m.targetToken));
  assert.equal(tokens.size, 16);
  const domains = new Set(LINUX_MISSIONS.map((m) => m.domainId));
  assert.deepEqual([...domains], [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(UBUNTU_CODEX.length, 22);

  for (const m of LINUX_MISSIONS) {
    assert.ok(m.productionLesson.length >= 40, `Mission ${m.id} missing productionLesson`);
  }

  const verifyRequiredIds = LINUX_MISSIONS.filter((m) => m.requireTokenVerify).map((m) => m.id);
  const autoClearIds = LINUX_MISSIONS.filter((m) => !m.requireTokenVerify).map((m) => m.id);
  assert.deepEqual(verifyRequiredIds, [1, 2, 3, 4, 9, 14]);
  assert.deepEqual(autoClearIds, [5, 6, 7, 8, 10, 11, 12, 13, 15, 16]);
});

test('Domain 1 (Linux Fundamentals): ls -la, grep, pipe wc -l, find, cd, tail & verify/crack', () => {
  // Mission 1 (idx 0, requireTokenVerify=true)
  let m1 = createInitialMissionState(0);
  m1 = executeHackerCommand(m1, 'ls').nextState;
  assert.doesNotMatch(recentLogText(m1, 2), /\.auth_noise\.log/);
  m1 = executeHackerCommand(m1, 'ls -la').nextState;
  assert.match(recentLogText(m1, 2), /\.auth_noise\.log/);

  const piped = executeHackerCommand(m1, 'cat .auth_noise.log | grep ERR | wc -l');
  assert.equal(piped.fx, 'hit');
  assert.match(recentLogText(piped.nextState, 2), /1 dòng/);

  m1 = executeHackerCommand(m1, 'grep ERR .auth_noise.log').nextState;
  assert.match(recentLogText(m1, 2), /ERR_B74A/);
  assert.equal(executeHackerCommand(m1, 'verify ERR_B74A').missionCleared, true);
  assert.equal(executeHackerCommand(m1, 'crack ERR_B74A').missionCleared, true);

  // Mission 2 (idx 1, requireTokenVerify=true) & VFS isolation
  let m2 = createInitialMissionState(1);
  assert.equal(executeHackerCommand(m2, 'cd /nonexistent/dir').fx, 'error');
  m2 = executeHackerCommand(m2, 'find / -name *.log').nextState;
  assert.match(recentLogText(m2, 2), /\/var\/backups\/secret\/backup\.log/);
  m2 = executeHackerCommand(m2, 'cd /var/backups/secret').nextState;
  assert.equal(m2.visitedTargetDir, true);
  m2 = executeHackerCommand(m2, 'tail -n 3 backup.log').nextState;
  assert.match(recentLogText(m2, 2), /BAK_209K/);
  assert.equal(executeHackerCommand(m2, 'verify BAK_209K').missionCleared, true);
});

test('Domain 2 (Bash Scripting): chmod +x, && short-circuit, env | grep, export SAFE_MODE=1', () => {
  // Mission 3 (idx 2, requireTokenVerify=true)
  const m3Init = createInitialMissionState(2);
  assert.equal(executeHackerCommand(m3Init, './decrypt.sh').fx, 'error');

  // Failing left side of && must short-circuit right side
  const aborted = executeHackerCommand(m3Init, './decrypt.sh && chmod +x decrypt.sh');
  assert.equal(aborted.fx, 'error');
  assert.equal(aborted.nextState.files[0].executable, false);

  let m3 = executeHackerCommand(m3Init, 'chmod +x decrypt.sh').nextState;
  m3 = executeHackerCommand(m3, './decrypt.sh').nextState;
  assert.equal(executeHackerCommand(m3, 'verify HEX_9X3').missionCleared, true);

  // Mission 4 (idx 3, requireTokenVerify=true)
  let m4 = createInitialMissionState(3);
  const baseRate = computeTraceRatePerSec(m4, 'speed');
  m4 = executeHackerCommand(m4, 'env | grep TOKEN').nextState;
  assert.match(recentLogText(m4, 2), /ENV_308R/);
  m4 = executeHackerCommand(m4, 'export SAFE_MODE=1').nextState;
  assert.equal(m4.safeEnvSet, true);
  assert.ok(computeTraceRatePerSec(m4, 'speed') < baseRate);
  m4 = executeHackerCommand(m4, 'kill -9 577').nextState;
  assert.equal(executeHackerCommand(m4, 'verify ENV_308R').missionCleared, true);
});

test('Domain 3 (SysAdmin): ps aux, du -sh, df -h, rm junk & systemctl auto-clear operations', () => {
  // Mission 5 (idx 4, auto-clear on rm once PID 404 is killed)
  let m5 = createInitialMissionState(4);
  for (let i = 0; i < 40; i++) {
    m5 = tickMissionTrace(m5, 0.1, 'speed');
  }
  m5 = executeHackerCommand(m5, 'ps aux').nextState;
  assert.match(recentLogText(m5, 2), /404/);
  m5 = executeHackerCommand(m5, 'df -h').nextState;
  assert.match(recentLogText(m5, 2), /99%/);
  m5 = executeHackerCommand(m5, 'du -sh').nextState;
  assert.match(recentLogText(m5, 2), /48\.2G/);
  m5 = executeHackerCommand(m5, 'kill -9 404').nextState;
  const m5Clear = executeHackerCommand(m5, 'rm malware_bomb.tmp');
  assert.equal(m5Clear.nextState.cleanedJunk, true);
  assert.equal(m5Clear.nextState.diskUsagePct, 28);
  assert.equal(m5Clear.missionCleared, true);

  // Mission 6 (idx 5, auto-clear on kill -9 709 && systemctl restart nginx-shield)
  let m6 = createInitialMissionState(5);
  m6 = executeHackerCommand(m6, 'crontab -l').nextState;
  assert.equal(executeHackerCommand(m6, 'systemctl restart nginx-shield').fx, 'error');
  const m6Clear = executeHackerCommand(m6, 'kill -9 709 && systemctl restart nginx-shield');
  assert.equal(m6Clear.nextState.restartedService, true);
  assert.equal(m6Clear.missionCleared, true);
});

test('Domain 4 (Networking): ss -tulpn, bypass -p, ASCII bridge, ip a & auto-clear', () => {
  // Mission 7 (idx 6, auto-clear when bridges 80 & 443 connected)
  let m7 = createInitialMissionState(6);
  assert.equal(toggleAsciiBridgeNode(m7, 80).fx, 'error');
  m7 = executeHackerCommand(m7, 'ss -tulpn').nextState;
  assert.match(recentLogText(m7, 2), /VULN/);
  m7 = executeHackerCommand(m7, 'bypass -p 80').nextState;
  m7 = executeHackerCommand(m7, 'link 80').nextState;
  const m7Clear = toggleAsciiBridgeNode(m7, 443);
  assert.match(renderAsciiPatchDiagram(m7Clear.nextState.bridges, m7Clear.nextState.ports), /══╬\[p80:OK\]══▶/);
  assert.equal(m7Clear.missionCleared, true);

  // Mission 8 (idx 7, auto-clear on kill + bypass + links)
  let m8 = createInitialMissionState(7);
  m8 = executeHackerCommand(m8, 'ip a').nextState;
  assert.match(recentLogText(m8, 2), /eth0/);
  m8 = executeHackerCommand(m8, 'find / -name *.key').nextState;
  assert.match(recentLogText(m8, 2), /\/opt\/vault\/node7\.key/);
  const m8Clear = executeHackerCommand(m8, 'kill -9 812 && bypass -p 3128 && link 3128 && link 22');
  assert.equal(m8Clear.missionCleared, true);
});

test('Domain 5 (Docker & Container): docker ps, logs, exec, restart', () => {
  // Mission 9 (idx 8, requireTokenVerify=true)
  let m9 = createInitialMissionState(8);
  m9 = executeHackerCommand(m9, 'docker ps').nextState;
  assert.match(recentLogText(m9, 2), /api-vault/);
  m9 = executeHackerCommand(m9, 'docker logs api-vault').nextState;
  assert.match(recentLogText(m9, 2), /DCK_109P/);
  assert.equal(executeHackerCommand(m9, 'verify DCK_109P').missionCleared, true);

  // Mission 10 (idx 9, auto-clear on kill + restart + port 5000)
  let m10 = createInitialMissionState(9);
  assert.equal(executeHackerCommand(m10, 'verify CNT_55X').fx, 'error');
  m10 = executeHackerCommand(m10, 'docker exec auth-worker cat /secret.key').nextState;
  assert.match(recentLogText(m10, 2), /CNT_55X/);
  m10 = executeHackerCommand(m10, 'docker restart auth-worker').nextState;
  assert.equal(m10.dockerHandled, true);
  const m10Clear = executeHackerCommand(m10, 'kill -9 642 && bypass -p 5000 && link 5000');
  assert.equal(m10Clear.missionCleared, true);
});

test('Domain 6 (Web Server & Deployment): nginx -t, curl -I, reload nginx, git pull, pm2', () => {
  // Mission 11 (idx 10, auto-clear)
  let m11 = createInitialMissionState(10);
  m11 = executeHackerCommand(m11, 'curl -I http://localhost').nextState;
  assert.match(recentLogText(m11, 2), /502 Bad Gateway/);
  m11 = executeHackerCommand(m11, 'nginx -t').nextState;
  m11 = executeHackerCommand(m11, 'systemctl reload nginx').nextState;
  m11 = executeHackerCommand(m11, 'curl -I http://localhost').nextState;
  assert.match(recentLogText(m11, 2), /200 OK/);
  const m11Clear = executeHackerCommand(m11, 'bypass -p 80 && link 80');
  assert.equal(m11Clear.missionCleared, true);

  // Mission 12 (idx 11, auto-clear)
  let m12 = createInitialMissionState(11);
  m12 = executeHackerCommand(m12, 'git pull').nextState;
  m12 = executeHackerCommand(m12, 'pm2 status').nextState;
  const m12Clear = executeHackerCommand(m12, 'kill -9 722 && pm2 restart app');
  assert.equal(m12Clear.nextState.pm2Restarted, true);
  assert.equal(m12Clear.missionCleared, true);
});

test('Domain 7 (Linux Security): ufw deny, chmod 600, auth.log & base64 -d', () => {
  // Mission 13 (idx 12, auto-clear after ufw deny + chmod 600 + kill 805)
  let m13 = createInitialMissionState(12);
  m13 = executeHackerCommand(m13, 'ufw status').nextState;
  assert.match(recentLogText(m13, 2), /Status: active/);
  m13 = executeHackerCommand(m13, 'grep Failed /var/log/auth.log').nextState;
  assert.match(recentLogText(m13, 2), /185\.220\.101\.9/);
  m13 = executeHackerCommand(m13, 'ufw deny from 185.220.101.9').nextState;
  assert.equal(m13.ufwHardened, true);
  m13 = executeHackerCommand(m13, 'chmod 600 id_rsa').nextState;
  assert.equal(m13.sshKeyHardened, true);
  const m13Clear = executeHackerCommand(m13, 'kill -9 805');
  assert.equal(m13Clear.missionCleared, true);

  // Mission 14 (idx 13, requireTokenVerify=true)
  let m14 = createInitialMissionState(13);
  m14 = executeHackerCommand(m14, 'echo QjY0XzQ0Qw== | base64 -d').nextState;
  assert.equal(m14.decodedCipher, true);
  assert.match(recentLogText(m14, 2), /B64_44C/);
  m14 = executeHackerCommand(m14, 'kill -9 825 && bypass -p 5432 && link 5432 && link 22').nextState;
  assert.equal(executeHackerCommand(m14, 'verify B64_44C').missionCleared, true);
});

test('Domain 8 (DevOps & Cloud): kubectl get/logs/scale, terraform apply & DR auto-clear', () => {
  // Mission 15 (idx 14, auto-clear)
  let m15 = createInitialMissionState(14);
  m15 = executeHackerCommand(m15, 'kubectl get pods').nextState;
  assert.match(recentLogText(m15, 2), /CrashLoopBackOff/);
  m15 = executeHackerCommand(m15, 'kubectl logs edge-api').nextState;
  assert.match(recentLogText(m15, 2), /K8S_33N/);
  m15 = executeHackerCommand(m15, 'kubectl scale --replicas=3').nextState;
  assert.equal(m15.k8sScaled, true);
  const m15Clear = executeHackerCommand(m15, 'kill -9 880');
  assert.equal(m15Clear.missionCleared, true);

  // Mission 16 (idx 15, auto-clear upon final operational step)
  let m16 = createInitialMissionState(15);
  m16 = executeHackerCommand(m16, 'kill -9 901 && kill -9 909 && rm trace_lock.tmp').nextState;
  m16 = executeHackerCommand(m16, 'chmod +x override.sh && ./override.sh').nextState;
  m16 = executeHackerCommand(m16, 'terraform apply').nextState;
  assert.equal(m16.terraformApplied, true);
  const m16Done = executeHackerCommand(m16, 'bypass -p 22 && link 22 && link 443 && link 9000');
  assert.equal(m16Done.missionCleared, true);
  assert.equal(getMissionObjectives(m16Done.nextState).allComplete, true);
});

test('Powerups, man/history, smart hint, rank, and autocomplete work cleanly', () => {
  let state = createInitialMissionState(0);
  state.tracePercent = 50;
  state.exploitPoints = 80;

  state = executeHackerCommand(state, 'man ls').nextState;
  assert.match(recentLogText(state, 2), /MAN\(LS\)/);
  state = executeHackerCommand(state, 'history').nextState;
  assert.match(recentLogText(state, 2), /man ls/);

  const speedHint = useHackerPowerup(state, 'hint', 'speed');
  assert.doesNotMatch(recentLogText(speedHint.nextState, 1), /ERR_B74A/);
  assert.equal(speedHint.nextState.exploitPoints, state.exploitPoints - 15);

  const practiceHint = useHackerPowerup(state, 'hint', 'practice');
  assert.equal(practiceHint.nextState.exploitPoints, state.exploitPoints);

  const frozen = useHackerPowerup(state, 'freeze');
  assert.ok(frozen.nextState.traceFreezeTimer >= 6.0);
  assert.equal(frozen.nextState.exploitPoints, state.exploitPoints - 30);

  const cloaked = useHackerPowerup(frozen.nextState, 'cloak');
  assert.equal(cloaked.nextState.tracePercent, 28);
  assert.equal(cloaked.nextState.exploitPoints, frozen.nextState.exploitPoints - 40);

  const smart = getSmartNextHint(createInitialMissionState(4));
  assert.equal(smart.command, 'kill -9 404');

  assert.equal(computeMissionRank(15, 0), 'S');
  assert.equal(computeMissionRank(45, 2), 'A');

  assert.equal(getAutocompleteSuggestion('grep E', state), 'grep ERR .auth_noise.log');
  assert.equal(getAutocompleteSuggestion('ls -', state), 'ls -la');
});

test('Live server telemetry snapshot & 8-domain codex mastery track remediation accurately', () => {
  // Mission 5 (Disk full + rogue process 404)
  let m5 = createInitialMissionState(4);
  const m5Before = computeServerTelemetrySnapshot(m5);
  assert.equal(m5Before.diskPct, 99);
  assert.equal(m5Before.overallHealth, 'CRITICAL');
  assert.equal(m5Before.nodes.find((n) => n.id === 'host_kernel')?.status, 'critical');
  assert.equal(m5Before.nodes.find((n) => n.id === 'storage_vault')?.status, 'critical');

  m5 = executeHackerCommand(m5, 'kill -9 404').nextState;
  m5 = executeHackerCommand(m5, 'rm malware_bomb.tmp').nextState;
  const m5After = computeServerTelemetrySnapshot(m5);
  assert.equal(m5After.diskPct, 28);
  assert.ok(m5After.cpuPct < m5Before.cpuPct);
  assert.ok(m5After.securityScore > m5Before.securityScore);
  assert.equal(m5After.overallHealth, 'HEALTHY');

  // Mission 13 (UFW + chmod 600 + kill 805)
  let m13 = createInitialMissionState(12);
  assert.equal(computeServerTelemetrySnapshot(m13).nodes.find((n) => n.id === 'ingress_fw')?.status, 'critical');
  m13 = executeHackerCommand(m13, 'ufw deny from 185.220.101.9').nextState;
  m13 = executeHackerCommand(m13, 'chmod 600 id_rsa').nextState;
  m13 = executeHackerCommand(m13, 'kill -9 805').nextState;
  const m13After = computeServerTelemetrySnapshot(m13);
  assert.equal(m13After.nodes.find((n) => n.id === 'ingress_fw')?.status, 'nominal');
  assert.equal(m13After.securityScore, 100);

  // Mission 15 (K8s CrashLoopBackOff -> Running)
  let m15 = createInitialMissionState(14);
  assert.equal(computeServerTelemetrySnapshot(m15).nodes.find((n) => n.id === 'service_runtime')?.status, 'critical');
  m15 = executeHackerCommand(m15, 'kubectl scale --replicas=3').nextState;
  m15 = executeHackerCommand(m15, 'kill -9 880').nextState;
  assert.equal(computeServerTelemetrySnapshot(m15).nodes.find((n) => n.id === 'service_runtime')?.status, 'nominal');

  // Domain mastery summary
  const summary = computeDomainProgressSummary(['ls', 'grep', 'chmod', 'kill']);
  assert.equal(summary.totalUnlocked, 4);
  assert.equal(summary.totalCodex, 22);
  assert.equal(summary.domains.length, 8);
  assert.ok(summary.pct > 0 && summary.pct < 100);
});

