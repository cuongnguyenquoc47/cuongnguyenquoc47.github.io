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
}

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const targetPage = this.dataset.navLink;
    location.hash = targetPage;
    changePage(targetPage);
  });
}

// Handle initial load
window.addEventListener("load", function () {
  const hash = location.hash.replace("#", "");
  changePage(hash || "about");
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
