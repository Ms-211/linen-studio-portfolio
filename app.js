const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); navigation.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('open', open); });
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
const currentYear = Number(new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Seoul', year: 'numeric'}).format(new Date()));
async function loadSharedSections() {
  await Promise.all([...document.querySelectorAll('[data-include]')].map(async target => {
    try {
      const response = await fetch(`/partials/${target.dataset.include}.html`);
      if (!response.ok) throw new Error(`Shared section: ${response.status}`);
      target.innerHTML = await response.text();
    } catch {
      target.innerHTML = '<div class="container"><a href="/contact/">견적 문의</a> · <a href="/dashboard/">통계 데모</a></div>';
    }
  }));
  const footer = document.querySelector('footer');
  footer.querySelector('#year')?.replaceChildren(String(currentYear));
  const pageLink = footer.querySelector(`nav a[href="${location.pathname.replace(/index\.html$/, '')}"]`);
  pageLink?.setAttribute('aria-current', 'page');
}
const sharedReady = loadSharedSections();
const factoryYear = document.querySelector('#factory-year');
document.querySelector('#about-year')?.replaceChildren(String(currentYear));
if (factoryYear) {
  factoryYear.textContent = currentYear;
  document.querySelectorAll('[data-start-year]').forEach(item => { item.textContent = currentYear - Number(item.dataset.startYear); });
}

function currentSectionIndex(rects, marker, lastMarker = marker) {
  return rects.at(-1).top <= lastMarker ? rects.length - 1 : Math.max(0, rects.findLastIndex(rect => rect.top <= marker));
}

const sectionNav = document.querySelector('.section-nav');
if (sectionNav) {
  const links = [...sectionNav.querySelectorAll('a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  const desktop = matchMedia('(min-width: 1280px)');
  let queued = false;
  function updateSectionNav() {
    queued = false;
    if (!desktop.matches) return;
    const marker = document.querySelector('.header').getBoundingClientRect().bottom + 1;
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
    const current = currentSectionIndex(sections.map(section => section.getBoundingClientRect()), marker, atBottom ? Infinity : Math.max(marker, window.innerHeight / 2));
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    sectionNav.classList.toggle('is-dark', sections[current].matches('.hero, .dark'));
  }
  function scheduleSectionNav() {
    if (!queued) { queued = true; requestAnimationFrame(updateSectionNav); }
  }
  window.addEventListener('scroll', scheduleSectionNav, {passive: true});
  window.addEventListener('resize', scheduleSectionNav);
  window.addEventListener('pageshow', scheduleSectionNav);
  updateSectionNav();
  sharedReady.then(scheduleSectionNav);
}

function formatDomesticPhone(value) {
  const input = value.trim();
  if (!/^[0-9\s().-]+$/.test(input)) return '';
  const digits = input.replace(/\D/g, '');
  const prefixLength = /^010\d{8}$/.test(digits) ? 3 :
    /^02\d{7,8}$/.test(digits) ? 2 :
    /^(?:03[1-3]|04[1-4]|05[1-5]|06[1-4])\d{7,8}$/.test(digits) ? 3 : 0;
  if (!prefixLength) return '';
  return `${digits.slice(0, prefixLength)}-${digits.slice(prefixLength, -4)}-${digits.slice(-4)}`;
}

const form = document.querySelector('#inquiry-form');
if (form) {
  const message = document.querySelector('#form-message');
  const submit = form.querySelector('[type=submit]');
  const consent = form.querySelector('#privacy-consent');
  const fileInput = form.querySelector('#files');
  const dropzone = form.querySelector('.attachment-dropzone');
  const uploadArea = form.querySelector('.attachment-upload');
  const attachmentStatus = document.querySelector('#attachment-status');
  const fileList = document.querySelector('#files-help');
  const fileError = document.querySelector('#files-error');
  const selectedFiles = [];
  const allowedExtensions = /\.(?:pdf|hwp|hwpx|doc|docx|xls|xlsx|csv|jpe?g|png|webp|heic)$/i;
  const mb = 1024 * 1024;
  function formatSize(bytes) {
    if (bytes < 1024) return '<1KB';
    if (bytes < mb) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)}KB`;
    return `${(bytes / mb).toFixed(1)}MB`;
  }
  function attachmentError(files) {
    if (files.length > 3) return '파일은 최대 3개까지 첨부할 수 있습니다.';
    if (files.some(file => file.size > 10 * mb)) return '파일 하나의 최대 크기는 10MB입니다.';
    if (files.reduce((sum, file) => sum + file.size, 0) > 20 * mb) return '첨부파일 전체 용량은 최대 20MB입니다.';
    if (files.some(file => !file.size || !allowedExtensions.test(file.name))) return '지원하지 않는 파일 형식입니다.';
    return '';
  }
  function renderFiles() {
    fileList.replaceChildren();
    uploadArea.classList.toggle('has-files', selectedFiles.length > 0);
    uploadArea.classList.toggle('at-limit', selectedFiles.length === 3);
    dropzone.tabIndex = selectedFiles.length === 3 ? -1 : 0;
    dropzone.setAttribute('aria-disabled', String(selectedFiles.length === 3));
    attachmentStatus.textContent = selectedFiles.length ? `✓ 첨부파일 ${selectedFiles.length}개` : '';
    selectedFiles.forEach((file, index) => {
      const row = document.createElement('div');
      const name = document.createElement('span');
      name.className = 'attachment-name';
      name.textContent = file.name;
      const size = document.createElement('span');
      size.textContent = formatSize(file.size);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '삭제';
      remove.setAttribute('aria-label', `${file.name} 삭제`);
      remove.addEventListener('click', () => { selectedFiles.splice(index, 1); fileError.textContent = ''; renderFiles(); });
      row.append(name, size, remove);
      fileList.append(row);
    });
    if (selectedFiles.length) {
      const summary = document.createElement('p');
      summary.textContent = `총 ${formatSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))} / 20MB`;
      fileList.append(summary);
    }
  }
  function addFiles(incoming) {
    const files = [...incoming];
    if (!files.length) return;
    if (selectedFiles.length + files.length > 3) { fileError.textContent = '파일은 최대 3개까지 첨부할 수 있습니다.'; return; }
    if (files.some((file, index) => [...selectedFiles, ...files.slice(0, index)].some(existing =>
      existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified))) {
      fileError.textContent = '이미 첨부한 파일입니다.';
      return;
    }
    const next = [...selectedFiles, ...files];
    fileError.textContent = attachmentError(next);
    if (!fileError.textContent) { selectedFiles.splice(0, selectedFiles.length, ...next); renderFiles(); }
  }
  fileInput.addEventListener('change', () => {
    addFiles(fileInput.files);
    fileInput.value = '';
  });
  dropzone.addEventListener('click', () => { if (selectedFiles.length < 3) fileInput.click(); });
  dropzone.addEventListener('keydown', event => {
    if (selectedFiles.length < 3 && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); fileInput.click(); }
  });
  for (const type of ['dragenter', 'dragover']) uploadArea.addEventListener(type, event => {
    event.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', event => {
    if (!uploadArea.contains(event.relatedTarget)) uploadArea.classList.remove('dragover');
  });
  uploadArea.addEventListener('drop', event => {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    addFiles(event.dataTransfer?.files || []);
  });
  submit.disabled = false;
  function validate(field) {
    let error = '';
    const value = field.value.trim();
    if (field.required && !value) error = `${field.labels[0].textContent.replace(' (필수)', '')} 항목을 확인해주세요.`;
    else if (field.name === 'phone' && value && !formatDomesticPhone(value)) error = '연락처 형식을 확인해주세요.';
    else if (field.validity.typeMismatch) error = '이메일 형식을 확인해주세요.';
    else if (!field.validity.valid) error = '입력값의 형식과 범위를 확인해주세요.';
    field.setAttribute('aria-invalid', String(Boolean(error)));
    document.getElementById(`${field.id}-error`).textContent = error;
    return !error;
  }
  const fields = [...form.querySelectorAll('.form-grid input, .form-grid select, .form-grid textarea')].filter(field => field !== fileInput);
  fields.forEach(field => {
    field.addEventListener('blur', () => validate(field));
    field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validate(field); });
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const invalid = fields.filter(field => !validate(field));
    if (invalid.length) { message.textContent = ''; invalid[0].focus(); return; }
    fileError.textContent = attachmentError(selectedFiles);
    if (fileError.textContent) { dropzone.focus(); return; }
    if (!consent.checked) { message.dataset.state = 'error'; message.textContent = '실제 전송 없는 데모임을 확인해 주세요.'; consent.focus(); return; }
    message.dataset.state = 'success';
    message.textContent = '데모가 완료되었습니다. 입력 내용과 첨부파일은 전송하거나 저장하지 않았습니다.';
    form.reset();
    selectedFiles.length = 0;
    fileError.textContent = '';
    renderFiles();
    fields.forEach(field => { field.removeAttribute('aria-invalid'); document.getElementById(`${field.id}-error`).textContent = ''; });
  });
}
