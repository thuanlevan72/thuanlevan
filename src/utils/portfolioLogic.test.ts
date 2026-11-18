import assert from 'node:assert/strict';
import test from 'node:test';
import { PORTFOLIO_PROJECTS } from '../data/portfolioData.ts';
import {
  executeCliCommand,
  filterProjects,
  getProjectCategoryCounts,
  resolveInitialTheme,
  resolveNextTheme,
} from './portfolioLogic.ts';

test('resolveInitialTheme defaults to light and honors stored dark', () => {
  assert.equal(resolveInitialTheme(undefined), 'light');
  assert.equal(resolveInitialTheme(null), 'light');
  assert.equal(resolveInitialTheme('light'), 'light');
  assert.equal(resolveInitialTheme('dark'), 'dark');
});

test('resolveNextTheme toggles cleanly between light and dark', () => {
  assert.equal(resolveNextTheme('light'), 'dark');
  assert.equal(resolveNextTheme('dark'), 'light');
});

test('filterProjects filters all 6 production projects accurately', () => {
  const counts = getProjectCategoryCounts(PORTFOLIO_PROJECTS);
  assert.deepEqual(counts, {
    all: 6,
    ai: 1,
    fintech: 2,
    healthcare: 3,
  });

  assert.equal(filterProjects(PORTFOLIO_PROJECTS, 'all').length, 6);
  assert.deepEqual(
    filterProjects(PORTFOLIO_PROJECTS, 'ai').map((p) => p.id),
    ['misa-oneai']
  );
  assert.deepEqual(
    filterProjects(PORTFOLIO_PROJECTS, 'fintech').map((p) => p.id),
    ['agribank-smf', 'memid-platform']
  );
  assert.deepEqual(
    filterProjects(PORTFOLIO_PROJECTS, 'healthcare').map((p) => p.id),
    ['phenikaa-mec', 'gc-fast-invoice', 'lotus-nguyen-sieu']
  );
});

test('executeCliCommand handles whitespace, clear/cls, known commands, and unknown commands', () => {
  assert.deepEqual(executeCliCommand('   '), { action: 'noop' });
  assert.deepEqual(executeCliCommand('clear'), { action: 'clear' });
  assert.deepEqual(executeCliCommand('CLS'), { action: 'clear' });

  const helpRes = executeCliCommand('help');
  assert.equal(helpRes.action, 'append');
  if (helpRes.action === 'append') {
    assert.match(helpRes.responseText, /dotnet --info/);
    assert.match(helpRes.responseText, /why-hire/);
  }

  const dotnetRes = executeCliCommand('dotnet --info');
  assert.equal(dotnetRes.action, 'append');
  if (dotnetRes.action === 'append') {
    assert.match(dotnetRes.responseText, /8\.0\.300/);
    assert.match(dotnetRes.responseText, /ONLINE & HIGH AVAILABILITY/);
  }

  const projectsRes = executeCliCommand('projects --recent');
  assert.equal(projectsRes.action, 'append');
  if (projectsRes.action === 'append') {
    assert.match(projectsRes.responseText, /MISA OneAI for Family/);
    assert.match(projectsRes.responseText, /Smart Form Agribank/);
  }

  const whyRes = executeCliCommand('why-hire');
  assert.equal(whyRes.action, 'append');
  if (whyRes.action === 'append') {
    assert.match(whyRes.responseText, /4 Giá Trị Cốt Lõi/);
  }

  const contactRes = executeCliCommand('contact');
  assert.equal(contactRes.action, 'append');
  if (contactRes.action === 'append') {
    assert.match(contactRes.responseText, /0352 988 596/);
    assert.match(contactRes.responseText, /thuanlevan72@gmail\.com/);
  }

  const stackRes = executeCliCommand('stack');
  assert.equal(stackRes.action, 'append');
  if (stackRes.action === 'append') {
    assert.match(stackRes.responseText, /Apache Kafka/);
  }

  const unknownRes = executeCliCommand('rm -rf /');
  assert.equal(unknownRes.action, 'append');
  if (unknownRes.action === 'append') {
    assert.match(unknownRes.responseText, /Lệnh không nhận dạng/);
    assert.equal(unknownRes.responseToneClass, 'text-rose-400');
  }
});
