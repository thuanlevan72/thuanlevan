import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeMissionRank,
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

function allLogText(state: MissionRuntimeState): string {
  return state.logs.slice(-2).map((l) => l.text).join('\n');
}

test('LINUX_MISSIONS covers all 8 required domains across 16 progressive missions', () => {
  assert.equal(KNOWLEDGE_DOMAINS.length, 8);
  assert.equal(LINUX_MISSIONS.length, 16);
  const tokens = new Set(LINUX_MISSIONS.map((m) => m.targetToken));
  assert.equal(tokens.size, 16);
  const domains = new Set(LINUX_MISSIONS.map((m) => m.domainId));
  assert.deepEqual([...domains], [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(UBUNTU_CODEX.length, 22);
});

test('Domain 1 (Linux Fundamentals): ls -la, grep, cd, tail, find', () => {
  // Mission 1 (idx 0)
  let m1 = createInitialMissionState(0);
  m1 = executeHackerCommand(m1, 'ls').nextState;
  assert.doesNotMatch(allLogText(m1), /\.auth_noise\.log/);
  m1 = executeHackerCommand(m1, 'ls -la').nextState;
  assert.match(allLogText(m1), /\.auth_noise\.log/);
  m1 = executeHackerCommand(m1, 'grep ERR .auth_noise.log').nextState;
  assert.match(allLogText(m1), /ERR_B74A/);
  assert.equal(executeHackerCommand(m1, 'crack ERR_B74A').missionCleared, true);

  // Mission 2 (idx 1)
  let m2 = createInitialMissionState(1);
  m2 = executeHackerCommand(m2, 'find / -name *.log').nextState;
  assert.match(allLogText(m2), /\/var\/backups\/secret\/backup\.log/);
  m2 = executeHackerCommand(m2, 'cd /var/backups/secret').nextState;
  assert.equal(m2.visitedTargetDir, true);
  m2 = executeHackerCommand(m2, 'tail -n 3 backup.log').nextState;
  assert.match(allLogText(m2), /BAK_209K/);
  assert.equal(executeHackerCommand(m2, 'crack BAK_209K').missionCleared, true);
});

test('Domain 2 (Bash Scripting): chmod +x, ./script.sh, env | pipe, export SAFE_MODE=1', () => {
  // Mission 3 (idx 2)
  let m3 = createInitialMissionState(2);
  assert.equal(executeHackerCommand(m3, './decrypt.sh').fx, 'error');
  m3 = executeHackerCommand(m3, 'chmod +x decrypt.sh').nextState;
  m3 = executeHackerCommand(m3, './decrypt.sh').nextState;
  assert.equal(executeHackerCommand(m3, 'crack HEX_9X3').missionCleared, true);

  // Mission 4 (idx 3)
  let m4 = createInitialMissionState(3);
  const baseRate = computeTraceRatePerSec(m4, 'speed');
  m4 = executeHackerCommand(m4, 'env | grep TOKEN').nextState;
  assert.match(allLogText(m4), /ENV_308R/);
  m4 = executeHackerCommand(m4, 'export SAFE_MODE=1').nextState;
  assert.equal(m4.safeEnvSet, true);
  assert.ok(computeTraceRatePerSec(m4, 'speed') < baseRate);
  m4 = executeHackerCommand(m4, 'kill -9 577').nextState;
  assert.equal(executeHackerCommand(m4, 'crack ENV_308R').missionCleared, true);
});

test('Domain 3 (SysAdmin): ps aux, kill -9, df -h, rm junk, crontab, systemctl', () => {
  // Mission 5 (idx 4)
  let m5 = createInitialMissionState(4);
  for (let i = 0; i < 60; i++) {
    m5 = tickMissionTrace(m5, 0.1, 'speed');
  }
  m5 = executeHackerCommand(m5, 'ps aux').nextState;
  assert.match(allLogText(m5), /404/);
  m5 = executeHackerCommand(m5, 'kill -9 404').nextState;
  m5 = executeHackerCommand(m5, 'df -h').nextState;
  assert.match(allLogText(m5), /99%/);
  m5 = executeHackerCommand(m5, 'rm malware_bomb.tmp').nextState;
  assert.equal(m5.cleanedJunk, true);
  assert.equal(m5.diskUsagePct, 28);
  assert.equal(executeHackerCommand(m5, 'crack SYS_404Z').missionCleared, true);

  // Mission 6 (idx 5)
  let m6 = createInitialMissionState(5);
  m6 = executeHackerCommand(m6, 'crontab -l').nextState;
  assert.equal(executeHackerCommand(m6, 'systemctl restart nginx-shield').fx, 'error');
  m6 = executeHackerCommand(m6, 'kill -9 709 && systemctl restart nginx-shield').nextState;
  assert.equal(executeHackerCommand(m6, 'crack SVC_61M').missionCleared, true);
});

test('Domain 4 (Networking): ss -tulpn, bypass -p, ASCII bridge, ip a', () => {
  // Mission 7 (idx 6)
  let m7 = createInitialMissionState(6);
  assert.equal(toggleAsciiBridgeNode(m7, 80).fx, 'error');
  m7 = executeHackerCommand(m7, 'ss -tulpn').nextState;
  assert.match(allLogText(m7), /VULN/);
  m7 = executeHackerCommand(m7, 'bypass -p 80').nextState;
  m7 = executeHackerCommand(m7, 'link 80').nextState;
  m7 = toggleAsciiBridgeNode(m7, 443).nextState;
  assert.match(renderAsciiPatchDiagram(m7.bridges, m7.ports), /══╬\[p80:OK\]══▶/);
  assert.equal(executeHackerCommand(m7, 'crack PORT_80X').missionCleared, true);

  // Mission 8 (idx 7)
  let m8 = createInitialMissionState(7);
  m8 = executeHackerCommand(m8, 'ip a').nextState;
  assert.match(allLogText(m8), /eth0/);
  m8 = executeHackerCommand(m8, 'find / -name *.key').nextState;
  assert.match(allLogText(m8), /\/opt\/vault\/node7\.key/);
  m8 = executeHackerCommand(m8, 'kill -9 812 && bypass -p 3128 && link 3128 && link 22').nextState;
  assert.equal(executeHackerCommand(m8, 'crack SSH_77V').missionCleared, true);
});

test('Domain 5 (Docker & Container): docker ps, logs, exec, restart', () => {
  // Mission 9 (idx 8)
  let m9 = createInitialMissionState(8);
  m9 = executeHackerCommand(m9, 'docker ps').nextState;
  assert.match(allLogText(m9), /api-vault/);
  m9 = executeHackerCommand(m9, 'docker logs api-vault').nextState;
  assert.match(allLogText(m9), /DCK_109P/);
  assert.equal(executeHackerCommand(m9, 'crack DCK_109P').missionCleared, true);

  // Mission 10 (idx 9)
  let m10 = createInitialMissionState(9);
  assert.equal(executeHackerCommand(m10, 'crack CNT_55X').fx, 'error');
  m10 = executeHackerCommand(m10, 'docker exec auth-worker cat /secret.key').nextState;
  assert.match(allLogText(m10), /CNT_55X/);
  m10 = executeHackerCommand(m10, 'docker restart auth-worker').nextState;
  assert.equal(m10.dockerHandled, true);
  m10 = executeHackerCommand(m10, 'kill -9 642 && bypass -p 5000 && link 5000').nextState;
  assert.equal(executeHackerCommand(m10, 'crack CNT_55X').missionCleared, true);
});

test('Domain 6 (Web Server & Deployment): nginx -t, curl -I, reload nginx, git pull, pm2', () => {
  // Mission 11 (idx 10)
  let m11 = createInitialMissionState(10);
  m11 = executeHackerCommand(m11, 'curl -I http://localhost').nextState;
  assert.match(allLogText(m11), /502 Bad Gateway/);
  m11 = executeHackerCommand(m11, 'nginx -t').nextState;
  m11 = executeHackerCommand(m11, 'systemctl reload nginx').nextState;
  m11 = executeHackerCommand(m11, 'curl -I http://localhost').nextState;
  assert.match(allLogText(m11), /200 OK/);
  m11 = executeHackerCommand(m11, 'bypass -p 80 && link 80').nextState;
  assert.equal(executeHackerCommand(m11, 'crack NGX_808W').missionCleared, true);

  // Mission 12 (idx 11)
  let m12 = createInitialMissionState(11);
  m12 = executeHackerCommand(m12, 'git pull').nextState;
  m12 = executeHackerCommand(m12, 'pm2 status').nextState;
  m12 = executeHackerCommand(m12, 'kill -9 722 && pm2 restart app').nextState;
  assert.equal(executeHackerCommand(m12, 'crack DEP_99G').missionCleared, true);
});

test('Domain 7 (Linux Security): ufw status, chmod 600, auth.log & base64 -d', () => {
  // Mission 13 (idx 12)
  let m13 = createInitialMissionState(12);
  m13 = executeHackerCommand(m13, 'ufw status').nextState;
  assert.match(allLogText(m13), /Status: active/);
  m13 = executeHackerCommand(m13, 'chmod 600 id_rsa').nextState;
  m13 = executeHackerCommand(m13, 'grep Failed /var/log/auth.log').nextState;
  assert.match(allLogText(m13), /SEC_600S/);
  m13 = executeHackerCommand(m13, 'kill -9 805').nextState;
  assert.equal(executeHackerCommand(m13, 'crack SEC_600S').missionCleared, true);

  // Mission 14 (idx 13)
  let m14 = createInitialMissionState(13);
  m14 = executeHackerCommand(m14, 'echo QjY0XzQ0Qw== | base64 -d').nextState;
  assert.equal(m14.decodedCipher, true);
  assert.match(allLogText(m14), /B64_44C/);
  m14 = executeHackerCommand(m14, 'kill -9 825 && bypass -p 5432 && link 5432 && link 22').nextState;
  assert.equal(executeHackerCommand(m14, 'crack B64_44C').missionCleared, true);
});

test('Domain 8 (DevOps & Cloud): kubectl get/logs/scale, terraform apply & Final Boss ROOT_000', () => {
  // Mission 15 (idx 14)
  let m15 = createInitialMissionState(14);
  m15 = executeHackerCommand(m15, 'kubectl get pods').nextState;
  assert.match(allLogText(m15), /CrashLoopBackOff/);
  m15 = executeHackerCommand(m15, 'kubectl logs edge-api').nextState;
  assert.match(allLogText(m15), /K8S_33N/);
  m15 = executeHackerCommand(m15, 'kubectl scale --replicas=3').nextState;
  assert.equal(m15.k8sScaled, true);
  m15 = executeHackerCommand(m15, 'kill -9 880').nextState;
  assert.equal(executeHackerCommand(m15, 'crack K8S_33N').missionCleared, true);

  // Mission 16 (idx 15): Final Boss
  let m16 = createInitialMissionState(15);
  m16 = executeHackerCommand(m16, 'kill -9 901 && kill -9 909 && rm trace_lock.tmp').nextState;
  m16 = executeHackerCommand(m16, 'chmod +x override.sh && ./override.sh').nextState;
  m16 = executeHackerCommand(m16, 'terraform apply').nextState;
  assert.equal(m16.terraformApplied, true);
  m16 = executeHackerCommand(m16, 'bypass -p 22 && link 22 && link 443 && link 9000').nextState;
  const m16Done = executeHackerCommand(m16, 'sudo crack ROOT_000');
  assert.equal(m16Done.missionCleared, true);
  assert.equal(getMissionObjectives(m16Done.nextState).allComplete, true);
});

test('Powerups freeze/cloak/hint, smart next hint, rank, and autocomplete work cleanly', () => {
  const state = createInitialMissionState(0);
  state.tracePercent = 50;
  state.exploitPoints = 80;

  const frozen = useHackerPowerup(state, 'freeze');
  assert.ok(frozen.nextState.traceFreezeTimer >= 6.0);
  assert.equal(frozen.nextState.exploitPoints, 50);

  const cloaked = useHackerPowerup(frozen.nextState, 'cloak');
  assert.equal(cloaked.nextState.tracePercent, 28);
  assert.equal(cloaked.nextState.exploitPoints, 10);

  const smart = getSmartNextHint(createInitialMissionState(4));
  assert.equal(smart.command, 'kill -9 404');

  assert.equal(computeMissionRank(15, 0), 'S');
  assert.equal(computeMissionRank(45, 2), 'A');

  assert.equal(getAutocompleteSuggestion('grep E', state), 'grep ERR .auth_noise.log');
  assert.equal(getAutocompleteSuggestion('ls -', state), 'ls -la');
});
