(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu]");
  const nav = document.getElementById("site-nav");

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 18);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    nav?.classList.toggle("is-open", open);
  });

  nav?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuButton?.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }
  });

  const intro = document.querySelector("[data-intro]");
  const hideIntro = () => {
    intro?.classList.add("is-hidden");
    try {
      sessionStorage.setItem("alika-intro-seen", "1");
    } catch (_) {
      // Storage may be disabled. The intro remains harmless.
    }
  };

  if (intro) {
    let seen = false;
    try {
      seen = sessionStorage.getItem("alika-intro-seen") === "1";
    } catch (_) {
      seen = false;
    }
    if (seen || reducedMotion) {
      intro.remove();
    } else {
      intro.querySelector("[data-intro-skip]")?.addEventListener("click", hideIntro);
      window.setTimeout(hideIntro, 1500);
      window.setTimeout(() => intro.remove(), 2050);
    }
  }

  const reveals = [...document.querySelectorAll(".reveal")];
  if (reducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((element) => element.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    reveals.forEach((element) => observer.observe(element));
  }

  const screenTabs = [...document.querySelectorAll("[data-screen-tab]")];
  const screenPanels = [...document.querySelectorAll("[data-screen-panel]")];
  screenTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-screen-tab");
      screenTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      screenPanels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.getAttribute("data-screen-panel") === target);
      });
    });
  });

  const ecoChoices = [...document.querySelectorAll("[data-eco-choice]")];
  const ecoStage = document.querySelector("[data-eco-stage]");
  const ecoTitle = document.querySelector("[data-eco-title]");
  ecoChoices.forEach((choice) => {
    choice.addEventListener("click", () => {
      ecoChoices.forEach((item) => item.classList.toggle("is-active", item === choice));
      if (ecoTitle) {
        ecoTitle.textContent = choice.textContent.replace(/^\s*\d+\s*/, "").trim();
      }
      ecoStage?.classList.remove("is-pulsing");
      requestAnimationFrame(() => ecoStage?.classList.add("is-pulsing"));
    });
  });

  const ageButtons = [...document.querySelectorAll("[data-age]")];
  const agePreview = document.querySelector("[data-age-preview]");
  const ageLabel = document.querySelector("[data-age-label]");
  ageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-age") || 0);
      ageButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      if (agePreview) {
        agePreview.className = `age-preview age-${index}`;
        agePreview.setAttribute("data-age-preview", "");
      }
      const age = button.querySelector("strong")?.textContent || "";
      const label = button.querySelector("span")?.textContent || "";
      const ageSmall = agePreview?.querySelector(".age-copy small");
      if (ageSmall) ageSmall.textContent = age;
      if (ageLabel) ageLabel.textContent = label;
    });
  });

  document.querySelectorAll("[data-direct-download]").forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      if (link.classList.contains("is-loading")) return;

      const url = link.getAttribute("href");
      const filename = link.getAttribute("download") || "alika-icerik.zip";
      const original = link.textContent;
      link.classList.remove("is-ready", "is-error");
      link.classList.add("is-loading");
      link.textContent = link.getAttribute("data-loading") || original;
      link.setAttribute("aria-busy", "true");

      try {
        const response = await fetch(url, { credentials: "omit" });
        if (!response.ok) throw new Error("download");
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const saveLink = document.createElement("a");
        saveLink.href = objectUrl;
        saveLink.download = filename;
        document.body.appendChild(saveLink);
        saveLink.click();
        saveLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
        link.classList.add("is-ready");
        link.textContent = link.getAttribute("data-ready") || original;
      } catch (_) {
        const fallback = document.createElement("a");
        fallback.href = url;
        fallback.download = filename;
        fallback.hidden = true;
        document.body.appendChild(fallback);
        fallback.click();
        fallback.remove();
        link.classList.add("is-ready");
        link.textContent = link.getAttribute("data-ready") || original;
      } finally {
        link.classList.remove("is-loading");
        link.removeAttribute("aria-busy");
        window.setTimeout(() => {
          link.classList.remove("is-ready", "is-error");
          link.textContent = original;
        }, 3500);
      }
    });
  });

  document.querySelectorAll("[data-content-filters]").forEach((filters) => {
    const country = filters.querySelector("[data-content-country]");
    const grade = filters.querySelector("[data-content-grade]");
    const items = [...document.querySelectorAll("[data-content-item]")];
    if (!country || !grade) return;

    const refresh = () => {
      const countryValue = country.value;
      const gradeOptions = [...grade.options];
      gradeOptions.forEach((option) => {
        option.hidden = option.dataset.countryOption !== countryValue;
      });
      if (grade.selectedOptions[0]?.hidden) {
        const firstVisible = gradeOptions.find((option) => !option.hidden);
        if (firstVisible) grade.value = firstVisible.value;
      }
      items.forEach((item) => {
        item.hidden = item.dataset.country !== countryValue || item.dataset.grade !== grade.value;
      });
      document.querySelectorAll("[data-content-collection]").forEach((collection) => {
        const collectionItems = [...collection.querySelectorAll("[data-content-item]")];
        collection.hidden = collectionItems.length === 0 || collectionItems.every((item) => item.hidden);
      });
    };
    country.addEventListener("change", refresh);
    grade.addEventListener("change", refresh);
    refresh();
  });
})();
