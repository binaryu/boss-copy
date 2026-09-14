
(() => {
  if (window.__bossJobExtractorInjected) return;
  window.__bossJobExtractorInjected = true;

  // 1. BOSS 自定义 WebFont 薪资乱码解密引擎
  function decodeBossFontText(str) {
    if (!str) return '';
    let decoded = '';
    for (const char of str) {
      const cp = char.codePointAt(0);
      // BOSS 直聘标准自定义字体映射: 0xe031 = '0', 0xe032 = '1', ..., 0xe03a = '9'
      if (cp >= 0xe031 && cp <= 0xe03a) {
        decoded += (cp - 0xe031).toString();
      } else if (cp >= 0xe000 && cp <= 0xf8ff) {
        if (cp >= 0xe030 && cp <= 0xe039) {
          decoded += (cp - 0xe030).toString();
        } else if (cp >= 0xe000 && cp <= 0xe009) {
          decoded += (cp - 0xe000).toString();
        } else {
          decoded += char;
        }
      } else {
        decoded += char;
      }
    }
    return decoded;
  }

  // 2. 智能提取职位及公司全景数据
  function extractCurrentJob() {
    const rightBox = document.querySelector('.job-detail-box');
    const isRightBox = rightBox && rightBox.offsetParent !== null;

    let title = '';
    let salary = '';
    let company = '';
    let companyScale = '';
    let companyIndustry = '';
    let companyStage = '';
    let recruiterName = '';
    let recruiterTitle = '';
    let recruiterActive = '';
    let locationAddress = '';
    let tags = [];
    let welfareList = [];
    let descEl = null;

    if (isRightBox) {
      // 场景 A: 列表/推荐页右侧详情抽屉
      const titleEl = rightBox.querySelector('.job-name') || rightBox.querySelector('.name');
      title = titleEl ? titleEl.innerText.trim() : '';

      const salaryEl = rightBox.querySelector('.job-salary') || rightBox.querySelector('.salary');
      salary = salaryEl ? salaryEl.innerText.trim() : '';

      // 关联左侧列表中匹配的卡片，获取公司名与地区
      const jobName = title;
      const moreBtnHref = rightBox.querySelector('.more-job-btn')?.href || '';
      const cards = Array.from(document.querySelectorAll('.job-card-box, .job-card-wrapper'));
      const matchedCard = cards.find(c => {
        const a = c.querySelector('a.job-name, a[href*="/job_detail/"]');
        if (moreBtnHref && a && moreBtnHref.includes(a.getAttribute('href'))) return true;
        const name = c.querySelector('.job-name')?.innerText?.trim();
        if (jobName && name === jobName) return true;
        return false;
      }) || cards[0];

      if (matchedCard) {
        const compEl = matchedCard.querySelector('.company-name')
          || matchedCard.querySelector('.boss-name')
          || matchedCard.querySelector('a[href*="/gongsi/"]');
        if (compEl) company = compEl.innerText.trim();

        const locEl = matchedCard.querySelector('.company-location');
        if (locEl) locationAddress = locEl.innerText.trim();
      }

      // 招聘者信息与活跃度
      const bossEl = rightBox.querySelector('.job-boss-info, .boss-info');
      if (bossEl) {
        const nameEl = bossEl.querySelector('.name');
        if (nameEl) {
          const clone = nameEl.cloneNode(true);
          clone.querySelectorAll('.boss-active-time, .boss-online-tag, .icon-vip').forEach(x => x.remove());
          recruiterName = clone.innerText.trim();
        }
        const actEl = bossEl.querySelector('.boss-active-time, .boss-online-tag');
        if (actEl) recruiterActive = actEl.innerText.trim();

        const attrEl = bossEl.querySelector('.boss-info-attr');
        if (attrEl) {
          const rawAttr = attrEl.innerText.trim();
          const parts = rawAttr.split('·').map(s => s.trim());
          if (parts.length > 1) {
            if (!company) company = parts[0];
            recruiterTitle = parts.slice(1).join(' · ');
          } else {
            recruiterTitle = parts[0];
          }
        }
      }

      // 详细工作地址
      const addressEl = rightBox.querySelector('.job-address-desc, .job-location, .location-address');
      if (addressEl) {
        const fullAddr = addressEl.innerText.replace(/工作地址|点击查看地图|查看地图/g, '').trim();
        if (fullAddr) locationAddress = fullAddr;
      }

      tags = Array.from(rightBox.querySelectorAll('.tag-list li, .job-tags span')).map(li => li.innerText.trim()).filter(Boolean);
      descEl = rightBox.querySelector('.job-detail-body p.desc') || rightBox.querySelector('.job-sec-text');
    } else {
      // 场景 B: 独立职位详情页 (/job_detail/xxx.html)
      const banner = document.querySelector('.job-banner') || document;
      const h1El = banner.querySelector('h1') || banner.querySelector('.name');
      if (h1El) {
        const cloneH1 = h1El.cloneNode(true);
        cloneH1.querySelectorAll('.salary').forEach(s => s.remove());
        title = cloneH1.innerText.trim();
      }

      const salEl = banner.querySelector('.salary');
      salary = salEl ? salEl.innerText.trim() : '';

      const compEl = document.querySelector('.sider-company .company-info a:not([ka*="logo"])')
        || document.querySelector('.company-info a')
        || document.querySelector('.job-company-info .name')
        || document.querySelector('.brand-name');
      if (compEl) company = compEl.innerText.trim();

      // 侧边栏公司画像：人数规模、行业、融资阶段
      document.querySelectorAll('.sider-company p').forEach(p => {
        const t = p.innerText.trim();
        if (p.querySelector('.icon-scale') || /人$/.test(t) || /\d+-\d+人/.test(t) || /10000人以上/.test(t)) {
          companyScale = t;
        } else if (p.querySelector('.icon-industry')) {
          companyIndustry = t;
        } else if (p.querySelector('.icon-stage') || /未融资|不需要融资|轮|已上市/.test(t)) {
          companyStage = t;
        }
      });

      // 招聘者信息与活跃度
      const bossEl = document.querySelector('.job-boss-info, .boss-info');
      if (bossEl) {
        const nameNode = bossEl.querySelector('h2, .name');
        if (nameNode) {
          const cloneName = nameNode.cloneNode(true);
          cloneName.querySelectorAll('.boss-active-time, .boss-online-tag, .icon-vip').forEach(x => x.remove());
          recruiterName = cloneName.innerText.trim();
        }
        const actEl = bossEl.querySelector('.boss-active-time, .boss-online-tag');
        if (actEl) recruiterActive = actEl.innerText.trim();

        const attrEl = bossEl.querySelector('.boss-info-attr');
        if (attrEl) {
          const rawAttr = attrEl.innerText.replace(/[\r\n\s]+/g, ' ').replace(/^[·\s]+|[·\s]+$/g, '').trim();
          const parts = rawAttr.split('·').map(s => s.trim());
          if (parts.length > 1) {
            recruiterTitle = parts.slice(1).join(' · ');
          } else {
            recruiterTitle = rawAttr;
          }
        }
      }

      // 工作地址
      const locEl = document.querySelector('.location-address, .company-address, .job-address-desc');
      if (locEl) {
        locationAddress = locEl.innerText.replace(/工作地址|点击查看地图|查看地图/g, '').trim();
      }

      // 要求标签与福利待遇
      tags = Array.from(document.querySelectorAll('.job-banner .tag-list li, .job-banner .text-desc'))
        .map(li => li.innerText.trim()).filter(Boolean);
      welfareList = Array.from(document.querySelectorAll('.job-banner .job-tags span, .welfare-list span'))
        .map(li => li.innerText.trim()).filter(Boolean);
      welfareList = Array.from(new Set(welfareList));

      descEl = document.querySelector('.job-sec-text') || document.querySelector('.job-detail-section');
    }

    // 清理混淆与不可见文本
    let cleanDesc = '';
    if (descEl) {
      const clone = descEl.cloneNode(true);
      clone.querySelectorAll('style, script').forEach(s => s.remove());
      clone.querySelectorAll('[style*="visibility: hidden"], [style*="display: none"], [style*="font-size: 0"]').forEach(s => s.remove());

      const hiddenClasses = new Set();
      descEl.querySelectorAll('*').forEach(el => {
        const s = window.getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.fontSize) === 0) {
          el.classList.forEach(c => hiddenClasses.add(c));
        }
      });
      hiddenClasses.forEach(cls => {
        clone.querySelectorAll('.' + cls).forEach(el => el.remove());
      });

      const raw = clone.innerText || clone.textContent || '';
      const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const filtered = lines.filter(l => !['举报', '微信扫码分享', '职位描述', '分享'].includes(l));
      cleanDesc = filtered.join('\n');
    }

    // 智能解密字体混淆
    title = decodeBossFontText(title);
    salary = decodeBossFontText(salary);
    cleanDesc = decodeBossFontText(cleanDesc);
    company = decodeBossFontText(company);
    companyScale = decodeBossFontText(companyScale);
    companyIndustry = decodeBossFontText(companyIndustry);
    companyStage = decodeBossFontText(companyStage);
    recruiterName = decodeBossFontText(recruiterName);
    recruiterTitle = decodeBossFontText(recruiterTitle);
    locationAddress = decodeBossFontText(locationAddress);
    tags = tags.map(t => decodeBossFontText(t));
    welfareList = welfareList.map(w => decodeBossFontText(w));

    // 智能切分岗位职责与任职要求
    let duties = '';
    let requirements = '';
    const dutyMatch = cleanDesc.match(/[【\[\s]*(?:岗位职责|工作职责|职位职责|主要职责|工作内容|职责描述)[】\]\s*：:]*/);
    const reqMatch = cleanDesc.match(/[【\[\s]*(?:任职要求|任职资格|岗位要求|职位要求|招聘要求|任职条件|岗位任职|入职要求)[】\]\s*：:]*/);

    const dutyIdx = dutyMatch ? dutyMatch.index : -1;
    const reqIdx = reqMatch ? reqMatch.index : -1;

    if (dutyIdx !== -1 && reqIdx !== -1) {
      if (dutyIdx < reqIdx) {
        duties = cleanDesc.slice(dutyIdx, reqIdx).trim();
        requirements = cleanDesc.slice(reqIdx).trim();
      } else {
        requirements = cleanDesc.slice(reqIdx, dutyIdx).trim();
        duties = cleanDesc.slice(dutyIdx).trim();
      }
    } else if (dutyIdx !== -1) {
      duties = cleanDesc.slice(dutyIdx).trim();
    } else if (reqIdx !== -1) {
      requirements = cleanDesc.slice(reqIdx).trim();
    }

    return {
      title: title || '未知职位',
      salary,
      company: company || '未知公司',
      companyScale,
      companyIndustry,
      companyStage,
      recruiterName,
      recruiterTitle,
      recruiterActive,
      locationAddress,
      tags,
      welfareList,
      fullDesc: cleanDesc || '暂未提取到职位详情，请先在页面点击一个具体职位。',
      duties,
      requirements
    };
  }

  // 3. 构建 DOM 界面
  function initUI() {
    if (document.getElementById('__boss_ext_trigger__')) return;

    const triggerBtn = document.createElement('div');
    triggerBtn.id = '__boss_ext_trigger__';
    triggerBtn.title = '点击展开当前职位说明与公司详情面板 (快捷键 Alt+C)';
    triggerBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>岗位提取</span>
    `;
    document.body.appendChild(triggerBtn);

    const overlay = document.createElement('div');
    overlay.id = '__boss_ext_overlay__';
    document.body.appendChild(overlay);

    const drawer = document.createElement('div');
    drawer.id = '__boss_ext_drawer__';
    drawer.innerHTML = `
      <div class="bext-header">
        <div class="bext-title-area">
          <div class="bext-job-title">
            <span id="bext-title">加载中...</span>
            <span id="bext-salary" class="bext-salary"></span>
          </div>
        </div>
        <button class="bext-close-btn" id="bext-close" title="关闭面板 (Esc)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <!-- 公司与岗位关键信息卡片 -->
      <div class="bext-meta-card">
        <div class="bext-meta-row" id="bext-company-row">
          <div class="bext-meta-left">
            <span class="bext-meta-icon">🏢</span>
            <span class="bext-company-name" id="bext-company"></span>
            <div id="bext-company-tags" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
          </div>
          <button class="bext-micro-btn" id="bext-copy-company-btn" title="复制公司全称">复制公司</button>
        </div>

        <div class="bext-meta-row" id="bext-recruiter-row">
          <div class="bext-meta-left">
            <span class="bext-meta-icon">👤</span>
            <span class="bext-recruiter-text" id="bext-recruiter-info"></span>
            <span id="bext-active-badge" class="bext-active-badge" style="display:none;"></span>
          </div>
        </div>

        <div class="bext-meta-row" id="bext-address-row">
          <div class="bext-meta-left" style="flex:1;min-width:0;">
            <span class="bext-meta-icon">📍</span>
            <span class="bext-address-text" id="bext-address" title="工作地址"></span>
          </div>
          <button class="bext-micro-btn" id="bext-copy-addr-btn" title="复制工作地址">复制地址</button>
        </div>

        <div class="bext-meta-row" id="bext-tags-row">
          <div class="bext-meta-left" id="bext-all-tags"></div>
        </div>
      </div>

      <div class="bext-actions">
        <button class="bext-btn bext-btn-primary" id="bext-copy-all" title="一键复制完整职位与公司画像">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>一键复制全部</span>
        </button>
        <button class="bext-btn bext-btn-secondary" id="bext-copy-duties">
          <span>🎯 复制职责</span>
        </button>
        <button class="bext-btn bext-btn-secondary" id="bext-copy-reqs">
          <span>📌 复制要求</span>
        </button>
      </div>

      <div class="bext-body">
        <div class="bext-section" id="bext-duty-section" style="display:none;">
          <div class="bext-section-title">
            <span>🎯 岗位职责</span>
            <span class="bext-copy-link" id="bext-copy-duty-link">复制此段</span>
          </div>
          <div class="bext-text-box" id="bext-duty-box"></div>
        </div>

        <div class="bext-section" id="bext-req-section" style="display:none;">
          <div class="bext-section-title">
            <span>📌 任职要求</span>
            <span class="bext-copy-link" id="bext-copy-req-link">复制此段</span>
          </div>
          <div class="bext-text-box" id="bext-req-box"></div>
        </div>

        <div class="bext-section">
          <div class="bext-section-title">
            <span>📝 完整职位说明</span>
            <span class="bext-copy-link" id="bext-copy-full-link">复制全文</span>
          </div>
          <div class="bext-text-box" id="bext-full-box"></div>
        </div>
      </div>

      <div class="bext-footer">
        <div class="bext-status">
          <span class="bext-status-dot"></span>
          <span>职位信息已提取</span>
        </div>
        <span id="bext-word-count">0 字</span>
      </div>
    `;
    document.body.appendChild(drawer);

    let currentData = null;

    async function copyText(text, btnElement, successText = '已复制!') {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }

      if (btnElement) {
        const oldHtml = btnElement.innerHTML;
        btnElement.classList.add('copied');
        btnElement.innerHTML = `<span>✓ ${successText}</span>`;
        setTimeout(() => {
          btnElement.classList.remove('copied');
          btnElement.innerHTML = oldHtml;
        }, 1200);
      }
    }

    function renderDrawer() {
      currentData = extractCurrentJob();

      // 标题 & 薪资
      document.getElementById('bext-title').innerText = currentData.title;
      document.getElementById('bext-salary').innerText = currentData.salary;

      // 公司名与画像标签
      document.getElementById('bext-company').innerText = currentData.company;
      const compTagsContainer = document.getElementById('bext-company-tags');
      compTagsContainer.innerHTML = '';
      [currentData.companyScale, currentData.companyIndustry, currentData.companyStage].filter(Boolean).forEach(info => {
        const sp = document.createElement('span');
        sp.className = 'bext-meta-pill';
        sp.innerText = info;
        compTagsContainer.appendChild(sp);
      });

      // 招聘者信息与活跃度
      const recruiterInfo = document.getElementById('bext-recruiter-info');
      const parts = [currentData.recruiterName, currentData.recruiterTitle].filter(Boolean);
      recruiterInfo.innerText = parts.length > 0 ? parts.join(' · ') : 'HR/招聘者信息暂未抓取';

      const activeBadge = document.getElementById('bext-active-badge');
      if (currentData.recruiterActive) {
        activeBadge.style.display = 'inline-flex';
        activeBadge.innerText = currentData.recruiterActive;
        activeBadge.className = 'bext-active-badge';
        if (/刚刚|在线/.test(currentData.recruiterActive)) {
          activeBadge.classList.add('active-green');
        } else if (/今日/.test(currentData.recruiterActive)) {
          activeBadge.classList.add('active-blue');
        } else if (/3日|本周/.test(currentData.recruiterActive)) {
          activeBadge.classList.add('active-orange');
        } else {
          activeBadge.classList.add('active-gray');
        }
      } else {
        activeBadge.style.display = 'none';
      }

      // 工作地址
      const addrRow = document.getElementById('bext-address-row');
      const addrEl = document.getElementById('bext-address');
      if (currentData.locationAddress) {
        addrRow.style.display = 'flex';
        addrEl.innerText = currentData.locationAddress;
      } else {
        addrRow.style.display = 'none';
      }

      // 职位要求标签与福利待遇
      const allTagsContainer = document.getElementById('bext-all-tags');
      allTagsContainer.innerHTML = '';
      currentData.tags.forEach(t => {
        const sp = document.createElement('span');
        sp.className = 'bext-meta-pill';
        sp.innerText = t;
        allTagsContainer.appendChild(sp);
      });
      currentData.welfareList.forEach(w => {
        const sp = document.createElement('span');
        sp.className = 'bext-meta-pill welfare';
        sp.innerText = '🎁 ' + w;
        allTagsContainer.appendChild(sp);
      });
      if (currentData.tags.length === 0 && currentData.welfareList.length === 0) {
        document.getElementById('bext-tags-row').style.display = 'none';
      } else {
        document.getElementById('bext-tags-row').style.display = 'flex';
      }

      // 职责
      const dutySec = document.getElementById('bext-duty-section');
      const dutyBox = document.getElementById('bext-duty-box');
      const copyDutyBtn = document.getElementById('bext-copy-duties');
      if (currentData.duties) {
        dutySec.style.display = 'block';
        dutyBox.innerText = currentData.duties;
        copyDutyBtn.style.display = 'inline-flex';
      } else {
        dutySec.style.display = 'none';
        copyDutyBtn.style.display = 'none';
      }

      // 要求
      const reqSec = document.getElementById('bext-req-section');
      const reqBox = document.getElementById('bext-req-box');
      const copyReqBtn = document.getElementById('bext-copy-reqs');
      if (currentData.requirements) {
        reqSec.style.display = 'block';
        reqBox.innerText = currentData.requirements;
        copyReqBtn.style.display = 'inline-flex';
      } else {
        reqSec.style.display = 'none';
        copyReqBtn.style.display = 'none';
      }

      // 全文
      const fullBox = document.getElementById('bext-full-box');
      fullBox.innerText = currentData.fullDesc;

      document.getElementById('bext-word-count').innerText = `${currentData.fullDesc.length} 字`;
    }

    function openDrawer() {
      renderDrawer();
      drawer.classList.add('active');
      overlay.classList.add('active');
    }

    function closeDrawer() {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    }

    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDrawer();
    });

    overlay.addEventListener('click', closeDrawer);
    document.getElementById('bext-close').addEventListener('click', closeDrawer);

    // 复制公司名
    document.getElementById('bext-copy-company-btn').addEventListener('click', (e) => {
      if (currentData && currentData.company) copyText(currentData.company, e.currentTarget, '公司已复制');
    });

    // 复制工作地址
    document.getElementById('bext-copy-addr-btn').addEventListener('click', (e) => {
      if (currentData && currentData.locationAddress) copyText(currentData.locationAddress, e.currentTarget, '地址已复制');
    });

    // 一键复制全部
    document.getElementById('bext-copy-all').addEventListener('click', (e) => {
      if (!currentData) return;
      const lines = [
        `【职位名称】${currentData.title} (${currentData.salary})`,
        `【招聘公司】${currentData.company}`
      ];
      const compMeta = [currentData.companyScale, currentData.companyIndustry, currentData.companyStage].filter(Boolean).join(' · ');
      if (compMeta) lines.push(`【公司画像】${compMeta}`);

      if (currentData.recruiterName || currentData.recruiterTitle) {
        let r = [currentData.recruiterName, currentData.recruiterTitle].filter(Boolean).join(' · ');
        if (currentData.recruiterActive) r += ` (${currentData.recruiterActive})`;
        lines.push(`【招聘负责】${r}`);
      }
      if (currentData.locationAddress) lines.push(`【工作地点】${currentData.locationAddress}`);
      if (currentData.tags.length > 0) lines.push(`【职位要求】${currentData.tags.join(' / ')}`);
      if (currentData.welfareList.length > 0) lines.push(`【福利待遇】${currentData.welfareList.join('、')}`);

      lines.push('');
      if (currentData.duties) {
        lines.push(currentData.duties);
        lines.push('');
      }
      if (currentData.requirements) {
        lines.push(currentData.requirements);
        lines.push('');
      }
      if (!currentData.duties && !currentData.requirements) {
        lines.push(currentData.fullDesc);
      }

      copyText(lines.join('\n').trim(), e.currentTarget, '全文已复制');
    });

    document.getElementById('bext-copy-duties').addEventListener('click', (e) => {
      if (currentData && currentData.duties) copyText(currentData.duties, e.currentTarget, '职责已复制');
    });
    document.getElementById('bext-copy-duty-link').addEventListener('click', (e) => {
      if (currentData && currentData.duties) copyText(currentData.duties, e.currentTarget, '已复制');
    });

    document.getElementById('bext-copy-reqs').addEventListener('click', (e) => {
      if (currentData && currentData.requirements) copyText(currentData.requirements, e.currentTarget, '要求已复制');
    });
    document.getElementById('bext-copy-req-link').addEventListener('click', (e) => {
      if (currentData && currentData.requirements) copyText(currentData.requirements, e.currentTarget, '已复制');
    });

    document.getElementById('bext-copy-full-link').addEventListener('click', (e) => {
      if (currentData && currentData.fullDesc) copyText(currentData.fullDesc, e.currentTarget, '已复制');
    });

    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        if (drawer.classList.contains('active')) {
          closeDrawer();
        } else {
          openDrawer();
        }
      } else if (e.key === 'Escape' && drawer.classList.contains('active')) {
        closeDrawer();
      }
    });

    // 智能监测单页应用切换职位
    function getJobIdentifier() {
      const rightBox = document.querySelector('.job-detail-box');
      if (rightBox && rightBox.offsetParent !== null) {
        const title = rightBox.querySelector('.job-name, .name')?.innerText?.trim() || '';
        if (!title) return lastJobKey; // 骨架屏加载过渡中，等待数据返回
        const boss = rightBox.querySelector('.boss-info-attr')?.innerText || '';
        return `right:${title}:${boss}`;
      }
      const banner = document.querySelector('.job-banner');
      if (banner) {
        const title = banner.querySelector('h1, .name')?.innerText?.trim() || '';
        return `banner:${title}:${window.location.pathname}`;
      }
      return window.location.href;
    }

    let lastJobKey = '';
    setInterval(() => {
      if (drawer.classList.contains('active')) {
        const currentKey = getJobIdentifier();
        if (currentKey && currentKey !== lastJobKey) {
          lastJobKey = currentKey;
          renderDrawer();
        }
      }
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }
})();
