/* =========================================================
   NABAT — The World of Plants
   Bilingual presentation navigation & interactions
   ========================================================= */
"use strict";

const slides = Array.from(document.querySelectorAll(".slide"));
const navLinks = Array.from(document.querySelectorAll("[data-slide-link]"));
const sidebar = document.getElementById("sidebar");
const sidebarNav = document.querySelector(".chapter-nav");
const sidebarClose = document.querySelector(".sidebar__close");
const navBackdrop = document.querySelector(".nav-backdrop");
const menuOpenButtons = Array.from(document.querySelectorAll("[data-nav-open]"));
const navCloseButtons = Array.from(document.querySelectorAll("[data-nav-close]"));
const langSwitchButtons = Array.from(document.querySelectorAll("[data-lang-toggle]"));
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const prevName = document.getElementById("prevName");
const nextName = document.getElementById("nextName");
const currentPage = document.getElementById("currentPage");
const pagerDots = document.getElementById("pagerDots");
const pager = document.querySelector(".pager");
const sidebarProgressCount = document.getElementById("sidebarProgressCount");
const sidebarProgressBar = document.getElementById("sidebarProgressBar");
const topProgressBar = document.getElementById("topProgressBar");
const slideAnnouncer = document.getElementById("slideAnnouncer");
const mainContent = document.getElementById("mainContent");
const partDetail = document.getElementById("partDetail");
const partsArt = document.getElementById("partsArt");
const partTabs = Array.from(document.querySelectorAll(".part-tab"));
const careItems = Array.from(document.querySelectorAll("[data-care-item]"));
const careRing = document.getElementById("careRing");
const careDone = document.getElementById("careDone");
const careComplete = document.getElementById("careComplete");
const careReset = document.getElementById("careReset");
const mobileMedia = window.matchMedia("(max-width: 1024px)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const meta = {
  ar: {
    title: "نبات | عالم النباتات — دليل تفاعلي",
    description: "عالم النباتات — دليل تعليمي تفاعلي عن أنواع النباتات وأجزائها واحتياجاتها والعناية بها. An interactive guide to the world of plants.",
    switchLanguage: "التبديل إلى اللغة الإنجليزية",
    openMenu: "فتح قائمة الفصول",
    closeMenu: "إغلاق قائمة الفصول",
    previousPage: "الصفحة السابقة",
    nextPage: "الصفحة التالية",
    chapters: "فصول العرض التقديمي",
    navigation: "التنقل بين صفحات العرض",
    pageJumps: "الانتقال إلى صفحة",
    partTabs: "أجزاء النبات",
    pageWord: "الصفحة",
    ofWord: "من",
    role: "الوظيفة",
    navVerb: "الانتقال إلى",
    openDetails: "عرض التفاصيل"
  },
  en: {
    title: "NABAT | The World of Plants — An Interactive Guide",
    description: "An interactive bilingual field guide to the world of plants: types, parts, needs, care, and why plants matter.",
    switchLanguage: "Switch to Arabic",
    openMenu: "Open chapter menu",
    closeMenu: "Close chapter menu",
    previousPage: "Previous page",
    nextPage: "Next page",
    chapters: "Presentation chapters",
    navigation: "Page navigation",
    pageJumps: "Jump to page",
    partTabs: "Plant parts",
    pageWord: "Page",
    ofWord: "of",
    role: "Role",
    navVerb: "Go to",
    openDetails: "Show details"
  }
};

const slideNames = {
  ar: ["البداية", "مقدمة عن النباتات", "أنواع النباتات", "أجزاء النبات", "احتياجات النباتات", "العناية بالنباتات", "أهمية النباتات", "الخاتمة"],
  en: ["Home", "Introduction to Plants", "Types of Plants", "Parts of a Plant", "Plant Needs", "Plant Care", "Importance of Plants", "Conclusion"]
};

const storedLanguage = (() => {
  try { return localStorage.getItem("nabat-language"); } catch (error) { return null; }
})();

let currentLang = storedLanguage === "en" ? "en" : "ar";
let currentIndex = 0;
let currentPart = "roots";
let statsAnimated = false;

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function getStoredCare() {
  try {
    const saved = JSON.parse(localStorage.getItem("nabat-care-checklist") || "[]");
    return Array.isArray(saved) && saved.length === careItems.length ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveCareState() {
  try {
    localStorage.setItem("nabat-care-checklist", JSON.stringify(careItems.map((item) => item.checked)));
  } catch (error) {
    /* Local storage may be unavailable in private mode. */
  }
}

function announceSlide() {
  if (!slideAnnouncer) return;
  const lang = currentLang;
  const title = slideNames[lang][currentIndex];
  slideAnnouncer.textContent = lang === "ar"
    ? `الصفحة ${currentIndex + 1} من ${slides.length}: ${title}`
    : `Page ${currentIndex + 1} of ${slides.length}: ${title}`;
}

function updateLanguageLabels() {
  const strings = meta[currentLang];
  document.title = strings.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", strings.description);

  langSwitchButtons.forEach((button) => {
    button.setAttribute("aria-label", strings.switchLanguage);
    button.setAttribute("title", strings.switchLanguage);
  });
  menuOpenButtons.forEach((button) => button.setAttribute("aria-label", strings.openMenu));
  if (sidebarClose) sidebarClose.setAttribute("aria-label", strings.closeMenu);
  if (sidebarNav) sidebarNav.setAttribute("aria-label", strings.chapters);
  if (pager) pager.setAttribute("aria-label", strings.navigation);
  if (pagerDots) pagerDots.setAttribute("aria-label", strings.pageJumps);
  const tabs = document.querySelector(".part-tabs");
  if (tabs) tabs.setAttribute("aria-label", strings.partTabs);

  document.querySelectorAll("[data-label-ar][data-label-en]").forEach((element) => {
    const label = currentLang === "ar" ? element.dataset.labelAr : element.dataset.labelEn;
    if (label) element.setAttribute("aria-label", label);
  });

  document.querySelectorAll("img[data-alt-ar][data-alt-en]").forEach((image) => {
    image.alt = currentLang === "ar" ? image.dataset.altAr : image.dataset.altEn;
  });
}

function applyLanguage(language, options = {}) {
  const { persist = true, announce = true } = options;
  currentLang = language === "en" ? "en" : "ar";
  const isArabic = currentLang === "ar";
  document.documentElement.lang = currentLang;
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.body.dataset.lang = currentLang;

  if (persist) {
    try { localStorage.setItem("nabat-language", currentLang); } catch (error) { /* no-op */ }
  }

  updateLanguageLabels();
  updatePager();
  renderPart(currentPart);
  updateCare();
  syncSidebarAccessibility();

  if (announce) {
    const message = isArabic ? "تم تغيير اللغة إلى العربية" : "Language changed to English";
    if (slideAnnouncer) slideAnnouncer.textContent = message;
    window.setTimeout(() => {
      updatePager();
      announceSlide();
    }, 900);
  }
}

function buildPagerDots() {
  if (!pagerDots) return;
  pagerDots.innerHTML = "";
  slides.forEach((slide, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.dotIndex = String(index);
    button.addEventListener("click", () => goToSlide(index));
    pagerDots.appendChild(button);
  });
}

function updatePager() {
  if (!prevBtn || !nextBtn) return;
  const strings = meta[currentLang];
  const names = slideNames[currentLang];
  const prevIndex = Math.max(0, currentIndex - 1);
  const nextIndex = Math.min(slides.length - 1, currentIndex + 1);

  currentPage.textContent = padNumber(currentIndex + 1);
  sidebarProgressCount.textContent = `${padNumber(currentIndex + 1)} / ${padNumber(slides.length)}`;
  const percentage = ((currentIndex + 1) / slides.length) * 100;
  sidebarProgressBar.style.width = `${percentage}%`;
  topProgressBar.style.width = `${percentage}%`;

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === slides.length - 1;
  prevBtn.setAttribute("aria-label", `${strings.previousPage}: ${names[prevIndex]}`);
  nextBtn.setAttribute("aria-label", `${strings.nextPage}: ${names[nextIndex]}`);
  prevName.textContent = names[prevIndex];
  nextName.textContent = names[nextIndex];

  navLinks.forEach((link) => {
    const active = link.dataset.slideLink === slides[currentIndex].id;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  if (pagerDots) {
    Array.from(pagerDots.children).forEach((dot, index) => {
      const active = index === currentIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-label", `${strings.pageWord} ${index + 1}: ${names[index]}`);
      if (active) dot.setAttribute("aria-current", "step");
      else dot.removeAttribute("aria-current");
    });
  }
}

function updateSlideVisibility() {
  slides.forEach((slide, index) => {
    const active = index === currentIndex;
    slide.hidden = !active;
    slide.classList.toggle("is-active", active);
  });
  document.body.dataset.slide = slides[currentIndex].id;
}

function goToSlide(index, options = {}) {
  const { push = true, scroll = true, announce = true, focus = false } = options;
  const target = Math.max(0, Math.min(slides.length - 1, Number(index) || 0));
  currentIndex = target;
  updateSlideVisibility();
  updatePager();
  syncSidebarAccessibility();

  if (push) {
    const hash = `#${slides[currentIndex].id}`;
    if (window.location.hash !== hash) {
      window.history.pushState({ slide: currentIndex }, "", hash);
    }
  }

  if (scroll) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  if (focus) {
    const heading = slides[currentIndex].querySelector("h1, h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }

  announceSlide();
  if (slides[currentIndex].id === "importance") animateStats();
  closeMobileNav(false);
  if (announce) {
    /* The live region carries the announcement. */
  }
}

function indexFromHash() {
  const id = window.location.hash.replace("#", "");
  const found = slides.findIndex((slide) => slide.id === id);
  return found >= 0 ? found : 0;
}

function goToTarget(targetId) {
  const target = slides.findIndex((slide) => slide.id === targetId);
  if (target >= 0) goToSlide(target);
}

function openMobileNav() {
  document.body.classList.add("nav-open");
  menuOpenButtons.forEach((button) => button.setAttribute("aria-expanded", "true"));
  syncSidebarAccessibility();
  window.requestAnimationFrame(() => {
    const activeNav = sidebarNav?.querySelector(".nav-item.is-active");
    if (activeNav && mobileMedia.matches) activeNav.focus({ preventScroll: true });
  });
}

function closeMobileNav(restoreFocus = false) {
  document.body.classList.remove("nav-open");
  menuOpenButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
  syncSidebarAccessibility();
  if (restoreFocus && mobileMedia.matches) {
    menuOpenButtons[0]?.focus({ preventScroll: true });
  }
}

function syncSidebarAccessibility() {
  if (!sidebar) return;
  if (mobileMedia.matches && !document.body.classList.contains("nav-open")) {
    sidebar.setAttribute("inert", "");
  } else {
    sidebar.removeAttribute("inert");
  }
}

function closeTypeCards(exception = null) {
  document.querySelectorAll(".type-card.is-flipped").forEach((card) => {
    if (card === exception) return;
    card.classList.remove("is-flipped");
    const trigger = card.querySelector(".type-card__trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });
}

function closeNeedCards(exception = null) {
  document.querySelectorAll(".need-card.is-open").forEach((card) => {
    if (card === exception) return;
    card.classList.remove("is-open");
    card.setAttribute("aria-expanded", "false");
  });
}

function updateCare() {
  if (!careRing || !careDone) return;
  const total = careItems.length;
  const done = careItems.filter((item) => item.checked).length;
  const percentage = total ? (done / total) * 100 : 0;
  careRing.style.setProperty("--progress", String(percentage));
  careDone.textContent = String(done);
  if (careComplete) careComplete.hidden = done !== total;
  saveCareState();
}

function animateStats() {
  const numbers = Array.from(document.querySelectorAll("#importance [data-count]"));
  if (!numbers.length) return;
  const finish = () => numbers.forEach((number) => { number.textContent = number.dataset.count; });
  if (statsAnimated) { finish(); return; }
  statsAnimated = true;
  if (reduceMotion.matches) { finish(); return; }

  let finished = false;
  const finishOnce = () => {
    if (finished) return;
    finished = true;
    finish();
  };
  /* Fallback for tabs whose animation frames are throttled. */
  window.setTimeout(finishOnce, 1500);

  numbers.forEach((number) => {
    const target = Number(number.dataset.count) || 0;
    const duration = 1100;
    const started = performance.now();
    number.textContent = "0";
    const tick = (now) => {
      if (finished) return;
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      number.textContent = String(Math.round(target * eased));
      if (progress < 1) window.requestAnimationFrame(tick);
      else finishOnce();
    };
    window.requestAnimationFrame(tick);
  });
}

function setPart(part, options = {}) {
  if (!partDetail || !partsArt) return;
  const { focusTab = false, animate = true } = options;
  const data = partData[part];
  if (!data) return;
  currentPart = part;
  const content = data[currentLang];
  const labels = meta[currentLang];

  partsArt.classList.add("has-active");
  document.querySelectorAll(".plant-part").forEach((group) => {
    group.classList.toggle("is-active", group.dataset.part === part);
  });
  document.querySelectorAll("[data-part-target]").forEach((button) => {
    const active = button.dataset.partTarget === part;
    button.classList.toggle("is-active", active);
    if (button.classList.contains("part-tab")) {
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    } else {
      button.setAttribute("aria-pressed", String(active));
    }
  });

  partDetail.setAttribute("aria-labelledby", `tab-${part}`);
  partDetail.innerHTML = `
    <span class="part-detail__ghost" aria-hidden="true">${data.number}</span>
    <div class="part-detail__top">${content.kicker}</div>
    <h3>${content.title}</h3>
    <p class="part-detail__copy">${content.copy}</p>
    <div class="part-detail__role">
      <svg class="icon" aria-hidden="true"><use href="#${data.icon}"></use></svg>
      <span><strong>${labels.role}:</strong> ${content.role}</span>
    </div>
    <div class="part-detail__facts">${content.facts.map((fact) => `<span>${fact}</span>`).join("")}</div>
  `;

  if (animate && !reduceMotion.matches) {
    partDetail.animate(
      [
        { opacity: 0.35, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 360, easing: "cubic-bezier(.2,.7,.2,1)" }
    );
  }

  if (focusTab) {
    const tab = document.getElementById(`tab-${part}`);
    tab?.focus({ preventScroll: true });
  }
}

/* ---------- Plant part content ---------- */
const partData = {
  roots: {
    number: "01",
    icon: "i-root",
    ar: {
      kicker: "الشبكة الخفية · ROOT SYSTEM",
      title: "الجذور",
      copy: "تثبّت الجذور النبات في التربة، وتمتص الماء والمعادن التي تحتاجها بقية أجزائه. بعض الجذور وتدية عميقة، وبعضها ليفية تنتشر قرب السطح لتزيد مساحة الامتصاص.",
      role: "تثبيت النبات، امتصاص الماء والمعادن، وتخزين الغذاء",
      facts: ["بعض الجذور أعمق من ارتفاع الشجرة.", "الجذور الليفية تزيد مساحة الامتصاص."]
    },
    en: {
      kicker: "THE HIDDEN NETWORK · ROOT SYSTEM",
      title: "Roots",
      copy: "Roots anchor the plant in soil and absorb the water and minerals the rest of the plant needs. Taproots reach deep; fibrous roots spread wide near the surface to increase absorption.",
      role: "Anchoring, absorbing water and minerals, and storing food",
      facts: ["Some roots reach deeper than the tree is tall.", "Fibrous roots increase the surface area for absorption."]
    }
  },
  stem: {
    number: "02",
    icon: "i-stem",
    ar: {
      kicker: "طريق الحياة · STEM",
      title: "الساق",
      copy: "تنقل الساق الماء والأملاح صعودًا عبر الخشب، والسكريات عبر اللحاء، وترفع الأوراق والأزهار نحو الضوء. بعض السيقان تخزن الماء أو الغذاء.",
      role: "دعم النبات ونقل الماء والغذاء بين الأجزاء",
      facts: ["العُقد هي مواضع خروج الأوراق والفروع.", "بعض السيقان تخزن الماء أو الغذاء."]
    },
    en: {
      kicker: "THE LIFELINE · STEM",
      title: "Stem",
      copy: "The stem carries water and minerals upward through xylem and sugars through phloem. It holds leaves and flowers toward the light, and some stems store water or food.",
      role: "Support and transport of water and food",
      facts: ["Nodes are where leaves and branches emerge.", "Some stems store water or food for later."]
    }
  },
  leaf: {
    number: "03",
    icon: "i-leaf",
    ar: {
      kicker: "مصنع الغذاء · LEAF",
      title: "الأوراق",
      copy: "الأوراق هي مطبخ النبات الشمسي. تلتقط البلاستيدات الخضراء الضوء، وتحوّل الماء وثاني أكسيد الكربون إلى سكريات في عملية البناء الضوئي، مع تبادل الغازات عبر الثغور.",
      role: "صنع الغذاء، تبادل الغازات، وتنظيم فقد الماء",
      facts: ["الثغور تفتح وتغلق لتنظيم الماء والهواء.", "شكل الورقة يعكس بيئتها."]
    },
    en: {
      kicker: "THE SOLAR KITCHEN · LEAF",
      title: "Leaves",
      copy: "Leaves are the plant’s solar kitchens. Chloroplasts capture light and turn water and carbon dioxide into sugars through photosynthesis, while gases move through tiny stomata.",
      role: "Food production, gas exchange, and water regulation",
      facts: ["Tiny stomata open and close to manage water and air.", "Leaf shape often reflects the plant’s habitat."]
    }
  },
  flower: {
    number: "04",
    icon: "i-flower",
    ar: {
      kicker: "وعد البداية · FLOWER",
      title: "الأزهار",
      copy: "الأزهار هي أعضاء التكاثر في النبات. تجذب الألوان والعطور والرحيق الملقحات، بينما يستقبل مركز الزهرة حبوب اللقاح لتبدأ البذور رحلتها.",
      role: "التكاثر وجذب الملقحات",
      facts: ["بعض الأزهار تستطيع تلقيح نفسها.", "ليست كل الأزهار ملونة؛ الأعشاب تعتمد على الرياح."]
    },
    en: {
      kicker: "THE PROMISE OF BEGINNINGS · FLOWER",
      title: "Flowers",
      copy: "Flowers are the plant’s reproductive organs. Colour, scent, and nectar invite pollinators, while the flower’s centre receives pollen so seeds can begin their journey.",
      role: "Reproduction and pollination",
      facts: ["Some flowers can pollinate themselves.", "Not every flower is showy; grasses rely on wind."]
    }
  },
  fruit: {
    number: "05",
    icon: "i-fruit",
    ar: {
      kicker: "حماية البذور · FRUIT",
      title: "الثمار",
      copy: "تتكوّن الثمار من مبيض الزهرة، وتحمي البذور النامية. تساعد ألوانها وطعومها الحيوانات على حمل البذور ونشرها، لتبدأ نبتة جديدة حياتها.",
      role: "حماية البذور والمساعدة على نشرها",
      facts: ["الطماطم ثمرة نباتيًا.", "الثمار المجنّحة تسافر مع الرياح."]
    },
    en: {
      kicker: "A SAFE BEGINNING · FRUIT",
      title: "Fruit",
      copy: "Fruits develop from the flower’s ovary and protect developing seeds. Their colours and flavours encourage animals to carry seeds away, giving new plants a place to begin.",
      role: "Protecting and dispersing seeds",
      facts: ["A tomato is botanically a fruit.", "Winged fruits can travel on the wind."]
    }
  }
};

function renderPart(part = currentPart, options = {}) {
  setPart(part, { animate: false, ...options });
}

/* ---------- Bindings ---------- */
function bindNavigation() {
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      goToTarget(link.dataset.slideLink);
    });
  });

  prevBtn?.addEventListener("click", () => {
    if (currentIndex > 0) goToSlide(currentIndex - 1);
  });
  nextBtn?.addEventListener("click", () => {
    if (currentIndex < slides.length - 1) goToSlide(currentIndex + 1);
  });

  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => goToSlide(currentIndex + 1));
  });

  document.querySelectorAll("[data-goto]").forEach((button) => {
    button.addEventListener("click", () => goToTarget(button.dataset.goto));
  });

  window.addEventListener("popstate", () => {
    goToSlide(indexFromHash(), { push: false });
  });
  window.addEventListener("hashchange", () => {
    const target = indexFromHash();
    if (target !== currentIndex) goToSlide(target, { push: false });
  });
}

function bindKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (document.body.classList.contains("nav-open")) {
        closeMobileNav(true);
        return;
      }
      closeTypeCards();
      closeNeedCards();
      return;
    }

    if (document.body.classList.contains("nav-open")) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const tagName = (event.target.tagName || "").toLowerCase();
    if (event.target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select") return;

    const isRtl = document.documentElement.dir === "rtl";
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToSlide(currentIndex + (isRtl ? -1 : 1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToSlide(currentIndex + (isRtl ? 1 : -1));
    } else if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      goToSlide(currentIndex + 1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      goToSlide(currentIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goToSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goToSlide(slides.length - 1);
    }
  });
}

function bindMobileNavigation() {
  menuOpenButtons.forEach((button) => {
    button.addEventListener("click", openMobileNav);
  });
  navCloseButtons.forEach((button) => {
    button.addEventListener("click", () => closeMobileNav(true));
  });
  mobileMedia.addEventListener("change", (event) => {
    if (!event.matches) {
      document.body.classList.remove("nav-open");
      menuOpenButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
    }
    syncSidebarAccessibility();
  });
}

function bindSwipeNavigation() {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  mainContent.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1 || document.body.classList.contains("nav-open")) {
      tracking = false;
      return;
    }
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  mainContent.addEventListener("touchend", (event) => {
    if (!tracking || !event.changedTouches.length) return;
    tracking = false;
    const deltaX = event.changedTouches[0].clientX - startX;
    const deltaY = event.changedTouches[0].clientY - startY;
    if (Math.abs(deltaX) < 70 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;
    if (deltaX < 0) goToSlide(currentIndex + 1);
    else goToSlide(currentIndex - 1);
  }, { passive: true });
}

function bindLanguageSwitch() {
  langSwitchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyLanguage(currentLang === "ar" ? "en" : "ar");
    });
  });
}

function bindTypeCards() {
  document.querySelectorAll(".type-card__trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const card = trigger.closest(".type-card");
      if (!card) return;
      const willOpen = !card.classList.contains("is-flipped");
      closeTypeCards(trigger);
      card.classList.toggle("is-flipped", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
    });
  });
}

function bindNeedCards() {
  document.querySelectorAll(".need-card").forEach((card) => {
    card.addEventListener("click", () => {
      const willOpen = !card.classList.contains("is-open");
      closeNeedCards(card);
      card.classList.toggle("is-open", willOpen);
      card.setAttribute("aria-expanded", String(willOpen));
    });
  });
}

function bindParts() {
  partTabs.forEach((tab) => {
    tab.addEventListener("click", () => setPart(tab.dataset.partTarget));
  });

  document.querySelectorAll(".hotspot").forEach((hotspot) => {
    hotspot.addEventListener("click", () => setPart(hotspot.dataset.partTarget));
  });

  partTabs.forEach((tab, index) => {
    tab.addEventListener("keydown", (event) => {
      let direction = 0;
      const isRtl = document.documentElement.dir === "rtl";
      if (event.key === "ArrowDown") direction = 1;
      if (event.key === "ArrowUp") direction = -1;
      if (event.key === "ArrowRight") direction = isRtl ? -1 : 1;
      if (event.key === "ArrowLeft") direction = isRtl ? 1 : -1;
      if (event.key === "Home") direction = -partTabs.length;
      if (event.key === "End") direction = partTabs.length;
      if (!direction) return;
      event.preventDefault();
      event.stopPropagation();
      const nextIndex = (index + direction + partTabs.length * 2) % partTabs.length;
      const nextTab = partTabs[nextIndex];
      setPart(nextTab.dataset.partTarget, { animate: true, focusTab: true });
    });
  });
}

function bindCareChecklist() {
  careItems.forEach((item) => {
    item.addEventListener("change", updateCare);
  });
  careReset?.addEventListener("click", () => {
    careItems.forEach((item) => { item.checked = false; });
    updateCare();
    careItems[0]?.focus({ preventScroll: true });
  });
}

/* ---------- Boot ---------- */
function boot() {
  const savedCare = getStoredCare();
  careItems.forEach((item, index) => {
    item.checked = Boolean(savedCare[index]);
  });

  currentIndex = indexFromHash();
  buildPagerDots();
  bindNavigation();
  bindKeyboard();
  bindMobileNavigation();
  bindSwipeNavigation();
  bindLanguageSwitch();
  bindTypeCards();
  bindNeedCards();
  bindParts();
  bindCareChecklist();

  applyLanguage(currentLang, { persist: false, announce: false });
  updateSlideVisibility();
  updatePager();
  syncSidebarAccessibility();
  closeTypeCards();
  closeNeedCards();

  const initialHash = `#${slides[currentIndex].id}`;
  if (window.location.hash !== initialHash) {
    window.history.replaceState({ slide: currentIndex }, "", initialHash);
  } else {
    window.history.replaceState({ slide: currentIndex }, "", initialHash);
  }

  if (slides[currentIndex].id === "importance") animateStats();
}

boot();
