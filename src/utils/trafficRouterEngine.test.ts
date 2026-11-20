import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAddEdge,
  createInitialNodes,
  evaluatePacketAtNode,
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

test('TRAFFIC_LEVELS defines 5 valid scenarios with initial path to database', () => {
  assert.equal(TRAFFIC_LEVELS.length, 5);
  assert.equal(INFRA_NODE_CATALOG.length, 5);
  assert.equal(RACK_SLOTS.length, 9);

  for (const lvl of TRAFFIC_LEVELS) {
    const nodes = createInitialNodes(lvl);
    assert.ok(nodes.some((n) => n.id === 'ingress' && n.fixed));
    assert.ok(nodes.some((n) => n.id === 'database' && n.fixed));
    assert.equal(hasPathToDatabase(nodes, lvl.initialEdges), true);
    assert.ok(lvl.waves.length >= 4);

    for (const w of lvl.waves) {
      const totalWeight = w.weights.read + w.weights.write + w.weights.ddos + w.weights.sqli;
      assert.ok(Math.abs(totalWeight - 1) < 0.001, `Wave ${w.waveNumber} weights must sum to 1`);
    }
  }
});

test('canAddEdge prevents cycles, self-loops, duplicates, and invalid terminal wiring', () => {
  const nodes: InfraNode[] = [
    { id: 'ingress', type: 'ingress', x: 84, y: 240, fixed: true, level: 1, rrCursor: 0, processedCount: 0, blockedCount: 0, cacheHitCount: 0, heat: 0 },
    { id: 'waf-1', type: 'waf', x: 250, y: 240, level: 1, rrCursor: 0, processedCount: 0, blockedCount: 0, cacheHitCount: 0, heat: 0 },
    { id: 'app-1', type: 'app', x: 630, y: 240, level: 1, rrCursor: 0, processedCount: 0, blockedCount: 0, cacheHitCount: 0, heat: 0 },
    { id: 'database', type: 'database', x: 796, y: 240, fixed: true, level: 1, rrCursor: 0, processedCount: 0, blockedCount: 0, cacheHitCount: 0, heat: 0 },
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
    x: 440,
    y: 240,
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

test('evaluatePacketAtNode verifies WAF SQLi blocking, Rate Limiter DDoS blocking, Redis cache hits, and DB load', () => {
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

  // Database suffers heavy CPU + integrity damage if SQLi reaches it unblocked
  const dbSqli = evaluatePacketAtNode(makeNode('database'), 'sqli', 0, 0);
  assert.equal(dbSqli.outcome, 'delivered');
  assert.ok(dbSqli.dbCpuDelta >= 20);
  assert.ok(dbSqli.integrityDelta < 0);
});

test('pickWeightedPacketKind and getSellRefund behave accurately', () => {
  const weights = { read: 0.5, write: 0.2, ddos: 0.2, sqli: 0.1 };
  assert.equal(pickWeightedPacketKind(weights, 0.25), 'read');
  assert.equal(pickWeightedPacketKind(weights, 0.6), 'write');
  assert.equal(pickWeightedPacketKind(weights, 0.85), 'ddos');
  assert.equal(pickWeightedPacketKind(weights, 0.95), 'sqli');

  const upgradedRedis: InfraNode = {
    id: 'r1',
    type: 'redis',
    x: 440,
    y: 240,
    level: 2,
    rrCursor: 0,
    processedCount: 0,
    blockedCount: 0,
    cacheHitCount: 0,
    heat: 0,
  };
  assert.equal(getSellRefund(upgradedRedis), Math.round((90 + 100) * 0.7));
});
