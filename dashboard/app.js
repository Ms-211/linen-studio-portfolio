const byId = id => document.getElementById(id);
const node = (tag, className = '', value) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
};
const count = value => Number(value || 0).toLocaleString('ko-KR');
const percent = (value, digits = 1) => `${Number(value || 0).toFixed(digits)}%`;
const metricLabels = {activeUsers: ['방문자 수', '명'], searchSessions: ['검색 유입', '회'], inquiries: ['문의', '건']};
let selectedMetric = 'activeUsers', dashboardData = null, currentDays = 30;
const clear = id => { const target = byId(id); target.replaceChildren(); return target; };
const empty = (target, message) => target.replaceChildren(node('p', 'empty-state', message));
function changeLine(value, unit = '%', reverse = false) {
  if (value === null || value === undefined) return node('p', 'delta-context', '비교 기준 없음');
  const improved = reverse ? value < 0 : value > 0;
  const label = value === 0 ? '변화 없음' : `${value > 0 ? '▲' : '▼'} ${Math.abs(value).toFixed(1)}${unit}${reverse ? improved ? ' 개선' : ' 악화' : ''}`;
  const line = node('p');
  line.append(node('span', `delta${reverse && value > 0 ? ' worse' : ''}`, label), node('span', 'delta-context', '직전 동일 기간 대비'));
  return line;
}
function renderKpis(summary) {
  const target = clear('kpis');
  if (!summary) return empty(target, 'GA4 통계 데이터를 불러오지 못했습니다.');
  const items = [
    ['방문자 수', `${count(summary.visitors)}명`, summary.visitorsChange, '%'],
    ['검색 유입', `${count(summary.searchTraffic)}회`, summary.searchTrafficChange, '%'],
    ['견적 문의', `${count(summary.inquiries)}건`, summary.inquiriesChange, '%'],
    ['문의 전환율', percent(summary.conversionRate, 2), summary.conversionRateChange, '%p']
  ];
  for (const [label, value, change, unit] of items) {
    const card = node('article', 'kpi');
    card.append(node('p', 'kpi-label', label), node('p', 'kpi-value', value), changeLine(change, unit));
    target.append(card);
  }
}
function renderTrend(points, days, failed) {
  const target = clear('trend-chart');
  const [label, unit] = metricLabels[selectedMetric];
  byId('trend-label').textContent = label;
  if (failed) return empty(target, `${label} 추이를 불러오지 못했습니다.`);
  const values = points.map(point => Number(point[selectedMetric]) || 0);
  if (!values.length || values.every(value => !value)) return empty(target, `이 기간에는 ${label} 데이터가 없습니다.`);
  const width = 1000, height = 220, left = 34, right = 12, top = 12, bottom = 28;
  const step = selectedMetric === 'activeUsers' ? 10 : 2;
  const maximum = Math.max(step, Math.ceil(Math.max(...values) / step) * step);
  const x = index => left + index * (width - left - right) / Math.max(1, values.length - 1);
  const y = value => height - bottom - value / maximum * (height - top - bottom);
  const coordinates = values.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  const grid = [0, .5, 1].map(fraction => {
    const lineY = y(maximum * fraction);
    return `<line class="grid-line" x1="${left}" y1="${lineY}" x2="${width - right}" y2="${lineY}"/><text class="axis-text" x="0" y="${lineY + 4}">${Math.round(maximum * fraction)}</text>`;
  }).join('');
  // Only numeric coordinates and a fixed range reach SVG markup.
  target.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="최근 ${days}일 ${label} 추이, 최소 ${Math.min(...values)}${unit}, 최대 ${Math.max(...values)}${unit}" preserveAspectRatio="none">${grid}<polygon class="trend-area" points="${left},${height - bottom} ${coordinates} ${x(values.length - 1)},${height - bottom}"/><polyline class="trend-line" points="${coordinates}"/><circle class="trend-dot" cx="${x(values.length - 1)}" cy="${y(values.at(-1))}" r="5"/><text class="axis-text" x="${left}" y="${height - 4}">시작</text><text class="axis-text" x="${width - right}" y="${height - 4}" text-anchor="end">최근</text></svg>`;
}
function renderSources(sources, failed) {
  const donut = clear('source-donut'), list = clear('source-list');
  if (failed || !sources.length || !sources.some(source => source.value > 0)) {
    donut.style.background = '#eaf0f2';
    donut.setAttribute('aria-label', failed ? '유입 경로를 불러오지 못했습니다.' : '유입 데이터가 없습니다.');
    list.append(node('li', 'empty-state', failed ? '유입 경로를 불러오지 못했습니다.' : '유입 데이터가 없습니다.'));
    return;
  }
  const colors = ['#155a7a', '#69a8c5', '#9cc9d8', '#d4e4e9', '#8dabb9', '#bed2da'];
  const total = sources.reduce((sum, source) => sum + Number(source.value || 0), 0);
  let offset = 0;
  const stops = sources.map((source, index) => {
    const start = offset;
    offset += source.value / total * 100;
    const color = colors[index % colors.length], row = node('li'), swatch = node('span', 'swatch');
    swatch.style.background = color;
    row.append(swatch, node('span', '', source.name), node('strong', '', `${(source.value / total * 100).toFixed(1)}%`));
    list.append(row);
    return `${color} ${start}% ${offset}%`;
  });
  donut.style.background = `conic-gradient(${stops.join(',')})`;
  donut.setAttribute('aria-label', sources.map(source => `${source.name} ${count(source.value)}회`).join(', '));
  donut.append(node('span', 'donut-center', '유입 경로'));
}
function renderSearch(search, failed) {
  const target = clear('search-stats');
  if (failed || !search) return empty(target, 'Google 검색 데이터를 불러오지 못했습니다.');
  if (!search.impressions && !search.clicks) return empty(target, 'Google 검색 데이터가 아직 충분하지 않습니다.');
  const items = [
    ['노출수', count(search.impressions), search.changes.impressions, '%'],
    ['클릭수', count(search.clicks), search.changes.clicks, '%'],
    ['클릭률', percent(search.ctr * 100), search.changes.ctr, '%p'],
    ['평균 검색순위', search.impressions ? Number(search.position).toFixed(1) : '—', search.changes.position, '', true]
  ];
  for (const [label, value, change, unit, reverse] of items) {
    const stat = node('div', 'search-stat');
    stat.append(node('span', 'stat-label', label), node('strong', 'stat-value', value), changeLine(change, unit, reverse));
    target.append(stat);
  }
}
function addRow(body, values, firstClass = '') {
  const row = node('tr');
  values.forEach((value, index) => row.append(node('td', index === 0 ? firstClass : 'number', String(value))));
  body.append(row);
  return row;
}
function emptyTable(body, message, columns = 3) {
  body.replaceChildren();
  const cell = node('td', 'empty-state', message), row = node('tr');
  cell.colSpan = columns;
  row.append(cell);
  body.append(row);
}
function renderPages(pages, failed) {
  const body = clear('pages-body');
  if (failed || !pages.length) return emptyTable(body, failed ? '인기 페이지를 불러오지 못했습니다.' : '이 기간에는 페이지 조회가 없습니다.');
  const max = Math.max(...pages.map(page => page.views), 1);
  for (const page of pages) {
    const row = addRow(body, [page.name, count(page.views), count(page.activeUsers)], 'page-name');
    const track = node('span', 'bar-track'), fill = node('span', 'bar-fill');
    fill.style.width = `${page.views / max * 100}%`;
    track.append(fill);
    row.cells[0].append(track);
  }
}
function renderQueries(queries, failed) {
  const body = clear('queries-body');
  if (failed || !queries.length) return emptyTable(body, failed ? '검색어를 불러오지 못했습니다.' : '검색 데이터가 아직 충분하지 않습니다.', 5);
  for (const query of queries) {
    const row = addRow(body, [query.query, count(query.clicks), count(query.impressions), query.impressions ? percent(query.ctr * 100) : '—', query.position == null ? '—' : Number(query.position).toFixed(1)], 'query-name');
    [...row.cells].slice(1).forEach((cell, index) => cell.dataset.label = ['클릭', '노출', 'CTR', '순위'][index]);
  }
}
function renderSearchPages(pages, failed) {
  const body = clear('search-pages-body');
  if (failed || !pages?.length) return emptyTable(body, failed || pages === null ? '검색 페이지 성과를 불러오지 못했습니다.' : '검색 페이지 데이터가 아직 충분하지 않습니다.', 5);
  for (const page of pages) {
    const row = addRow(body, [page.name, count(page.clicks), count(page.impressions), page.impressions ? percent(page.ctr * 100) : '—', page.position == null ? '—' : Number(page.position).toFixed(1)], 'page-name');
    row.cells[0].title = page.url;
    [...row.cells].slice(1).forEach((cell, index) => cell.dataset.label = ['클릭', '노출', 'CTR', '순위'][index]);
  }
}
function renderInquiries(stats, failed) {
  const target = clear('inquiry-stats');
  if (failed || !stats) return empty(target, '문의 통계를 불러오지 못했습니다.');
  const items = [
    ['문의 페이지 방문', count(stats.contactPageViews), stats.contactPageViewsChange, '%'],
    ['견적 문의 제출', count(stats.leads), stats.leadsChange, '%'],
    ['문의 전환율', percent(stats.conversionRate), stats.conversionRateChange, '%p']
  ];
  for (const [label, value, change, unit] of items) {
    const stat = node('div', 'inquiry-stat');
    stat.append(node('span', 'stat-label', label), node('strong', 'stat-value', value), changeLine(change, unit));
    target.append(stat);
  }
}
let pending;
async function loadDashboard(days) {
  pending?.abort();
  dashboardData = null;
  currentDays = Number(days);
  const controller = new AbortController();
  pending = controller;
  document.querySelectorAll('[data-days]').forEach(button => button.setAttribute('aria-pressed', button.dataset.days === String(days)));
  byId('status').replaceChildren(node('strong', '', '불러오는 중'), node('span', '', '통계 데이터를 불러오는 중입니다.'));
  try {
    const response = await fetch(`/dashboard/sample-${days}.json`, {signal: controller.signal, credentials: 'same-origin'});
    const data = await response.json();
    if (pending !== controller) return;
    if (!data.meta || data.meta.source !== 'sample') throw new Error('INVALID_RESPONSE');
    const analyticsFailed = Boolean(data.meta.errors.analytics), searchFailed = Boolean(data.meta.errors.searchConsole);
    byId('updated-at').textContent = new Date(data.meta.updatedAt).toLocaleString('ko-KR', {timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
    byId('period-label').textContent = `${data.range.startDate} — ${data.range.endDate}`;
    byId('trend-period').textContent = `최근 ${days}일`;
    renderKpis(data.summary);
    renderTrend(data.visitorTrend, days, analyticsFailed);
    renderSources(data.trafficSources, analyticsFailed);
    renderSearch(data.searchConsole, searchFailed);
    renderPages(data.popularPages, analyticsFailed);
    renderQueries(data.searchQueries, searchFailed);
    renderSearchPages(data.searchPages, searchFailed);
    renderInquiries(data.inquiryStats, analyticsFailed);
    dashboardData = data;
    const partial = analyticsFailed || searchFailed || data.searchPages === null;
    const message = analyticsFailed && searchFailed ? '통계 데이터를 불러오지 못했습니다.' : partial ? '일부 통계 데이터를 불러오지 못했습니다.' : '가상 샘플 데이터가 표시됩니다.';
    byId('status').replaceChildren(node('strong', '', analyticsFailed && searchFailed ? '연결 오류' : partial ? '일부 오류' : '샘플 데이터'), node('span', '', message));
  } catch (error) {
    if (error.name === 'AbortError') return;
    byId('status').replaceChildren(node('strong', '', '연결 오류'), node('span', '', '통계 데이터를 불러오지 못했습니다.'));
    byId('updated-at').textContent = '—';
    byId('period-label').textContent = '—';
    byId('trend-period').textContent = `최근 ${days}일`;
    renderKpis(null); renderTrend([], days, true); renderSources([], true); renderSearch(null, true); renderPages([], true); renderQueries([], true); renderSearchPages([], true); renderInquiries(null, true);
  }
}
document.querySelectorAll('[data-days]').forEach(button => button.addEventListener('click', () => loadDashboard(button.dataset.days)));
document.querySelectorAll('[data-metric]').forEach(button => button.addEventListener('click', () => {
  selectedMetric = button.dataset.metric;
  document.querySelectorAll('[data-metric]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  if (dashboardData) renderTrend(dashboardData.visitorTrend, currentDays, Boolean(dashboardData.meta.errors.analytics));
}));
loadDashboard(30);
