from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, re

root = Path(__file__).resolve().parent
class Assets(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src', 'href'):
            url = attrs.get(key, '')
            if not url or url.startswith('#'): continue
            parsed = urlsplit(url)
            assert not parsed.scheme and not parsed.netloc, f'External URL: {url}'
            target = root / unquote(parsed.path).lstrip('/')
            if parsed.path.endswith('/'): target /= 'index.html'
            assert target.exists(), f'Missing asset: {url}'
        if tag == 'img':
            assert all(key in attrs for key in ('alt', 'width', 'height'))
        if tag == 'form':
            assert 'action' not in attrs and 'data-endpoint' not in attrs

for page in root.rglob('*.html'):
    Assets().feed(page.read_text(encoding='utf-8'))
for path in root.rglob('*'):
    if not path.is_file() or '.git' in path.parts or path.suffix in ('.woff', '.png'): continue
    text = path.read_text(encoding='utf-8')
    if path.name == 'check_demo.py': continue
    if path.suffix != '.md':
        assert not re.search(r'turnstile|resend|GOOGLE_SERVICE_ACCOUNT|/api/contact|/dashboard/api|tel:|mailto:', text, re.I), f'Live integration: {path}'
    assert not re.search(r'gh[pousr]_[A-Za-z0-9]{20,}|github_pat_|AKIA[A-Z0-9]{16}|BEGIN PRIVATE KEY', text), f'Credential pattern: {path}'
assert not (root / 'functions').exists()
assert not (root / 'photos').exists()
assert (root / 'fonts/LICENSE').exists()
app = (root / 'app.js').read_text(encoding='utf-8')
assert not re.search(r'FormData|localStorage|sessionStorage|sendBeacon|method:\s*[\"\']POST', app)
for days in (7, 30, 90):
    data = json.loads((root / f'dashboard/sample-{days}.json').read_text(encoding='utf-8'))
    assert data['meta']['source'] == 'sample'
    assert len(data['visitorTrend']) == days
    assert sum(p['inquiries'] for p in data['visitorTrend']) == data['summary']['inquiries']
    stats = data['inquiryStats']
    assert abs(stats['leads'] / stats['contactPageViews'] * 100 - stats['conversionRate']) < 1e-9
print('PASS: links/assets, demo boundaries, credential patterns, and all sample ranges')
