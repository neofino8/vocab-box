function applyTheme(){
  const themeId = localStorage.getItem(THEME_KEY) || 'slate';
  const bgImage = localStorage.getItem(BG_IMAGE_KEY);
  const resolved = themeId === AUTO_THEME ? (darkScheme.matches ? AUTO_DARK : AUTO_LIGHT) : themeId;
  const theme = themeById(resolved) || THEMES[0];
  const root = document.documentElement.style;
  root.setProperty('--bg', theme.bg);
  root.setProperty('--panel', theme.panel);
  root.setProperty('--accent', theme.accent);
  root.setProperty('--soft', theme.soft);
  root.setProperty('--danger', theme.danger || '#E0868E');
  document.documentElement.classList.toggle('theme-light', !!theme.light);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', theme.bg);
  if(bgImage){
    document.body.style.backgroundImage = 'url(' + bgImage + ')';
    document.body.classList.add('has-image');
  } else {
    document.body.style.backgroundImage = 'none';
    document.body.classList.remove('has-image');
  }
  document.querySelectorAll('.swatch').forEach(s=>{
    s.classList.toggle('active', s.dataset.theme === themeId && !bgImage);
  });
}

function luminance(hex){
  const h = hex.replace('#','');
  const r = parseInt(h.substr(0,2),16);
  const g = parseInt(h.substr(2,2),16);
  const b = parseInt(h.substr(4,2),16);
  return (0.299*r + 0.587*g + 0.114*b) / 255;
}

function applyCardColor(){
  const hex = localStorage.getItem(CARD_KEY) || '#EFEAD9';
  const cardImage = localStorage.getItem(CARD_IMAGE_KEY);
  const root = document.documentElement.style;
  root.setProperty('--card-bg', hex);
  if(cardImage){
    root.setProperty('--card-image', 'url(' + cardImage + ')');
    document.body.classList.add('card-has-image');
  } else {
    root.setProperty('--card-image', 'none');
    document.body.classList.remove('card-has-image');
  }
  const isLight = !cardImage && luminance(hex) > 0.55;
  if(isLight){
    root.setProperty('--card-ink', '#242420');
    root.setProperty('--card-ink-soft', '#5B584C');
    root.setProperty('--card-trans', '#2B3A4A');
    root.setProperty('--card-divider', 'rgba(0,0,0,0.14)');
    root.setProperty('--card-input-bg', 'rgba(255,255,255,0.55)');
  } else {
    root.setProperty('--card-ink', '#EFEAD9');
    root.setProperty('--card-ink-soft', 'rgba(239,234,217,0.6)');
    root.setProperty('--card-trans', '#A9C4DA');
    root.setProperty('--card-divider', 'rgba(255,255,255,0.2)');
    root.setProperty('--card-input-bg', 'rgba(0,0,0,0.28)');
  }
  document.querySelectorAll('#cardSwatches .swatch').forEach(s=>{
    s.classList.toggle('active', s.dataset.card === hex && !cardImage);
  });
  const picker = document.getElementById('cardColorInput');
  if(picker) picker.value = hex;
}

function renderCardSwatches(){
  const wrap = document.getElementById('cardSwatches');
  wrap.innerHTML = '';
  CARD_COLORS.forEach(c=>{
    const s = document.createElement('div');
    s.className = 'swatch';
    s.dataset.card = c.id;
    s.style.background = c.id;
    const labelColor = luminance(c.id) > 0.55 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)';
    s.innerHTML = '<span style="color:' + labelColor + ';text-shadow:none;bottom:50%;transform:translateY(50%);">' + t(c.key) + '</span>';
    s.addEventListener('click', ()=>{
      localStorage.setItem(CARD_KEY, c.id);
      localStorage.removeItem(CARD_IMAGE_KEY);
      applyCardColor();
      noteSettingsChange();
    });
    wrap.appendChild(s);
  });
}

function renderSwatches(){
  const wrap = document.getElementById('swatches');
  wrap.innerHTML = '';
  const dark = themeById(AUTO_DARK), light = themeById(AUTO_LIGHT);
  const auto = {id:AUTO_THEME, key:'thAuto', light:true,
    bg:'linear-gradient(to bottom, ' + dark.bg + ' 50%, ' + light.bg + ' 50%)',
    accent:'linear-gradient(to right, ' + dark.accent + ' 50%, ' + light.accent + ' 50%)'};
  [auto, ...THEMES].forEach(th=>{
    const s = document.createElement('div');
    s.className = 'swatch' + (th.light ? ' swatch-light' : '');
    s.dataset.theme = th.id;
    s.style.background = th.bg;
    s.innerHTML = '<span>' + t(th.key) + '</span><div class="accent-strip" style="background:' + th.accent + '"></div>';
    s.addEventListener('click', ()=>{
      localStorage.setItem(THEME_KEY, th.id);
      localStorage.removeItem(BG_IMAGE_KEY);
      applyTheme();
      noteSettingsChange();
    });
    wrap.appendChild(s);
  });
}

function handleImageUpload(file){
  const reader = new FileReader();
  reader.onload = (e)=>{
    const img = new Image();
    img.onload = ()=>{
      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      try{
        localStorage.setItem(BG_IMAGE_KEY, dataUrl);
        applyTheme();
      }catch(err){
        alert(t('imageTooBig'));
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleCardImageUpload(file){
  const reader = new FileReader();
  reader.onload = (e)=>{
    const img = new Image();
    img.onload = ()=>{
      const maxW = 1000;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      try{
        localStorage.setItem(CARD_IMAGE_KEY, dataUrl);
        applyCardColor();
      }catch(err){
        alert(t('imageTooBig'));
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
