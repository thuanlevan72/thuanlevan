import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeArchitectureDesign,
  ARCH_MODES,
  buildBlueprintGraph,
  canAddEdge,
  computeBlueprintCost,
  createInitialNodes,
  evaluatePacketAtNode,
  evaluateSolutionOptimization,
  getEffectiveScenarioConfig,
  getSellRefund,
  hasPathToDatabase,
  INFRA_NODE_CATALOG,
  pickWeightedPacketKind,
  RACK_SLOTS,
  selectOutgoingEdge,
  TRAFFIC_LEVELS,
  type InfraEdge,
  type InfraNode,
} from './trafficRouterEngine.ts';

test('TRAFFIC_LEVELS defines 24 valid scenarios across 6 chapters with 4 escalating waves & 3+ approaches', () => {
  assert.equal(TRAFFIC_LEVELS.length, 24);
  assert.equal(INFRA_NODE_CATALOG.length, 10);
  assert.equal(RACK_SLOTS.length, 12);

  const chapterCounts = new Map<number, number>();
  for (const lvl of TRAFFIC_LEVELS) {
    chapterCounts.set(lvl.chapter, (chapterCounts.get(lvl.chapter) ?? 0) + 1);
    const nodes = createInitialNodes(lvl);
    assert.ok(nodes.some((n) => n.id === 'ingress' && n.fixed));
    assert.ok(nodes.some((n) => n.id === 'database' && n.fixed));
    assert.equal(hasPathToDatabase(nodes, lvl.initialEdges), true);
    assert.ok(lvl.waves.length >= 4, `Level ${lvl.code} must have at least 4 escalating waves`);
    assert.ok(lvl.approaches.length >= 3, `Level ${lvl.code} must offer at least 3 diverse approaches`);

    for (const w of lvl.waves) {
      const totalWeight =
        w.weights.read + w.weights.write + w.weights.media + w.weights.ddos + w.weights.sqli;
      assert.ok(
        Math.abs(totalWeight - 1) < 0.002,
        `Level ${lvl.code} Wave ${w.waveNumber} weights must sum to 1 (got ${totalWeight})`
      );
    }

    for (const ap of lvl.approaches) {
      const bp = buildBlueprintGraph(lvl, ap);
      assert.equal(
        hasPathToDatabase(bp.nodes, bp.edges),
        true,
        `Blueprint ${ap.id} in ${lvl.code} must connect ingress to database`
      );
      const bpCost = computeBlueprintCost(lvl, ap);
      assert.ok(
        bpCost <= lvl.startingBudget,
        `Blueprint ${ap.id} ($${bpCost}) in ${lvl.code} must fit within upfront startingBudget ($${lvl.startingBudget})`
      );
    }
  }
  assert.deepEqual([...chapterCounts.keys()].sort(), [1, 2, 3, 4, 5, 6]);
  for (const ch of [1, 2, 3, 4, 5, 6]) {
    assert.equal(chapterCounts.get(ch), 4, `Chapter ${ch} should contain 4 scenarios`);
  }
});

test('5 game modes transform every scenario cleanly with normalized weights and distinct constraints', () => {
  assert.equal(ARCH_MODES.length, 5);

  for (const lvl of TRAFFIC_LEVELS) {
    const stdCfg = getEffectiveScenarioConfig(lvl, 'standard');
    const surgeCfg = getEffectiveScenarioConfig(lvl, 'flash_surge');
    const cyberCfg = getEffectiveScenarioConfig(lvl, 'cyber_siege');
    const finOpsCfg = getEffectiveScenarioConfig(lvl, 'tight_budget');
    const chaosCfg = getEffectiveScenarioConfig(lvl, 'chaos_hell');

    assert.equal(stdCfg.waves.length, lvl.waves.length);
    assert.equal(surgeCfg.waves.length, lvl.waves.length + 1);
    assert.equal(cyberCfg.waves.length, lvl.waves.length + 1);
    assert.equal(finOpsCfg.waves.length, lvl.waves.length);
    assert.equal(chaosCfg.waves.length, lvl.waves.length + 1);

    assert.ok(finOpsCfg.startingBudget < stdCfg.startingBudget, `${lvl.code} tight_budget must lower budget`);
    assert.ok(cyberCfg.startingBudget >= stdCfg.startingBudget, `${lvl.code} cyber_siege increases budget`);
    assert.ok(chaosCfg.targetSlaMs < stdCfg.targetSlaMs, `${lvl.code} chaos_hell tightens SLA`);
    assert.ok(chaosCfg.dbCoolingPerSec < stdCfg.dbCoolingPerSec, `${lvl.code} chaos_hell reduces DB cooling`);

    const stdMalicious = stdCfg.waves[0].weights.ddos + stdCfg.waves[0].weights.sqli;
    const cyberMalicious = cyberCfg.waves[0].weights.ddos + cyberCfg.waves[0].weights.sqli;
    assert.ok(cyberMalicious > stdMalicious, `${lvl.code} cyber_siege must inject malicious traffic`);

    for (const cfg of [stdCfg, surgeCfg, cyberCfg, finOpsCfg, chaosCfg]) {
      for (const w of cfg.waves) {
        const sum = w.weights.read + w.weights.write + w.weights.media + w.weights.ddos + w.weights.sqli;
        assert.ok(
          Math.abs(sum - 1) < 0.002,
          `${lvl.code} mode ${cfg.mode.id} wave ${w.waveNumber} sum=${sum}`
        );
      }
    }
  }
});

test('canAddEdge prevents cycles, self-loops, duplicates, and invalid terminal wiring', () => {
  const nodes: InfraNode[] = [
    { id: 'ingress', type: 'ingress', x: 76, y: 250, fixed: true, level: 1, rrCursor: 0, processedCount: 0, blockedCount: 0, cacheHitCount: 0, heat: 0 },
    { id: 'waf-1', type: 'waf', x: 225, y: 250, level: 1, rrCursor: 0, processedCount: 0, blockedCount: 0, cacheHitCount: 0, heat: 0 },
    { id: 'app-1', type: 'app', x: 545, y: 250, level: 1, rrCursor: 0, processedCount: 0, blockedCount: 0, cacheHitCount: 0, heat: 0 },
    { id: 'database', type: 'database', x: 844, y: 250, fixed: true, level: 1, rrCursor: 0, processedCount: 0, blockedCount: 0, cacheHitCount: 0, heat: 0 },
  ];
  const edges: InfraEdge[] = [
    { id: 'e1', fromId: 'ingress', toId: 'waf-1' },
    { id: 'e2', fromId: 'waf-1', toId: 'app-1' },
  ];

  assert.equal(canAddEdge(nodes, edges, 'app-1', 'app-1').valid, false);
  assert.equal(canAddEdge(nodes, edges, 'ingress', 'waf-1').valid, false);
  assert.equal(canAddEdge(nodes, edges, 'database', 'app-1').valid, false);
  assert.equal(canAddEdge(nodes, edges, 'app-1', 'ingress').valid, false);
  assert.equal(canAddEdge(nodes, edges, 'app-1', 'waf-1').valid, false); // Cycle check
  assert.equal(canAddEdge(nodes, edges, 'app-1', 'database').valid, true);
});

test('selectOutgoingEdge strictly alternates Round-Robin branches across outgoing edges', () => {
  const lb: InfraNode = {
    id: 'lb-1',
    type: 'load_balancer',
    x: 385,
    y: 250,
    level: 1,
    rrCursor: 0,
    processedCount: 0,
    blockedCount: 0,
    cacheHitCount: 0,
    heat: 0,
  };
  const edges: InfraEdge[] = [
    { id: 'e-top', fromId: 'lb-1', toId: 'app-top' },
    { id: 'e-mid', fromId: 'lb-1', toId: 'app-mid' },
    { id: 'e-bot', fromId: 'lb-1', toId: 'app-bot' },
  ];

  const r1 = selectOutgoingEdge(lb, edges);
  assert.equal(r1.edge?.toId, 'app-top');
  const r2 = selectOutgoingEdge({ ...lb, rrCursor: r1.nextCursor }, edges);
  assert.equal(r2.edge?.toId, 'app-mid');
  const r3 = selectOutgoingEdge({ ...lb, rrCursor: r2.nextCursor }, edges);
  assert.equal(r3.edge?.toId, 'app-bot');
  const r4 = selectOutgoingEdge({ ...lb, rrCursor: r3.nextCursor }, edges);
  assert.equal(r4.edge?.toId, 'app-top');
});

test('evaluatePacketAtNode verifies WAF, Limiter, CDN, Redis, Queue damping, S3 offload, and heat congestion latency', () => {
  const makeNode = (type: InfraNode['type'], level: 1 | 2 = 1, heat = 0): InfraNode => ({
    id: type,
    type,
    x: 0,
    y: 0,
    level,
    rrCursor: 0,
    processedCount: 0,
    blockedCount: 0,
    cacheHitCount: 0,
    heat,
  });

  // WAF blocks SQLi 100%
  assert.equal(evaluatePacketAtNode(makeNode('waf'), 'sqli', 0.99, 1).outcome, 'blocked');
  assert.equal(evaluatePacketAtNode(makeNode('waf'), 'write', 0.5, 1).outcome, 'forward');

  // Rate Limiter blocks DDoS burst cleanly while allowing read/write
  assert.equal(evaluatePacketAtNode(makeNode('rate_limiter', 2), 'ddos', 0.95, 1).outcome, 'blocked');
  assert.equal(evaluatePacketAtNode(makeNode('rate_limiter', 1), 'read', 0.1, 1).outcome, 'forward');

  // Redis intercepts GET reads on hit with zero DB CPU, forwards writes
  const redisHit = evaluatePacketAtNode(makeNode('redis', 1), 'read', 0.3, 1);
  assert.equal(redisHit.outcome, 'cache_hit');
  assert.equal(redisHit.dbCpuDelta, 0);
  assert.equal(evaluatePacketAtNode(makeNode('redis', 1), 'write', 0.1, 1).outcome, 'forward');

  // CDN & Object Storage offload MEDIA files
  assert.equal(evaluatePacketAtNode(makeNode('cdn', 1), 'media', 0.5, 1).outcome, 'cache_hit');
  assert.equal(evaluatePacketAtNode(makeNode('object_storage', 1), 'media', 0.5, 1).outcome, 'cache_hit');

  // Queue damps heavy POST writes before DB
  const mqDecision = evaluatePacketAtNode(makeNode('queue', 2), 'write', 0.5, 1);
  assert.equal(mqDecision.outcome, 'forward');
  assert.ok((mqDecision.writeDampingFactor ?? 1) < 0.5);

  const dbWriteFull = evaluatePacketAtNode(makeNode('database'), 'write', 0, 0, 1);
  const dbWriteDamped = evaluatePacketAtNode(makeNode('database'), 'write', 0, 0, mqDecision.writeDampingFactor!);
  assert.ok(dbWriteDamped.dbCpuDelta < dbWriteFull.dbCpuDelta);

  // Heat congestion increases processing latency, amplified by heatPenaltyMult
  const coolApp = evaluatePacketAtNode(makeNode('app', 1, 0), 'read', 0.5, 1, 1, 1);
  const hotApp = evaluatePacketAtNode(makeNode('app', 1, 0.85), 'read', 0.5, 1, 1, 1);
  const hellApp = evaluatePacketAtNode(makeNode('app', 1, 0.85), 'read', 0.5, 1, 1, 1.6);
  assert.ok(hotApp.addedLatencyMs > coolApp.addedLatencyMs);
  assert.ok(hellApp.addedLatencyMs > hotApp.addedLatencyMs);

  // Database suffers heavy CPU + integrity damage if SQLi reaches it unblocked
  const dbSqli = evaluatePacketAtNode(makeNode('database'), 'sqli', 0, 0);
  assert.equal(dbSqli.outcome, 'delivered');
  assert.ok(dbSqli.dbCpuDelta >= 20);
  assert.ok(dbSqli.integrityDelta < 0);
});

test('pickWeightedPacketKind and getSellRefund behave accurately', () => {
  const weights = { read: 0.4, write: 0.2, media: 0.15, ddos: 0.15, sqli: 0.1 };
  assert.equal(pickWeightedPacketKind(weights, 0.25), 'read');
  assert.equal(pickWeightedPacketKind(weights, 0.5), 'write');
  assert.equal(pickWeightedPacketKind(weights, 0.65), 'media');
  assert.equal(pickWeightedPacketKind(weights, 0.8), 'ddos');
  assert.equal(pickWeightedPacketKind(weights, 0.95), 'sqli');

  const upgradedRedis: InfraNode = {
    id: 'r1',
    type: 'redis',
    x: 385,
    y: 250,
    level: 2,
    rrCursor: 0,
    processedCount: 0,
    blockedCount: 0,
    cacheHitCount: 0,
    heat: 0,
  };
  assert.equal(getSellRefund(upgradedRedis), Math.round((85 + 95) * 0.7));
});

test('analyzeArchitectureDesign and evaluateSolutionOptimization enforce strictSecurity, modeName, and S/A/B/C verdicts', () => {
  const authLevel = TRAFFIC_LEVELS[3]; // ARCH-04
  const naiveNodes = createInitialNodes(authLevel);
  const naiveEval = evaluateSolutionOptimization({
    level: authLevel,
    nodes: naiveNodes,
    edges: [...authLevel.initialEdges],
    avgLatencyMs: 92,
    peakDbCpu: 91,
    breachedAttacks: 8,
    remainingBudget: 300,
  });

  assert.equal(naiveEval.isOptimal, false);
  assert.ok(naiveEval.whyNotOptimal.some((c) => c.category === 'security'));
  assert.ok(naiveEval.whyNotOptimal.length >= 2);
  assert.ok(naiveEval.grade === 'B' || naiveEval.grade === 'C');

  // Strict security flags even 1 breached packet in Cyber Siege mode
  const bp1 = buildBlueprintGraph(authLevel, authLevel.approaches[0]);
  const analysis1 = analyzeArchitectureDesign(authLevel, bp1.nodes, bp1.edges);
  assert.equal(analysis1.hasValidPath, true);
  assert.ok(analysis1.matchedApproaches.length >= 1);

  const strictEval = evaluateSolutionOptimization({
    level: authLevel,
    nodes: bp1.nodes,
    edges: bp1.edges,
    avgLatencyMs: 36,
    peakDbCpu: 48,
    breachedAttacks: 1,
    remainingBudget: 120,
    strictSecurity: true,
    modeName: 'Bao Vây DDoS & Hacker',
  });
  assert.equal(strictEval.isOptimal, false);
  assert.ok(strictEval.whyNotOptimal.some((c) => c.severity === 'critical' && c.category === 'security'));
  assert.ok(strictEval.verdictTitle.includes('Bao Vây DDoS & Hacker'));

  // Chapter 6 Global Failover Final Boss blueprint reaches optimal Grade S with clean metrics
  const finalBoss = TRAFFIC_LEVELS[23]; // ARCH-24
  assert.equal(finalBoss.chapter, 6);
  const finalBp = buildBlueprintGraph(finalBoss, finalBoss.approaches[0]);
  const optimalEval = evaluateSolutionOptimization({
    level: finalBoss,
    nodes: finalBp.nodes,
    edges: finalBp.edges,
    avgLatencyMs: 34,
    peakDbCpu: 46,
    breachedAttacks: 0,
    remainingBudget: 150,
    strictSecurity: true,
    modeName: 'Địa Ngục SLA & Chaos',
  });
  assert.equal(optimalEval.isOptimal, true);
  assert.equal(optimalEval.grade, 'S');
  assert.equal(optimalEval.whyNotOptimal.length, 0);
});
