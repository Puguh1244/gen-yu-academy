import { B, language, setLanguage } from "./i18n.js";
import { db, configured, result } from "../services/supabase.js";
import { field, bindForm, escapeHTML as e, showStatus } from "./ui.js";

const portals = [
  {id:"parent", label:["Parent","Orang Tua"], title:["Follow their little steps.","Ikuti langkah kecil anak."], description:["See your child’s progress, class activities, messages and school fees.","Lihat perkembangan anak, kegiatan kelas, pesan, dan informasi biaya sekolah."], icon:'<circle cx="9" cy="8" r="3"/><circle cx="18" cy="11" r="2"/><path d="M3 22v-4a6 6 0 0 1 12 0v4m1-5a4 4 0 0 1 6 3v2"/>'},
  {id:"teacher", label:["Teacher","Guru"], title:["Help little minds grow.","Dampingi anak bertumbuh."], description:["Manage class activities, learning progress, assignments and family communication.","Kelola kegiatan kelas, perkembangan belajar, tugas, dan komunikasi dengan orang tua."], icon:'<path d="M3 5c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2V5Zm9 2v15"/>'},
  {id:"admin", label:["Admin","Admin"], title:["Keep the school connected.","Kelola layanan sekolah."], description:["Manage school records, accounts, admissions, announcements and payments.","Kelola data sekolah, akun, pendaftaran, pengumuman, dan pembayaran."], icon:'<rect x="4" y="3" width="16" height="19" rx="2"/><path d="M8 8h8m-8 5h8m-8 5h5"/>'}
];
let selectedPortal = null;
try { const role = new URLSearchParams(location.search).get("role"); if(portals.some(p=>p.id===role)) selectedPortal=role; } catch {}

export function loginView(root,onLogin){
  document.documentElement.lang=language;
  const chosen=portals.find(p=>p.id===selectedPortal);
  root.innerHTML=`<section class="login-intro"><div><p class="eyebrow">${B("WELCOME TO GEN-YU ACADEMY","SELAMAT DATANG DI GEN-YU ACADEMY")}</p><h1>${B("Your school. Your space.","Ruang untuk komunitas sekolah.")}</h1><p>${B("Choose your portal to sign in with your school account.","Pilih portal untuk masuk dengan akun sekolah Anda.")}</p></div><button type="button" class="btn secondary" id="login-language">${B("Bahasa Indonesia","English")}</button></section>
  <div class="login-roles">${portals.map(p=>`<article class="login-role ${p.id===selectedPortal?'selected':''}" data-role-card="${p.id}"><div class="role-icon ${p.id}"><svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p.icon}</svg></div><p class="eyebrow">${B("PORTAL","PORTAL")} ${e(B(...p.label).toUpperCase())}</p><h2>${B(...p.title)}</h2><p>${B(...p.description)}</p><button class="btn ${p.id===selectedPortal?'':'secondary'}" data-login-role="${p.id}" aria-pressed="${p.id===selectedPortal}" aria-controls="login-panel">${B("Sign in as ","Masuk sebagai ")}${B(...p.label)} <span aria-hidden="true">↗</span></button></article>`).join('')}</div>
  <section id="login-panel" class="login-panel" ${chosen?'':'hidden'}>${chosen?`<div class="login-panel-heading"><div><span class="badge">${B(...chosen.label)}</span><h2>${B("Sign in to your account","Masuk ke akun Anda")}</h2></div><button type="button" class="link" id="change-portal">${B("Change portal","Ganti portal")}</button></div>${!configured?`<p class="notice">${B("Supabase is not connected yet. The login form will become available after the school configuration is installed.","Supabase belum terhubung. Formulir login dapat digunakan setelah konfigurasi sekolah dipasang.")}</p>`:''}<form id="login"><fieldset ${configured?'':'disabled'}><div class="login-fields">${field("email",B("Email address","Alamat email"),"email")}${field("password",B("Password","Kata sandi"),"password")}</div><button type="submit" class="btn">${B("Sign in as ","Masuk sebagai ")}${B(...chosen.label)}</button></fieldset></form><p class="small muted">${B("Use the account assigned by the school. For an account or password reset, contact school administration.","Gunakan akun yang diberikan sekolah. Untuk akun baru atau pemulihan kata sandi, hubungi administrasi sekolah.")}</p>`:''}</section>
  <div class="login-help"><p>${B("Your account determines your access. Choosing a portal does not change your account role.","Hak akses mengikuti akun Anda. Memilih portal tidak mengubah peran akun.")}</p>${!configured?`<a href="panduan-supabase.html">${B("Supabase setup guide","Panduan pemasangan Supabase")}</a>`:''}<a href="index.html#portal">${B("Try the interactive demo","Coba demo interaktif")} ↗</a></div>`;
  document.getElementById('login-language').onclick=()=>{setLanguage(language==='en'?'id':'en');loginView(root,onLogin)};
  root.querySelectorAll('[data-login-role]').forEach(button=>button.onclick=()=>{selectedPortal=button.dataset.loginRole;showStatus('');loginView(root,onLogin);const panel=document.getElementById('login-panel');panel.scrollIntoView({behavior:'smooth',block:'nearest'});if(configured)document.querySelector('#login [name=email]').focus();});
  const change=document.getElementById('change-portal');if(change)change.onclick=()=>{const previous=selectedPortal;selectedPortal=null;showStatus('');loginView(root,onLogin);root.querySelector(`[data-login-role="${previous}"]`).focus()};
  if(chosen){document.querySelector('#login [name=email]').autocomplete='username';document.querySelector('#login [name=password]').autocomplete='current-password';}
  if(configured&&chosen)bindForm('login',async f=>{
    const requestedRole=chosen.id;
    showStatus(B('Signing in…','Sedang masuk…'));
    await result(db.auth.signInWithPassword({email:f.get('email').trim(),password:f.get('password')}));
    // Verify the database role before invoking the dashboard. Never write a role here.
    try { const profile=await account(requestedRole);if(!profile)throw Error(B('Unable to verify your account. Please sign in again.','Akun belum dapat diverifikasi. Silakan masuk kembali.')); }
    catch(error){await db.auth.signOut({scope:'local'});throw error;}
    showStatus('');await onLogin();
  });
}
export async function account(expectedRole=null){
  if(!db)return null;
  const {data:{user},error}=await db.auth.getUser();if(error||!user)return null;
  const profile=await result(db.from('profiles').select('id,display_name,role,active').eq('id',user.id).maybeSingle());
  if(!profile?.active||!portals.some(p=>p.id===profile.role)){
    await db.auth.signOut({scope:'local'});
    throw Error(B('Your school profile is not active. Please contact administration.','Profil sekolah Anda belum aktif. Silakan hubungi administrasi.'));
  }
  if(expectedRole&&profile.role!==expectedRole){
    await db.auth.signOut({scope:'local'});
    throw Error(B('This account does not match the selected portal. Choose the portal assigned to your account.','Akun ini tidak sesuai dengan portal yang dipilih. Pilih portal sesuai peran akun Anda.'));
  }
  return profile;
}
export async function signOut(){if(db)await result(db.auth.signOut());}
