// 300 Transport — site interactivity

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Sticky header ---------- */
  const header = document.getElementById("siteHeader");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll);

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById("navToggle");
  const navList = document.getElementById("navList");
  navToggle.addEventListener("click", () => {
    navToggle.classList.toggle("is-open");
    navList.classList.toggle("is-open");
  });
  navList.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.classList.remove("is-open");
      navList.classList.remove("is-open");
    });
  });

  /* ---------- Tabs (trucks / trailers) ---------- */
  document.querySelectorAll(".tab-group").forEach((group) => {
    const buttons = group.querySelectorAll(".tab-btn");
    const panels = group.querySelectorAll(".tab-panel");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("is-active"));
        panels.forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        group.querySelector(`.tab-panel[data-panel="${btn.dataset.tab}"]`).classList.add("is-active");
      });
    });
  });

  /* ---------- Form submission helper ---------- */
  const submitForm = async (form, note, endpoint) => {
    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Sending...";
    note.classList.remove("is-visible", "form-note--success", "form-note--error");

    try {
      const res = await fetch(endpoint, { method: "POST", body: new FormData(form) });
      const data = await res.json().catch(() => ({ ok: false }));

      if (res.ok && data.ok) {
        note.textContent = "Thanks! Your message has been sent — we'll be in touch shortly.";
        note.classList.add("is-visible", "form-note--success");
        form.reset();
        return true;
      }
      note.textContent = data.error || "Something went wrong. Please try again or call us directly.";
      note.classList.add("is-visible", "form-note--error");
      return false;
    } catch (err) {
      note.textContent = "Network error — please check your connection and try again.";
      note.classList.add("is-visible", "form-note--error");
      return false;
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
      note.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  /* ---------- Application form ---------- */
  const applicationForm = document.getElementById("applicationForm");
  const applicationNote = document.getElementById("applicationNote");
  const fileInput = document.getElementById("fileInput");
  const fileName = document.getElementById("fileName");
  const MAX_FILE_BYTES = 8 * 1024 * 1024;

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      fileName.textContent = fileInput.files.length ? fileInput.files[0].name : "No file attached";
    });
  }

  if (applicationForm) {
    applicationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const file = fileInput.files[0];

      if (!file) {
        applicationNote.textContent = "Please attach a photo of your CDL before submitting.";
        applicationNote.classList.add("is-visible", "form-note--error");
        applicationNote.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        applicationNote.textContent = "That file is too large — 8MB max.";
        applicationNote.classList.add("is-visible", "form-note--error");
        applicationNote.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      submitForm(applicationForm, applicationNote, "/api/apply").then((ok) => {
        if (ok) fileName.textContent = "No file attached";
      });
    });
  }

  /* ---------- Quote form ---------- */
  const quoteForm = document.getElementById("quoteForm");
  const quoteNote = document.getElementById("quoteNote");
  if (quoteForm) {
    quoteForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitForm(quoteForm, quoteNote, "/api/quote");
    });
  }

  /* ---------- Work schedule picker ---------- */
  const schedules = {
    conestoga: ["3 weeks OTR + 1 week home", "2 weeks OTR + 3-4 days home", "Weekends home"],
    reefer: ["2 weeks OTR + 3-4 days home", "3 weeks OTR + 1 week home", "Regional, weekends home"],
    dryvan: ["Weekends home", "4 weeks OTR + 1 week home", "Regional, weekends home"],
  };
  const scheduleList = document.getElementById("scheduleList");
  const trailerPicker = document.getElementById("trailerPicker");
  const renderSchedule = (type) => {
    if (!scheduleList) return;
    scheduleList.innerHTML = schedules[type].map((s) => `<li>${s}</li>`).join("");
  };
  if (trailerPicker) {
    renderSchedule("conestoga");
    trailerPicker.querySelectorAll('input[name="schedTrailer"]').forEach((input) => {
      input.addEventListener("change", () => renderSchedule(input.value));
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
