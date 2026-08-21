// =========================================================
// VN–RU PORTAL · MODULE 1: IAM & GOVERNANCE LOGIC
// =========================================================

// --- State Variables ---
let currentMainTab = 'public';
let currentContext = 'researcher';
let timerInterval = null;
let countdownSeconds = 24;

// --- Tab Switching ---
function switchMainTab(tabId) {
  currentMainTab = tabId;
  
  // Update nav buttons
  const navPublic = document.getElementById('tabNavPublic');
  const navWorkspace = document.getElementById('tabNavWorkspace');
  const navRbac = document.getElementById('tabNavRbac');
  const navAdmin = document.getElementById('tabNavAdmin');

  if (navPublic) navPublic.classList.toggle('active', tabId === 'public');
  if (navWorkspace) navWorkspace.classList.toggle('active', tabId === 'workspace');
  if (navRbac) navRbac.classList.toggle('active', tabId === 'rbac');
  if (navAdmin) navAdmin.classList.toggle('active', tabId === 'admin');

  // Update panes
  const panePublic = document.getElementById('panePublic');
  const paneWorkspace = document.getElementById('paneWorkspace');
  const paneRbac = document.getElementById('paneRbac');
  const paneAdmin = document.getElementById('paneAdmin');

  if (panePublic) panePublic.classList.toggle('active', tabId === 'public');
  if (paneWorkspace) paneWorkspace.classList.toggle('active', tabId === 'workspace');
  if (paneRbac) paneRbac.classList.toggle('active', tabId === 'rbac');
  if (paneAdmin) paneAdmin.classList.toggle('active', tabId === 'admin');

  if (tabId === 'rbac') {
    renderRoleConfig(currentConfigRole || 'REVIEWER');
  }

  // Close context dropdown if open
  closeContextDropdown();
}

// --- Context Switcher Logic (OPEN-02) ---
function toggleContextDropdown() {
  const dropdown = document.getElementById('contextDropdown');
  dropdown.classList.toggle('show');
}

function closeContextDropdown() {
  const dropdown = document.getElementById('contextDropdown');
  if (dropdown) dropdown.classList.remove('show');
}

// Close context dropdown when clicking outside
document.addEventListener('click', function (e) {
  const wrapper = document.getElementById('userContextWrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    closeContextDropdown();
  }
});

function selectContext(contextKey) {
  currentContext = contextKey;

  // Update dropdown selection states
  document.getElementById('ctxCard1').classList.toggle('active', contextKey === 'researcher');
  document.getElementById('ctxCard2').classList.toggle('active', contextKey === 'reviewer');
  document.getElementById('ctxCard3').classList.toggle('active', contextKey === 'partner_rep');

  document.querySelector('#ctxCard1 .ctx-check').innerText = (contextKey === 'researcher' ? '✓' : '');
  document.querySelector('#ctxCard2 .ctx-check').innerText = (contextKey === 'reviewer' ? '✓' : '');
  document.querySelector('#ctxCard3 .ctx-check').innerText = (contextKey === 'partner_rep' ? '✓' : '');

  // Update top header pill
  const activeLabel = document.getElementById('activeContextText');
  const wsRoleTag = document.getElementById('wsRoleTag');
  const bannerTitle = document.getElementById('bannerContextTitle');
  const bannerDesc = document.getElementById('bannerContextDesc');

  if (contextKey === 'researcher') {
    activeLabel.innerText = 'Nhà nghiên cứu (VAST)';
    wsRoleTag.innerText = 'Nhà nghiên cứu / Tác giả';
    bannerTitle.innerText = 'Đang ở Ngữ cảnh: Nhà nghiên cứu / Tác giả đề xuất (VAST)';
    bannerDesc.innerHTML = 'Bạn có quyền soạn thảo đề tài tài trợ độc lập, bổ sung báo cáo tiến độ và tra cứu chuyên gia. Scope: <code>GRANT.PROPOSAL.*</code>';
    showNotification('Đã chuyển ngữ cảnh sang: Nhà nghiên cứu (VAST) · Quyền được cấp: GRANT.PROPOSAL.*');
  } else if (contextKey === 'reviewer') {
    activeLabel.innerText = 'Chuyên gia Phản biện (Quỹ)';
    wsRoleTag.innerText = 'Chuyên gia Phản biện';
    bannerTitle.innerText = 'Đang ở Ngữ cảnh: Chuyên gia Phản biện (Hội đồng Quỹ TT&HN)';
    bannerDesc.innerHTML = 'Bạn có quyền truy cập và chấm điểm <b>02 hồ sơ được phân công (#R100, #R104)</b>. Hệ thống tự động chặn xem các đề tài ngoài danh mục để chống rò rỉ.';
    showNotification('Đã chuyển ngữ cảnh sang: Reviewer · Resource Scope: assignmentId in [R100, R104]');
  } else if (contextKey === 'partner_rep') {
    activeLabel.innerText = 'Đại diện Tổ chức Đối tác';
    wsRoleTag.innerText = 'Đại diện Đơn vị VAST';
    bannerTitle.innerText = 'Đang ở Ngữ cảnh: Đại diện Tổ chức Đối tác (VAST Liaison)';
    bannerDesc.innerHTML = 'Bạn có quyền xác nhận tư cách hội viên trực thuộc, phê duyệt Thỏa thuận hợp tác song phương và xem báo cáo dự án đơn vị.';
    showNotification('Đã chuyển ngữ cảnh sang: Đại diện Tổ chức Đối tác · Scope: ORG.AFFILIATION.VERIFY');
  }

  closeContextDropdown();

  // If in public, auto switch to workspace
  if (currentMainTab === 'public') {
    switchMainTab('workspace');
  }
}

// --- Login & 2FA Flow ---
function handleLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  if (!username) return;

  // Open 2FA Modal
  open2faModal();
}

function simulateSso(providerName) {
  showNotification(`Đang chuyển hướng xác thực qua cổng liên hợp ${providerName}...`);
  setTimeout(() => {
    open2faModal();
  }, 800);
}

function open2faModal(isReconfigure = false) {
  const modal = document.getElementById('modal2FA');
  modal.classList.add('show');
  countdownSeconds = 30;
  startOtpTimer();
}

function close2faModal() {
  const modal = document.getElementById('modal2FA');
  modal.classList.remove('show');
  if (timerInterval) clearInterval(timerInterval);
}

function startOtpTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const timerElem = document.getElementById('otpTimerText');

  timerInterval = setInterval(() => {
    countdownSeconds--;
    if (timerElem) timerElem.innerText = `${countdownSeconds}s`;
    if (countdownSeconds <= 0) {
      countdownSeconds = 30;
      showNotification('Mã OTP TOTP đã tự động làm mới chu kỳ 30 giây.');
    }
  }, 1000);
}

function moveOtp(currentInput, nextIndex) {
  if (currentInput.value.length === 1 && nextIndex <= 5) {
    const inputs = document.querySelectorAll('.otp-box');
    if (inputs[nextIndex]) inputs[nextIndex].focus();
  }
}

function submit2faVerification() {
  close2faModal();
  showNotification('✅ Xác thực 2FA thành công! Cấp phát Session Token JWT thành công.');
  setTimeout(() => {
    switchMainTab('workspace');
  }, 400);
}

function togglePasswordVisibility() {
  const pwd = document.getElementById('loginPassword');
  pwd.type = (pwd.type === 'password' ? 'text' : 'password');
}

// --- Workspace Specifics ---
function showWsSection(sectionKey) {
  showNotification(`Đang mở phân hệ làm việc: ${sectionKey.toUpperCase()}`);
}

function revokeSingleSession(cardId, deviceName) {
  const card = document.getElementById(cardId);
  if (card) {
    card.style.opacity = '0.4';
    card.innerHTML = `<div style="padding:10px; color:#b91c1c;">Đã thu hồi phiên trên ${deviceName}. Token đã bị đưa vào Redis Revocation Blacklist.</div>`;
    showNotification(`Đã thu hồi phiên làm việc trên ${deviceName}.`);
  }
}

function revokeOtherSessions() {
  const card1 = document.getElementById('sessCardMobile');
  const card2 = document.getElementById('sessCardMac');
  if (card1) card1.remove();
  if (card2) card2.remove();
  showNotification('⚠️ Đã thu hồi toàn bộ phiên làm việc khác! Tất cả thiết bị còn lại đã bị buộc đăng xuất.');
}

// --- Admin Console Sub-Tabs ---
function switchAdminTab(subTabId) {
  const navItems = document.querySelectorAll('.admin-nav-item');
  navItems.forEach((btn, idx) => {
    btn.classList.remove('active');
    if (
      (subTabId === 'users' && idx === 0) ||
      (subTabId === 'roles' && idx === 1) ||
      (subTabId === 'audit' && idx === 2) ||
      (subTabId === 'redis' && idx === 3)
    ) {
      btn.classList.add('active');
    }
  });

  const paneUsers = document.getElementById('subpaneUsers');
  const paneRoles = document.getElementById('subpaneRoles');
  const paneAudit = document.getElementById('subpaneAudit');
  const paneRedis = document.getElementById('subpaneRedis');

  if (paneUsers) paneUsers.classList.toggle('active', subTabId === 'users');
  if (paneRoles) paneRoles.classList.toggle('active', subTabId === 'roles');
  if (paneAudit) paneAudit.classList.toggle('active', subTabId === 'audit');
  if (paneRedis) paneRedis.classList.toggle('active', subTabId === 'redis');
}

// --- Role Access Configuration Data (Exact Reference UI Model) ---
const roleConfigDatabase = {
  'REVIEWER': {
    title: 'Cấu hình truy cập: Chuyên gia Phản biện (Reviewer)',
    badge: 'ROLE_REVIEWER',
    code: 'HOTEL_FRONTDESK / SCIENTIFIC_REVIEWER',
    created: '27 thg 5, 2026',
    totalPerms: 13,
    capsules: [
      { id: 'all_portal', icon: '🏛️', title: 'Khách sạn / Cổng Portal', count: '0/79', selectedPrimary: true },
      { id: 'user_mgmt', icon: '👥', title: 'Người dùng', count: '0/9' },
      { id: 'role_mgmt', icon: '🛡️', title: 'Vai trò', count: '0/23' },
      { id: 'admin_sys', icon: '📋', title: 'Admin', count: '0/12' },
      { id: 'codes_mgmt', icon: '📑', title: 'Codes / Mã phân loại', count: '0/4' },

      { id: 'guestos', icon: 'ℹ️', title: 'GuestOS / Khách vãng lai', count: '0/1' },
      { id: 'payment', icon: 'ℹ️', title: 'Thanh toán & Thù lao', count: '2/2', hasPerms: true },
      { id: 'dashboard', icon: '📊', title: 'Dashboard khách sạn / Phản biện', count: '1/1', hasPerms: true },
      { id: 'local_partners', icon: '🏛️', title: 'Hotel Local Partners / Đối tác', count: '0/2' },

      { id: 'marketplace', icon: '🏢', title: 'Hotel Marketplace / Sàn CN', count: '0/2' },
      { id: 'messages', icon: '💬', title: 'Hotel Messages / Tin nhắn phản hồi', count: '2/2', hasPerms: true },
      { id: 'guest_req', icon: '📤', title: 'Yêu cầu khách / Hội đồng', count: '2/2', hasPerms: true },
      { id: 'booking', icon: 'ℹ️', title: 'Đặt phòng & khách đến / Hồ sơ', count: '2/6', hasPerms: true },

      { id: 'rev_prot', icon: '🔒', title: 'Hotel Revenue Protection', count: '0/1' },
      { id: 'qr_room', icon: '🔲', title: 'QR phòng / Xác thực', count: '0/1' },
      { id: 'rooms', icon: '📁', title: 'Phòng / Hồ sơ đề xuất', count: '2/2', hasPerms: true },
      { id: 'services', icon: '⚙️', title: 'Dịch vụ thẩm định', count: '0/2' },

      { id: 'hotel_staff', icon: '👥', title: 'Nhân viên khách sạn / Thư ký', count: '0/2' },
      { id: 'stay', icon: '📁', title: 'Lưu trú / Tài liệu', count: '2/2', hasPerms: true },
      { id: 'integrations', icon: '📑', title: 'Integrations', count: '0/2' },
      { id: 'payments_sub', icon: '📑', title: 'Payments', count: '0/1' },
      { id: 'perms_sub', icon: '🛡️', title: 'Quyền', count: '0/2' },

      { id: 'plat_billing', icon: '📑', title: 'Platform Billing', count: '0/13' },
      { id: 'plat_hotel', icon: 'ℹ️', title: 'Khách sạn nền tảng', count: '0/2' },
      { id: 'plat_market', icon: '📑', title: 'Platform Marketplace', count: '0/2' },
      { id: 'plat_authz', icon: 'ℹ️', title: 'Phân quyền', count: '0/1' },

      { id: 'roles_plat', icon: '🛡️', title: 'Vai trò', count: '0/2' },
      { id: 'users_plat', icon: '👥', title: 'Người dùng nền tảng', count: '0/2' },
      { id: 'service_market', icon: '📑', title: 'Service Marketplace', count: '0/2' },
      { id: 'service_portal', icon: '📑', title: 'Service Portal', count: '0/17' },

      { id: 'system_core', icon: 'ℹ️', title: 'Hệ thống', count: '0/1' },
      { id: 'unit_owner', icon: '📑', title: 'Chủ đơn vị', count: '0/6' }
    ]
  },
  'RESEARCHER': {
    title: 'Cấu hình truy cập: Nhà nghiên cứu (Researcher / Principal Investigator)',
    badge: 'ROLE_RESEARCHER',
    code: 'SCIENTIST_RESEARCHER / VAST_MEMBER',
    created: '15 thg 4, 2026',
    totalPerms: 8,
    capsules: [
      { id: 'all_portal', icon: '🏛️', title: 'Cổng Portal VN-RU', count: '0/79', selectedPrimary: true },
      { id: 'user_mgmt', icon: '👥', title: 'Hồ sơ cá nhân & CV', count: '1/2', hasPerms: true },
      { id: 'rooms', icon: '📁', title: 'Đề xuất tài trợ (Grant Proposal)', count: '3/4', hasPerms: true },
      { id: 'stay', icon: '📁', title: 'Tiến độ & Báo cáo đề tài', count: '2/3', hasPerms: true },
      { id: 'marketplace', icon: '🏢', title: 'Chào bán công nghệ (Tech Offer)', count: '2/2', hasPerms: true },
      { id: 'booking', icon: 'ℹ️', title: 'Tra cứu chuyên gia & Đồng tác giả', count: '0/4' },
      { id: 'plat_market', icon: '📑', title: 'Liên kết Đối tác Nga (RAS/2+2)', count: '0/2' }
    ]
  },
  'ENTERPRISE_REP': {
    title: 'Cấu hình truy cập: Đại diện Doanh nghiệp (Enterprise Liaison)',
    badge: 'ROLE_ENTERPRISE_REP',
    code: 'TECH_ENTERPRISE_REP / MODEL_2PLUS2',
    created: '02 thg 6, 2026',
    totalPerms: 6,
    capsules: [
      { id: 'all_portal', icon: '🏛️', title: 'Cổng Portal VN-RU', count: '0/79', selectedPrimary: true },
      { id: 'marketplace', icon: '🏢', title: 'Sàn Công nghệ 2+2', count: '2/2', hasPerms: true },
      { id: 'messages', icon: '💬', title: 'Kết nối Viện/Trường VAST/RAS', count: '2/2', hasPerms: true },
      { id: 'unit_owner', icon: '📑', title: 'Xác thực tư cách Doanh nghiệp', count: '2/2', hasPerms: true }
    ]
  },
  'COUNCIL': {
    title: 'Cấu hình truy cập: Hội đồng Quỹ Truyền thống và Hữu nghị',
    badge: 'ROLE_COUNCIL_MEMBER',
    code: 'COUNCIL_VOTING_MEMBER / EVALUATION_BOARD',
    created: '10 thg 3, 2026',
    totalPerms: 16,
    capsules: [
      { id: 'all_portal', icon: '🏛️', title: 'Cổng Portal VN-RU', count: '0/79', selectedPrimary: true },
      { id: 'guest_req', icon: '📤', title: 'Tổng hợp phiếu phản biện', count: '4/4', hasPerms: true },
      { id: 'booking', icon: 'ℹ️', title: 'Bỏ phiếu phê duyệt tài trợ', count: '2/2', hasPerms: true },
      { id: 'payment', icon: 'ℹ️', title: 'Định mức & Phê duyệt giải ngân', count: '4/4', hasPerms: true },
      { id: 'stay', icon: '📁', title: 'Biên bản họp Hội đồng', count: '2/2', hasPerms: true }
    ]
  },
  'GOVERNANCE_ADMIN': {
    title: 'Cấu hình truy cập: Quản trị viên Hệ thống & Bảo mật (Admin Quỹ)',
    badge: 'ROLE_GOVERNANCE_ADMIN',
    code: 'SUPERUSER_ADMIN / SECURITY_OPERATOR',
    created: '01 thg 1, 2026',
    totalPerms: 64,
    capsules: [
      { id: 'all_portal', icon: '🏛️', title: 'Toàn bộ Portal VN-RU', count: '64/79', selectedPrimary: true, hasPerms: true },
      { id: 'user_mgmt', icon: '👥', title: 'Quản trị Người dùng', count: '9/9', hasPerms: true },
      { id: 'role_mgmt', icon: '🛡️', title: 'Quản trị Phân quyền', count: '23/23', hasPerms: true },
      { id: 'admin_sys', icon: '📋', title: 'Admin Quỹ', count: '12/12', hasPerms: true },
      { id: 'integrations', icon: '📑', title: 'Bảo mật 2FA & Audit Trail', count: '4/4', hasPerms: true },
      { id: 'plat_billing', icon: '📑', title: 'Hạ tầng Redis Cache', count: '13/13', hasPerms: true }
    ]
  }
};

let currentConfigRole = 'REVIEWER';

function renderRoleConfig(roleKey) {
  currentConfigRole = roleKey;
  const data = roleConfigDatabase[roleKey] || roleConfigDatabase['REVIEWER'];

  document.getElementById('acRoleTitle').innerText = data.title;
  document.getElementById('acRoleBadge').innerText = data.badge;
  document.getElementById('acRoleCode').innerText = data.code;
  document.getElementById('acTotalPermsCount').innerText = data.totalPerms;

  const container = document.getElementById('acCapsulesGrid');
  if (!container) return;

  container.innerHTML = '';
  data.capsules.forEach(cap => {
    const btn = document.createElement('button');
    btn.className = 'ac-capsule-btn';
    if (cap.selectedPrimary) btn.classList.add('selected-primary');
    if (cap.hasPerms) btn.classList.add('has-perms');

    btn.innerHTML = `
      <span class="capsule-icon">${cap.icon}</span>
      <span class="capsule-title">${cap.title}</span>
      <span class="capsule-count">${cap.count}</span>
    `;

    btn.onclick = () => openGranularPanel(cap);
    container.appendChild(btn);
  });
}

function switchRoleConfig(roleKey) {
  const pills = document.querySelectorAll('.r-pill-btn');
  pills.forEach(p => p.classList.remove('active'));
  event.currentTarget.classList.add('active');

  renderRoleConfig(roleKey);
  closeGranularPanel();
  showNotification(`Đã chuyển xem Cấu hình truy cập của vai trò: ${roleKey}`);
}

function openGranularPanel(capObj) {
  const panel = document.getElementById('acGranularPanel');
  if (!panel) return;

  document.getElementById('granularGroupIcon').innerText = capObj.icon;
  document.getElementById('granularGroupName').innerText = `Chi tiết Quyền trong phân hệ: ${capObj.title} (${capObj.count})`;
  
  const list = document.getElementById('granularItemsList');
  list.innerHTML = `
    <div class="granular-item-card">
      <input type="checkbox" checked id="g1">
      <div class="granular-item-text">
        <strong>${capObj.id.toUpperCase()}.READ</strong>
        <span>Quyền truy vấn và xem chi tiết dữ liệu phân hệ</span>
      </div>
    </div>
    <div class="granular-item-card">
      <input type="checkbox" ${capObj.hasPerms ? 'checked' : ''} id="g2">
      <div class="granular-item-text">
        <strong>${capObj.id.toUpperCase()}.WRITE</strong>
        <span>Quyền khởi tạo, chỉnh sửa dữ liệu thuộc phạm vi sở hữu</span>
      </div>
    </div>
    <div class="granular-item-card">
      <input type="checkbox" id="g3">
      <div class="granular-item-text">
        <strong>${capObj.id.toUpperCase()}.APPROVE</strong>
        <span>Quyền phê duyệt cấp cao (Dành cho Quỹ / Hội đồng)</span>
      </div>
    </div>
    <div class="granular-item-card">
      <input type="checkbox" ${capObj.hasPerms ? 'checked' : ''} id="g4">
      <div class="granular-item-text">
        <strong>${capObj.id.toUpperCase()}.SUBMIT</strong>
        <span>Quyền gửi nộp kết quả đánh giá lên cấp quản lý</span>
      </div>
    </div>
  `;

  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeGranularPanel() {
  const panel = document.getElementById('acGranularPanel');
  if (panel) panel.style.display = 'none';
}

function saveGranularPermissions() {
  closeGranularPanel();
  showNotification('💾 Đã lưu cấu hình phân quyền phân hệ! Đã gửi tín hiệu Invalidate Redis Cache (<1.2ms).');
}

function openCreateRoleModal() {
  showNotification('Mở trình tạo vai trò mới (Custom Role Definition Builder).');
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderRoleConfig('REVIEWER');
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  renderRoleConfig('REVIEWER');
}

// --- Live Policy Simulator Engine ---
function runPolicySimulation() {
  const user = document.getElementById('simUserSelect').value;
  const ctx = document.getElementById('simContextSelect').value;
  const action = document.getElementById('simActionSelect').value;
  const resId = document.getElementById('simResourceIdInput').value.trim().toUpperCase();

  const outBox = document.getElementById('simOutputBox');
  const badge = document.getElementById('simResBadge');
  const latency = document.getElementById('simResLatency');
  const body = document.getElementById('simResBody');

  // Random low latency simulation
  const ms = (Math.random() * 0.8 + 0.8).toFixed(2);
  latency.innerText = `⚡ ${ms} ms (Redis Cache Hit)`;

  // Evaluation logic rules
  let isAllowed = false;
  let reason = '';
  let ruleName = '';

  if (action === 'GRANT.PROPOSAL.READ') {
    if (ctx === 'RESEARCHER') {
      if (resId === 'P001' || resId === 'GRANT.P001') {
        isAllowed = true;
        ruleName = 'ABAC_OWNER_PROPOSAL_MATCH';
      } else {
        isAllowed = false;
        reason = `Đề tài ${resId} không do u_nguyenva sở hữu (Owner mismatch).`;
        ruleName = 'ABAC_PROPOSAL_STRICT_ISOLATION';
      }
    } else if (ctx === 'REVIEWER') {
      if (resId === 'R100' || resId === 'R104' || resId === 'P100' || resId === 'P104') {
        isAllowed = true;
        ruleName = 'ABAC_REVIEWER_ASSIGNMENT_MATCH';
      } else {
        isAllowed = false;
        reason = `Đề tài ${resId} nằm ngoài phạm vi phân công [R100, R104] của Hội đồng Quỹ.`;
        ruleName = 'ABAC_REVIEWER_STRICT_ISOLATION';
      }
    } else if (ctx === 'GOVERNANCE_ADMIN') {
      isAllowed = true;
      ruleName = 'RBAC_GOVERNANCE_FULL_AUDIT';
    } else {
      isAllowed = false;
      reason = `Ngữ cảnh ${ctx} không có quyền đọc hồ sơ tài trợ.`;
      ruleName = 'RBAC_ROLE_NOT_AUTHORIZED';
    }
  } else if (action === 'GRANT.PROPOSAL.SUBMIT') {
    if (ctx === 'RESEARCHER') {
      isAllowed = true;
      ruleName = 'RBAC_RESEARCHER_SUBMIT_ALLOWED';
    } else {
      isAllowed = false;
      reason = `Chỉ ngữ cảnh RESEARCHER mới được nộp hồ sơ đề tài. Ngữ cảnh hiện tại: ${ctx}.`;
      ruleName = 'RBAC_ROLE_CONTEXT_MISMATCH';
    }
  } else if (action === 'REVIEW.SCORE.WRITE') {
    if (ctx === 'REVIEWER') {
      isAllowed = true;
      ruleName = 'RBAC_REVIEWER_SCORING_PERMITTED';
    } else {
      isAllowed = false;
      reason = `Chỉ Chuyên gia Phản biện (REVIEWER) mới có quyền nhập phiếu điểm.`;
      ruleName = 'RBAC_REVIEW_RESTRICTED';
    }
  } else if (action === 'IAM.USER.MANAGE') {
    if (ctx === 'GOVERNANCE_ADMIN') {
      isAllowed = true;
      ruleName = 'RBAC_ADMIN_SUPERUSER';
    } else {
      isAllowed = false;
      reason = `Quyền Quản trị Hệ thống bị từ chối với vai trò ${ctx}. Cần GOVERNANCE_ADMIN.`;
      ruleName = 'RBAC_ADMIN_BARRIER';
    }
  } else {
    isAllowed = true;
    ruleName = 'RBAC_DEFAULT_PERMISSION_ALLOW';
  }

  // Render Simulation Result
  if (isAllowed) {
    outBox.className = 'sim-output allow';
    badge.className = 'sim-badge allow';
    badge.innerText = '✅ ALLOWED (200 OK)';
    body.innerHTML = `
      <div class="sim-item"><strong>Actor ID:</strong> <code>${user}</code> (Token hợp lệ)</div>
      <div class="sim-item"><strong>Active Context:</strong> <span class="badge-tag green">${ctx}</span></div>
      <div class="sim-item"><strong>Action:</strong> <code>${action}</code></div>
      <div class="sim-item"><strong>Target Resource:</strong> <code>${resId}</code> (Khớp phạm vi Scope)</div>
      <div class="sim-item" style="color:#15803d; font-weight:700;">✅ Quyết định: Cho phép truy cập tài nguyên thành công.</div>
      <div class="sim-item"><strong>Matched Policy Rule:</strong> <code>${ruleName}</code></div>
      <div class="sim-item audit"><strong>Security Audit Trace ID:</strong> <code>trace-sim-${Math.floor(Math.random()*90000+10000)}</code> (ALLOW Event ghi nhận)</div>
    `;
    showNotification(`✅ Mô phỏng Policy: ALLOWED (200 OK) · Độ trễ: ${ms}ms`);
  } else {
    outBox.className = 'sim-output';
    badge.className = 'sim-badge denied';
    badge.innerText = '🚫 DENIED (403 FORBIDDEN)';
    body.innerHTML = `
      <div class="sim-item"><strong>Actor ID:</strong> <code>${user}</code> (Token hợp lệ)</div>
      <div class="sim-item"><strong>Active Context:</strong> <span class="badge-tag orange">${ctx}</span></div>
      <div class="sim-item"><strong>Action:</strong> <code>${action}</code></div>
      <div class="sim-item"><strong>Target Resource:</strong> <code>${resId}</code></div>
      <div class="sim-item error"><strong>Lý do từ chối:</strong> <code>OUT_OF_SCOPE_MISMATCH</code> (${reason})</div>
      <div class="sim-item"><strong>Matched Policy Rule:</strong> <code>${ruleName}</code></div>
      <div class="sim-item audit"><strong>Security Audit Trace ID:</strong> <code>trace-sim-${Math.floor(Math.random()*90000+10000)}</code> (DENIED Event ghi nhận)</div>
    `;
    showNotification(`🚫 Mô phỏng Policy: DENIED (403 FORBIDDEN) · ${reason}`);
  }
}

// --- Admin Table Filter ---
function filterUserTable() {
  const query = document.getElementById('userSearchInput').value.toLowerCase();
  const role = document.getElementById('roleFilterSelect').value;
  const table = document.getElementById('usersTable');
  const trs = table.getElementsByTagName('tr');

  for (let i = 1; i < trs.length; i++) {
    const rowText = trs[i].innerText.toLowerCase();
    const matchesQuery = rowText.includes(query);
    const matchesRole = (role === 'ALL' || rowText.includes(role.toLowerCase()));

    trs[i].style.display = (matchesQuery && matchesRole ? '' : 'none');
  }
}

// --- Permission Drawer ---
function openPermissionDrawer(userName, userId, roles) {
  const drawer = document.getElementById('drawerPermission');
  document.getElementById('drawerUserSubtitle').innerText = `Người dùng: ${userName} (${userId}) · Vai trò hiện tại: ${roles}`;
  drawer.classList.add('show');
}

function closePermissionDrawer() {
  const drawer = document.getElementById('drawerPermission');
  drawer.classList.remove('show');
}

function savePermissionChanges() {
  closePermissionDrawer();
  showNotification('💾 Đã lưu cấu hình phân quyền mới! Đã gửi tín hiệu Invalidate Redis Cache (< 1.5ms).');
}

function openAddUserModal() {
  showNotification('Mở form tạo tài khoản mới & gán Affiliation tổ chức.');
}

function flushRedisCache() {
  showNotification('⚡ Đã xóa toàn bộ AuthZ Cache trên Redis Cluster! Dữ liệu sẽ được tải lại từ Postgres khi có request tiếp theo.');
}

// --- Audit Log Inspector ---
const sampleAuditEvents = {
  'trace-8f92c9': {
    eventId: "evt-20260820-99812",
    eventType: "AUTHORIZATION_DENIED",
    timestamp: "2026-08-20T23:23:02.148Z",
    httpStatus: 403,
    actor: {
      actorId: "u_nguyenva",
      email: "nguyen.vana@vast.vn",
      activeContext: "ctx_reviewer_02",
      roles: ["RESEARCHER", "REVIEWER"]
    },
    authorization: {
      action: "GRANT.PROPOSAL.READ",
      resourceType: "proposal",
      resourceId: "P099",
      assignedScope: ["R100", "R104"],
      decision: "DENIED",
      decisionReason: "OUT_OF_SCOPE_ASSIGNMENT_MISMATCH",
      policyRule: "ABAC_REVIEWER_STRICT_ISOLATION"
    },
    telemetry: {
      requestId: "req-4fa9-88120b",
      traceId: "trace-8f92c9",
      spanId: "span-authz-check-01",
      clientIp: "113.190.42.18",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0"
    }
  },
  'trace-8f9301': {
    eventId: "evt-20260820-99834",
    eventType: "ROLE_CHANGE",
    timestamp: "2026-08-20T23:24:40.512Z",
    httpStatus: 200,
    actor: {
      actorId: "admin_quy",
      email: "sec-admin@vn-ru.org",
      roles: ["GOVERNANCE_ADMIN"]
    },
    actionDetails: {
      targetUserId: "u_petrov",
      operation: "IAM.ROLE.ASSIGN",
      newRole: "REVIEWER",
      scope: "REVIEW.ASSIGNMENT.*",
      cacheInvalidation: {
        redisKey: "authz:u_petrov:*",
        status: "PURGED_SUCCESSFULLY",
        durationMs: 1.12
      }
    },
    telemetry: {
      requestId: "req-7bc1-99201a",
      traceId: "trace-8f9301"
    }
  },
  'trace-8f92a4': {
    eventId: "evt-20260820-99790",
    eventType: "CONTEXT_SWITCH",
    timestamp: "2026-08-20T23:22:18.030Z",
    httpStatus: 200,
    actor: {
      actorId: "u_nguyenva",
      fromContext: "RESEARCHER",
      toContext: "REVIEWER",
      scopedAssignmentIds: ["R100", "R104"]
    },
    telemetry: {
      traceId: "trace-8f92a4"
    }
  },
  'trace-8f92a1': {
    eventId: "evt-20260820-99785",
    eventType: "LOGIN_SUCCESS",
    timestamp: "2026-08-20T23:22:15.820Z",
    actorId: "u_nguyenva",
    authMechanism: "PASSWORD_PLUS_TOTP",
    clientIp: "113.190.42.18",
    telemetry: {
      traceId: "trace-8f92a1"
    }
  }
};

function inspectAuditEvent(traceId) {
  const modal = document.getElementById('modalAuditJson');
  const content = document.getElementById('modalJsonContent');
  const traceElem = document.getElementById('modalTraceId');

  traceElem.innerText = traceId;
  const eventObj = sampleAuditEvents[traceId] || { traceId: traceId, info: "Audit Record Loaded" };
  content.innerText = JSON.stringify(eventObj, null, 2);

  modal.classList.add('show');
}

function closeAuditModal() {
  document.getElementById('modalAuditJson').classList.remove('show');
}

function copyAuditJson() {
  const text = document.getElementById('modalJsonContent').innerText;
  navigator.clipboard.writeText(text).then(() => {
    showNotification('📋 Đã sao chép JSON sự kiện kiểm toán vào Clipboard!');
  });
}

function exportAuditReport(format) {
  showNotification(`📥 Đang xuất báo cáo kiểm toán bảo mật dưới định dạng ${format.toUpperCase()}...`);
}

function filterAuditTable() {
  const eventType = document.getElementById('auditEventSelect').value;
  const query = document.getElementById('auditSearchInput').value.toLowerCase();
  const table = document.getElementById('auditTable');
  const trs = table.getElementsByTagName('tr');

  for (let i = 1; i < trs.length; i++) {
    const rowText = trs[i].innerText.toLowerCase();
    const matchesQuery = rowText.includes(query);
    const matchesEvent = (eventType === 'ALL' || rowText.includes(eventType.toLowerCase()));

    trs[i].style.display = (matchesQuery && matchesEvent ? '' : 'none');
  }
}

// --- Toast Notification Helper ---
function showNotification(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>🔔</span> <span>${msg}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
