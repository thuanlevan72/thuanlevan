import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeArchitectureDesign,
  buildBlueprintGraph,
  canAddEdge,
  computeBlueprintCost,
  createInitialNodes,
  evaluatePacketAtNode,
  evaluateSolutionOptimization,
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

test('TRAFFIC_LEVELS defines 16 valid scenarios across 4 chapters with multiple approaches', () => {
  assert.equal(TRAFFIC_LEVELS.length, 16);
  assert.equal(INFRA_NODE_CATALOG.length, 10);
  assert.equal(RACK_SLOTS.length, 12);

  const chapters = new Set<number>();
  for (const lvl of TRAFFIC_LEVELS) {
    chapters.add(lvl.chapter);
    const nodes = createInitialNodes(lvl);
    assert.ok(nodes.some((n) => n.id === 'ingress' && n.fixed));
    assert.ok(nodes.some((n) => n.id === 'database' && n.fixed));
    assert.equal(hasPathToDatabase(nodes, lvl.initialEdges), true);
    assert.ok(lvl.waves.length >= 3);
    assert.ok(lvl.approaches.length >= 3, `Level ${lvl.code} must offer at least 3 diverse approaches`);

    for (const w of lvl.waves) {
      const totalWeight =
        w.weights.read + w.weights.write + w.weights.media + w.weights.ddos + w.weights.sqli;
      assert.ok(
        Math.abs(totalWeight - 1) < 0.001,
        `Level ${lvl.code} Wave ${w.waveNumber} weights must sum to 1`
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
  assert.deepEqual([...chapters].sort(), [1, 2, 3, 4]);
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

test('evaluatePacketAtNode verifies WAF, Limiter, CDN, Redis, Queue damping, and S3 offload', () => {
  const makeNode = (type: InfraNode['type'], level: 1 | 2 = 1): InfraNode => ({
    id: type,
    type,
    x: 0,
    y: 0,
    level,
    rrCursor: 0,
    processedCount: 0,
    blockedCount: 0,
    cacheHitCount: 0,
    heat: 0,
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

test('analyzeArchitectureDesign and evaluateSolutionOptimization distinguish optimal vs suboptimal designs', () => {
  // Scenario 4 requires WAF for SQLi + Limiter/Redis
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

  // Apply Approach 1 blueprint on ARCH-04 -> Grade A (strong security, flags missing Redis read cache)
  const bp1 = buildBlueprintGraph(authLevel, authLevel.approaches[0]);
  const analysis1 = analyzeArchitectureDesign(authLevel, bp1.nodes, bp1.edges);
  assert.equal(analysis1.hasValidPath, true);
  assert.ok(analysis1.matchedApproaches.length >= 1);

  const eval1 = evaluateSolutionOptimization({
    level: authLevel,
    nodes: bp1.nodes,
    edges: bp1.edges,
    avgLatencyMs: 36,
    peakDbCpu: 48,
    breachedAttacks: 0,
    remainingBudget: 120,
  });
  assert.equal(eval1.grade, 'A');
  assert.ok(eval1.whyNotOptimal.some((c) => c.category === 'performance'));

  // Apply Approach 2 blueprint on ARCH-04 (WAF Lv2 + Redis Session Store) -> catches DDoS tradeoff without Rate Limiter
  const bp2 = buildBlueprintGraph(authLevel, authLevel.approaches[1]);
  const eval2 = evaluateSolutionOptimization({
    level: authLevel,
    nodes: bp2.nodes,
    edges: bp2.edges,
    avgLatencyMs: 34,
    peakDbCpu: 46,
    breachedAttacks: 0,
    remainingBudget: 120,
  });
  assert.equal(eval2.isOptimal, false);
  assert.ok(eval2.whyNotOptimal.some((c) => c.category === 'security'));

  // ARCH-01 Approach 1 (Cache-Aside Redis) achieves full Grade S optimal for read-heavy portal
  const newsLevel = TRAFFIC_LEVELS[0];
  const newsBp = buildBlueprintGraph(newsLevel, newsLevel.approaches[0]);
  const optimalEval = evaluateSolutionOptimization({
    level: newsLevel,
    nodes: newsBp.nodes,
    edges: newsBp.edges,
    avgLatencyMs: 32,
    peakDbCpu: 44,
    breachedAttacks: 0,
    remainingBudget: 120,
  });
  assert.equal(optimalEval.isOptimal, true);
  assert.equal(optimalEval.grade, 'S');
  assert.equal(optimalEval.whyNotOptimal.length, 0);
});
