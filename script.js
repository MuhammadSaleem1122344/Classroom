// ===== Supabase Init =====
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://xvfwbhvjdvlyspulvdtn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2ZndiaHZqZHZseXNwdWx2ZHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNzU0MDEsImV4cCI6MjA2ODY1MTQwMX0.pNFl_hUxvY3V2TU-qne7jRvcd34LD30kvHWmDzkCq54";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== Utils =====
const uid = (len = 6) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

const toast = (msg) => {
  alert(msg); // agar chaho to bootstrap toast use kar lena
};

const escapeHtml = (s = "") =>
  s.replace(/[&<>"']/g, (ch) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch])
  );

// ===== DOM Refs =====
const refs = {
  classesMenu: document.getElementById("classesMenu"),
  currentClassName: document.getElementById("currentClassName"),
  heroClassName: document.getElementById("heroClassName"),
  heroClassSection: document.getElementById("heroClassSection"),
  heroClassCode: document.getElementById("heroClassCode"),

  // Stream
  postInput: document.getElementById("postInput"),
  postBtn: document.getElementById("postBtn"),
  postsWrap: document.getElementById("postsWrap"),

  // Classwork
  assTitle: document.getElementById("assTitle"),
  assDue: document.getElementById("assDue"),
  assDesc: document.getElementById("assDesc"),
  assFile: document.getElementById("assFile"),
  assCreateBtn: document.getElementById("assCreateBtn"),
  assList: document.getElementById("assList"),

  // People
  teachersList: document.getElementById("teachersList"),
  studentsList: document.getElementById("studentsList"),
};

let currentClass = null;

// ===== Supabase API Wrappers =====
const api = {
  async createClass(name, section) {
    const code = uid(6);
    const { data, error } = await supabase
      .from("classes")
      .insert([{ name, section, code }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async fetchClasses() {
    const { data, error } = await supabase.from("classes").select("*");
    if (error) throw error;
    return data;
  },

  async findClassByCode(code) {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("code", code)
      .single();
    if (error) throw error;
    return data;
  },

  // Assignments
  async createAssignment(classId, title, due, desc) {
    const { data, error } = await supabase
      .from("assignments")
      .insert([{ class_id: classId, title, due_date: due, description: desc }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async fetchAssignments(classId) {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId);
    if (error) throw error;
    return data;
  },

  // People
  async createPerson(name, email, role) {
    const { data, error } = await supabase
      .from("people")
      .insert([{ name, email, role }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async addPersonToClass(person_id, class_id) {
    const { data, error } = await supabase
      .from("class_people")
      .insert([{ class_id, person_id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async getPeopleInClass(classId) {
    const { data: cp, error: cpErr } = await supabase
      .from("class_people")
      .select("person_id")
      .eq("class_id", classId);
    if (cpErr) throw cpErr;
    if (!cp?.length) return [];
    const ids = cp.map((x) => x.person_id);
    const { data: people, error: pErr } = await supabase
      .from("people")
      .select("id,name,email,role")
      .in("id", ids);
    if (pErr) throw pErr;
    return people;
  },

  // Posts
  async createPost(classId, text) {
    const { data, error } = await supabase
      .from("posts")
      .insert([{ class_id: classId, content: text }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async fetchPosts(classId) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
};

// ===== Rendering =====
const render = {
  classesDropdown(classes) {
    refs.classesMenu.innerHTML = "";
    if (!classes.length) {
      refs.classesMenu.innerHTML =
        '<li><span class="dropdown-item-text text-muted">No classes</span></li>';
      return;
    }
    classes.forEach((c) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <button class="dropdown-item d-flex justify-content-between align-items-center">
          <span><i class="bi bi-collection me-2"></i>${c.name}</span>
          <span class="badge text-bg-light">${c.code}</span>
        </button>
      `;
      li.querySelector("button").addEventListener("click", async () => {
        currentClass = c;
        render.header();
        await render.posts();
        await render.classwork();
        await render.people();
      });
      refs.classesMenu.appendChild(li);
    });
  },

  header() {
    if (!currentClass) {
      refs.currentClassName.textContent = "No Class";
      refs.heroClassName.textContent = "Welcome";
      refs.heroClassSection.textContent =
        "Create or join a class to get started.";
      refs.heroClassCode.textContent = "—";
      return;
    }
    refs.currentClassName.textContent = currentClass.name;
    refs.heroClassName.textContent = currentClass.name;
    refs.heroClassSection.textContent = currentClass.section || "—";
    refs.heroClassCode.textContent = currentClass.code;
  },

  async posts() {
    refs.postsWrap.innerHTML = "";
    if (!currentClass) return;
    const posts = await api.fetchPosts(currentClass.id);
    if (!posts.length) {
      refs.postsWrap.innerHTML = `<div class="text-muted">No posts yet.</div>`;
      return;
    }
    posts.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card shadow-sm";
      card.innerHTML = `
        <div class="card-body">
          <p class="mb-1">${escapeHtml(p.content)}</p>
          <small class="text-muted">${new Date(
            p.created_at
          ).toLocaleString()}</small>
        </div>
      `;
      refs.postsWrap.appendChild(card);
    });
  },

  async classwork() {
    refs.assList.innerHTML = "";
    if (!currentClass) return;
    const assignments = await api.fetchAssignments(currentClass.id);
    if (!assignments.length) {
      refs.assList.innerHTML =
        `<div class="text-muted">No assignments yet.</div>`;
      return;
    }
    assignments.forEach((a) => {
      const col = document.createElement("div");
      col.className = "col-md-6";
      col.innerHTML = `
        <div class="card ass shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${escapeHtml(a.title)}</h5>
            <p class="due mb-1">Due: ${
              a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"
            }</p>
            <p class="text-muted small">${escapeHtml(a.description || "")}</p>
          </div>
        </div>`;
      refs.assList.appendChild(col);
    });
  },

  async people() {
    refs.teachersList.innerHTML = "";
    refs.studentsList.innerHTML = "";
    if (!currentClass) return;
    const members = await api.getPeopleInClass(currentClass.id);
    members.forEach((m) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `${m.name} (${m.email})`;
      if (m.role?.toLowerCase() === "teacher")
        refs.teachersList.appendChild(li);
      else refs.studentsList.appendChild(li);
    });
  },
};

// ===== Events =====

// Post in stream
refs.postBtn.addEventListener("click", async () => {
  if (!currentClass) return toast("Select a class first");
  const text = refs.postInput.value.trim();
  if (!text) return;
  try {
    await api.createPost(currentClass.id, text);
    refs.postInput.value = "";
    await render.posts();
  } catch (err) {
    toast("Failed to post");
    console.error(err);
  }
});

// Create assignment
refs.assCreateBtn.addEventListener("click", async () => {
  if (!currentClass) return toast("Select a class first");
  const title = refs.assTitle.value.trim();
  if (!title) return;
  try {
    await api.createAssignment(
      currentClass.id,
      title,
      refs.assDue.value || null,
      refs.assDesc.value.trim()
    );
    refs.assTitle.value = refs.assDue.value = refs.assDesc.value = "";
    await render.classwork();
  } catch (err) {
    toast("Failed to create assignment");
    console.error(err);
  }
});

// Create class
document.getElementById("createClassForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const name = fd.get("name").toString().trim();
  const section = fd.get("section").toString().trim();
  if (!name) return;
  try {
    const cls = await api.createClass(name, section);
    currentClass = cls;
    await loadAllClasses();
    render.header();
    bootstrap.Modal.getInstance(document.getElementById("createClassModal"))?.hide();
    e.target.reset();
  } catch (err) {
    toast("Failed to create class");
    console.error(err);
  }
});

// Join class
document.getElementById("joinClassForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const code = fd.get("code").toString().trim();
  if (!code) return;
  try {
    const cls = await api.findClassByCode(code);
    currentClass = cls;
    await loadAllClasses();
    render.header();
    await render.posts();
    await render.classwork();
    await render.people();
    bootstrap.Modal.getInstance(document.getElementById("joinClassModal"))?.hide();
    e.target.reset();
  } catch (err) {
    toast("Invalid class code");
    console.error(err);
  }
});

// Add person
document.getElementById("addPersonForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentClass) return toast("Select a class first");
  const fd = new FormData(e.target);
  const name = fd.get("name").toString().trim();
  const email = fd.get("email").toString().trim();
  const role = fd.get("role").toString().trim().toLowerCase();
  if (!["teacher", "student"].includes(role)) return toast("Invalid role");
  try {
    const person = await api.createPerson(name, email, role);
    await api.addPersonToClass(person.id, currentClass.id);
    toast(`${role} added to class`);
    await render.people();
    bootstrap.Modal.getInstance(document.getElementById("addPersonModal"))?.hide();
    e.target.reset();
  } catch (err) {
    toast("Failed to add person");
    console.error(err);
  }
});

// ===== Load Classes =====
async function loadAllClasses() {
  try {
    const classes = await api.fetchClasses();
    render.classesDropdown(classes);
  } catch (err) {
    toast("Failed to load classes");
    console.error(err);
  }
}

// ===== Init =====
window.addEventListener("load", () => {
  loadAllClasses();
});
