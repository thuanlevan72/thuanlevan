import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeArchitectureDesign,
  ARCH_MODES,
  buildBlueprintGraph,
  canAddEdge,
  computeBezierPointAndTangent,
  computeBlueprintCost,
  createInitialNodes,
  detectArchitectureCombos,
  diagnoseArchitectureTelemetry,
  diagnoseWavePerformance,
  distToCubicBezier,
  evaluatePacketAtNode,
  evaluateSolutionOptimization,
  getDatabaseSinkNodes,
  getEffectiveScenarioConfig,
  getNodeCapabilityDetails,
  getNodeOperationalTelemetry,
  getPreSimChecklist,
  getSellRefund,
  hasPathToDatabase,
  INFRA_NODE_CATALOG,
  isDatabaseSinkType,
  pickWeightedPacketKind,
  RACK_SLOTS,
  selectOutgoingEdge,
  TRAFFIC_LEVELS,
  type InfraEdge,
  type InfraNode,
} from './trafficRouterEngine.ts';

test('TRAFFIC_LEVELS defines 24 valid scenarios across 6 chapters with 4 escalating waves & 3+ approaches', () => {
  assert.equal(TRAFFIC_LEVELS.length, 24);
  assert.equal(INFRA_NODE_CATALOG.length, 20);
  assert.equal(RACK_SLOTS.length, 14);

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
  assert.equal(getSellRefund(upgradedRedis, true), 85 + 95);
});

test('All 24 levels recommended approaches fit within FinOps tight_budget and survive deterministic wave simulation without 502', () => {
  for (const lvl of TRAFFIC_LEVELS) {
    const finOpsCfg = getEffectiveScenarioConfig(lvl, 'tight_budget');
    const stdCfg = getEffectiveScenarioConfig(lvl, 'standard');

    for (const ap of lvl.approaches) {
      const bpCost = computeBlueprintCost(lvl, ap);
      assert.ok(
        bpCost <= finOpsCfg.startingBudget,
        `Blueprint ${ap.id} ($${bpCost}) in ${lvl.code} must fit within tight_budget ($${finOpsCfg.startingBudget})`
      );

      // Deterministic full-wave simulation in standard mode
      const bp = buildBlueprintGraph(lvl, ap);
      const nodes = bp.nodes.map((n) => ({ ...n }));
      const edges = bp.edges.map((e) => ({ ...e }));
      let dbCpu = 10;
      let peakDbCpu = 10;
      let systemHealth = 100;
      let breachedAttacks = 0;
      let latencySum = 0;
      let latencySamples = 0;
      let rollCounter = 1;
      const nextRoll = () => {
        rollCounter = (rollCounter * 1664525 + 1013904223) >>> 0;
        return rollCounter / 4294967296;
      };

      const dt = 0.2;
      for (const wave of stdCfg.effectiveLevel.waves) {
        let waveTime = wave.durationSec;
        let spawnTimer = 0.15;
        while (waveTime > 0) {
          waveTime -= dt;
          spawnTimer -= dt;
          dbCpu = Math.max(6, dbCpu - stdCfg.dbCoolingPerSec * dt);
          for (const n of nodes) {
            n.heat = Math.max(0, n.heat - dt * 0.22);
          }
          if (spawnTimer <= 0) {
            spawnTimer += wave.spawnIntervalSec;
            const kind = pickWeightedPacketKind(wave.weights, nextRoll());
            let curId: string | undefined = 'ingress';
            let damping = 1;
            let totalLat = 0;
            let hops = 0;
            while (curId && hops < 12) {
              hops += 1;
              const node = nodes.find((n) => n.id === curId);
              if (!node) break;
              const outEdges = edges.filter((e) => e.fromId === node.id);
              const decision = evaluatePacketAtNode(
                node,
                kind,
                nextRoll(),
                outEdges.length,
                damping,
                stdCfg.heatPenaltyMult
              );
              node.heat = Math.min(1, node.heat + 0.04);
              totalLat += decision.addedLatencyMs;
              if (decision.writeDampingFactor !== undefined) {
                damping = Math.min(damping, decision.writeDampingFactor);
              }
              if (decision.outcome === 'forward') {
                const { edge, nextCursor } = selectOutgoingEdge(node, edges);
                node.rrCursor = nextCursor;
                curId = edge?.toId;
              } else {
                if (decision.outcome === 'delivered') {
                  dbCpu = Math.min(100, dbCpu + decision.dbCpuDelta * stdCfg.cpuLoadMult);
                  peakDbCpu = Math.max(peakDbCpu, dbCpu);
                  if (decision.integrityDelta < 0) {
                    systemHealth = Math.max(0, systemHealth + decision.integrityDelta);
                    breachedAttacks += 1;
                  }
                }
                latencySum += totalLat;
                latencySamples += 1;
                break;
              }
            }
          }
          if (dbCpu >= 96) {
            systemHealth = Math.max(0, systemHealth - dt * 9);
          } else if (dbCpu < 82 && systemHealth < 100) {
            systemHealth = Math.min(100, systemHealth + dt * 2.5);
          }
        }
      }

      assert.ok(
        systemHealth > 0,
        `${lvl.code} (${ap.id}) crashed with 502 during standard simulation (peakDbCpu=${Math.round(peakDbCpu)}%, breached=${breachedAttacks})`
      );

      const avgLat = latencySamples > 0 ? Math.round(latencySum / latencySamples) : 30;
      const evalResult = evaluateSolutionOptimization({
        level: stdCfg.effectiveLevel,
        nodes,
        edges,
        avgLatencyMs: avgLat,
        peakDbCpu: Math.round(peakDbCpu),
        breachedAttacks,
        remainingBudget: stdCfg.startingBudget - bpCost,
        strictSecurity: false,
        modeName: stdCfg.mode.name,
      });
      assert.ok(
        evalResult.grade === 'S' || evalResult.grade === 'A' || evalResult.grade === 'B',
        `${lvl.code} (${ap.id}) received unexpected grade ${evalResult.grade} (score=${evalResult.totalScore}, peakCpu=${Math.round(peakDbCpu)}%, avgLat=${avgLat}ms, breached=${breachedAttacks})`
      );
    }
  }
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

test('Bezier geometry, Lv1/Lv2 node capability specs, and live bottleneck telemetry work accurately', () => {
  const start = computeBezierPointAndTangent(100, 150, 400, 350, 0);
  const mid = computeBezierPointAndTangent(100, 150, 400, 350, 0.5);
  const end = computeBezierPointAndTangent(100, 150, 400, 350, 1);
  assert.equal(Math.round(start.x), 100);
  assert.equal(Math.round(start.y), 150);
  assert.equal(Math.round(mid.x), 250);
  assert.equal(Math.round(mid.y), 250);
  assert.equal(Math.round(end.x), 400);
  assert.equal(Math.round(end.y), 350);

  // Midpoint lies right on the Bezier curve (< 3px distance)
  assert.ok(distToCubicBezier(mid.x, mid.y, 100, 150, 400, 350) < 3);
  assert.ok(distToCubicBezier(100, 350, 100, 150, 400, 350) > 60);

  // Every catalog node provides Lv1/Lv2/Lv3 capability specs with faster latencies on upgrades
  for (const item of INFRA_NODE_CATALOG) {
    const spec = getNodeCapabilityDetails(item.type);
    assert.ok(spec.lv2Value.length > 0);
    assert.ok(spec.lv3Value.length > 0);
    assert.ok(spec.latencyLv2Ms < spec.latencyLv1Ms, `${item.type} Lv2 must be faster than Lv1`);
    assert.ok(spec.latencyLv3Ms < spec.latencyLv2Ms, `${item.type} Lv3 must be faster than Lv2`);
  }

  // Live telemetry detects hottest bottleneck and unused disconnected nodes
  const nodes: InfraNode[] = [
    { id: 'ingress', type: 'ingress', x: 76, y: 250, fixed: true, level: 1, rrCursor: 0, processedCount: 20, blockedCount: 0, cacheHitCount: 0, heat: 0 },
    { id: 'app-hot', type: 'app', x: 385, y: 250, level: 1, rrCursor: 0, processedCount: 20, blockedCount: 0, cacheHitCount: 0, heat: 0.84 },
    { id: 'redis-orphan', type: 'redis', x: 545, y: 120, level: 1, rrCursor: 0, processedCount: 0, blockedCount: 0, cacheHitCount: 0, heat: 0 },
    { id: 'database', type: 'database', x: 844, y: 250, fixed: true, level: 1, rrCursor: 0, processedCount: 20, blockedCount: 0, cacheHitCount: 0, heat: 0.4 },
  ];
  const edges: InfraEdge[] = [
    { id: 'e1', fromId: 'ingress', toId: 'app-hot' },
    { id: 'e2', fromId: 'app-hot', toId: 'database' },
  ];
  const diag = diagnoseArchitectureTelemetry(nodes, edges, {
    deliveredOk: 40,
    cacheHits: 16,
    blockedAttacks: 9,
    breachedAttacks: 1,
    dbCpu: 62,
  });
  assert.equal(diag.cacheHitRatePct, 40);
  assert.equal(diag.threatBlockRatePct, 90);
  assert.equal(diag.hottestNode?.id, 'app-hot');
  assert.equal(diag.hottestNode?.heatPct, 84);
  assert.deepEqual(diag.unusedNodeIds, ['redis-orphan']);
});

test('Smart edge routing (CQRS routeRule), Queue buffer capacity, SRE ops, and wave incidents behave accurately', async () => {
  const engine = await import('./trafficRouterEngine.ts');
  const lb: InfraNode = {
    id: 'lb-cqrs',
    type: 'load_balancer',
    x: 385,
    y: 250,
    level: 2,
    rrCursor: 0,
    processedCount: 0,
    blockedCount: 0,
    cacheHitCount: 0,
    heat: 0,
  };
  const cqrsEdges: InfraEdge[] = [
    { id: 'e-read', fromId: 'lb-cqrs', toId: 'redis-node', routeRule: 'read' },
    { id: 'e-write', fromId: 'lb-cqrs', toId: 'kafka-node', routeRule: 'write' },
    { id: 'e-media', fromId: 'lb-cqrs', toId: 's3-node', routeRule: 'media' },
    { id: 'e-fallback', fromId: 'lb-cqrs', toId: 'app-node', routeRule: 'all' },
  ];

  // Content-based routing sends GET->Redis, POST->Kafka, MEDIA->S3, DDoS->all fallback
  assert.equal(engine.selectOutgoingEdgeForPacket(lb, cqrsEdges, 'read').edge?.toId, 'redis-node');
  assert.equal(engine.selectOutgoingEdgeForPacket(lb, cqrsEdges, 'write').edge?.toId, 'kafka-node');
  assert.equal(engine.selectOutgoingEdgeForPacket(lb, cqrsEdges, 'media').edge?.toId, 's3-node');
  assert.equal(engine.selectOutgoingEdgeForPacket(lb, cqrsEdges, 'ddos').edge?.toId, 'app-node');

  // Cycle route rule order: all -> read -> write -> media -> all
  assert.equal(engine.cycleEdgeRouteRule(undefined), 'read');
  assert.equal(engine.cycleEdgeRouteRule('read'), 'write');
  assert.equal(engine.cycleEdgeRouteRule('write'), 'media');
  assert.equal(engine.cycleEdgeRouteRule('media'), 'all');

  // Kafka Lv2 has larger buffer and faster drain interval than Lv1
  assert.ok(engine.getQueueMaxBuffer(2) > engine.getQueueMaxBuffer(1));
  assert.ok(engine.getQueueDrainIntervalSec(2) < engine.getQueueDrainIntervalSec(1));

  // SRE actions & Wave incident events are defined cleanly
  assert.equal(engine.SRE_ACTIONS.length, 3);
  assert.equal(engine.getWaveIncidentEvent(TRAFFIC_LEVELS[0], 0, 'standard'), null);
  const incFlash = engine.getWaveIncidentEvent(TRAFFIC_LEVELS[3], 1, 'flash_surge');
  assert.ok(incFlash !== null && incFlash.spawnRateMult > 1);

  // Specialized edges earn CQRS recognition in evaluation
  const lvl = TRAFFIC_LEVELS[1];
  const bp = buildBlueprintGraph(lvl, lvl.approaches[0]);
  const specializedEdges = bp.edges.map((e, i) => (i === 1 ? { ...e, routeRule: 'read' as const } : e));
  const evalCqrs = evaluateSolutionOptimization({
    level: lvl,
    nodes: bp.nodes,
    edges: specializedEdges,
    avgLatencyMs: 32,
    peakDbCpu: 48,
    breachedAttacks: 0,
    remainingBudget: 120,
  });
  assert.ok(evalCqrs.strengths.some((st) => st.includes('CQRS')));
});

test('Pure System Design v3: Multi-DB sinks, Lv3 scaling, Quick-Tune, Combos, Pre-Sim Checklist, Telemetry & Wave Diagnosis', () => {
  assert.equal(isDatabaseSinkType('database'), true);
  assert.equal(isDatabaseSinkType('primary_db'), true);
  assert.equal(isDatabaseSinkType('nosql_db'), true);
  assert.equal(isDatabaseSinkType('timeseries_db'), true);
  assert.equal(isDatabaseSinkType('read_replica'), false);

  const multiDbNodes: InfraNode[] = [
    { id: 'ingress', type: 'ingress', x: 76, y: 250, fixed: true, level: 1, rrCursor: 0, processedCount: 50, blockedCount: 0, cacheHitCount: 0, heat: 0.1 },
    { id: 'cdn-1', type: 'cdn', x: 225, y: 112, slotId: 'rack-0-0', level: 2, cacheTtl: 'long', rrCursor: 0, processedCount: 40, blockedCount: 4, cacheHitCount: 18, heat: 0.2 },
    { id: 'redis-1', type: 'redis', x: 385, y: 112, slotId: 'rack-1-0', level: 3, cacheTtl: 'long', rrCursor: 0, processedCount: 35, blockedCount: 0, cacheHitCount: 28, heat: 0.3 },
    { id: 'app-1', type: 'app', x: 545, y: 112, slotId: 'rack-2-0', level: 3, rrCursor: 0, processedCount: 30, blockedCount: 0, cacheHitCount: 0, droppedCount: 2, heat: 0.89, avgNodeLatencyMs: 24 },
    { id: 'mq-1', type: 'queue', x: 545, y: 388, slotId: 'rack-2-2', level: 2, queueCapacityMode: 'large', queueBuffer: 20, rrCursor: 0, processedCount: 24, blockedCount: 0, cacheHitCount: 0, heat: 0.45, avgNodeLatencyMs: 12 },
    { id: 'wk-1', type: 'worker', x: 705, y: 388, slotId: 'rack-3-2', level: 2, rrCursor: 0, processedCount: 22, blockedCount: 0, cacheHitCount: 0, heat: 0.25 },
    { id: 's3-1', type: 'object_storage', x: 705, y: 112, slotId: 'rack-3-0', level: 2, rrCursor: 0, processedCount: 15, blockedCount: 0, cacheHitCount: 14, heat: 0.1 },
    { id: 'database', type: 'database', x: 844, y: 250, fixed: true, level: 2, dbPoolMode: 'high_pool', localDbCpu: 44, rrCursor: 0, processedCount: 18, blockedCount: 0, cacheHitCount: 0, heat: 0.44, avgNodeLatencyMs: 14 },
    { id: 'nosql-1', type: 'nosql_db', x: 844, y: 388, slotId: 'rack-4-2', level: 1, localDbCpu: 92, rrCursor: 0, processedCount: 25, blockedCount: 0, cacheHitCount: 0, droppedCount: 3, heat: 0.92, avgNodeLatencyMs: 38 },
  ];
  const multiDbEdges: InfraEdge[] = [
    { id: 'e1', fromId: 'ingress', toId: 'cdn-1' },
    { id: 'e2', fromId: 'cdn-1', toId: 'redis-1' },
    { id: 'e3', fromId: 'redis-1', toId: 'app-1' },
    { id: 'e4', fromId: 'app-1', toId: 's3-1', routeRule: 'media' },
    { id: 'e5', fromId: 'app-1', toId: 'database', routeRule: 'read' },
    { id: 'e6', fromId: 'ingress', toId: 'mq-1', routeRule: 'write' },
    { id: 'e7', fromId: 'mq-1', toId: 'wk-1' },
    { id: 'e8', fromId: 'wk-1', toId: 'nosql-1' },
    { id: 'e9', fromId: 's3-1', toId: 'database' },
  ];

  // Multi-DB sink detection & DAG validation
  assert.equal(getDatabaseSinkNodes(multiDbNodes).length, 2);
  assert.equal(hasPathToDatabase(multiDbNodes, multiDbEdges), true);
  assert.equal(canAddEdge(multiDbNodes, multiDbEdges, 'nosql-1', 'app-1').valid, false);
  assert.equal(canAddEdge(multiDbNodes, multiDbEdges, 'app-1', 'nosql-1').valid, true);

  // All 4 architecture combos activate cleanly on this Multi-DB hybrid graph
  const combos = detectArchitectureCombos(multiDbNodes, multiDbEdges);
  assert.equal(combos.length, 4);
  assert.equal(combos.every((c) => c.active), true);

  // Quick-Tune & Lv3 checks
  const nosqlWrite = evaluatePacketAtNode(multiDbNodes[8], 'write', 0.1, 0, 1);
  const stdDbWrite = evaluatePacketAtNode(multiDbNodes[7], 'write', 0.1, 0, 1);
  assert.equal(nosqlWrite.outcome, 'delivered');
  assert.ok(nosqlWrite.dbCpuDelta < 5.4);
  assert.ok(stdDbWrite.dbCpuDelta < 5.4);

  // Overload saturation drop when heat >= 0.9
  const overloadedApp: InfraNode = { ...multiDbNodes[3], heat: 0.94 };
  const overflow = evaluatePacketAtNode(overloadedApp, 'read', 0.95, 1);
  assert.equal(overflow.outcome, 'dropped_overload');

  // Strict Rate Limiter blocks minor legit POST under high burst heat
  const strictLimiter: InfraNode = {
    id: 'rl-strict',
    type: 'rate_limiter',
    x: 225,
    y: 250,
    slotId: 'rack-0-1',
    level: 2,
    limiterMode: 'strict',
    rrCursor: 0,
    processedCount: 10,
    blockedCount: 5,
    cacheHitCount: 0,
    heat: 0.82,
  };
  assert.equal(evaluatePacketAtNode(strictLimiter, 'write', 0.02, 1).outcome, 'blocked');

  // Pre-Sim Checklist includes Multi-DB ok item
  const checklist = getPreSimChecklist(TRAFFIC_LEVELS[0], multiDbNodes, multiDbEdges);
  assert.ok(checklist.some((item) => item.ok && item.label.includes('Đa Database')));

  // Operational telemetry standby vs active/warning/degraded states
  const idleTel = getNodeOperationalTelemetry(multiDbNodes[2], 'DESIGNING');
  assert.equal(idleTel.status, 'idle');
  assert.ok(idleTel.line1.includes('STANDBY'));

  const redisActiveTel = getNodeOperationalTelemetry(multiDbNodes[2], 'SIMULATING', { elapsedSec: 10 });
  assert.equal(redisActiveTel.status, 'active');
  assert.ok(redisActiveTel.line1.includes('hit '));

  const overloadedDbTel = getNodeOperationalTelemetry(multiDbNodes[8], 'SIMULATING', { elapsedSec: 10 });
  assert.equal(overloadedDbTel.status, 'degraded');
  assert.equal(overloadedDbTel.badgeLevel, 'danger');

  // Wave diagnosis reports specific root cause
  const diag = diagnoseWavePerformance({
    waveNumber: 1,
    waveLabel: 'Đợt 1',
    deliveredOk: 42,
    droppedPackets: 4,
    breachedAttacks: 0,
    uptimePct: 98,
    peakLatencyMs: 48,
    targetSlaMs: 56,
    peakDbCpu: 86,
    nodes: multiDbNodes,
    edges: multiDbEdges,
  });
  assert.equal(diag.activeDbCount, 2);
  assert.ok(diag.diagnosisLine.includes('DB'));
});



