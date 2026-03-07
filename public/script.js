(function () {
  var root = document.documentElement;
  var savedTheme = localStorage.getItem("rr_theme");
  var currentTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  root.setAttribute("data-theme", currentTheme);

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("rr_theme", theme);
  }

  var navRight = document.querySelector(".nav-right");
  if (navRight) {
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn btn-secondary theme-toggle";
    toggle.setAttribute("aria-label", "Toggle color theme");
    toggle.textContent = currentTheme === "dark" ? "Light mode" : "Dark mode";
    toggle.addEventListener("click", function () {
      currentTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(currentTheme);
      toggle.textContent = currentTheme === "dark" ? "Light mode" : "Dark mode";
    });
    navRight.insertBefore(toggle, navRight.firstChild);
  }

  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("site-nav");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      navMenu.classList.toggle("open", !expanded);
    });

    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth < 920) {
          navToggle.setAttribute("aria-expanded", "false");
          navMenu.classList.remove("open");
        }
      });
    });
  }

  function showMessage(messageId, text, isError) {
    var node = document.getElementById(messageId);
    if (!node) return;
    node.textContent = text;
    node.classList.add("show");
    if (isError) {
      node.classList.add("error");
    } else {
      node.classList.remove("error");
    }
  }

  async function postForm(form, endpoint, messageId) {
    var formData = new FormData(form);
    var payload = {};
    formData.forEach(function (value, key) {
      payload[key] = String(value || "").trim();
    });

    var response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    form.reset();
    showMessage(messageId, "Submission received. Thank you.", false);
  }

  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        await postForm(contactForm, "/api/contact", "contact-confirmation");
      } catch (error) {
        showMessage("contact-confirmation", "Unable to submit right now. Please try again.", true);
      }
    });
  }

  var campForm = document.getElementById("camp-interest-form");
  if (campForm) {
    campForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        await postForm(campForm, "/api/camp-interest", "camp-confirmation");
      } catch (error) {
        showMessage("camp-confirmation", "Unable to submit right now. Please try again.", true);
      }
    });
  }

  var adminLoginForm = document.getElementById("admin-login-form");
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var passcode = document.getElementById("admin-passcode");
      var loginMessage = document.getElementById("admin-login-message");
      if (!passcode) return;

      try {
        var response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode: passcode.value })
        });

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        window.location.href = "admin.html";
      } catch (error) {
        if (loginMessage) {
          loginMessage.textContent = "Invalid passcode.";
          loginMessage.classList.add("show", "error");
        }
      }
    });
  }

  var dashboard = document.getElementById("admin-dashboard");
  if (dashboard) {
    var contactBody = document.getElementById("admin-contact-body");
    var campBody = document.getElementById("admin-camp-body");

    function rowHtml(entry, columns) {
      return "<tr>" + columns.map(function (key) {
        var value = entry.data && entry.data[key] ? entry.data[key] : "";
        return "<td>" + String(value).replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</td>";
      }).join("") + "<td>" + new Date(entry.timestamp).toLocaleString() + "</td></tr>";
    }

    async function loadAdminData() {
      var response = await fetch("/api/admin/data");
      if (response.status === 401) {
        window.location.href = "admin-login.html";
        return;
      }
      if (!response.ok) {
        throw new Error("Failed");
      }

      var payload = await response.json();
      var contactRows = payload.contact || [];
      var campRows = payload.camp || [];

      if (contactBody) {
        contactBody.innerHTML = contactRows.length
          ? contactRows.map(function (entry) {
              return rowHtml(entry, ["name", "email", "organization", "message", "subject"]);
            }).join("")
          : '<tr><td colspan="6">No submissions yet.</td></tr>';
      }

      if (campBody) {
        campBody.innerHTML = campRows.length
          ? campRows.map(function (entry) {
              return rowHtml(entry, ["parent_name", "parent_email", "parent_phone", "student_count", "grade_band", "camp_block", "camp_notes"]);
            }).join("")
          : '<tr><td colspan="8">No submissions yet.</td></tr>';
      }
    }

    dashboard.querySelectorAll("[data-clear]").forEach(function (button) {
      button.addEventListener("click", async function () {
        var type = button.getAttribute("data-clear");
        var ok = window.confirm("Clear all " + type + " submissions?");
        if (!ok) return;
        await fetch("/api/admin/clear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: type })
        });
        await loadAdminData();
      });
    });

    loadAdminData().catch(function () {
      window.location.href = "admin-login.html";
    });
  }

  var givebutterRoot = document.getElementById("givebutter-embed-root");
  if (givebutterRoot) {
    var widgetTag = givebutterRoot.querySelector("givebutter-widget");
    if (widgetTag && widgetTag.getAttribute("id") === "YOUR_WIDGET_ID") {
      var placeholderMsg = document.getElementById("givebutter-fallback-msg");
      if (placeholderMsg) placeholderMsg.style.display = "block";
    }

    window.setTimeout(function () {
      if (window.__gbFailed === true) {
        var msg = document.getElementById("givebutter-fallback-msg");
        if (msg) msg.style.display = "block";
      }
    }, 1200);
  }

  var sponsorCarousel = document.querySelector("[data-sponsor-carousel]");
  if (sponsorCarousel) {
    var slides = Array.prototype.slice.call(sponsorCarousel.querySelectorAll(".sponsor-slide"));
    if (slides.length > 1) {
      var active = 0;
      window.setInterval(function () {
        slides[active].classList.remove("is-active");
        active = (active + 1) % slides.length;
        slides[active].classList.add("is-active");
      }, 2600);
    }
  }
})();
