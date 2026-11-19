/* ============================================================
   Виртуальный инструктор — поведение страницы
   ============================================================ */

/* ── Настройки ───────────────────────────────────────────────
   1. Контакты: заполните — появятся в блоке заявки и в подвале.
   2. Юридические данные: ИП/ООО, ИНН, город — попадут в подвал.
   3. Счётчик Яндекс.Метрики: вставьте номер — начнётся сбор статистики.
   4. LEAD_ENDPOINT: адрес приёмника заявок. Пусто — демо-режим.       */
const CONFIG = {
  phone: "",
  email: "",
  telegram: "",
  legal: "",
  metrikaId: "",
  leadEndpoint: "",
};

/* ── Контакты ──────────────────────────────────────────────── */
function digits(value) {
  return value.replace(/[^\d+]/g, "");
}

function renderContacts() {
  const blocks = document.querySelectorAll("[data-contacts]");
  let visible = 0;

  blocks.forEach((block) => {
    block.querySelectorAll("[data-contact]").forEach((link) => {
      const kind = link.dataset.contact;
      const value = CONFIG[kind];

      if (!value) {
        link.remove();
        return;
      }

      visible += 1;
      link.textContent = value;

      if (kind === "phone") link.href = "tel:" + digits(value);
      if (kind === "email") link.href = "mailto:" + value;
      if (kind === "telegram") {
        link.href = value.startsWith("http") ? value : "https://t.me/" + value.replace("@", "");
      }
    });

    if (block.querySelector("[data-contact]")) block.hidden = false;
  });

  const legal = document.querySelector("[data-legal]");
  if (legal && CONFIG.legal) {
    legal.textContent = CONFIG.legal;
    legal.hidden = false;
  }

  return visible;
}

renderContacts();

/* ── Яндекс.Метрика ────────────────────────────────────────── */
if (CONFIG.metrikaId) {
  const script = document.createElement("script");
  script.text = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};` +
    `m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}` +
    `k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})` +
    `(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");` +
    `ym(${JSON.stringify(CONFIG.metrikaId)},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`;
  document.head.appendChild(script);
}

/* ── Плавающая кнопка ──────────────────────────────────────── */
const floatCta = document.getElementById("floatCta");
const writeSection = document.getElementById("write");

function updateCta() {
  if (!floatCta || !writeSection) return;
  const scrolled = window.scrollY > 520;
  const formVisible = writeSection.getBoundingClientRect().top < window.innerHeight - 120;
  floatCta.classList.toggle("is-on", scrolled && !formVisible);
}

window.addEventListener("scroll", updateCta, { passive: true });
window.addEventListener("resize", updateCta);
updateCta();

/* ── Калькулятор стоимости ─────────────────────────────────── */
const studentsInput = document.getElementById("students");
const studentsOut = document.getElementById("studentsOut");
const calcYear = document.getElementById("calcYear");
const calcMonth = document.getElementById("calcMonth");
const calcShare = document.getElementById("calcShare");
const calcHint = document.getElementById("calcHint");

const money = new Intl.NumberFormat("ru-RU");

function tariffName(count) {
  if (count < 150) return "Это тариф «Старт»: до 150 учеников.";
  if (count <= 400) return "Это тариф «Школа»: 150–400 учеников.";
  return "Это тариф «Сеть»: больше 400 учеников или несколько филиалов.";
}

function updateCalc() {
  if (!studentsInput) return;

  const students = Number(studentsInput.value);
  const year = students * 500;
  const month = Math.round(year / 12);
  const share = (500 / 19900) * 100;

  studentsOut.textContent = money.format(students);
  calcYear.textContent = money.format(year) + " ₽";
  calcMonth.textContent = money.format(month) + " ₽";
  calcShare.textContent = share.toFixed(1).replace(".", ",") + " %";
  calcHint.textContent = tariffName(students);
}

if (studentsInput) {
  studentsInput.addEventListener("input", updateCalc);
  updateCalc();
}

/* ── Форма ─────────────────────────────────────────────────── */
const form = document.getElementById("leadForm");
const status = document.getElementById("formStatus");

const FIELDS = [
  { input: document.getElementById("leadName"), message: "Укажите имя" },
  { input: document.getElementById("leadSchool"), message: "Укажите школу и город" },
  { input: document.getElementById("leadPhone"), message: "Укажите телефон для связи" },
].filter((field) => field.input);

function markField(field, invalid) {
  field.input.closest(".field")?.classList.toggle("is-error", invalid);
}

function validate() {
  let firstInvalid = null;

  FIELDS.forEach((field) => {
    const value = field.input.value.trim();
    const digitsOnly = value.replace(/\D/g, "");
    const invalid = field.input.type === "tel" ? digitsOnly.length < 10 : value.length < 2;
    markField(field, invalid);
    if (invalid && !firstInvalid) firstInvalid = field;
  });

  if (firstInvalid) {
    if (status) status.textContent = firstInvalid.message;
    firstInvalid.input.focus();
    return false;
  }
  return true;
}

FIELDS.forEach((field) => {
  field.input.addEventListener("input", () => {
    markField(field, false);
    if (status && status.dataset.state !== "ok") status.textContent = "";
  });
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  FIELDS.forEach((field) => markField(field, false));
  if (status) {
    status.textContent = "";
    delete status.dataset.state;
  }
  if (!validate()) return;

  const lead = {
    name: document.getElementById("leadName").value.trim(),
    school: document.getElementById("leadSchool").value.trim(),
    phone: document.getElementById("leadPhone").value.trim(),
    students: studentsInput ? Number(studentsInput.value) : null,
    page: location.href,
    sentAt: new Date().toISOString(),
  };

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Отправляем…";

  try {
    if (CONFIG.leadEndpoint) {
      const response = await fetch(CONFIG.leadEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!response.ok) throw new Error("status " + response.status);
    } else {
      const saved = JSON.parse(localStorage.getItem("vi_leads") || "[]");
      saved.push(lead);
      localStorage.setItem("vi_leads", JSON.stringify(saved));
      console.info("[демо] заявка сохранена локально:", lead);
    }

    form.reset();
    if (status) {
      status.textContent = "Заявка принята. Свяжусь в течение рабочего дня.";
      status.dataset.state = "ok";
    }
  } catch (error) {
    console.error(error);
    if (status) status.textContent = "Не удалось отправить. Повторите попытку через минуту.";
  } finally {
    button.disabled = false;
    button.textContent = "Отправить";
  }
});
