(function () {
  const KEYS = {
    fontSize: "careplus-font-size",
    reminders: "careplus-reminders",
    reminderTriggerLog: "careplus-reminder-trigger-log",
    orders: "careplus-orders",
    users: "careplus-users",
    userSession: "careplus-user-session",
    adminSession: "careplus-admin-session"
  };

  const medicineDb = {
    paracetamol: {
      name: "Paracetamol",
      indications: "Used for fever and mild pain.",
      dosage: "Usually 1 tablet every 6 to 8 hours as advised.",
      sideEffects: "Sometimes nausea or mild stomach upset.",
      warnings: "Do not take more than recommended. Ask doctor if liver problems exist."
    },
    metformin: {
      name: "Metformin",
      indications: "Used to manage blood sugar in diabetes.",
      dosage: "Usually taken with meals, once or twice daily as advised.",
      sideEffects: "May cause stomach discomfort at first.",
      warnings: "Take with food. Discuss kidney issues with doctor."
    },
    amlodipine: {
      name: "Amlodipine",
      indications: "Used to control high blood pressure.",
      dosage: "Commonly once daily at the same time.",
      sideEffects: "Can cause ankle swelling or mild dizziness.",
      warnings: "Stand up slowly. Do not stop suddenly without advice."
    },
    aspirin: {
      name: "Aspirin",
      indications: "Used for pain relief or heart protection in some patients.",
      dosage: "Take exactly as advised by your healthcare provider.",
      sideEffects: "May upset stomach or increase bleeding risk.",
      warnings: "Avoid if you have bleeding issues unless prescribed."
    },
    ibuprofen: {
      name: "Ibuprofen",
      indications: "Used for pain, inflammation, and fever.",
      dosage: "Often taken every 6 to 8 hours with food, as advised.",
      sideEffects: "Can cause acidity, stomach pain, or nausea.",
      warnings: "Avoid long-term use without medical advice, especially with kidney issues."
    },
    cetirizine: {
      name: "Cetirizine",
      indications: "Used for allergy symptoms like sneezing and itching.",
      dosage: "Usually once daily as advised.",
      sideEffects: "May cause mild drowsiness or dry mouth.",
      warnings: "Use caution before driving if it causes sleepiness."
    },
    omeprazole: {
      name: "Omeprazole",
      indications: "Used for acidity, reflux, and stomach ulcers.",
      dosage: "Usually once daily before food, as advised.",
      sideEffects: "Can cause headache, bloating, or stomach discomfort.",
      warnings: "Do not use for long periods without doctor guidance."
    }
  };
  function getJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch (_e) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function setStatus(el, type, message) {
    if (!el) return;
    el.className = "status " + type;
    el.textContent = message;
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function requireUserAuth() {
    const requiresAuth = document.body.getAttribute("data-requires-user-auth") === "true";
    if (!requiresAuth) return;
    const session = getJSON(KEYS.userSession, null);
    if (session) return;
    const next = encodeURIComponent(window.location.pathname.split("/").pop() || "index.html");
    window.location.href = "login.html?next=" + next;
  }

  function initAuthNav() {
    const session = getJSON(KEYS.userSession, null);
    const signupLinks = document.querySelectorAll('a[href="signup.html"]');
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    const navs = document.querySelectorAll("header nav");

    if (!navs.length) return;

    if (session) {
      signupLinks.forEach(function (link) {
        link.style.display = "none";
      });
      loginLinks.forEach(function (link) {
        link.style.display = "none";
      });

      navs.forEach(function (nav) {
        const userBadge = document.createElement("span");
        userBadge.className = "user-badge";
        userBadge.textContent = "User: " + session.name;

        const logoutBtn = document.createElement("button");
        logoutBtn.type = "button";
        logoutBtn.className = "nav-logout";
        logoutBtn.textContent = "Logout";
        logoutBtn.addEventListener("click", function () {
          localStorage.removeItem(KEYS.userSession);
          window.location.href = "index.html";
        });

        nav.appendChild(userBadge);
        nav.appendChild(logoutBtn);
      });
    }

    const gate = document.getElementById("entryAuthGate");
    if (!gate) return;

    if (session) {
      gate.innerHTML = "<p class='status success'>Welcome back, " + session.name + ". You are logged in.</p>";
      return;
    }

    gate.innerHTML =
      "<p class='status'>Please sign up or login to start ordering medicines.</p>" +
      "<div class='btn-row'>" +
      "<a class='btn-link' href='signup.html'>Sign Up</a>" +
      "<a class='btn-link' href='login.html'>Login</a>" +
      "<a class='btn-link btn-light' href='admin-login.html'>Admin Login</a>" +
      "</div>";
  }

  function initTextSizeControls() {
    const savedFont = Number(localStorage.getItem(KEYS.fontSize));
    let baseFont = Number.isFinite(savedFont) && savedFont >= 16 && savedFont <= 28 ? savedFont : 20;
    document.documentElement.style.setProperty("--base-font", baseFont + "px");

    const incBtn = document.getElementById("increaseText");
    const decBtn = document.getElementById("decreaseText");

    if (incBtn) {
      incBtn.addEventListener("click", function () {
        baseFont = Math.min(28, baseFont + 2);
        document.documentElement.style.setProperty("--base-font", baseFont + "px");
        localStorage.setItem(KEYS.fontSize, String(baseFont));
      });
    }

    if (decBtn) {
      decBtn.addEventListener("click", function () {
        baseFont = Math.max(16, baseFont - 2);
        document.documentElement.style.setProperty("--base-font", baseFont + "px");
        localStorage.setItem(KEYS.fontSize, String(baseFont));
      });
    }
  }

  function initMedicineSearch() {
    const medicineInput = document.getElementById("medicineInput");
    const medicineStatus = document.getElementById("medicineStatus");
    const medicineCards = document.getElementById("medicineCards");
    const searchBtn = document.getElementById("searchBtn");
    const medicineAliases = {
      metaformin: "metformin",
      pcm: "paracetamol",
      dolo: "paracetamol",
      dolo650: "paracetamol",
      crocin: "paracetamol"
    };

    function normalizeName(value) {
      return value.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    function toTitleCase(value) {
      return value
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(function (word) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
    }

    function renderMedicineCard(med) {
      medicineCards.innerHTML =
        '<article class="card"><h3>Indications</h3><p>' + med.indications + '</p></article>' +
        '<article class="card"><h3>Dosage Instructions</h3><p>' + med.dosage + '</p></article>' +
        '<article class="card"><h3>Side Effects</h3><p>' + med.sideEffects + '</p></article>' +
        '<article class="card"><h3>Warnings</h3><p>' + med.warnings + '</p></article>';
    }

    function searchMedicine() {
      const query = medicineInput.value.trim();
      if (!query) {
        setStatus(medicineStatus, "error", "Please type a medicine name.");
        medicineCards.innerHTML = "";
        return;
      }

      const normalized = normalizeName(query);
      const aliasKey = medicineAliases[normalized];
      const dbKeys = Object.keys(medicineDb);
      let result = null;

      if (medicineDb[normalized]) {
        result = medicineDb[normalized];
      } else if (aliasKey && medicineDb[aliasKey]) {
        result = medicineDb[aliasKey];
      } else {
        const partialKey = dbKeys.find(function (k) {
          const dbNorm = normalizeName(k);
          const nameNorm = normalizeName(medicineDb[k].name);
          return dbNorm.includes(normalized) || nameNorm.includes(normalized) || normalized.includes(dbNorm);
        });
        if (partialKey) result = medicineDb[partialKey];
      }

      if (!result) {
        const displayName = toTitleCase(query);
        result = {
          name: displayName,
          indications: "This medicine may be used for different conditions depending on the exact brand and strength.",
          dosage: "Dose depends on age, weight, and diagnosis. Follow your doctor or label instructions exactly.",
          sideEffects: "Possible effects can include stomach upset, dizziness, allergy, or sleep changes based on medicine type.",
          warnings: "Please verify active ingredient, strength, and interactions with a pharmacist before use."
        };
        setStatus(medicineStatus, "success", "Showing general guidance for " + displayName + ". Please confirm exact details with a pharmacist.");
        renderMedicineCard(result);
        return;
      }

      setStatus(medicineStatus, "success", result.name + " information is shown below.");
      renderMedicineCard(result);
    }

    if (searchBtn && medicineInput && medicineStatus && medicineCards) {
      searchBtn.addEventListener("click", searchMedicine);
      medicineInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          searchMedicine();
        }
      });
    }
  }

  function initReminders() {
    const reminderForm = document.getElementById("reminderForm");
    const reminderList = document.getElementById("reminderList");
    const reminderStatus = document.getElementById("reminderStatus");

    if (!reminderForm || !reminderList || !reminderStatus) return;

    let reminders = getJSON(KEYS.reminders, []);
    let reminderTriggerLog = getJSON(KEYS.reminderTriggerLog, {});

    function nowDateKey() {
      return new Date().toISOString().slice(0, 10);
    }

    function playReminderTone() {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      setTimeout(function () {
        oscillator.stop();
        ctx.close();
      }, 700);
    }

    function triggerReminder(item) {
      const noteText = item.note ? " Note: " + item.note : "";
      const message = "Time to take " + item.name + "." + noteText;

      setStatus(reminderStatus, "success", message);
      playReminderTone();

      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Medicine Reminder", { body: message });
        } else if (Notification.permission === "default") {
          Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
              new Notification("Medicine Reminder", { body: message });
            }
          });
        }
      }

      // Fallback alarm for browsers/devices that block notifications.
      window.alert(message);
    }

    function checkReminderAlarms() {
      if (!reminders.length) return;

      const now = new Date();
      const hour = String(now.getHours()).padStart(2, "0");
      const minute = String(now.getMinutes()).padStart(2, "0");
      const currentTime = hour + ":" + minute;
      const dateKey = nowDateKey();

      reminders.forEach(function (item) {
        if (item.time !== currentTime) return;
        const triggerKey = String(item.id) + "|" + dateKey;
        if (reminderTriggerLog[triggerKey]) return;
        reminderTriggerLog[triggerKey] = Date.now();
        setJSON(KEYS.reminderTriggerLog, reminderTriggerLog);
        triggerReminder(item);
      });
    }

    function renderReminders(items) {
      if (!items.length) {
        reminderList.innerHTML = "<p class='small'>No reminders yet. Add your first medicine reminder.</p>";
        return;
      }

      reminderList.innerHTML = items
        .map(function (item) {
          return (
            '<div class="reminder-item">' +
            '<div><strong>' + item.name + '</strong> at <strong>' + item.time + '</strong><br><span class="small">' + (item.note || "No note") + '</span></div>' +
            '<button class="btn btn-danger" type="button" data-reminder-id="' + item.id + '">Remove</button>' +
            '</div>'
          );
        })
        .join("");
    }

    renderReminders(reminders);

    reminderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("reminderMedicine").value.trim();
      const time = document.getElementById("reminderTime").value;
      const note = document.getElementById("reminderNote").value.trim();

      if (!name || !time) {
        setStatus(reminderStatus, "error", "Please enter medicine name and time.");
        return;
      }

      reminders.push({ id: Date.now(), name: name, time: time, note: note });
      setJSON(KEYS.reminders, reminders);
      renderReminders(reminders);
      setStatus(reminderStatus, "success", "Reminder added successfully.");
      reminderForm.reset();
    });

    reminderList.addEventListener("click", function (e) {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const id = target.getAttribute("data-reminder-id");
      if (!id) return;
      reminders = reminders.filter(function (item) {
        return String(item.id) !== id;
      });
      setJSON(KEYS.reminders, reminders);
      renderReminders(reminders);
      setStatus(reminderStatus, "success", "Reminder removed.");
    });

    // Poll every 15 seconds so reminders fire close to scheduled minute.
    checkReminderAlarms();
    setInterval(checkReminderAlarms, 15000);
  }

  function initDeliveryOrder() {
    const orderForm = document.getElementById("orderForm");
    const orderStatus = document.getElementById("orderStatus");
    if (!orderForm || !orderStatus) return;
    const upiDetails = document.getElementById("upiDetails");
    const cardDetails = document.getElementById("cardDetails");
    const upiIdInput = document.getElementById("upiId");
    const cardNameInput = document.getElementById("cardName");
    const cardNumberInput = document.getElementById("cardNumber");
    const cardExpiryInput = document.getElementById("cardExpiry");
    const cardCvvInput = document.getElementById("cardCvv");
    const paymentInputs = document.querySelectorAll("input[name='payment']");
    const medicineInput = document.getElementById("orderMedicine");
    const qtyInput = document.getElementById("orderQty");
    const totalAmountInput = document.getElementById("orderTotalAmount");
    const randomPriceCache = {};
    let currentUnitPrice = 0;
    let currentTotalAmount = 0;

    const session = getJSON(KEYS.userSession, null);
    if (session) {
      const customerName = document.getElementById("customerName");
      const customerPhone = document.getElementById("customerPhone");
      if (customerName && !customerName.value) customerName.value = session.name || "";
      if (customerPhone && !customerPhone.value) customerPhone.value = session.phone || "";
    }

    function normalizeName(value) {
      return value.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    function getMedicineUnitPrice(medicineName) {
      const key = normalizeName(medicineName || "");
      if (!key) return null;
      if (randomPriceCache[key]) return randomPriceCache[key];
      const randomPrice = Math.floor(Math.random() * 90) + 10;
      randomPriceCache[key] = randomPrice;
      return randomPrice;
    }

    function updateTotalAmount(useExistingUnitPrice) {
      if (!medicineInput || !qtyInput || !totalAmountInput) return;
      const qty = Math.max(1, Number(qtyInput.value) || 1);
      const unitPrice = useExistingUnitPrice ? currentUnitPrice : getMedicineUnitPrice(medicineInput.value.trim());
      if (!unitPrice) {
        currentUnitPrice = 0;
        currentTotalAmount = 0;
        totalAmountInput.value = "";
        return;
      }
      currentUnitPrice = unitPrice;
      const total = qty * unitPrice;
      currentTotalAmount = total;
      totalAmountInput.value = String(total);
    }

    function clearAmountFields() {
      currentUnitPrice = 0;
      currentTotalAmount = 0;
      if (totalAmountInput) totalAmountInput.value = "";
    }

    function applyMedicinePricing() {
      updateTotalAmount(false);
    }

    if (qtyInput) qtyInput.addEventListener("input", function () { updateTotalAmount(true); });
    if (medicineInput) {
      medicineInput.addEventListener("input", clearAmountFields);
      medicineInput.addEventListener("change", applyMedicinePricing);
      medicineInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          applyMedicinePricing();
        }
      });
    }
    clearAmountFields();

    function getSelectedPaymentMethod() {
      const selected = document.querySelector("input[name='payment']:checked");
      return selected ? selected.value : "Cash on Delivery";
    }

    function togglePaymentDetails() {
      const paymentMethod = getSelectedPaymentMethod();
      if (upiDetails) upiDetails.hidden = paymentMethod !== "UPI";
      if (cardDetails) cardDetails.hidden = paymentMethod !== "Card";
    }

    paymentInputs.forEach(function (input) {
      input.addEventListener("change", togglePaymentDetails);
    });
    togglePaymentDetails();

    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const medicine = document.getElementById("orderMedicine").value.trim();
      const qty = Number(qtyInput ? qtyInput.value : 0);
      const unitPrice = currentUnitPrice;
      const totalAmount = currentTotalAmount;
      const address = document.getElementById("orderAddress").value.trim();
      const name = document.getElementById("customerName").value.trim();
      const phone = document.getElementById("customerPhone").value.trim();
      const paymentMethod = getSelectedPaymentMethod();
      let paymentDetails = "";

      if (!medicine || !address || !name || !phone || qty < 1) {
        setStatus(orderStatus, "error", "Please fill all order details correctly.");
        return;
      }
      if (!unitPrice || totalAmount <= 0) {
        setStatus(orderStatus, "error", "Please type medicine name to generate payable amount.");
        return;
      }

      if (paymentMethod === "UPI") {
        const upiId = upiIdInput ? upiIdInput.value.trim() : "";
        if (!upiId || !/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
          setStatus(orderStatus, "error", "Please enter a valid UPI ID.");
          return;
        }
        paymentDetails = "UPI ID: " + upiId;
      }

      if (paymentMethod === "Card") {
        const cardName = cardNameInput ? cardNameInput.value.trim() : "";
        const cardNumberRaw = cardNumberInput ? cardNumberInput.value : "";
        const cardNumber = cardNumberRaw.replace(/\s+/g, "");
        const cardExpiry = cardExpiryInput ? cardExpiryInput.value.trim() : "";
        const cardCvv = cardCvvInput ? cardCvvInput.value.trim() : "";

        if (!cardName) {
          setStatus(orderStatus, "error", "Please enter card holder name.");
          return;
        }

        if (!/^\d{12,19}$/.test(cardNumber)) {
          setStatus(orderStatus, "error", "Please enter a valid card number.");
          return;
        }

        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
          setStatus(orderStatus, "error", "Please enter expiry in MM/YY format.");
          return;
        }

        if (!/^\d{3,4}$/.test(cardCvv)) {
          setStatus(orderStatus, "error", "Please enter a valid CVV.");
          return;
        }

        paymentDetails = "Card ending " + cardNumber.slice(-4);
      }

      const orders = getJSON(KEYS.orders, []);
      const order = {
        id: "ORD-" + Date.now(),
        customerName: name,
        phone: phone,
        address: address,
        medicine: medicine,
        quantity: qty,
        unitPrice: Number(unitPrice),
        totalAmount: Number(totalAmount),
        paymentMethod: paymentMethod,
        paymentDetails: paymentDetails,
        status: "New",
        orderTime: new Date().toLocaleString()
      };

      orders.push(order);
      setJSON(KEYS.orders, orders);

      setStatus(orderStatus, "success", "Order placed successfully. Total amount: " + String(totalAmount) + ". Admin will process it soon.");
      orderForm.reset();
      clearAmountFields();
      togglePaymentDetails();
    });
  }

  function initSignup() {
    const form = document.getElementById("signupForm");
    const status = document.getElementById("signupStatus");
    if (!form || !status) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim().toLowerCase();
      const phone = document.getElementById("signupPhone").value.trim();
      const password = document.getElementById("signupPassword").value;

      if (!name || !email || !password) {
        setStatus(status, "error", "Please complete all required fields.");
        return;
      }

      const users = getJSON(KEYS.users, []);
      if (users.some(function (u) { return u.email === email; })) {
        setStatus(status, "error", "This email is already registered.");
        return;
      }

      const newUser = { id: Date.now(), name: name, email: email, phone: phone, password: password };
      users.push(newUser);
      setJSON(KEYS.users, users);
      setJSON(KEYS.userSession, { id: newUser.id, name: name, email: email, phone: phone || "" });
      setStatus(status, "success", "Signup successful. Redirecting to delivery...");
      form.reset();
      setTimeout(function () {
        window.location.href = "delivery.html";
      }, 700);
    });
  }

  function initLogin() {
    const form = document.getElementById("loginForm");
    const status = document.getElementById("loginStatus");
    if (!form || !status) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim().toLowerCase();
      const password = document.getElementById("loginPassword").value;

      const users = getJSON(KEYS.users, []);
      const user = users.find(function (u) { return u.email === email && u.password === password; });

      if (!user) {
        setStatus(status, "error", "Invalid email or password.");
        return;
      }

      setJSON(KEYS.userSession, { id: user.id, name: user.name, email: user.email, phone: user.phone || "" });
      const next = getQueryParam("next") || "delivery.html";
      setStatus(status, "success", "Login successful. Redirecting...");
      setTimeout(function () {
        window.location.href = next;
      }, 700);
    });
  }

  function initAdminLogin() {
    const form = document.getElementById("adminLoginForm");
    const status = document.getElementById("adminLoginStatus");
    if (!form || !status) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("adminUsername").value.trim();
      const password = document.getElementById("adminPassword").value;

      if (username === "admin" && password === "admin123") {
        setJSON(KEYS.adminSession, { loggedIn: true, username: "admin" });
        window.location.href = "admin-dashboard.html";
        return;
      }

      setStatus(status, "error", "Invalid admin credentials.");
    });
  }

  function initAdminDashboard() {
    const root = document.getElementById("adminOrders");
    const logoutBtn = document.getElementById("adminLogout");
    const status = document.getElementById("adminStatus");
    if (!root) return;

    const adminSession = getJSON(KEYS.adminSession, null);
    if (!adminSession || !adminSession.loggedIn) {
      window.location.href = "admin-login.html";
      return;
    }

    function renderOrders() {
      const orders = getJSON(KEYS.orders, []);
      if (!orders.length) {
        root.innerHTML = "<p class='small'>No medicine orders yet.</p>";
        return;
      }

      root.innerHTML = orders
        .slice()
        .reverse()
        .map(function (order) {
          return (
            '<article class="card order-admin-card">' +
            '<h3>Order ID: ' + order.id + '</h3>' +
            '<p><strong>Customer:</strong> ' + order.customerName + '</p>' +
            '<p><strong>Phone:</strong> ' + order.phone + '</p>' +
            '<p><strong>Address:</strong> ' + order.address + '</p>' +
            '<p><strong>Medicine:</strong> ' + order.medicine + ' (Qty: ' + order.quantity + ')</p>' +
            '<p><strong>Total Amount:</strong> ' + String(Number(order.totalAmount || 0)) + '</p>' +
            '<p><strong>Payment:</strong> ' + order.paymentMethod + '</p>' +
            (order.paymentDetails ? '<p><strong>Payment Info:</strong> ' + order.paymentDetails + '</p>' : '') +
            '<p><strong>Order Time:</strong> ' + order.orderTime + '</p>' +
            '<p><strong>Status:</strong> ' + order.status + '</p>' +
            '<div class="btn-row">' +
            '<button class="btn btn-light" data-action="processing" data-id="' + order.id + '">Mark Processing</button>' +
            '<button class="btn" data-action="delivered" data-id="' + order.id + '">Mark Delivered</button>' +
            '<button class="btn btn-danger" data-action="delete" data-id="' + order.id + '">Delete</button>' +
            '</div>' +
            '</article>'
          );
        })
        .join("");
    }

    root.addEventListener("click", function (e) {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute("data-action");
      const id = target.getAttribute("data-id");
      if (!action || !id) return;

      let orders = getJSON(KEYS.orders, []);

      if (action === "delete") {
        orders = orders.filter(function (o) { return o.id !== id; });
        setJSON(KEYS.orders, orders);
        setStatus(status, "success", "Order deleted.");
        renderOrders();
        return;
      }

      orders = orders.map(function (o) {
        if (o.id === id) {
          o.status = action === "processing" ? "Processing" : "Delivered";
        }
        return o;
      });
      setJSON(KEYS.orders, orders);
      setStatus(status, "success", "Order updated.");
      renderOrders();
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        localStorage.removeItem(KEYS.adminSession);
        window.location.href = "admin-login.html";
      });
    }

    renderOrders();
  }

  function initEmergencyContacts() {
    const toggleBtn = document.getElementById("emergencyToggleBtn");
    const list = document.getElementById("emergencyContactList");
    if (!toggleBtn || !list) return;

    toggleBtn.addEventListener("click", function () {
      const willShow = list.hidden;
      list.hidden = !willShow;
      toggleBtn.textContent = willShow ? "Hide Emergency Contact" : "Emergency Contact";
    });
  }

  requireUserAuth();
  initAuthNav();
  initTextSizeControls();
  initMedicineSearch();
  initReminders();
  initDeliveryOrder();
  initSignup();
  initLogin();
  initAdminLogin();
  initAdminDashboard();
  initEmergencyContacts();
})();
