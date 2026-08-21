// State Management
const STATE = {
  activeTab: 'tab-simulator',
  selectedPersona: 'researcher',
  activeRole: 'RESEARCHER',
  activeTenant: 'VAST',
  selectedEndpoint: 'proposal_review_assigned',
  tokenCondition: 'valid',
  diagramPage: 1,
  auditLogs: [
    {
      id: 'AUD-9012',
      timestamp: new Date().toLocaleTimeString(),
      event: 'AUTHZ_ALLOW',
      actor: 'GS. Petrov I.V. (USR-1002)',
      role: 'REVIEWER',
      tenant: 'VAST',
      resource: 'POST /api/v1/proposals/PR-2026-001/review',
      decision: 'ALLOW',
      scope: 'ASSIGNED_ONLY (Match: PR-2026-001)',
      ip: '118.70.18.92'
    },
    {
      id: 'AUD-9011',
      timestamp: new Date(Date.now() - 15000).toLocaleTimeString(),
      event: 'AUTHZ_DENIED',
      actor: 'TS. Nguyễn Văn A (USR-1001)',
      role: 'RESEARCHER',
      tenant: 'VAST',
      resource: 'POST /api/v1/admin/audit-logs',
      decision: 'DENY',
      scope: 'GLOBAL (Missing IAM.AUDIT.READ)',
      ip: '113.190.23.45'
    }
  ]
};

// Persona Definition
const PERSONAS = {
  researcher: {
    id: 'USR-1001',
    name: 'TS. Nguyễn Văn A',
    title: 'Nhà khoa học · Viện Hàn lâm VAST',
    defaultRole: 'RESEARCHER',
    tenant: 'VAST',
    allowedRoles: ['RESEARCHER', 'REVIEWER'],
    assignedProposals: []
  },
  reviewer: {
    id: 'USR-1002',
    name: 'GS. Petrov I. V.',
    title: 'Chuyên gia Phản biện · Hội đồng Quỹ TT&HN',
    defaultRole: 'REVIEWER',
    tenant: 'VAST',
    allowedRoles: ['REVIEWER', 'RESEARCHER'],
    assignedProposals: ['PR-2026-001', 'PR-2026-004']
  },
  org_admin: {
    id: 'USR-1003',
    name: 'Bà Lê Thị Mai',
    title: 'Đại diện Tổ chức · Đại học Quốc gia',
    defaultRole: 'ORG_ADMIN',
    tenant: 'VNU',
    allowedRoles: ['ORG_ADMIN'],
    assignedProposals: []
  },
  enterprise: {
    id: 'USR-1004',
    name: 'Ông Dmitry Sokolov',
    title: 'Đại diện Doanh nghiệp · RUTECH Corp',
    defaultRole: 'ENTERPRISE_USER',
    tenant: 'RUTECH',
    allowedRoles: ['ENTERPRISE_USER'],
    assignedProposals: []
  },
  leadership: {
    id: 'USR-1005',
    name: 'Ban Lãnh đạo Quỹ TT&HN',
    title: 'Hội đồng Điều hành Song phương',
    defaultRole: 'LEADERSHIP',
    tenant: 'FUND',
    allowedRoles: ['LEADERSHIP'],
    assignedProposals: []
  },
  iam_admin: {
    id: 'USR-1006',
    name: 'Quản trị viên IAM (Admin)',
    title: 'Đội ngũ Kỹ thuật & An ninh Quỹ',
    defaultRole: 'IAM_ADMIN',
    tenant: 'FUND',
    allowedRoles: ['IAM_ADMIN', 'SUPER_ADMIN'],
    assignedProposals: []
  },
  visitor: {
    id: 'ANON-0000',
    name: 'Khách vãng lai (Anonymous)',
    title: 'Chưa đăng nhập / Unauthenticated',
    defaultRole: 'ANONYMOUS',
    tenant: 'NONE',
    allowedRoles: ['ANONYMOUS'],
    assignedProposals: []
  }
};

// Endpoints Definition
const ENDPOINTS = {
  proposal_review_assigned: {
    method: 'POST',
    path: '/api/v1/proposals/PR-2026-001/review',
    requiredPerm: 'GRANT.PROPOSAL.REVIEW',
    targetResource: 'PR-2026-001',
    scopeType: 'ASSIGNED_ONLY',
    description: 'Chấm điểm và nộp báo cáo thẩm định đề xuất PR-2026-001 (Đã phân công cho GS. Petrov)'
  },
  proposal_review_unassigned: {
    method: 'POST',
    path: '/api/v1/proposals/PR-2026-999/review',
    requiredPerm: 'GRANT.PROPOSAL.REVIEW',
    targetResource: 'PR-2026-999',
    scopeType: 'ASSIGNED_ONLY',
    description: 'Thử chấm điểm đề xuất PR-2026-999 (KHÔNG thuộc danh sách phân công -> Test 403)'
  },
  proposal_submit: {
    method: 'POST',
    path: '/api/v1/proposals/draft',
    requiredPerm: 'GRANT.PROPOSAL.CREATE',
    targetResource: 'NEW_PROPOSAL',
    scopeType: 'OWNER_ONLY',
    description: 'Khởi tạo và nộp hồ sơ đề tài nghiên cứu song phương mới'
  },
  org_member_verify: {
    method: 'PUT',
    path: '/api/v1/org/members/USR-102/verify',
    requiredPerm: 'ORG.MEMBER.MANAGE',
    targetResource: 'TENANT_MEMBER',
    scopeType: 'TENANT_BOUND',
    description: 'Xác nhận tư cách thành viên nghiên cứu trực thuộc Viện/Trường'
  },
  tech_2plus2: {
    method: 'POST',
    path: '/api/v1/tech-transfer/2plus2/propose',
    requiredPerm: 'TECH.2PLUS2.SUBMIT',
    targetResource: 'COMMERCIAL_PROJECT',
    scopeType: 'TENANT_BOUND',
    description: 'Nộp hồ sơ đề xuất dự án chuyển giao công nghệ mô hình 2+2'
  },
  admin_audit_logs: {
    method: 'GET',
    path: '/api/v1/admin/audit-logs',
    requiredPerm: 'AUDIT.LOG.VIEW',
    targetResource: 'SYSTEM_AUDIT_LOGS',
    scopeType: 'GLOBAL',
    description: 'Truy vấn toàn bộ nhật ký kiểm toán bảo mật và dấu vết định danh'
  },
  public_news: {
    method: 'GET',
    path: '/api/v1/public/news',
    requiredPerm: 'PUBLIC.PORTAL.HOME_VIEW',
    targetResource: 'PUBLIC_CONTENT',
    scopeType: 'PUBLIC',
    description: 'Xem tin tức và thông báo công khai (Bypass PEP Check)'
  },
  admin_user_lock: {
    method: 'POST',
    path: '/api/v1/admin/users/USR-99/lock',
    requiredPerm: 'IAM.USER.MANAGE',
    targetResource: 'USER_ACCOUNT',
    scopeType: 'GLOBAL',
    description: 'Khóa tài khoản người dùng khẩn cấp (Chỉ dành cho IAM Admin)'
  }
};

// Role-Permission Matrix
const ROLE_PERMISSIONS = {
  ANONYMOUS: ['PUBLIC.PORTAL.HOME_VIEW', 'KNOWLEDGE.DOC.SEARCH_PUBLIC', 'EXPERT.DIRECTORY.SEARCH'],
  RESEARCHER: [
    'PUBLIC.PORTAL.HOME_VIEW', 'KNOWLEDGE.DOC.SEARCH_PUBLIC', 'EXPERT.DIRECTORY.SEARCH',
    'RESEARCHER.PROFILE.MANAGE', 'GRANT.PROPOSAL.CREATE', 'GRANT.PROPOSAL.READ_OWN',
    'PROJECT.MILESTONE.UPDATE_OWN', 'KNOWLEDGE.DOC.PUBLISH_DRAFT', 'TECH.2PLUS2.SUBMIT'
  ],
  REVIEWER: [
    'PUBLIC.PORTAL.HOME_VIEW', 'KNOWLEDGE.DOC.SEARCH_PUBLIC', 'EXPERT.DIRECTORY.SEARCH',
    'GRANT.ASSIGNMENT.VIEW_ASSIGNED', 'GRANT.PROPOSAL.READ_ASSIGNED', 'GRANT.PROPOSAL.REVIEW',
    'GRANT.SCORE.INPUT_EVALUATION', 'GRANT.REVIEW.SUBMIT_REPORT'
  ],
  ORG_ADMIN: [
    'PUBLIC.PORTAL.HOME_VIEW', 'KNOWLEDGE.DOC.SEARCH_PUBLIC', 'EXPERT.DIRECTORY.SEARCH',
    'ORG.PROFILE.UPDATE_INFO', 'ORG.MEMBER.MANAGE', 'GRANT.PROPOSAL.ENDORSE_ORG',
    'GRANT.PROJECT.TRACK_ORG_DASHBOARD', 'TECH.2PLUS2.SUBMIT'
  ],
  ENTERPRISE_USER: [
    'PUBLIC.PORTAL.HOME_VIEW', 'KNOWLEDGE.DOC.SEARCH_PUBLIC', 'EXPERT.DIRECTORY.SEARCH',
    'TECH.DEMAND.SUBMIT_RND_NEED', 'TECH.TRANSFER.PROPOSE_2PLUS2', 'TECH.CATALOG.SEARCH_PATENT',
    'TECH.COMMERCIAL.TRACK_PROJECT', 'TECH.2PLUS2.SUBMIT'
  ],
  LEADERSHIP: [
    'PUBLIC.PORTAL.HOME_VIEW', 'KNOWLEDGE.DOC.SEARCH_PUBLIC', 'EXPERT.DIRECTORY.SEARCH',
    'REPORT.KPI.VIEW_EXECUTIVE_DASHBOARD', 'REPORT.BILATERAL.VIEW_SUMMARY_STATS',
    'GRANT.DECISION.VIEW_FUND_SUMMARY', 'TECH.TRANSFER.VIEW_MACRO_METRICS'
  ],
  IAM_ADMIN: [
    'PUBLIC.PORTAL.HOME_VIEW', 'IAM.USER.MANAGE', 'IAM.ROLE.ASSIGN',
    'IAM.SESSION.FORCE_LOGOUT', 'IAM.MFA.RESET_CREDENTIAL', 'AUDIT.LOG.VIEW'
  ],
  SUPER_ADMIN: [
    'PUBLIC.PORTAL.HOME_VIEW', 'IAM.USER.MANAGE', 'IAM.ROLE.ASSIGN',
    'GRANT.BOARD.MANAGE', 'AUDIT.LOG.VIEW', 'SYSTEM.CONFIG.GLOBAL_PARAM_UPDATE'
  ]
};

// DOM Initializer
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initPersonaSelector();
  initSimulator();
  renderAuditLogs();
  initDiagramViewer();
});

function initTabs() {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      document.getElementById(target).classList.add('active');
      STATE.activeTab = target;
    });
  });
}

function initPersonaSelector() {
  const select = document.getElementById('persona-select');
  const roleSelect = document.getElementById('active-role-select');

  select.addEventListener('change', (e) => {
    STATE.selectedPersona = e.target.value;
    const persona = PERSONAS[STATE.selectedPersona];
    STATE.activeRole = persona.defaultRole;
    STATE.activeTenant = persona.tenant;

    // update role switcher options
    roleSelect.innerHTML = '';
    persona.allowedRoles.forEach(role => {
      const opt = document.createElement('option');
      opt.value = role;
      opt.textContent = `${role} (${role === 'RESEARCHER' ? 'Nhà khoa học' : role === 'REVIEWER' ? 'Chuyên gia phản biện' : role})`;
      if (role === STATE.activeRole) opt.selected = true;
      roleSelect.appendChild(opt);
    });

    document.getElementById('persona-info-display').innerHTML = `
      <strong>${persona.name}</strong> (${persona.id})<br>
      <span style="color: var(--slate-500); font-size: 0.8rem;">${persona.title} · Tenant: <strong>${persona.tenant}</strong></span>
    `;
  });

  roleSelect.addEventListener('change', (e) => {
    STATE.activeRole = e.target.value;
    showToast(`Đã chuyển đổi Ngữ cảnh hoạt động (Active Context) sang: ${STATE.activeRole}`);
  });
}

function initSimulator() {
  const btn = document.getElementById('btn-execute-eval');
  btn.addEventListener('click', runSimulation);
}

function runSimulation() {
  const personaKey = document.getElementById('persona-select').value;
  const persona = PERSONAS[personaKey];
  const activeRole = document.getElementById('active-role-select').value;
  const endpointKey = document.getElementById('endpoint-select').value;
  const endpoint = ENDPOINTS[endpointKey];
  const tokenState = document.getElementById('token-state-select').value;

  const resultsContainer = document.getElementById('eval-results-container');
  resultsContainer.innerHTML = `<div style="text-align: center; padding: 2rem;"><div class="status-dot" style="display:inline-block; margin-bottom: 0.5rem;"></div><br><strong>Đang thẩm định yêu cầu qua PEP & PDP...</strong></div>`;

  setTimeout(() => {
    let authnPassed = false;
    let authnError = '';
    let authzPassed = false;
    let authzError = '';
    let scopePassed = false;
    let scopeDetails = '';
    let httpStatus = 200;
    let decision = 'ALLOW';

    // 1. Check Public Bypass
    if (endpoint.scopeType === 'PUBLIC') {
      authnPassed = true;
      authzPassed = true;
      scopePassed = true;
      decision = 'ALLOW_PUBLIC';
      httpStatus = 200;
    } else {
      // 2. AuthN Check
      if (tokenState === 'valid') {
        if (activeRole === 'ANONYMOUS') {
          authnPassed = false;
          authnError = 'Không tìm thấy Authorization Bearer Token (Unauthenticated)';
          httpStatus = 401;
          decision = 'UNAUTHORIZED';
        } else {
          authnPassed = true;
        }
      } else if (tokenState === 'expired') {
        authnPassed = false;
        authnError = 'Token đã hết hạn (Claim exp exceeded)';
        httpStatus = 401;
        decision = 'UNAUTHORIZED';
      } else if (tokenState === 'blacklisted') {
        authnPassed = false;
        authnError = 'Token đã bị thu hồi / nằm trong Blacklist Redis (Session Revoked)';
        httpStatus = 401;
        decision = 'UNAUTHORIZED';
      } else if (tokenState === 'no_2fa') {
        authnPassed = false;
        authnError = 'Thiếu xác thực 2FA/MFA theo chính sách phiên an toàn';
        httpStatus = 401;
        decision = 'UNAUTHORIZED';
      }

      // 3. AuthZ Check (If AuthN passed)
      if (authnPassed) {
        const userPerms = ROLE_PERMISSIONS[activeRole] || [];
        if (userPerms.includes(endpoint.requiredPerm)) {
          authzPassed = true;

          // 4. Scope Check (ABAC)
          if (endpoint.scopeType === 'ASSIGNED_ONLY') {
            if (persona.assignedProposals.includes(endpoint.targetResource)) {
              scopePassed = true;
              scopeDetails = `Hợp lệ: Hồ sơ ${endpoint.targetResource} thuộc danh sách phân công của Reviewer.`;
            } else {
              scopePassed = false;
              scopeDetails = `Vi phạm Scope: Hồ sơ ${endpoint.targetResource} KHÔNG được Hội đồng phân công cho chuyên gia này.`;
              httpStatus = 403;
              decision = 'FORBIDDEN';
              authzError = `Bị từ chối bởi Bộ lọc Phạm vi dữ liệu (ABAC Scope Filter: ${scopeDetails})`;
            }
          } else if (endpoint.scopeType === 'TENANT_BOUND') {
            scopePassed = true;
            scopeDetails = `Hợp lệ: Thao tác đóng gói trong phạm vi Tenant ${persona.tenant}.`;
          } else if (endpoint.scopeType === 'GLOBAL') {
            if (activeRole === 'IAM_ADMIN' || activeRole === 'SUPER_ADMIN') {
              scopePassed = true;
              scopeDetails = 'Hợp lệ: Đặc quyền Quản trị Toàn cục (Global Governance Scope).';
            } else {
              scopePassed = false;
              scopeDetails = 'Vi phạm: Quyền Global chỉ dành riêng cho Quản trị viên Quỹ.';
              httpStatus = 403;
              decision = 'FORBIDDEN';
              authzError = 'Thiếu thẩm quyền truy cập tài nguyên Quản trị cấp Hệ thống.';
            }
          } else {
            scopePassed = true;
            scopeDetails = 'Hợp lệ: Phạm vi tài nguyên thỏa mãn.';
          }
        } else {
          authzPassed = false;
          scopePassed = false;
          httpStatus = 403;
          decision = 'FORBIDDEN';
          authzError = `Vai trò [${activeRole}] KHÔNG chứa quyền yêu cầu [${endpoint.requiredPerm}].`;
        }
      }
    }

    // Record to Audit Logs
    const auditId = 'AUD-' + Math.floor(1000 + Math.random() * 9000);
    const newLog = {
      id: auditId,
      timestamp: new Date().toLocaleTimeString(),
      event: decision === 'ALLOW' || decision === 'ALLOW_PUBLIC' ? 'AUTHZ_ALLOW' : 'AUTHZ_DENIED',
      actor: `${persona.name} (${persona.id})`,
      role: activeRole,
      tenant: persona.tenant,
      resource: `${endpoint.method} ${endpoint.path}`,
      decision: decision === 'ALLOW' || decision === 'ALLOW_PUBLIC' ? 'ALLOW' : 'DENY',
      scope: scopeDetails || authzError || authnError,
      ip: '118.70.18.92'
    };
    STATE.auditLogs.unshift(newLog);
    renderAuditLogs();

    // Render Stepper Result
    renderStepperResult({
      persona,
      activeRole,
      endpoint,
      tokenState,
      authnPassed,
      authnError,
      authzPassed,
      authzError,
      scopePassed,
      scopeDetails,
      httpStatus,
      decision,
      auditId
    });
  }, 350);
}

function renderStepperResult(res) {
  const c = document.getElementById('eval-results-container');
  
  let verdictClass = 'allow';
  let verdictIcon = '✅';
  let verdictTitle = '200 OK — QUYỀN HỢP LỆ (REQUEST ALLOWED)';
  let verdictDesc = 'Yêu cầu vượt qua thành công toàn bộ rào chắn xác thực, phân giải ngữ cảnh và phân quyền phạm vi.';

  if (res.decision === 'UNAUTHORIZED') {
    verdictClass = 'unauthorized';
    verdictIcon = '⛔';
    verdictTitle = '401 UNAUTHORIZED — XÁC THỰC THẤT BẠI';
    verdictDesc = res.authnError;
  } else if (res.decision === 'FORBIDDEN') {
    verdictClass = 'deny';
    verdictIcon = '🚫';
    verdictTitle = '403 FORBIDDEN — TỪ CHỐI TRUY CẬP (ACCESS DENIED)';
    verdictDesc = res.authzError;
  }

  c.innerHTML = `
    <!-- Verdict Banner -->
    <div class="verdict-banner ${verdictClass}">
      <div class="verdict-info">
        <div class="verdict-icon">${verdictIcon}</div>
        <div>
          <div class="verdict-title">${verdictTitle}</div>
          <div class="verdict-desc">${verdictDesc}</div>
        </div>
      </div>
      <div style="text-align: right; font-family: var(--font-mono); font-size: 0.85rem;">
        <strong>Trace ID:</strong> trc-${Math.random().toString(36).substr(2, 8)}<br>
        <strong>Audit ID:</strong> ${res.auditId}
      </div>
    </div>

    <!-- 4 Tiers Execution Pipeline -->
    <div class="pipeline-container" style="margin-top: 1.5rem;">
      <!-- Tier 1 -->
      <div class="tier-step-card tier-1">
        <div class="tier-header">
          <div class="tier-title"><span>💻</span> TẦNG 1: TRẢI NGHIỆM CLIENT & PHÁT KHỞI REQUEST</div>
          <span class="tier-badge" style="background:#e0f2fe; color:#0369a1;">CLIENT PACKET</span>
        </div>
        <div class="code-box">
${res.endpoint.method} ${res.endpoint.path} HTTP/1.1
Host: portal.vn-ru.org
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
X-Active-Context: {"tenantId": "${res.persona.tenant}", "activeRole": "${res.activeRole}", "userId": "${res.persona.id}"}
X-Trace-ID: trc-9901-live
        </div>
      </div>

      <!-- Tier 2 -->
      <div class="tier-step-card tier-2">
        <div class="tier-header">
          <div class="tier-title"><span>🛡️</span> TẦNG 2: POLICY ENFORCEMENT POINT (PEP) — API GATEWAY</div>
          <span class="tier-badge" style="background:${res.authnPassed ? '#dcfce7; color:#15803d;' : '#fee2e2; color:#b91c1c;'}">${res.authnPassed ? 'PASSED (AuthN OK)' : 'FAILED (401)'}</span>
        </div>
        <div style="font-size: 0.85rem; line-height: 1.6; color: var(--slate-700);">
          • <strong>JWT Verification:</strong> RS256 Public Key Signature Verify (${res.authnPassed ? 'VALID ✅' : 'INVALID ❌'})<br>
          • <strong>Redis Blacklist Check:</strong> Tra cứu Token Revocation List (<0.8ms - Cache Hit)<br>
          • <strong>Context Resolution:</strong> Gán ThreadLocal Security Context: <code>{user: "${res.persona.id}", role: "${res.activeRole}", tenant: "${res.persona.tenant}"}</code><br>
          • <strong>Route Mapping:</strong> <code>${res.endpoint.method} ${res.endpoint.path}</code> ➔ Quyền yêu cầu: <code style="color:var(--primary); font-weight:bold;">${res.endpoint.requiredPerm}</code>
        </div>
      </div>

      <!-- Tier 3 -->
      <div class="tier-step-card tier-3">
        <div class="tier-header">
          <div class="tier-title"><span>⚙️</span> TẦNG 3: POLICY DECISION POINT (PDP) — LÕI THẨM ĐỊNH RBAC & ABAC</div>
          <span class="tier-badge" style="background:${res.authzPassed && res.scopePassed ? '#dcfce7; color:#15803d;' : '#fee2e2; color:#b91c1c;'}">${res.authzPassed && res.scopePassed ? 'ALLOW (200)' : 'DENY (403)'}</span>
        </div>
        <div style="font-size: 0.85rem; line-height: 1.6; color: var(--slate-700);">
          • <strong>Pha 1 (RBAC Role-Perm Check):</strong> Kiểm tra tập quyền vai trò <code>${res.activeRole}</code> có chứa <code>${res.endpoint.requiredPerm}</code>? ➔ <strong>${res.authzPassed ? 'TRUE (Khớp quyền) ✅' : 'FALSE (Thiếu quyền) ❌'}</strong><br>
          • <strong>Pha 2 (ABAC Scope & Ownership Filter):</strong> Kiểm tra quy tắc <code>${res.endpoint.scopeType}</code> ➔ <strong>${res.scopePassed ? 'PASS ✅' : 'FAIL ❌'}</strong> (${res.scopeDetails || res.authzError})<br>
          • <strong>L1 Cache Status:</strong> <code>rbac:perm:${res.persona.id}:${res.activeRole}:${res.persona.tenant}</code> (Tra cứu siêu tốc 0.9ms)
        </div>
      </div>

      <!-- Tier 4 -->
      <div class="tier-step-card tier-4">
        <div class="tier-header">
          <div class="tier-title"><span>🚀</span> TẦNG 4: THỰC THI NGHIỆP VỤ & GHI NHẬT KÝ KIỂM TOÁN</div>
          <span class="tier-badge" style="background:#f0fdf4; color:#16a34a;">DOWNSTREAM & AUDIT</span>
        </div>
        <div style="font-size: 0.85rem; line-height: 1.6; color: var(--slate-700);">
          • <strong>Injected Headers:</strong> <code>X-User-Id: ${res.persona.id}</code>, <code>X-Active-Role: ${res.activeRole}</code>, <code>X-Scopes: ${res.endpoint.scopeType}</code><br>
          • <strong>Target Microservice:</strong> Chuyển tiếp tới Domain Service thực thi nghiệp vụ an toàn.<br>
          • <strong>Async Security Event:</strong> Đã gửi sự kiện <code>AUDIT.${res.decision}</code> tới Kafka/Elasticsearch (ID: <code>${res.auditId}</code>).
        </div>
      </div>
    </div>
  `;
}

function renderAuditLogs() {
  const tbody = document.getElementById('audit-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  STATE.auditLogs.slice(0, 15).forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${log.id}</strong></td>
      <td style="color:var(--slate-500);">${log.timestamp}</td>
      <td><span class="perm-pill ${log.decision === 'ALLOW' ? 'pill-allow' : 'pill-deny'}">${log.event}</span></td>
      <td>${log.actor}</td>
      <td><span class="badge-tag" style="background:#e2e8f0; color:#334155;">${log.role}</span></td>
      <td><code>${log.resource}</code></td>
      <td><span style="font-size:0.8rem; color:${log.decision === 'ALLOW' ? '#15803d' : '#b91c1c'};">${log.scope}</span></td>
      <td><span style="color:var(--slate-400);">${log.ip}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function initDiagramViewer() {
  document.querySelectorAll('.diagram-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diagram-page-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const page = btn.dataset.page;
      STATE.diagramPage = page;
      const img = document.getElementById('active-diagram-img');
      const title = document.getElementById('diagram-caption-title');
      if (page === '1') {
        img.src = 'diagrams/module1_rbac_p1.png';
        title.textContent = 'Trang 1: Luồng Xử lý Phân quyền & Đánh giá Permission (PEP & PDP Flow)';
      } else if (page === '2') {
        img.src = 'diagrams/module1_rbac_p2.png';
        title.textContent = 'Trang 2: Mô hình Thực thể Dữ liệu RBAC & Phân cấp Ngữ cảnh (Data Model)';
      } else if (page === '3') {
        img.src = 'diagrams/module1_rbac_p3.png';
        title.textContent = 'Trang 3: Ma trận Phân quyền RBAC Chi tiết theo 3 Vùng Canonical Access Zones';
      }
    });
  });
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.background = '#0f172a';
  toast.style.color = '#ffffff';
  toast.style.padding = '0.75rem 1.25rem';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
  toast.style.fontSize = '0.9rem';
  toast.style.zIndex = '9999';
  toast.style.transition = 'all 0.3s ease';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
