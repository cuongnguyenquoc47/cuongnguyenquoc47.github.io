'use strict';

/**
 * element toggle function
 */
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

/**
 * theme (light / dark) toggle
 */
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.classList.add("light-mode");
  } else {
    document.documentElement.classList.remove("light-mode");
  }
  // Let the Three.js background react to the theme change.
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

// Load saved preference (default: dark).
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    const next = document.documentElement.classList.contains("light-mode")
      ? "dark"
      : "light";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
}

/**
 * sidebar variables
 */
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });

/**
 * contact form variables
 */
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {
    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  });
}

// contact form submission handling
form.addEventListener("submit", function (event) {
  event.preventDefault();
  
  const originalBtnContent = formBtn.innerHTML;
  formBtn.innerHTML = '<ion-icon name="sync-outline" class="rotating"></ion-icon><span>Sending...</span>';
  formBtn.setAttribute("disabled", "");

  const formData = new FormData(form);
  
  fetch(form.action, {
    method: "POST",
    body: formData,
    headers: {
      'Accept': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) {
      formBtn.innerHTML = '<ion-icon name="checkmark-done-outline"></ion-icon><span>Message Sent!</span>';
      formBtn.style.backgroundColor = "var(--orange-yellow-crayola)";
      formBtn.style.color = "var(--smoky-black)";
      form.reset();
      setTimeout(() => {
        formBtn.innerHTML = originalBtnContent;
        formBtn.style.backgroundColor = "";
        formBtn.style.color = "";
        formBtn.setAttribute("disabled", "");
      }, 5000);
    } else {
      throw new Error("Form submission failed");
    }
  })
  .catch(error => {
    console.error("Error:", error);
    formBtn.innerHTML = '<ion-icon name="alert-circle-outline"></ion-icon><span>Error! Try again.</span>';
    setTimeout(() => {
      formBtn.innerHTML = originalBtnContent;
      formBtn.removeAttribute("disabled");
    }, 5000);
  });
});

/**
 * page navigation functionality
 */
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// Function to handle page changes
const changePage = function (targetPage) {
  let isPageFound = false;
  
  for (let i = 0; i < pages.length; i++) {
    if (targetPage === pages[i].dataset.page) {
      pages[i].classList.add("active");
      navigationLinks[i].classList.add("active");
      window.scrollTo(0, 0);
      isPageFound = true;
    } else {
      pages[i].classList.remove("active");
      navigationLinks[i].classList.remove("active");
    }
  }

  // If page not found or empty hash, default to first page
  if (!isPageFound && pages.length > 0) {
    pages[0].classList.add("active");
    navigationLinks[0].classList.add("active");
  }

  // Blog should always open on its post list, never a stale detail view
  if (targetPage === "blog" && typeof resetBlogView === "function") {
    resetBlogView();
  }
}

// Horizontally scroll the navbar so the given link sits in the center,
// using a custom eased animation for a consistently smooth feel.
const easeInOutCubic = function (t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const centerNavLink = function (link) {
  const list = link.closest(".navbar-list");
  if (!list) return;

  const listRect = list.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const delta =
    linkRect.left + linkRect.width / 2 - (listRect.left + listRect.width / 2);

  const maxScroll = list.scrollWidth - list.clientWidth;
  const start = list.scrollLeft;
  const target = Math.max(0, Math.min(start + delta, maxScroll));
  const distance = target - start;
  if (Math.abs(distance) < 1) return;

  // Jump instantly when the user prefers reduced motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    list.scrollLeft = target;
    return;
  }

  // Cancel any in-flight animation so rapid clicks don't fight each other
  if (list._navScrollRAF) cancelAnimationFrame(list._navScrollRAF);

  const duration = 500;
  let startTime = null;

  const step = function (now) {
    if (startTime === null) startTime = now;
    const progress = Math.min((now - startTime) / duration, 1);
    list.scrollLeft = start + distance * easeInOutCubic(progress);
    if (progress < 1) {
      list._navScrollRAF = requestAnimationFrame(step);
    } else {
      list._navScrollRAF = null;
    }
  };

  list._navScrollRAF = requestAnimationFrame(step);
};

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const targetPage = this.dataset.navLink;
    location.hash = targetPage;
    changePage(targetPage);
    centerNavLink(this);
  });
}

// Handle initial load
window.addEventListener("load", function () {
  const hash = location.hash.replace("#", "");
  changePage(hash || "about");
  const activeLink = document.querySelector(".navbar-link.active");
  if (activeLink) centerNavLink(activeLink);
});

// Handle browser back/forward buttons
window.addEventListener("hashchange", function () {
  const hash = location.hash.replace("#", "");
  changePage(hash || "about");
});

// Initialize Lucide icons
if (window.lucide) {
  lucide.createIcons();
}

/**
 * project detail modal
 */
const projectModal = document.getElementById("projectModal");
const projectModalClose = document.getElementById("projectModalClose");
const modalImg = document.getElementById("modalImg");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalDesc = document.getElementById("modalDesc");
const modalTech = document.getElementById("modalTech");
const modalGithub = document.getElementById("modalGithub");
const modalLive = document.getElementById("modalLive");

// Open modal when clicking a project card
const projectItems = document.querySelectorAll(".project-item");

projectItems.forEach(function (item) {
  item.addEventListener("click", function (e) {
    // Don't open modal if clicking on the external links
    if (e.target.closest(".project-link-icon")) return;

    const title = item.querySelector(".project-title").textContent;
    const category = item.querySelector(".project-category").textContent;
    const imgSrc = item.querySelector(".project-img img").src;
    const imgAlt = item.querySelector(".project-img img").alt;
    const desc = item.dataset.projectDesc || "No description available.";
    const techStr = item.dataset.projectTech || "";
    const githubLink = item.dataset.projectGithub || "";
    const liveLink = item.dataset.projectLive || "";

    // Populate modal
    modalImg.src = imgSrc;
    modalImg.alt = imgAlt;
    modalTitle.textContent = title;
    modalCategory.textContent = category;
    modalDesc.textContent = desc;

    // Build tech tags
    modalTech.innerHTML = "";
    if (techStr) {
      techStr.split(",").forEach(function (tech) {
        const tag = document.createElement("span");
        tag.className = "project-modal-tech-tag";
        tag.textContent = tech.trim();
        modalTech.appendChild(tag);
      });
    }

    // Set links (hide a button when its link is not provided)
    if (githubLink) {
      modalGithub.href = githubLink;
      modalGithub.style.display = "";
    } else {
      modalGithub.style.display = "none";
    }
    if (liveLink) {
      modalLive.href = liveLink;
      modalLive.style.display = "";
    } else {
      modalLive.style.display = "none";
    }

    // Show modal
    projectModal.classList.add("active");
    document.body.style.overflow = "hidden";
  });
});

// Close modal
function closeProjectModal() {
  projectModal.classList.remove("active");
  document.body.style.overflow = "";
}

projectModalClose.addEventListener("click", closeProjectModal);

// Close on overlay click
projectModal.addEventListener("click", function (e) {
  if (e.target === projectModal) {
    closeProjectModal();
  }
});

// Close on Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && projectModal.classList.contains("active")) {
    closeProjectModal();
  }
});

/**
 * blog: paginated post list + detail view
 */
const blogPosts = [
  {
    id: "casdoor-auth",
    title: "Authentication & Authorization với Casdoor trong Enterprise",
    date: "2025-01-15",
    readTime: "8 phút đọc",
    tags: ["Security", "Casdoor", "SSO", "OAuth2"],
    excerpt:
      "Cách xây dựng lớp xác thực & phân quyền tập trung cho hệ thống doanh nghiệp bằng Casdoor: SSO, OAuth2/OIDC, RBAC và tích hợp với nhiều microservice.",
    content: `
      <p>Trong hệ thống enterprise nhiều ứng dụng, việc mỗi service tự quản lý user và mật khẩu là một cơn ác mộng về bảo mật và vận hành. <strong>Casdoor</strong> là một Identity Provider (IdP) mã nguồn mở, hỗ trợ OAuth2, OIDC, SAML và SSO — giúp tập trung hoá toàn bộ việc xác thực.</p>

      <h3>Vì sao chọn Casdoor?</h3>
      <ul>
        <li>Hỗ trợ sẵn <strong>OAuth2 / OIDC / SAML</strong>, tích hợp nhanh với mọi ngôn ngữ.</li>
        <li>Single Sign-On: đăng nhập một lần, dùng cho mọi ứng dụng nội bộ.</li>
        <li>Quản lý <strong>RBAC</strong> (role, permission, resource) ngay trên UI.</li>
        <li>Social login, MFA, LDAP/AD sẵn có.</li>
      </ul>

      <h3>Luồng hoạt động</h3>
      <ol>
        <li>User truy cập app → app redirect sang Casdoor để đăng nhập.</li>
        <li>Casdoor xác thực và trả về <code>authorization code</code>.</li>
        <li>App đổi code lấy <code>access_token</code> + <code>id_token</code> (JWT).</li>
        <li>Mỗi microservice verify JWT bằng public key của Casdoor — không cần gọi ngược lại IdP.</li>
      </ol>

      <blockquote>Nguyên tắc: xác thực (authentication) tập trung ở Casdoor, còn phân quyền chi tiết (authorization) nên đặt gần business logic của từng service.</blockquote>

      <h3>Kinh nghiệm triển khai</h3>
      <p>Đặt một API Gateway ở trước để verify token và forward <code>user context</code> xuống các service qua header. Cache public key (JWKS) để giảm độ trễ, và luôn thiết lập thời hạn token ngắn kèm refresh token để cân bằng giữa bảo mật và trải nghiệm.</p>
    `,
  },
  {
    id: "microservices",
    title: "Thiết kế hệ thống Microservices thực chiến",
    date: "2024-11-02",
    readTime: "10 phút đọc",
    tags: ["Microservices", "Architecture", "DDD"],
    excerpt:
      "Chia service theo bounded context, giao tiếp đồng bộ/bất đồng bộ, xử lý dữ liệu phân tán và những cạm bẫy thường gặp khi tách monolith.",
    content: `
      <p>Microservices không phải là "chia nhỏ càng nhiều càng tốt". Ranh giới service nên bám theo <strong>bounded context</strong> trong Domain-Driven Design, để mỗi service sở hữu dữ liệu và nghiệp vụ của riêng mình.</p>

      <h3>Giao tiếp giữa các service</h3>
      <ul>
        <li><strong>Đồng bộ (REST/gRPC):</strong> phù hợp cho truy vấn cần phản hồi ngay.</li>
        <li><strong>Bất đồng bộ (message queue):</strong> dùng cho sự kiện, giảm coupling và tăng khả năng chịu lỗi.</li>
      </ul>

      <h3>Dữ liệu phân tán</h3>
      <p>Mỗi service một database. Với giao dịch trải nhiều service, dùng mẫu <strong>Saga</strong> thay cho distributed transaction, và <strong>Outbox pattern</strong> để đảm bảo publish event không mất mát.</p>

      <blockquote>Đừng bắt đầu bằng microservices. Hãy bắt đầu bằng một monolith rõ ràng, rồi tách ra khi bounded context đã đủ ổn định.</blockquote>

      <h3>Cạm bẫy thường gặp</h3>
      <ul>
        <li>Chia service quá sớm khi domain chưa rõ.</li>
        <li>Chia sẻ chung một database — phá vỡ tính độc lập.</li>
        <li>Thiếu observability: không có distributed tracing thì debug gần như bất khả thi.</li>
      </ul>
    `,
  },
  {
    id: "ecommerce-platform",
    title: "Xây dựng nền tảng Ecommerce chịu tải cao",
    date: "2024-09-20",
    readTime: "9 phút đọc",
    tags: ["Ecommerce", "Scalability", "Redis"],
    excerpt:
      "Từ catalog, giỏ hàng, đặt hàng đến thanh toán — cách thiết kế nền tảng thương mại điện tử phục vụ hàng trăm nghìn người dùng.",
    content: `
      <p>Một nền tảng ecommerce điển hình gồm các miền: <strong>Catalog</strong>, <strong>Cart</strong>, <strong>Order</strong>, <strong>Payment</strong>, <strong>Inventory</strong> và <strong>Notification</strong>. Mỗi miền có đặc tính tải khác nhau nên cần chiến lược mở rộng riêng.</p>

      <h3>Những điểm nóng về hiệu năng</h3>
      <ul>
        <li><strong>Catalog:</strong> đọc nhiều — cache mạnh bằng Redis/CDN, đánh index tìm kiếm bằng Elasticsearch.</li>
        <li><strong>Inventory:</strong> cần chống overselling — dùng khoá lạc quan hoặc reserve tồn kho có thời hạn.</li>
        <li><strong>Order/Payment:</strong> ưu tiên đúng đắn dữ liệu — idempotency key để tránh trừ tiền hai lần.</li>
      </ul>

      <h3>Xử lý cao điểm (flash sale)</h3>
      <p>Tách luồng đặt hàng qua hàng đợi để hấp thụ đỉnh tải, kết hợp rate limiting và warm cache trước sự kiện. Trạng thái đơn hàng cập nhật bất đồng bộ và thông báo cho user qua event.</p>

      <blockquote>Tối ưu cho đường đi phổ biến nhất: xem sản phẩm và thêm giỏ hàng chiếm phần lớn traffic, hãy làm chúng nhanh trước.</blockquote>
    `,
  },
  {
    id: "k8s-architecture",
    title: "Kiến trúc triển khai Microservices trên Kubernetes",
    date: "2024-07-08",
    readTime: "11 phút đọc",
    tags: ["Kubernetes", "DevOps", "Cloud Native"],
    excerpt:
      "Tổ chức namespace, deployment, service, ingress; autoscaling, health check và chiến lược rollout an toàn cho hệ microservice trên K8s.",
    content: `
      <p><strong>Kubernetes</strong> là nền tảng điều phối container giúp chạy microservices một cách bền bỉ và tự phục hồi. Nhưng để dùng tốt, cần thiết kế đúng từ tổ chức tài nguyên đến chiến lược triển khai.</p>

      <h3>Các khối cơ bản</h3>
      <ul>
        <li><strong>Deployment:</strong> quản lý số replica và rolling update.</li>
        <li><strong>Service:</strong> load balancing nội bộ và service discovery.</li>
        <li><strong>Ingress:</strong> định tuyến traffic từ ngoài vào, kèm TLS.</li>
        <li><strong>ConfigMap / Secret:</strong> tách cấu hình khỏi image.</li>
      </ul>

      <h3>Vận hành khoẻ mạnh</h3>
      <ul>
        <li><code>liveness</code> & <code>readiness probe</code> để K8s biết pod nào sẵn sàng nhận traffic.</li>
        <li><strong>HPA</strong> (Horizontal Pod Autoscaler) scale theo CPU/metric tuỳ biến.</li>
        <li>Đặt <code>resources.requests/limits</code> hợp lý để scheduler xếp pod tối ưu.</li>
      </ul>

      <h3>Rollout an toàn</h3>
      <p>Ưu tiên rolling update với <code>maxSurge/maxUnavailable</code> phù hợp; với thay đổi rủi ro cao thì dùng canary hoặc blue-green. Kết hợp Prometheus + Grafana + tracing để quan sát trong lúc phát hành.</p>

      <blockquote>K8s tự phục hồi, nhưng chỉ khi bạn khai báo đúng health check và resource. "Declarative" là sức mạnh cốt lõi.</blockquote>
    `,
  },
  {
    id: "api-gateway",
    title: "API Gateway & Service Mesh: khi nào dùng cái nào?",
    date: "2024-05-14",
    readTime: "7 phút đọc",
    tags: ["API Gateway", "Service Mesh", "Networking"],
    excerpt:
      "Phân biệt vai trò của API Gateway (north-south) và Service Mesh (east-west), và cách chúng bổ sung cho nhau trong hệ microservice.",
    content: `
      <p>Hai khái niệm hay bị nhầm lẫn nhưng giải quyết bài toán khác nhau. <strong>API Gateway</strong> xử lý traffic <em>north-south</em> (từ client vào hệ thống), còn <strong>Service Mesh</strong> xử lý traffic <em>east-west</em> (giữa các service với nhau).</p>

      <h3>API Gateway lo gì?</h3>
      <ul>
        <li>Authentication, rate limiting, request routing.</li>
        <li>Aggregation nhiều API thành một response cho client.</li>
        <li>TLS termination và versioning.</li>
      </ul>

      <h3>Service Mesh lo gì?</h3>
      <ul>
        <li>mTLS giữa các service, retry, timeout, circuit breaking.</li>
        <li>Traffic shifting cho canary, observability tự động.</li>
      </ul>

      <blockquote>Không phải hệ nào cũng cần service mesh. Chỉ thêm khi số lượng service và nhu cầu bảo mật/observability đủ lớn để bù cho độ phức tạp.</blockquote>
    `,
  },
  {
    id: "event-driven",
    title: "Kiến trúc Event-Driven với Message Queue",
    date: "2024-03-03",
    readTime: "8 phút đọc",
    tags: ["Event-Driven", "Kafka", "Messaging"],
    excerpt:
      "Giảm coupling, tăng khả năng mở rộng bằng giao tiếp qua sự kiện — cùng các mẫu Outbox, CQRS và những lưu ý về thứ tự, idempotency.",
    content: `
      <p>Trong kiến trúc <strong>event-driven</strong>, các service không gọi trực tiếp lẫn nhau mà phát ra <em>sự kiện</em>. Bên quan tâm sẽ lắng nghe và phản ứng, giúp giảm phụ thuộc và dễ mở rộng.</p>

      <h3>Lợi ích</h3>
      <ul>
        <li>Loose coupling: thêm consumer mới không ảnh hưởng producer.</li>
        <li>Khả năng chịu tải cao nhờ đệm qua hàng đợi.</li>
        <li>Dễ dựng luồng xử lý bất đồng bộ, phản ứng theo thời gian thực.</li>
      </ul>

      <h3>Những điều phải xử lý</h3>
      <ul>
        <li><strong>Idempotency:</strong> consumer phải xử lý an toàn khi nhận trùng message.</li>
        <li><strong>Thứ tự:</strong> dùng partition key hợp lý khi thứ tự quan trọng.</li>
        <li><strong>Outbox pattern:</strong> đảm bảo ghi DB và publish event là nguyên tử.</li>
      </ul>

      <blockquote>Event-driven mạnh mẽ nhưng khó debug hơn. Đầu tư vào tracing và schema registry ngay từ đầu.</blockquote>
    `,
  },
];

const BLOG_PAGE_SIZE = 4;
let blogCurrentPage = 1;

const blogArticle = document.querySelector('[data-page="blog"]');
const blogListEl = document.querySelector("[data-blog-list]");
const blogPaginationEl = document.querySelector("[data-blog-pagination]");
const blogListView = document.querySelector("[data-blog-list-view]");
const blogDetailView = document.querySelector("[data-blog-detail-view]");
const blogDetailEl = document.querySelector("[data-blog-detail]");
const blogBackBtn = document.querySelector("[data-blog-back]");

// "2025-01-15" -> "15/01/2025" (no Date() to avoid timezone surprises)
function formatBlogDate(iso) {
  const parts = iso.split("-");
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

function blogTagsHtml(tags) {
  return tags
    .map(function (t) {
      return '<li class="blog-tag">' + t + "</li>";
    })
    .join("");
}

function renderBlogList(page) {
  if (!blogListEl) return;
  const totalPages = Math.max(1, Math.ceil(blogPosts.length / BLOG_PAGE_SIZE));
  blogCurrentPage = Math.min(Math.max(1, page), totalPages);
  const start = (blogCurrentPage - 1) * BLOG_PAGE_SIZE;
  const pageItems = blogPosts.slice(start, start + BLOG_PAGE_SIZE);

  blogListEl.innerHTML = pageItems
    .map(function (post) {
      return (
        '<li class="blog-item">' +
        '<button class="blog-card" type="button" data-blog-open="' +
        post.id +
        '">' +
        '<div class="blog-card-meta">' +
        '<ion-icon name="calendar-outline"></ion-icon><span>' +
        formatBlogDate(post.date) +
        "</span>" +
        '<span class="blog-card-sep"></span>' +
        '<ion-icon name="time-outline"></ion-icon><span>' +
        post.readTime +
        "</span>" +
        "</div>" +
        '<h3 class="blog-card-title">' +
        post.title +
        "</h3>" +
        '<p class="blog-card-excerpt">' +
        post.excerpt +
        "</p>" +
        '<ul class="blog-card-tags">' +
        blogTagsHtml(post.tags) +
        "</ul>" +
        '<span class="blog-card-more">Đọc tiếp<ion-icon name="arrow-forward-outline"></ion-icon></span>' +
        "</button>" +
        "</li>"
      );
    })
    .join("");

  renderBlogPagination(totalPages);
}

function renderBlogPagination(totalPages) {
  if (!blogPaginationEl) return;
  if (totalPages <= 1) {
    blogPaginationEl.innerHTML = "";
    return;
  }
  let html =
    '<button class="blog-page-btn blog-page-nav" type="button" data-blog-page="prev"' +
    (blogCurrentPage === 1 ? " disabled" : "") +
    ' aria-label="Trang trước"><ion-icon name="chevron-back-outline"></ion-icon></button>';
  for (let i = 1; i <= totalPages; i++) {
    html +=
      '<button class="blog-page-btn' +
      (i === blogCurrentPage ? " active" : "") +
      '" type="button" data-blog-page="' +
      i +
      '">' +
      i +
      "</button>";
  }
  html +=
    '<button class="blog-page-btn blog-page-nav" type="button" data-blog-page="next"' +
    (blogCurrentPage === totalPages ? " disabled" : "") +
    ' aria-label="Trang sau"><ion-icon name="chevron-forward-outline"></ion-icon></button>';
  blogPaginationEl.innerHTML = html;
}

function openBlogPost(id) {
  const post = blogPosts.find(function (p) {
    return p.id === id;
  });
  if (!post || !blogDetailEl) return;
  blogDetailEl.innerHTML =
    '<div class="blog-detail-meta">' +
    '<ion-icon name="calendar-outline"></ion-icon><span>' +
    formatBlogDate(post.date) +
    "</span>" +
    '<span class="blog-card-sep"></span>' +
    '<ion-icon name="time-outline"></ion-icon><span>' +
    post.readTime +
    "</span>" +
    "</div>" +
    '<h1 class="blog-detail-title">' +
    post.title +
    "</h1>" +
    '<ul class="blog-card-tags blog-detail-tags">' +
    blogTagsHtml(post.tags) +
    "</ul>" +
    '<div class="blog-detail-body">' +
    post.content +
    "</div>";
  blogListView.hidden = true;
  blogDetailView.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Hoisted so changePage can safely reset the blog when the tab opens
function resetBlogView() {
  if (!blogListView || !blogDetailView) return;
  blogDetailView.hidden = true;
  blogListView.hidden = false;
}

if (blogArticle) {
  renderBlogList(1);

  blogArticle.addEventListener("click", function (e) {
    const openBtn = e.target.closest("[data-blog-open]");
    if (openBtn) {
      openBlogPost(openBtn.dataset.blogOpen);
      return;
    }

    const pageBtn = e.target.closest("[data-blog-page]");
    if (pageBtn && !pageBtn.disabled) {
      const val = pageBtn.dataset.blogPage;
      if (val === "prev") renderBlogList(blogCurrentPage - 1);
      else if (val === "next") renderBlogList(blogCurrentPage + 1);
      else renderBlogList(parseInt(val, 10));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  });

  if (blogBackBtn) {
    blogBackBtn.addEventListener("click", resetBlogView);
  }
}
