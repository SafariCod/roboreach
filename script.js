(function () {
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
        if (window.innerWidth < 900) {
          navToggle.setAttribute("aria-expanded", "false");
          navMenu.classList.remove("open");
        }
      });
    });
  }

  var params = new URLSearchParams(window.location.search);
  var subjectFromQuery = params.get("subject");
  var subjectInput = document.getElementById("subject");
  if (subjectInput && subjectFromQuery) {
    subjectInput.value = subjectFromQuery;
  }

  var mailtoButton = document.getElementById("mailto-submit");
  if (mailtoButton) {
    mailtoButton.addEventListener("click", function (event) {
      event.preventDefault();
      var getVal = function (id) {
        var el = document.getElementById(id);
        return el ? el.value : "";
      };
      var body = [
        "Name: " + getVal("name"),
        "Email: " + getVal("email"),
        "Organization: " + getVal("organization"),
        "",
        "Message:",
        getVal("message")
      ].join("\n");

      var subject = subjectInput && subjectInput.value ? subjectInput.value : "Roboreach Foundation Inquiry";
      window.location.href =
        "mailto:info@roboreach.org?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
    });
  }
})();
