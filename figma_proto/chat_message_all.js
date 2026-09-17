const I = {
  mute: "assets/icons/mute.svg",
  reply: "assets/icons/reply.svg",
  save: "assets/icons/save.svg",
  forward: "assets/icons/forward.svg",
  delete: "assets/icons/delete.svg",
  multi: "assets/icons/select_menu.svg"
};

const phone = document.getElementById("phone");
const ctxOverlay = document.getElementById("ctxOverlay");
const ctxMenu = document.getElementById("ctxMenu");
const floatVideo = document.getElementById("floatVideo");
const toastEl = document.getElementById("toast");
const inputBox = document.getElementById("inputBox");
const replyPreview = document.getElementById("replyPreview");
const forwardBar = document.getElementById("forwardBar");
const plusPanel = document.getElementById("plusPanel");
const deleteSheet = document.getElementById("deleteSheet");
const sheetOverlay = document.getElementById("sheetOverlay");
const selectCount = document.getElementById("selectCount");
const selForward = document.getElementById("selForward");
const selDelete = document.getElementById("selDelete");
const msgInput = document.getElementById("msgInput");

let activeMsg = null;
let selected = new Set();
let toastTimer = null;
let pressTimer = null;
let deleteTargets = [];

const MENUS = {
  video: [
    { key: "mute", label: "静音播放", icon: I.mute },
    { key: "reply", label: "回复", icon: I.reply },
    { key: "save", label: "保存视频", icon: I.save },
    { key: "forward", label: "转发", icon: I.forward, flip: true },
    { key: "delete", label: "删除", icon: I.delete, danger: true },
    { key: "multi", label: "多选", icon: I.multi }
  ],
  text: [
    { key: "reply", label: "回复", icon: I.reply },
    { key: "forward", label: "转发", icon: I.forward, flip: true },
    { key: "delete", label: "删除", icon: I.delete, danger: true },
    { key: "multi", label: "多选", icon: I.multi }
  ],
  expired: [
    { key: "reply", label: "回复", icon: I.reply },
    { key: "forward", label: "转发", icon: I.forward, flip: true },
    { key: "delete", label: "删除", icon: I.delete, danger: true },
    { key: "multi", label: "多选", icon: I.multi }
  ]
};

function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1600);
}

function menuType(type) {
  if (type === "video") return "video";
  if (type === "video-expired" || type === "image-expired") return "expired";
  return "text";
}

function syncSendState() {
  phone.classList.toggle(
    "can-send",
    msgInput.value.trim().length > 0 || inputBox.classList.contains("replying")
  );
}

function closeCtx() {
  ctxOverlay.classList.remove("show");
  floatVideo.classList.remove("show");
  document.querySelectorAll(".bubble.highlight").forEach((b) => b.classList.remove("highlight"));
  activeMsg = null;
}

function openCtx(row, clientX, clientY) {
  if (phone.classList.contains("selecting")) return;
  activeMsg = row;
  const type = row.dataset.type;
  const items = MENUS[menuType(type)];
  ctxMenu.innerHTML = items
    .map(
      (it) => `
    <button class="ctx-item ${it.danger ? "danger" : ""}" data-action="${it.key}">
      <span>${it.label}</span>
      <span class="menu-ico">
        <img class="ico" src="${it.icon}" alt="" style="${it.flip ? "transform:scaleX(-1)" : ""}">
      </span>
    </button>`
    )
    .join("");

  row.querySelector("[data-msg]").classList.add("highlight");
  floatVideo.classList.toggle("show", type === "video");

  const phoneRect = phone.getBoundingClientRect();
  const scaleX = phone.clientWidth / phoneRect.width;
  const scaleY = phone.clientHeight / phoneRect.height;
  let left = (clientX - phoneRect.left) * scaleX - 104;
  let top = (clientY - phoneRect.top) * scaleY + 12;
  left = Math.max(16, Math.min(left, phone.clientWidth - 224));
  top = Math.max(120, Math.min(top, phone.clientHeight - 340));

  if (type === "video") {
    ctxMenu.style.right = "16px";
    ctxMenu.style.left = "auto";
    ctxMenu.style.top = "338px";
  } else {
    ctxMenu.style.left = left + "px";
    ctxMenu.style.right = "auto";
    ctxMenu.style.top = top + "px";
  }

  ctxOverlay.classList.add("show");
  plusPanel.classList.remove("show");
}

function enterSelect(seedId) {
  closeCtx();
  phone.classList.add("selecting");
  selected.clear();
  if (seedId) selected.add(seedId);
  document.querySelectorAll(".msg-row").forEach((row) => {
    row.classList.add("select-mode");
    row.querySelector(".check").classList.toggle("on", selected.has(row.dataset.id));
  });
  syncSelectUI();
}

function exitSelect() {
  phone.classList.remove("selecting");
  selected.clear();
  document.querySelectorAll(".msg-row").forEach((row) => {
    row.classList.remove("select-mode");
    row.querySelector(".check").classList.remove("on");
  });
  syncSelectUI();
}

function syncSelectUI() {
  selectCount.innerHTML = `选择了<span class="n">${selected.size}</span>条信息`;
  const has = selected.size > 0;
  selForward.disabled = !has;
  selDelete.disabled = !has;
}

function toggleSelect(row) {
  const id = row.dataset.id;
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  row.querySelector(".check").classList.toggle("on", selected.has(id));
  syncSelectUI();
}

function openDeleteSheet(ids) {
  deleteTargets = ids;
  closeCtx();
  sheetOverlay.classList.add("show");
  deleteSheet.classList.add("show");
}

function closeDeleteSheet() {
  sheetOverlay.classList.remove("show");
  deleteSheet.classList.remove("show");
  deleteTargets = [];
}

function removeMessages(ids) {
  ids.forEach((id) => {
    const row = document.querySelector(`.msg-row[data-id="${id}"]`);
    if (row) row.remove();
  });
  closeDeleteSheet();
  exitSelect();
  toast("已删除");
}

function startReply(preview, type) {
  const text =
    type === "video" || type === "image-expired" || type === "video-expired"
      ? type.indexOf("video") >= 0
        ? "[视频]"
        : "[图片]"
      : preview;
  replyPreview.textContent = text;
  inputBox.classList.add("replying");
  msgInput.focus();
  syncSendState();
}

function clearReply() {
  inputBox.classList.remove("replying");
  syncSendState();
}

function goForward(count) {
  location.href = "chat_forward.html?count=" + encodeURIComponent(count || 1);
}

function sendMessage() {
  if (!msgInput.value.trim() && !inputBox.classList.contains("replying")) return;
  const text = msgInput.value.trim() || "收到";
  const row = document.createElement("div");
  row.className = "msg-row sent";
  row.dataset.id = "m" + Date.now();
  row.dataset.type = "text";
  row.dataset.preview = text;
  row.innerHTML = `
    <div class="check"><img class="ico-on" src="assets/icons/radio_on.svg" alt=""></div>
    <div class="bubble sent" data-msg>
      <div class="bubble-text"></div>
      <div class="meta">
        <span>刚刚</span>
        <span class="read">
          <img class="ico" src="assets/icons/read_a.svg" alt="">
          <img class="ico" src="assets/icons/read_b.svg" alt="">
        </span>
      </div>
    </div>`;
  row.querySelector(".bubble-text").textContent = text;
  document.getElementById("chatScroll").appendChild(row);
  bindLongPress(row);
  msgInput.value = "";
  clearReply();
  forwardBar.classList.remove("show");
  plusPanel.classList.remove("show");
  syncSendState();
  row.scrollIntoView({ behavior: "smooth", block: "end" });
}

function bindLongPress(row) {
  const bubble = row.querySelector("[data-msg]");
  const start = (e) => {
    if (phone.classList.contains("selecting")) return;
    const point = e.touches ? e.touches[0] : e;
    pressTimer = setTimeout(() => {
      openCtx(row, point.clientX, point.clientY);
      if (navigator.vibrate) navigator.vibrate(20);
    }, 420);
  };
  const clear = () => clearTimeout(pressTimer);
  bubble.addEventListener("mousedown", start);
  bubble.addEventListener("touchstart", start, { passive: true });
  ["mouseup", "mouseleave", "touchend", "touchmove", "touchcancel"].forEach((ev) => {
    bubble.addEventListener(ev, clear, { passive: true });
  });
  bubble.addEventListener("click", (e) => {
    if (phone.classList.contains("selecting")) {
      e.preventDefault();
      toggleSelect(row);
    }
  });
  bubble.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openCtx(row, e.clientX, e.clientY);
  });
}

document.querySelectorAll(".msg-row").forEach(bindLongPress);

ctxMenu.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn || !activeMsg) return;
  const action = btn.dataset.action;
  const preview = activeMsg.dataset.preview || "";
  const id = activeMsg.dataset.id;
  const type = activeMsg.dataset.type;

  if (action === "mute") {
    closeCtx();
    toast("静音播放中");
  } else if (action === "save") {
    closeCtx();
    toast("视频已保存");
  } else if (action === "forward") {
    closeCtx();
    goForward(1);
  } else if (action === "reply") {
    closeCtx();
    startReply(preview, type);
  } else if (action === "delete") {
    openDeleteSheet([id]);
  } else if (action === "multi") {
    enterSelect(id);
  }
});

document.getElementById("ctxDim").addEventListener("click", closeCtx);
document.getElementById("replyClose").addEventListener("click", clearReply);
document.getElementById("forwardClose").addEventListener("click", () => forwardBar.classList.remove("show"));
document.getElementById("btnCancelSelect").addEventListener("click", exitSelect);
document.getElementById("btnClearBack").addEventListener("click", exitSelect);
document.getElementById("btnClearAll").addEventListener("click", () => {
  if (!selected.size) {
    document.querySelectorAll(".msg-row").forEach((row) => selected.add(row.dataset.id));
    document.querySelectorAll(".check").forEach((c) => c.classList.add("on"));
    syncSelectUI();
  }
  openDeleteSheet([...selected]);
});

selForward.addEventListener("click", () => goForward(selected.size || 1));
selDelete.addEventListener("click", () => openDeleteSheet([...selected]));
document.getElementById("sheetDim").addEventListener("click", closeDeleteSheet);
document.getElementById("delMine").addEventListener("click", () => removeMessages(deleteTargets));
document.getElementById("delBoth").addEventListener("click", () => removeMessages(deleteTargets));
document.getElementById("btnPlus").addEventListener("click", () => plusPanel.classList.toggle("show"));
plusPanel.addEventListener("click", (e) => {
  const item = e.target.closest("[data-toast]");
  if (!item) return;
  const t = item.dataset.toast;
  if (t === "红包") {
    location.href = "chat_redpacket.html";
    return;
  }
  if (t === "私聊转账" || t === "转账") {
    location.href = "chat_transfer.html";
    return;
  }
  if (t === "视频通话") {
    location.href = "chat_video_call.html";
    return;
  }
  if (t === "名片") {
    location.href = "chat_card_pick.html";
    return;
  }
  toast(t);
});
document.getElementById("btnEmoji").addEventListener("click", () => toast("表情面板"));
document.getElementById("btnMic").addEventListener("click", () => toast("按住说话"));
document.getElementById("btnSend").addEventListener("click", sendMessage);
document.getElementById("btnBack").addEventListener("click", () => {
  if (history.length > 1) history.back();
  else toast("返回消息列表");
});

msgInput.addEventListener("input", syncSendState);
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

const params = new URLSearchParams(location.search);
if (params.get("mode") === "select") enterSelect("m1");
if (params.get("mode") === "reply") startReply("看得到吗", "video");
if (params.get("mode") === "forward") {
  forwardBar.classList.add("show");
  document.getElementById("forwardText").textContent = `转发${params.get("count") || 1}条消息`;
}
