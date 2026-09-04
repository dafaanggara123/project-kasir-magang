import React,{useEffect,useMemo,useRef,useState} from 'react';
import {
  BrowserRouter,
  useNavigate,
  useLocation,
  Link,
  NavLink,
  Routes,
  Route
} from 'react-router-dom';

import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  MapPin,
  Minus,
  Package,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
  WalletCards,
  X
} from 'lucide-react';

const API =
  import.meta.env.VITE_API_URL ||
  'http://localhost:4000/api';

const money = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(n || 0));

const fmtDate = (v) => {
  if (!v) return '-';

  const d = new Date(v);

  if (Number.isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d);
};

const labels = {
  pending: 'Menunggu',
  confirmed: 'Diterima',
  preparing: 'Sedang Disiapkan',
  ready: 'Siap Diambil',
  completed: 'Selesai',
  cancelled: 'Ditolak'
};

const paymentState = (order) =>
  order?.status === 'completed'
    ? 'paid'
    : 'pending';

const paymentLabel = (order) =>
  paymentState(order) === 'paid'
    ? 'LUNAS'
    : 'MENUNGGU';

function App() {
  const [token,setToken] =
    useState(localStorage.getItem('p1_token'));

  const [profile,setProfile] =
    useState(null);

  const [toast,setToast] =
    useState(null);

  const show = (text,type='success') =>
    setToast({text,type});

  useEffect(() => {
    if (!toast) return;

    const t = setTimeout(
      () => setToast(null),
      3500
    );

    return () => clearTimeout(t);
  }, [toast]);

  const api = async (
    path,
    opt={}
  ) => {
    const headers = {
      ...(opt.body instanceof FormData
        ? {}
        : {
            'Content-Type':
              'application/json'
          }),
      ...(token
        ? {
            Authorization:
              `Bearer ${token}`
          }
        : {}),
      ...(opt.headers || {})
    };

    const r = await fetch(
      API + path,
      {
        ...opt,
        headers
      }
    );

    const d =
      await r.json().catch(
        () => ({})
      );

    if (!r.ok) {
      if (r.status === 401) {
        localStorage.removeItem(
          'p1_token'
        );
        setToken(null);
        setProfile(null);
      }

      throw new Error(
        d.error ||
        'Request gagal.'
      );
    }

    return d;
  };

  useEffect(() => {
  if (!token || profile) {
    return;
  }

  api('/me')
    .then((x) => {
      if (x?.profile) {
        setProfile(
          x.profile
        );
      }
    })
    .catch((error) => {
      console.error(
        'Gagal memuat profil:',
        error
      );

      localStorage.removeItem(
        'p1_token'
      );

      setToken(
        null
      );

      setProfile(
        null
      );
    });

}, [token, profile]);

  const logout = () => {
    localStorage.removeItem(
      'p1_token'
    );

    setToken(null);
    setProfile(null);
  };

  if (!token) {
    return (
      <Auth
        show={show}
        onLogin={(s,p) => {
          localStorage.setItem(
            'p1_token',
            s.access_token
          );

          setToken(
            s.access_token
          );

          setProfile(p);
        }}
      />
    );
  }

  if (!profile) {
    return (
      <div className="loading-screen">

  <div className="loading-spinner"/>

  <strong>
    Memuat akun...
  </strong>

  <span>
    Menyiapkan data pelanggan
  </span>

</div>
    );
  }

  return (
    <BrowserRouter>
      <>
        {profile.role === 'cashier' ? (
          <CashierApp
            profile={profile}
            api={api}
            show={show}
            logout={logout}
          />
        ) : (
          <CustomerApp
            profile={profile}
            api={api}
            show={show}
            logout={logout}
            onProfileUpdate={setProfile}
          />
        )}

        {toast && (
          <Toast {...toast} />
        )}
      </>
    </BrowserRouter>
  );
}

/* =========================================================
   AUTH
========================================================= */

function Auth({
  onLogin,
  show
}) {
  const [mode,setMode] =
    useState('login');

  const [fullName,setFullName] =
    useState('');

  const [email,setEmail] =
    useState('');

  const [password,setPassword] =
    useState('');

  const [loading,setLoading] =
    useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        mode === 'login'
          ? '/auth/login'
          : '/auth/signup';

      const body =
        mode === 'login'
          ? {
              email,
              password
            }
          : {
              fullName,
              email,
              password
            };

      const r = await fetch(
        API + endpoint,
        {
          method:'POST',
          headers:{
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify(body)
        }
      );

      const d =
        await r.json();

      if (!r.ok) {
        throw new Error(
          d.error ||
          'Proses gagal.'
        );
      }

      if (
        mode === 'register'
      ) {
        show(
          d.message ||
          'Registrasi berhasil.'
        );

        setMode(
          'login'
        );
      } else {
        onLogin(
          d.session,
          d.profile
        );
      }

    } catch(e) {
      show(
        e.message,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-visual">

        <div className="auth-logo">
          <div className="logo-mark">
            G
          </div>

          <div>
            <strong>
              Geprek Dapoersari
            </strong>

            <span>
              Ayam Geprek Order Center
            </span>
          </div>
        </div>

        <span className="eyebrow light">
          SMART ORDERING SYSTEM
        </span>

        <h1>
          Pesan lebih cepat.
          <br />
          Kelola lebih rapi.
        </h1>

        <p>
          Satu sistem untuk pelanggan
          dan kasir, terhubung langsung
          ke database Supabase.
        </p>

        <div className="auth-features">
          <Feature
            icon={<ShoppingBag />}
            text="Menu digital & keranjang pelanggan"
          />

          <Feature
            icon={<ReceiptText />}
            text="Kasir menerima dan memproses pesanan"
          />

          <Feature
            icon={<Bell />}
            text="Notifikasi saat pesanan disiapkan"
          />
        </div>

      </div>

      <div className="auth-card">

        <div className="auth-tabs">

          <button
            className={
              mode === 'login'
                ? 'active'
                : ''
            }
            onClick={() =>
              setMode('login')
            }
          >
            Masuk
          </button>

          <button
            className={
              mode === 'register'
                ? 'active'
                : ''
            }
            onClick={() =>
              setMode('register')
            }
          >
            Register
          </button>

        </div>

        <span className="eyebrow">
          {
            mode === 'login'
              ? 'WELCOME BACK'
              : 'CUSTOMER REGISTRATION'
          }
        </span>

        <h2>
          {
            mode === 'login'
              ? 'Masuk ke GeprekFlow'
              : 'Buat akun pelanggan'
          }
        </h2>

        <p className="auth-sub">
          {
            mode === 'login'
              ? 'Login pelanggan dan kasir menggunakan Supabase Auth.'
              : 'Akun register otomatis menjadi pelanggan.'
          }
        </p>

        <form
          onSubmit={submit}
          className="form-stack"
        >

          {mode === 'register' && (
            <label>
              Nama Lengkap

              <input
                value={fullName}
                onChange={(e) =>
                  setFullName(
                    e.target.value
                  )
                }
                required
              />
            </label>
          )}

          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              minLength="6"
              required
            />
          </label>

          <button
            className="primary-button"
            disabled={loading}
          >
            {
              loading
                ? 'Memproses...'
                : mode === 'login'
                ? 'Masuk'
                : 'Buat Akun'
            }
          </button>

        </form>

        <div className="secure-note">
          <ShieldCheck size={14}/>
          Supabase Auth + Row Level Security
        </div>

      </div>

    </div>
  );
}

function Feature({
  icon,
  text
}) {
  return (
    <div className="feature">

      <div>
        {React.cloneElement(
          icon,
          {size:16}
        )}
      </div>

      <span>
        {text}
      </span>

    </div>
  );
}

function Toast({
  text,
  type
}) {
  return (
    <div
      className={
        `app-toast ${type}`
      }
    >
      <div className="toast-icon">
        {
          type === 'error'
            ? '!'
            : '✓'
        }
      </div>

      <div>
        <strong>
          {
            type === 'error'
              ? 'Perhatian'
              : 'Berhasil'
          }
        </strong>

        <span>
          {text}
        </span>
      </div>

      <div className="toast-progress"/>
    </div>
  );
}

/* =========================================================
   SHARED UI
========================================================= */

function SideLink({
  to,
  end,
  icon,
  text
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `side-link ${isActive ? 'active' : ''}`
      }
    >
      {React.cloneElement(icon, { size: 17 })}
      <span>{text}</span>
    </NavLink>
  );
}

function Status({ status }) {
  return (
    <span className={`status-pill ${status || ''}`}>
      {labels[status] || status || '-'}
    </span>
  );
}

/* =========================================================
   CUSTOMER
========================================================= */

function CustomerApp({
  profile,
  api,
  show,
  logout,
  onProfileUpdate
}) {
  return (
    <div className="customer-store-layout">

      <CustomerStoreSidebar
        profile={profile}
        logout={logout}
      />

      <main className="customer-store-main">

        <CustomerStoreHeader
          profile={profile}
        />

        <Routes>

          <Route
            path="*"
            element={
              <CustomerPages
                api={api}
                profile={profile}
                show={show}
                onProfileUpdate={onProfileUpdate}
              />
            }
          />

        </Routes>

      </main>

      <CustomerBottomNav/>

    </div>
  );
}

function CustomerStoreSidebar({
  profile,
  logout
}) {
  return (
    <aside className="customer-store-sidebar">

      <Link
        to="/"
        className="store-brand"
      >
        <div className="store-logo">
          G
        </div>

        <div>
          <strong>
            Geprek Dapoersari
          </strong>

          <span>
            Ayam Geprek
          </span>
        </div>
      </Link>


      <nav className="store-nav">

        <SideLink
          to="/"
          end
          icon={
            <LayoutDashboard />
          }
          text="Beranda"
        />

        <SideLink
          to="/menu"
          icon={
            <Utensils />
          }
          text="Menu"
        />

        <SideLink
          to="/keranjang"
          icon={
            <ShoppingBag />
          }
          text="Keranjang"
        />

        <SideLink
          to="/pesanan"
          icon={
            <ReceiptText />
          }
          text="Pesanan Saya"
        />

        <SideLink
          to="/pengaturan"
          icon={
            <Settings />
          }
          text="Pengaturan"
        />

      </nav>


      <div className="store-side-spacer" />


      <button
        type="button"
        className="store-logout"
        onClick={logout}
      >
        <LogOut size={15} />
        Keluar
      </button>

    </aside>
  );
}

function CustomerStoreHeader({
  profile
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery,setSearchQuery] = useState('');

  const count =
    Object.values(
      normalizeCart(
        readCart()
      )
    ).reduce(
      (s,item) =>
        s + Number(item?.quantity || 0),
      0
    );

  const isHome =
    location.pathname === '/';

  useEffect(() => {
    if (!isHome) {
      setSearchQuery('');
    }
  }, [isHome]);

  const submitSearch = () => {
    const value = searchQuery.trim();
    navigate(
      value
        ? `/menu?search=${encodeURIComponent(value)}`
        : '/menu'
    );
  };

  return (
    <header className="customer-store-header">

      <div className="customer-mobile-brand">

        <div className="store-logo small">
          G
        </div>

        <div>
          <strong>
            GeprekDapoersari
          </strong>

          <span>
            Ayam Geprek
          </span>
        </div>

      </div>

      {isHome ? (
        <div className="customer-search customer-home-search">
          <Search size={17}/>

          <input
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitSearch();
              }
            }}
            placeholder="Cari menu, minuman, atau tambahan..."
            aria-label="Cari menu"
          />
        </div>
      ) : (
        <div className="customer-header-spacer"/>
      )}

      <div className="customer-header-actions">

        <Link
          to="/pesanan"
          className="header-action"
        >
          <Bell size={18}/>
          <span>
            Pesanan
          </span>
        </Link>

        <Link
          to="/keranjang"
          className="cart-action"
        >
          <ShoppingBag size={19}/>
          <span>
            Keranjang
          </span>

          {count > 0 && (
            <b>{count}</b>
          )}
        </Link>

        <Link
          to="/pengaturan"
          className="customer-avatar-link"
        >
          {(profile.full_name || 'P')[0].toUpperCase()}
        </Link>

      </div>

    </header>
  );
}

function CustomerBottomNav() {
  return (
    <nav className="customer-bottom-nav">

      <SideLink
        to="/"
        end
        icon={<LayoutDashboard/>}
        text="Beranda"
      />

      <SideLink
        to="/menu"
        icon={<Utensils/>}
        text="Menu"
      />

      <SideLink
        to="/keranjang"
        icon={<ShoppingBag/>}
        text="Keranjang"
      />

      <SideLink
        to="/pesanan"
        icon={<ReceiptText/>}
        text="Pesanan"
      />

      <SideLink
        to="/pengaturan"
        icon={<Settings/>}
        text="Akun"
      />

    </nav>
  );
}

function CustomerPages({
  api,
  profile,
  show,
  onProfileUpdate
}) {
  return (
    <Routes>

      <Route
        path="/"
        element={
          <CustomerHome
            api={api}
            profile={profile}
          />
        }
      />

      <Route
        path="/menu"
        element={
          <CustomerMenu
            api={api}
            show={show}
          />
        }
      />

      <Route
        path="/keranjang"
        element={
          <CustomerCart
            api={api}
            profile={profile}
            show={show}
          />
        }
      />

      <Route
        path="/pesanan"
        element={
          <CustomerOrders
            api={api}
            show={show}
          />
        }
      />

      <Route
        path="/pengaturan"
        element={
          <SettingsPage
            api={api}
            profile={profile}
            show={show}
            onProfileUpdate={
              onProfileUpdate
            }
          />
        }
      />

    </Routes>
  );
}

function CustomerHome({
  api,
  profile
}) {
  const [
    menu,
    setMenu
  ] = useState([]);

  const [
    greeting,
    setGreeting
  ] = useState('Selamat datang');


  /* =====================================================
     LOAD MENU
  ===================================================== */

  useEffect(() => {

    api('/menu')
      .then(
        (data) =>
          setMenu(
            data || []
          )
      )
      .catch(
        () => {}
      );

  }, []);


  /* =====================================================
     GREETING BERDASARKAN JAM PERANGKAT
  ===================================================== */

  useEffect(() => {

    const updateGreeting = () => {

      const hour =
        new Date().getHours();

      if (
        hour >= 5 &&
        hour < 11
      ) {

        setGreeting(
          'Selamat pagi'
        );

      } else if (
        hour >= 11 &&
        hour < 15
      ) {

        setGreeting(
          'Selamat siang'
        );

      } else if (
        hour >= 15 &&
        hour < 18
      ) {

        setGreeting(
          'Selamat sore'
        );

      } else {

        setGreeting(
          'Selamat malam'
        );

      }

    };


    updateGreeting();


    /*
     * Periksa setiap 1 menit
     * agar sapaan berubah otomatis
     * ketika jam perangkat berubah.
     */
    const timer =
      setInterval(
        updateGreeting,
        60000
      );


    return () =>
      clearInterval(
        timer
      );

  }, []);


  /* =====================================================
     NAMA PELANGGAN
  ===================================================== */

  const customerName =
    (
      profile?.full_name ||
      'Pelanggan'
    )
      .trim()
      .split(/\s+/)[0];


  return (

    <div className="page-stack">


      {/* =================================================
         SAPAAN PELANGGAN
      ================================================= */}

      <section className="customer-welcome">

        <span className="eyebrow">
          WELCOME BACK
        </span>


        <h2>

          {greeting},{' '}

          <strong>
            {customerName}
          </strong>

          {' '}👋

        </h2>


        <p>
          Mau makan apa hari ini?
          Pilih menu favoritmu dan
          pesan dengan cepat.
        </p>

      </section>


      {/* =================================================
         HERO
      ================================================= */}

      <section className="customer-hero">

        <div>

          <span className="eyebrow light">
            AYAM GEPREK
          </span>


          <h1>
            Pedasnya pas.
            <br/>
            Pesannya cepat.
          </h1>


          <p>
            Pilih menu favorit,
            masukkan ke keranjang,
            lalu pantau status pesanan
            sampai siap diambil.
          </p>


          <Link
            to="/menu"
            className="primary-button hero-btn"
          >

            Pesan Sekarang

            <ArrowRight
              size={15}
            />

          </Link>

        </div>


        <div className="hero-plate">
          🍗
        </div>

      </section>


      {/* =================================================
         REKOMENDASI MENU
      ================================================= */}

      <div className="section-title-row">

        <div>

          <span className="eyebrow">
            REKOMENDASI
          </span>

          <h3>
            Menu Pilihan
          </h3>

        </div>


        <Link
          to="/menu"
          className="text-link"
        >

          Lihat semua

          <ChevronRight
            size={14}
          />

        </Link>

      </div>


      {/* =================================================
         PRODUCT GRID
      ================================================= */}

      <div className="product-grid">

        {menu
          .slice(
            0,
            6
          )
          .map(
            (item) => (

              <ProductCard
                key={
                  item.id
                }
                item={
                  item
                }
              />
            )
          )}
      </div>
    </div>
  );
}


function CustomerMenu({
  api,
  show
}) {
  const [
    menu,
    setMenu
  ] = useState([]);

  const [
    categories,
    setCategories
  ] = useState([]);

  const [
    query,
    setQuery
  ] = useState('');

  const [
    category,
    setCategory
  ] = useState('Semua');

  const [
    cart,
    setCart
  ] = useState(
    normalizeCart(
      loadCart()
    )
  );

  useEffect(() => {
    Promise.all([
      api('/menu'),
      api('/categories')
    ])
      .then(
        ([m, c]) => {
          setMenu(m || []);
          setCategories(c || []);
        }
      )
      .catch(
        (e) =>
          show(
            e.message,
            'error'
          )
      );
  }, []);


  useEffect(() => {
    saveCart(cart);
  }, [cart]);


  const visible =
    menu.filter(
      (item) => {

        const byCategory =
          category === 'Semua' ||
          item.categories?.name ===
            category;

        const bySearch =
          item.name
            .toLowerCase()
            .includes(
              query
                .trim()
                .toLowerCase()
            );

        return (
          byCategory &&
          bySearch
        );
      }
    );


  const add =
    (item) => {

      setCart(
        (current) => ({
          ...current,

          [item.id]: {
            quantity:
              current[item.id]
                ?.quantity
                ? current[item.id]
                    .quantity + 1
                : 1,

            spiceLevel:
              current[item.id]
                ?.spiceLevel ||
              'sedang',

            notes:
              current[item.id]
                ?.notes ||
              ''
          }
        })
      );

      show(
        `${item.name} ditambahkan ke keranjang.`
      );
    };


  return (
    <div className="page-stack">

      <PageHeader
        eyebrow="MENU"
        title="Pilih Menu"
        description="Cari menu favorit dan pilih makanan yang ingin dipesan."
      />


      <div className="menu-toolbar">

        {/* SEARCH MENU */}
        <div className="search-box">

          <Search
            size={16}
          />

          <input
            type="text"
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
            placeholder="Cari menu..."
          />

          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() =>
                setQuery('')
              }
              aria-label="Hapus pencarian"
            >
              <X size={14}/>
            </button>
          )}

        </div>


        {/* FILTER KATEGORI */}
        <div className="chips">

          <button
            type="button"
            className={
              category === 'Semua'
                ? 'active'
                : ''
            }
            onClick={() =>
              setCategory(
                'Semua'
              )
            }
          >
            Semua
          </button>


          {categories.map(
            (item) => (

              <button
                type="button"
                key={
                  item.id
                }
                className={
                  category ===
                  item.name
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setCategory(
                    item.name
                  )
                }
              >
                {
                  item.name
                }
              </button>

            )
          )}

        </div>

      </div>


      {query && (
        <div className="active-search-info">

          <span>
            Hasil pencarian untuk
          </span>

          <strong>
            "{query}"
          </strong>

        </div>
      )}


      <div className="product-grid">

        {visible.map(
          (item) => (

            <ProductCard
              key={
                item.id
              }
              item={
                item
              }
              onAdd={() =>
                add(
                  item
                )
              }
            />

          )
        )}

      </div>


      {visible.length === 0 && (

        <Empty
          title="Menu tidak ditemukan"
          text={
            query
              ? `Tidak ada menu yang cocok dengan "${query}".`
              : 'Tidak ada menu pada kategori ini.'
          }
          icon={
            <Search
              size={27}
            />
          }
        />

      )}

    </div>
  );
}

function ProductCard({
  item,
  onAdd
}) {
  return (
    <article className="product-card">

      <div className="product-image">

        {item.image_url ? (
          <img
            src={
              item.image_url
            }
            alt={
              item.name
            }
          />
        ) : (
          <span>
            🍗
          </span>
        )}

      </div>

      <div className="product-content">

        <span className="product-category">
          {
            item.categories?.name ||
            'Menu'
          }
        </span>

        <h3>
          {item.name}
        </h3>

        <p>
          {
            item.description ||
            'Menu pilihan Geprek Dapoersari.'
          }
        </p>

        <div className="product-footer">

          <strong>
            {money(item.price)}
          </strong>

          {onAdd && (
            <button
              className="round-add"
              onClick={onAdd}
            >
              <Plus
                size={17}
              />
            </button>
          )}

        </div>

      </div>

    </article>
  );
}

/* =========================================================
   CUSTOMER CART
========================================================= */


function CustomerCart({
  api,
  profile,
  show
}) {
  const [menu,setMenu] = useState([]);
  const [cart,setCart] = useState(
    normalizeCart(loadCart())
  );
  const [paymentMethod,setPaymentMethod] = useState('cash');
  const [orderNotes,setOrderNotes] = useState('');
  const [submitting,setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api('/menu')
      .then((data) => setMenu(data || []))
      .catch((e) => show(e.message,'error'));
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const entries =
    Object.entries(cart)
      .map(([id,item]) => ({
        menu: menu.find((m) => m.id === Number(id)),
        quantity: Number(item?.quantity || 0),
        spiceLevel: item?.spiceLevel || 'sedang'
      }))
      .filter((item) => item.menu && item.quantity > 0);

  const total = entries.reduce(
    (sum,item) =>
      sum + Number(item.menu.price) * item.quantity,
    0
  );

  const updateItem = (id,patch) => {
    setCart((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {quantity:1,spiceLevel:'sedang'}),
        ...patch
      }
    }));
  };

  const updateQty = (id,delta) => {
    setCart((current) => {
      const existing = current[id] || {quantity:0,spiceLevel:'sedang'};
      const quantity = Math.max(
        0,
        Number(existing.quantity || 0) + delta
      );
      const next = {...current};

      if (quantity === 0) {
        delete next[id];
      } else {
        next[id] = {...existing,quantity};
      }

      return next;
    });
  };

  const removeItem = (id) => {
    setCart((current) => {
      const next = {...current};
      delete next[id];
      return next;
    });
    show('Item dihapus dari keranjang.');
  };

  const checkout = async () => {
    if (!entries.length) {
      show('Keranjang masih kosong.','error');
      return;
    }

    if (!profile.full_name?.trim()) {
      show('Nama pelanggan belum lengkap. Isi di Pengaturan.','error');
      navigate('/pengaturan');
      return;
    }

    if (!profile.phone?.trim()) {
      show('Nomor telepon belum diisi. Lengkapi di Pengaturan.','error');
      navigate('/pengaturan');
      return;
    }

    if (!profile.address?.trim()) {
      show('Alamat belum diisi. Lengkapi di Pengaturan.','error');
      navigate('/pengaturan');
      return;
    }

    setSubmitting(true);

    try {
      const result = await api('/orders',{
        method:'POST',
        body:JSON.stringify({
          customerName:profile.full_name,
          customerPhone:profile.phone,
          address:profile.address,
          latitude:profile.latitude ?? null,
          longitude:profile.longitude ?? null,
          orderNotes:orderNotes.trim() || null,
          paymentMethod,
          items:entries.map((item) => ({
            menuId:item.menu.id,
            quantity:item.quantity,
            spiceLevel:
              item.menu.categories?.name === 'Ayam Geprek'
                ? item.spiceLevel
                : 'sedang'
          }))
        })
      });

      setCart({});
      saveCart({});
      setOrderNotes('');

      show(
        `Pesanan ${result.order_code} berhasil dikirim ke kasir.`
      );

      navigate('/pesanan');
    } catch(error) {
      show(error.message,'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">

      <PageHeader
        eyebrow="KERANJANG & CHECKOUT"
        title="Checkout Pesanan"
        description="Atur jumlah, level sambal, catatan, dan pembayaran."
      />

      <div className="checkout-layout">

        <section className="surface-card">

          <div className="surface-head">
            <div>
              <span className="eyebrow">YOUR ORDER</span>
              <h3>Keranjang</h3>
            </div>

            <span className="count-badge">
              {entries.reduce((sum,item) => sum + item.quantity,0)} item
            </span>
          </div>

          {entries.length ? (
            <div className="cart-list">
              {entries.map((item) => {
                const isAyamGeprek =
                  item.menu.categories?.name === 'Ayam Geprek';

                return (
                  <div
                    className="cart-row"
                    key={item.menu.id}
                  >

                    <div className="cart-image">
                      {item.menu.image_url ? (
                        <img
                          src={item.menu.image_url}
                          alt={item.menu.name}
                        />
                      ) : '🍗'}
                    </div>

                    <div className="cart-info">
                      <strong>{item.menu.name}</strong>

                      <span className="cart-unit-price-inline">
                        {money(item.menu.price)} / item
                      </span>

                      {isAyamGeprek && (
                        <div className="cart-spice-only">
                          <label>
                            Level Sambal
                            <select
                              value={item.spiceLevel}
                              onChange={(e) =>
                                updateItem(
                                  item.menu.id,
                                  {spiceLevel:e.target.value}
                                )
                              }
                            >
                              <option value="tidak_pedas">Tidak Pedas</option>
                              <option value="sedang">Sedang</option>
                              <option value="pedas">Pedas</option>
                              <option value="extra_pedas">Extra Pedas</option>
                            </select>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="qty-controls">
                      <button
                        type="button"
                        onClick={() => updateQty(item.menu.id,-1)}
                      >
                        <Minus size={13}/>
                      </button>

                      <b>{item.quantity}</b>

                      <button
                        type="button"
                        onClick={() => updateQty(item.menu.id,1)}
                      >
                        <Plus size={13}/>
                      </button>
                    </div>

                    <div className="cart-item-price">
                      {money(item.menu.price)}
                    </div>

                    <button
                      type="button"
                      className="icon-danger"
                      onClick={() => removeItem(item.menu.id)}
                    >
                      <Trash2 size={15}/>
                    </button>

                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              title="Keranjang kosong"
              text="Pilih menu untuk mulai membuat pesanan."
              icon={<ShoppingBag size={27}/>}
              action={
                <Link
                  className="primary-button"
                  to="/menu"
                >
                  Pilih Menu
                </Link>
              }
            />
          )}

        </section>

        <aside className="surface-card checkout-side">

          <span className="eyebrow">CUSTOMER DETAILS</span>
          <h3>Detail Pesanan</h3>

          <div className="form-stack">

            <div className="checkout-profile-box">

              <div className="checkout-profile-head">
                <div>
                  <span className="eyebrow">DATA PELANGGAN</span>
                  <h4>Informasi Pengiriman</h4>
                </div>

                <Link
                  to="/pengaturan"
                  className="profile-edit-link"
                >
                  Ubah
                </Link>
              </div>

              <div className="checkout-profile-row">
                <strong>{profile.full_name || 'Belum diisi'}</strong>
                <span>Nama pelanggan</span>
              </div>

              <div className="checkout-profile-row">
                <strong>{profile.phone || 'Belum diisi'}</strong>
                <span>Nomor telepon</span>
              </div>

              <div className="checkout-profile-row">
                <strong>{profile.address || 'Belum diisi'}</strong>
                <span>Alamat</span>
              </div>

              <div className="checkout-location">
                <MapPin size={15}/>
                <div>
                  <strong>Lokasi Pemesan</strong>
                  <span>
                    {
                      profile.latitude !== null &&
                      profile.latitude !== undefined &&
                      profile.longitude !== null &&
                      profile.longitude !== undefined
                        ? `${Number(profile.latitude).toFixed(6)}, ${Number(profile.longitude).toFixed(6)}`
                        : 'Lokasi belum ditentukan'
                    }
                  </span>

                  {
                    profile.latitude !== null &&
                    profile.latitude !== undefined &&
                    profile.longitude !== null &&
                    profile.longitude !== undefined && (
                      <a
                        href={`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Lihat titik di Google Maps
                      </a>
                    )
                  }
                </div>
              </div>

            </div>

            <div className="order-note-field">
              <label>Catatan Pesanan</label>
              <textarea
                rows="3"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Contoh: sambal dipisah, nasi sedikit, jangan pakai timun..."
                maxLength={300}
              />
              <small>Catatan berlaku untuk seluruh pesanan.</small>
            </div>

            <div>
              <span className="form-caption">Metode Pembayaran</span>
              <div className="payment-grid">
                {['cash','qris','transfer'].map((method) => (
                  <button
                    type="button"
                    key={method}
                    className={paymentMethod === method ? 'selected' : ''}
                    onClick={() => setPaymentMethod(method)}
                  >
                    <WalletCards size={15}/>
                    {method === 'cash' ? 'CASH' : method === 'qris' ? 'QRIS' : 'TRANSFER'}
                  </button>
                ))}
              </div>
            </div>

            <div className="summary-box">
              <span>Total Pesanan</span>
              <strong>{money(total)}</strong>
            </div>

            <button
              className="primary-button full"
              onClick={checkout}
              disabled={submitting || !entries.length}
            >
              {submitting ? 'Mengirim...' : 'Checkout Pesanan'}
            </button>

          </div>
        </aside>

      </div>
    </div>
  );
}

function CustomerOrders({
  api,
  show
}) {
  const [
    orders,
    setOrders
  ] = useState([]);

  const previousRef =
    useRef({});

  const notifyStatus =
    (order) => {
      if (
        order.status ===
        'preparing'
      ) {
        show(
          `Pesanan ${order.order_code} sedang disiapkan.`
        );
      }

      if (
        order.status ===
        'ready'
      ) {
        show(
          `Pesanan ${order.order_code} sudah siap diambil.`
        );
      }

      if (
        order.status ===
        'cancelled'
      ) {
        show(
          `Pesanan ${order.order_code} ditolak kasir.`,
          'error'
        );
      }
    };

  const load =
    async (notifyChange=true) => {
      try {
        const data =
          await api(
            '/my/orders'
          );

        if (
          notifyChange &&
          orders.length
        ) {
          data.forEach(
            (order) => {
              const old =
                previousRef
                  .current[
                    order.id
                  ];

              if (
                old &&
                old !==
                  order.status
              ) {
                notifyStatus(
                  order
                );
              }

              previousRef.current[
                order.id
              ] =
                order.status;
            }
          );
        } else {
          data.forEach(
            (order) => {
              previousRef.current[
                order.id
              ] =
                order.status;
            }
          );
        }

        setOrders(
          data
        );

      } catch(error) {
        show(
          error.message,
          'error'
        );
      }
    };

  useEffect(() => {
    load(false);

    const timer =
      setInterval(
        () => load(true),
        5000
      );

    return () =>
      clearInterval(
        timer
      );
  }, []);

  return (
    <div className="page-stack">

      <PageHeader
        eyebrow="ORDER TRACKING"
        title="Pesanan Saya"
        description="Pantau status pesanan sampai siap diambil."
      />

      <div className="notification-banner">

        <Bell size={17}/>

        <div>
          <strong>
            Notifikasi pesanan aktif
          </strong>

          <span>
            Status pesanan diperiksa otomatis setiap beberapa detik.
          </span>
        </div>

      </div>

      <div className="order-history-list">

        {orders.map(
          (order) => (
            <CustomerOrderCard
              key={
                order.id
              }
              order={
                order
              }
            />
          )
        )}

      </div>

      {!orders.length && (
        <Empty
          title="Belum ada pesanan"
          text="Pesanan yang kamu checkout akan muncul di sini."
          icon={
            <ReceiptText
              size={28}
            />
          }
        />
      )}

    </div>
  );
}


function CustomerOrderCard({
  order
}) {

  const calculateOrderTotal = (order) => {
    const storedTotal = Number(order?.total || 0);

    if (storedTotal > 0) {
      return storedTotal;
    }

    return (order?.order_items || []).reduce(
      (sum, item) =>
        sum +
        Number(item.unit_price || 0) *
        Number(item.quantity || 0),
      0
    );
  };

  const total = calculateOrderTotal(order);

  const flow = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'completed'
  ];

  const activeIndex =
    flow.indexOf(
      order.status
    );

  return (
    <article className="order-card">

      <div className="order-card-head">

        <div>

          <span className="eyebrow">
            {order.order_code}
          </span>

          <h3>
            {
              fmtDate(
                order.ordered_at
              )
            }
          </h3>

        </div>

        <span
          className={
            `status-chip ${order.status}`
          }
        >
          {
            labels[
              order.status
            ] ||
            order.status
          }
        </span>

      </div>

      {order.status !== 'cancelled' && (
        <div className="status-timeline">

          {flow.map(
            (step,index) => (
              <div
                className={
                  `timeline-step ${
                    index <= activeIndex
                      ? 'done'
                      : ''
                  }`
                }
                key={step}
              >

                <div className="timeline-dot">

                  {(
                    index <
                      activeIndex ||
                    order.status ===
                      'completed'
                  ) && (
                    <Check size={11}/>
                  )}

                </div>

                <span>
                  {
                    labels[
                      step
                    ]
                  }
                </span>

              </div>
            )
          )}

        </div>
      )}

      <div className="order-items-preview">

        {(order.order_items || []).map(
          (item) => (
            <div
              className="order-history-item"
              key={item.id}
            >

              <div>

                <strong>
                  {
                    item.menu?.name ||
                    'Menu'
                  } × {
                    item.quantity
                  }
                </strong>

                {item.menu?.categories?.name === 'Ayam Geprek' && (
                  <small>
                    Level Sambal:{' '}
                    {spiceLabel(item.spice_level)}
                  </small>
                )}

              </div>

              <strong>
                {
                  money(
                    Number(
                      item.unit_price
                    ) *
                      item.quantity
                  )
                }
              </strong>

            </div>
          )
        )}

      </div>

      {order.order_notes && (
        <div className="customer-order-note">
          <strong>Catatan Pesanan</strong>
          <span>{order.order_notes}</span>
        </div>
      )}

      <div className="order-card-footer">

  <span>
    {
      (
        order.payment_method ||
        '-'
      ).toUpperCase()
    } · {
      paymentLabel(order)
    }
  </span>

  <strong>
    {
      money(total)
    }
  </strong>

</div>

      {order.address && (
        <div className="order-address">
          <MapPin size={14}/>
          {order.address}
        </div>
      )}

    </article>
  );
}

function SettingsPage({
  api,
  profile,
  show,
  onProfileUpdate
}) {
  const [form,setForm] = useState({
    fullName:profile.full_name || '',
    phone:profile.phone || '',
    address:profile.address || '',
    latitude:profile.latitude ?? '',
    longitude:profile.longitude ?? ''
  });

  const [saving,setSaving] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      show('Browser tidak mendukung GPS.','error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude:position.coords.latitude,
          longitude:position.coords.longitude
        }));
        show('Lokasi GPS berhasil diambil.');
      },
      (error) => {
        let message = 'Izin lokasi belum diberikan.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Akses lokasi ditolak. Izinkan lokasi pada browser.';
        }
        show(message,'error');
      },
      {enableHighAccuracy:true,timeout:10000,maximumAge:0}
    );
  };

  const save = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      show('Nama lengkap wajib diisi.','error');
      return;
    }

    if (!form.phone.trim()) {
      show('Nomor telepon wajib diisi.','error');
      return;
    }

    if (!form.address.trim()) {
      show('Alamat wajib diisi.','error');
      return;
    }

    setSaving(true);

    try {
      const updatedProfile = await api('/profile',{
        method:'PUT',
        body:JSON.stringify({
          fullName:form.fullName.trim(),
          phone:form.phone.trim(),
          address:form.address.trim(),
          latitude:form.latitude === '' ? null : Number(form.latitude),
          longitude:form.longitude === '' ? null : Number(form.longitude)
        })
      });

      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      setForm({
        fullName:updatedProfile.full_name || '',
        phone:updatedProfile.phone || '',
        address:updatedProfile.address || '',
        latitude:updatedProfile.latitude ?? '',
        longitude:updatedProfile.longitude ?? ''
      });

      show('Pengaturan profil berhasil disimpan.');
    } catch(error) {
      show(error.message,'error');
    } finally {
      setSaving(false);
    }
  };

  const hasLocation =
    form.latitude !== '' &&
    form.longitude !== '';

  return (
    <div className="page-stack">

      <PageHeader
        eyebrow="ACCOUNT SETTINGS"
        title="Pengaturan"
        description="Lengkapi biodata pelanggan yang otomatis digunakan saat checkout."
      />

      <section className="settings-grid">

        <div className="surface-card">
          <div className="settings-avatar">
            {(form.fullName || 'P')[0].toUpperCase()}
          </div>

          <h3>Informasi Akun</h3>

          <p>
            Nama, nomor telepon, alamat, dan lokasi yang disimpan di sini akan digunakan otomatis saat checkout.
          </p>

          <div className="profile-location-hint">
            <MapPin size={15}/>
            <span>
              Gunakan lokasi saat ini untuk menyimpan titik pemesan.
            </span>
          </div>
        </div>

        <form
          className="surface-card form-stack"
          onSubmit={save}
        >

          <label>
            Nama Lengkap
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm({...form,fullName:e.target.value})
              }
              required
            />
          </label>

          <label>
            Nomor Telepon
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm({...form,phone:e.target.value})
              }
              placeholder="08xxxxxxxxxx"
              required
            />
          </label>

          <label>
            Alamat Lengkap
            <textarea
              rows="4"
              value={form.address}
              onChange={(e) =>
                setForm({...form,address:e.target.value})
              }
              placeholder="Contoh: Jl. Soekarno Hatta No. 10, Semarang"
              required
            />
          </label>

          <button
            type="button"
            className="location-button"
            onClick={getLocation}
          >
            <MapPin size={15}/>
            Gunakan Lokasi Saat Ini
          </button>

          {hasLocation && (
            <div className="map-location-card">
              <div className="map-location-icon">
                <MapPin size={18}/>
              </div>

              <div className="map-location-info">
                <strong>Lokasi tersimpan</strong>
                <span>
                  {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Lihat di Google Maps
                </a>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>

        </form>
      </section>
    </div>
  );
}

/* =========================================================
   CASHIER
========================================================= */

function CashierApp({
  profile,
  api,
  show,
  logout
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="cashier-layout">

      {/* MOBILE TOPBAR */}
      <header className="cashier-mobile-topbar">

        <button
          type="button"
          className="cashier-menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>

        <div className="cashier-mobile-brand">
          <div className="cashier-mobile-logo">
            G
          </div>

          <div>
            <strong>Geprek Dapoersari</strong>
            <span>Cashier Center</span>
          </div>
        </div>

      </header>


      {/* OVERLAY MOBILE */}
      {menuOpen && (
        <div
          className="cashier-sidebar-overlay"
          onClick={closeMenu}
        />
      )}


      {/* SIDEBAR */}
      <aside
        className={
          `sidebar cashier-sidebar ${
            menuOpen ? 'mobile-open' : ''
          }`
        }
      >

        <Link
          to="/kasir"
          className="brand-link"
          onClick={closeMenu}
        >
          <div className="logo-mark">
            G
          </div>

          <div>
            <strong>
              Geprek Dapoersari
            </strong>

            <span>
              Cashier Center
            </span>
          </div>
        </Link>


        <div className="cashier-role">
          <ShieldCheck size={14} />
          ADMIN / KASIR
        </div>


        <nav
          className="side-nav"
          onClick={closeMenu}
        >

          <SideLink
            to="/kasir"
            end
            icon={
              <LayoutDashboard />
            }
            text="Dashboard"
          />

          <SideLink
            to="/kasir/menu"
            icon={
              <Utensils />
            }
            text="Kelola Menu"
          />

          <SideLink
            to="/kasir/pesanan"
            icon={
              <ReceiptText />
            }
            text="Kelola Pesanan"
          />

          <SideLink
            to="/kasir/manual"
            icon={
              <Plus />
            }
            text="Input Manual"
          />

        </nav>


        <div className="sidebar-grow" />


        {/* USER */}
        <div className="side-user">

          <div className="avatar">
            {
              (
                profile.full_name ||
                'K'
              )[0].toUpperCase()
            }
          </div>

          <div>
            <b>
              {
                profile.full_name ||
                'Kasir'
              }
            </b>

            <span>
              CASHIER
            </span>
          </div>

        </div>


        {/* LOGOUT */}
        <button
          type="button"
          className="side-logout"
          onClick={logout}
        >
          <LogOut size={14} />
          Keluar
        </button>

      </aside>


      {/* MAIN */}
      <main className="main-content">

        <Header
          profile={profile}
        />

        <Routes>

          <Route
            path="/kasir"
            element={
              <CashierDashboard
                api={api}
                show={show}
              />
            }
          />

          <Route
            path="/kasir/menu"
            element={
              <CashierMenu
                api={api}
                show={show}
              />
            }
          />

          <Route
            path="/kasir/pesanan"
            element={
              <CashierOrders
                api={api}
                show={show}
              />
            }
          />

          <Route
            path="/kasir/manual"
            element={
              <ManualOrder
                api={api}
                show={show}
              />
            }
          />

        </Routes>

      </main>

    </div>
  );
}

function Header({
  profile
}) {
  return (
    <header className="header">

      <div>

        

      </div>

      <div className="header-profile">

        <div className="header-avatar">
          {
            (
              profile.full_name ||
              'K'
            )[0]
          }
        </div>

        <div>

          <strong>
            {
              profile.full_name
            }
          </strong>

          <span>
            CASHIER
          </span>

        </div>

      </div>

    </header>
  );
}

function PageHeader({
  eyebrow,
  title,
  description
}) {
  return (
    <div className="page-header">

      <span className="eyebrow">
        {eyebrow}
      </span>

      <h1>
        {title}
      </h1>

      <p>
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   CASHIER DASHBOARD
========================================================= */

function CashierDashboard({
  api,
  show
}) {
  const calculateOrderTotal = (order) => {
  const storedTotal = Number(order?.total || 0);

  if (storedTotal > 0) {
    return storedTotal;
  }

  return (order?.order_items || []).reduce(
    (sum, item) =>
      sum +
      Number(item.unit_price || 0) *
      Number(item.quantity || 0),
    0
  );
};

  const [
    data,
    setData
  ] = useState({
    totalOrders:0,
    pendingOrders:0,
    preparingOrders:0,
    readyOrders:0,
    completedOrders:0,
    paidOrders:0,
    omzetToday:0
  });

  const [
    orders,
    setOrders
  ] = useState([]);

  const load =
    async () => {
      try {
        const [
          dashboard,
          allOrders
        ] =
          await Promise.all([
            api(
              '/cashier/dashboard'
            ),
            api(
              '/cashier/orders'
            )
          ]);

        setData(
          dashboard
        );

        setOrders(
          allOrders.slice(
            0,
            7
          )
        );

      } catch(error) {
        show(
          error.message,
          'error'
        );
      }
    };

  useEffect(() => {
    load();

    const timer =
      setInterval(
        load,
        5000
      );

    return () =>
      clearInterval(
        timer
      );
  }, []);

  return (
    <div className="page-stack">

          <section className="cashier-hero">

        <div>

          <span className="eyebrow light">
            LIVE ORDER CENTER
          </span>

          <h1>
            Semua pesanan,
            <br/>
            satu kendali.
          </h1>

          <p>
            Terima pesanan pelanggan,
            siapkan makanan, dan
            tandai siap diambil.
          </p>

        </div>

        <Package
          size={68}
          strokeWidth={1.3}
        />

      </section>

      <div className="metric-grid">

        <Metric
          label="Pesanan Masuk"
          value={
            data.totalOrders
          }
          icon={
            <ReceiptText/>
          }
        />

        <Metric
          label="Menunggu"
          value={
            data.pendingOrders
          }
          icon={
            <Clock3/>
          }
        />

        <Metric
          label="Diproses"
          value={
            data.preparingOrders
          }
          icon={
            <Utensils/>
          }
        />

        <Metric
          label="Siap Diambil"
          value={
            data.readyOrders
          }
          icon={
            <Package/>
          }
        />

        <Metric
          label="Selesai"
          value={
            data.completedOrders
          }
          icon={
            <CheckCircle2/>
          }
        />

        <Metric
          label="Omzet Hari Ini"
          value={
            money(
              data.omzetToday
            )
          }
          icon={
            <Sparkles/>
          }
        />

      </div>

      <section className="surface-card">

        <div className="surface-head">

          <div>

            <span className="eyebrow">
              LATEST ORDERS
            </span>

            <h3>
              Pesanan Terbaru
            </h3>

          </div>

          <Link
            className="text-link"
            to="/kasir/pesanan"
          >
            Lihat semua
          </Link>

        </div>

        <OrderMiniTable
          orders={
            orders
          }
        />

      </section>

    </div>
  );
}

function Metric({
  label,
  value,
  icon
}) {
  return (
    <div className="metric-card">

      <div className="metric-card-top">

        <span>
          {label}
        </span>

        <div className="metric-icon">
          {
            React.cloneElement(
              icon,
              {size:17}
            )
          }
        </div>

      </div>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   CASHIER MENU
========================================================= */

function CashierMenu({
  api,
  show
}) {
  const [
    menu,
    setMenu
  ] = useState([]);

  const [
    categories,
    setCategories
  ] = useState([]);

  const [
    editing,
    setEditing
  ] = useState(null);

  const emptyForm = {
    categoryId:'',
    name:'',
    description:'',
    price:'',
    isActive:true,
    image:null
  };

  const [
    form,
    setForm
  ] = useState(
    emptyForm
  );

  const [
    preview,
    setPreview
  ] = useState('');

  const [
    saving,
    setSaving
  ] = useState(false);

  const load =
    async () => {
      const [
        m,
        c
      ] =
        await Promise.all([
          api(
            '/cashier/menu'
          ),
          api(
            '/categories'
          )
        ]);

      setMenu(m);
      setCategories(c);
    };

  useEffect(() => {
    load().catch(
      (e) =>
        show(
          e.message,
          'error'
        )
    );
  }, []);

  const reset =
    () => {
      setEditing(null);
      setForm(emptyForm);
      setPreview('');
    };

  const edit =
    (item) => {
      setEditing(item);

      setForm({
        categoryId:
          String(
            item.category_id
          ),
        name:
          item.name,
        description:
          item.description ||
          '',
        price:
          item.price,
        isActive:
          item.is_active,
        image:
          null
      });

      setPreview(
        item.image_url ||
        ''
      );

      window.scrollTo({
        top:0,
        behavior:'smooth'
      });
    };

  const imageChange =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      if (
        ![
          'image/jpeg',
          'image/png',
          'image/webp'
        ].includes(
          file.type
        )
      ) {
        show(
          'Gunakan JPG, PNG, atau WEBP.',
          'error'
        );
        return;
      }

      if (
        file.size >
        3 *
          1024 *
          1024
      ) {
        show(
          'Ukuran gambar maksimal 3 MB.',
          'error'
        );
        return;
      }

      setForm(
        (current) => ({
          ...current,
          image:file
        })
      );

      setPreview(
        URL.createObjectURL(
          file
        )
      );
    };

  const submit =
    async (e) => {
      e.preventDefault();
      setSaving(true);

      try {
        const body =
          new FormData();

        body.append(
          'categoryId',
          form.categoryId
        );

        body.append(
          'name',
          form.name
        );

        body.append(
          'description',
          form.description
        );

        body.append(
          'price',
          form.price
        );

        body.append(
          'isActive',
          String(
            form.isActive
          )
        );

        if (
          form.image
        ) {
          body.append(
            'image',
            form.image
          );
        }

        const result =
          await api(
            editing
              ? `/cashier/menu/${editing.id}`
              : '/cashier/menu',
            {
              method:
                editing
                  ? 'PUT'
                  : 'POST',
              body
            }
          );

        show(
          editing
            ? `${result.name} berhasil diperbarui.`
            : `${result.name} berhasil ditambahkan.`
        );

        reset();

        await load();

      } catch(error) {
        show(
          error.message,
          'error'
        );
      } finally {
        setSaving(false);
      }
    };

  const toggle =
    async (item) => {
      try {
        await api(
          `/cashier/menu/${item.id}/status`,
          {
            method:'PATCH',
            body:
              JSON.stringify({
                isActive:
                  !item.is_active
              })
          }
        );

        show(
          item.is_active
            ? `${item.name} dinonaktifkan.`
            : `${item.name} diaktifkan.`
        );

        await load();

      } catch(error) {
        show(
          error.message,
          'error'
        );
      }
    };

  return (
    <div className="page-stack">

      <PageHeader
        eyebrow="MENU MANAGEMENT"
        title={
          editing
            ? 'Edit Menu'
            : 'Kelola Menu'
        }
        description="Tambah menu, ubah harga, kelola gambar, dan atur ketersediaan."
      />

      <div className="manager-grid">

        <section className="surface-card">

          <div className="surface-head">

            <div>

              <span className="eyebrow">
                {
                  editing
                    ? 'EDIT MENU'
                    : 'NEW MENU'
                }
              </span>

              <h3>
                {
                  editing
                    ? 'Perbarui Menu'
                    : 'Tambah Menu'
                }
              </h3>

            </div>

            {editing && (
              <button
                className="secondary-button"
                onClick={
                  reset
                }
              >
                Batal
              </button>
            )}

          </div>

          <form
            className="form-stack"
            onSubmit={
              submit
            }
          >

            <label>
              Nama Menu

              <input
                value={
                  form.name
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    name:
                      e.target.value
                  })
                }
                required
              />
            </label>

            <label>
              Kategori

              <select
                value={
                  form.categoryId
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoryId:
                      e.target.value
                  })
                }
                required
              >
                <option value="">
                  Pilih kategori
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  )
                )}

              </select>
            </label>

            <label>
              Harga

              <input
                type="number"
                min="1"
                value={
                  form.price
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    price:
                      e.target.value
                  })
                }
                required
              />
            </label>

            <label>
              Deskripsi

              <textarea
                rows="4"
                value={
                  form.description
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value
                  })
                }
              />

            </label>

            <div className="upload-field">

              <span>
                Gambar Menu
              </span>

              <label className="upload-box">

                <ImagePlus
                  size={25}
                />

                <strong>
                  Pilih gambar
                </strong>

                <small>
                  JPG, PNG, WEBP · Maks. 3 MB
                </small>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    imageChange
                  }
                />

              </label>

            </div>

            {preview && (
              <div className="preview-box">

                <img
                  src={
                    preview
                  }
                  alt="Preview"
                />

                <button
                  type="button"
                  className="preview-remove"
                  onClick={() =>
                    setPreview(
                      ''
                    )
                  }
                >
                  <X
                    size={15}
                  />
                </button>

              </div>
            )}

            <label className="check-row">

              <input
                type="checkbox"
                checked={
                  form.isActive
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    isActive:
                      e.target.checked
                  })
                }
              />

              Menu tersedia

            </label>

            <button
              className="primary-button full"
              disabled={
                saving
              }
            >
              {
                saving
                  ? 'Menyimpan...'
                  : editing
                  ? 'Simpan Perubahan'
                  : 'Tambah Menu'
              }
            </button>

          </form>

        </section>

        <section className="surface-card">

          <div className="surface-head">

            <div>

              <span className="eyebrow">
                MENU CATALOG
              </span>

              <h3>
                Daftar Menu
              </h3>

            </div>

            <button
              className="secondary-button"
              onClick={
                load
              }
            >
              Refresh
            </button>

          </div>

          <div className="manager-list">

            {menu.map(
              (item) => (
                <div
                  className="manager-row"
                  key={
                    item.id
                  }
                >

                  <div className="manager-image">

                    {
                      item.image_url
                        ? (
                          <img
                            src={
                              item.image_url
                            }
                            alt={
                              item.name
                            }
                          />
                        )
                        : (
                          <span>
                            🍗
                          </span>
                        )
                    }

                  </div>

                  <div className="manager-info">

                    <div className="inline-row">

                      <b>
                        {
                          item.name
                        }
                      </b>

                      <StatusActive
                        active={
                          item.is_active
                        }
                      />

                    </div>

                    <span>
                      {
                        item.categories?.name ||
                        'Tanpa kategori'
                      }
                    </span>

                    <strong>
                      {
                        money(
                          item.price
                        )
                      }
                    </strong>

                    <small>
                      {
                        item.description ||
                        '-'
                      }
                    </small>

                  </div>

                  <div className="row-actions">

                    <button
                      className="secondary-button"
                      onClick={() =>
                        edit(
                          item
                        )
                      }
                    >
                      <Pencil
                        size={14}
                      />
                      Edit
                    </button>

                    <button
                      className="danger-button"
                      onClick={() =>
                        toggle(
                          item
                        )
                      }
                    >
                      {
                        item.is_active
                          ? 'Nonaktifkan'
                          : 'Aktifkan'
                      }
                    </button>

                  </div>

                </div>
              )
            )}

          </div>

        </section>

      </div>

    </div>
  );
}

function StatusActive({
  active
}) {
  return (
    <span
      className={
        `active-pill ${
          active
            ? 'yes'
            : 'no'
        }`
      }
    >
      {
        active
          ? 'Aktif'
          : 'Nonaktif'
      }
    </span>
  );
}

/* =========================================================
   CASHIER ORDERS
========================================================= */


function CashierOrders({
  api,
  show
}) {

  const [
    orders,
    setOrders
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);


  const calculateOrderTotal =
    (order) => {

      const storedTotal =
        Number(
          order?.total || 0
        );

      if (
        storedTotal > 0
      ) {
        return storedTotal;
      }


      return (
        order?.order_items || []
      ).reduce(
        (
          sum,
          item
        ) =>
          sum +
          (
            Number(
              item.unit_price ||
              0
            ) *
            Number(
              item.quantity ||
              0
            )
          ),

        0
      );
    };


  const load =
    async () => {

      try {

        const data =
          await api(
            '/cashier/orders'
          );

        setOrders(
          data || []
        );

      } catch(error) {

        show(
          error.message,
          'error'
        );

      } finally {

        setLoading(
          false
        );

      }
    };


  useEffect(() => {

    load();

    const timer =
      setInterval(
        load,
        5000
      );

    return () =>
      clearInterval(
        timer
      );

  }, []);


  const updateStatus =
    async (
      order,
      status
    ) => {

      try {

        await api(
          `/cashier/orders/${order.id}/status`,
          {
            method:
              'PATCH',

            body:
              JSON.stringify({
                status
              })
          }
        );


        show(
          `${order.order_code} berhasil diubah menjadi ${labels[status]}.`
        );


        await load();

      } catch(error) {

        show(
          error.message,
          'error'
        );

      }
    };


  const cancelOrder =
    async (
      order
    ) => {

      const yakin =
        window.confirm(
          `Tolak pesanan ${order.order_code}?`
        );

      if (!yakin) {
        return;
      }

      await updateStatus(
        order,
        'cancelled'
      );
    };


  const completeOrder =
    async (
      order
    ) => {

      try {

        await api(
          `/cashier/orders/${order.id}/status`,
          {
            method:
              'PATCH',

            body:
              JSON.stringify({
                status:
                  'completed'
              })
          }
        );


        show(
          `Pesanan ${order.order_code} berhasil diselesaikan dan pembayaran dinyatakan lunas.`
        );


        await load();

      } catch(error) {

        show(
          error.message,
          'error'
        );

      }

    };


  if (
    loading
  ) {

    return (
      <div className="page-stack">

        <PageHeader
          eyebrow="ORDER MANAGEMENT"
          title="Kelola Pesanan"
          description="Terima, proses, dan selesaikan pesanan pelanggan."
        />

        <div className="surface-card">
          Memuat pesanan...
        </div>

      </div>
    );
  }


  const pendingCount =
    orders.filter(
      (o) =>
        o.status ===
        'pending'
    ).length;


  const processingCount =
    orders.filter(
      (o) =>
        [
          'confirmed',
          'preparing'
        ].includes(
          o.status
        )
    ).length;


  const readyCount =
    orders.filter(
      (o) =>
        o.status ===
        'ready'
    ).length;


  const completedCount =
    orders.filter(
      (o) =>
        o.status ===
        'completed'
    ).length;


  return (
    <div className="page-stack">

      <PageHeader
        eyebrow="ORDER MANAGEMENT"
        title="Kelola Pesanan"
        description="Terima, siapkan, dan selesaikan pesanan pelanggan."
      />


      <div className="order-filter-summary">

        <div className="order-filter-card">

          <span>
            Menunggu
          </span>

          <strong>
            {pendingCount}
          </strong>

        </div>


        <div className="order-filter-card">

          <span>
            Diproses
          </span>

          <strong>
            {processingCount}
          </strong>

        </div>


        <div className="order-filter-card">

          <span>
            Siap Diambil
          </span>

          <strong>
            {readyCount}
          </strong>

        </div>


        <div className="order-filter-card">

          <span>
            Selesai
          </span>

          <strong>
            {completedCount}
          </strong>

        </div>

      </div>


      {orders.length === 0 ? (

        <Empty
          title="Belum ada pesanan"
          text="Pesanan pelanggan akan muncul di sini."
          icon={
            <ReceiptText
              size={28}
            />
          }
        />

      ) : (

        <div className="order-board">

          {orders.map(
            (order) => {

              const total =
                calculateOrderTotal(
                  order
                );


              const paymentStatus =
                order.status ===
                'completed'
                  ? 'paid'
                  : 'pending';


              return (

                <article
                  className="cashier-order"
                  key={
                    order.id
                  }
                >

                  <div className="cashier-order-head">

                    <div>

                      <span className="eyebrow">
                        {
                          order.order_code
                        }
                      </span>

                      <h3>
                        {
                          order.customer_name ||
                          'Pelanggan'
                        }
                      </h3>

                      <small>
                        {
                          fmtDate(
                            order.ordered_at
                          )
                        }
                      </small>

                    </div>


                    <Status
                      status={
                        order.status
                      }
                    />

                  </div>


                  <div className="order-items">

                    {(
                      order.order_items ||
                      []
                    ).map(
                      (item) => {

                        const isAyamGeprek =
                          item.menu
                            ?.categories
                            ?.name ===
                          'Ayam Geprek';


                        const itemTotal =
                          Number(
                            item.unit_price ||
                            0
                          ) *
                          Number(
                            item.quantity ||
                            0
                          );


                        return (

                          <div
                            className="cashier-order-item"
                            key={
                              item.id
                            }
                          >

                            <div>

                              <strong>
                                {
                                  item.menu?.name ||
                                  'Menu'
                                }

                                {' × '}

                                {
                                  item.quantity
                                }
                              </strong>


                              {isAyamGeprek && (
                                <small>
                                  Level Sambal:{' '}
                                  {
                                    spiceLabel(
                                      item.spice_level
                                    )
                                  }
                                </small>
                              )}

                            </div>


                            <b>
                              {
                                money(
                                  itemTotal
                                )
                              }
                            </b>

                          </div>

                        );
                      }
                    )}

                  </div>


                  {order.order_notes && (

                    <div className="cashier-order-note">

                      <strong>
                        Catatan Pesanan
                      </strong>

                      <span>
                        {
                          order.order_notes
                        }
                      </span>

                    </div>

                  )}


                  {order.address && (

                    <div className="address-line">

                      <MapPin
                        size={13}
                      />

                      <span>
                        {
                          order.address
                        }
                      </span>

                    </div>

                  )}


                  <div className="cashier-payment-info">

                    <div>

                      <span>
                        Metode Pembayaran
                      </span>

                      <strong>
                        {
                          (
                            order.payment_method ||
                            '-'
                          ).toUpperCase()
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Status Pembayaran
                      </span>

                      <strong
                        className={
                          paymentStatus ===
                          'paid'
                            ? 'payment-paid'
                            : 'payment-pending'
                        }
                      >
                        {
                          paymentStatus ===
                          'paid'
                            ? 'LUNAS'
                            : 'MENUNGGU'
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Total
                      </span>

                      <strong>
                        {
                          money(
                            total
                          )
                        }
                      </strong>

                    </div>

                  </div>


                  <div className="cashier-actions">

                    {order.status ===
                      'pending' && (

                      <>

                        <button
                          type="button"
                          className="primary-button"
                          onClick={() =>
                            updateStatus(
                              order,
                              'confirmed'
                            )
                          }
                        >

                          <Check
                            size={14}
                          />

                          Terima Pesanan

                        </button>


                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            cancelOrder(
                              order
                            )
                          }
                        >

                          Tolak

                        </button>

                      </>
                    )}


                    {order.status ===
                      'confirmed' && (

                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          updateStatus(
                            order,
                            'preparing'
                          )
                        }
                      >

                        <Utensils
                          size={14}
                        />

                        Mulai Siapkan

                      </button>
                    )}


                    {order.status ===
                      'preparing' && (

                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          updateStatus(
                            order,
                            'ready'
                          )
                        }
                      >

                        <Package
                          size={14}
                        />

                        Siap Diambil

                      </button>
                    )}


                    {order.status ===
                      'ready' && (

                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          completeOrder(
                            order
                          )
                        }
                      >

                        <CheckCircle2
                          size={14}
                        />

                        Selesaikan & Lunas

                      </button>
                    )}


                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        printReceipt(
                          order
                        )
                      }
                    >

                      <Printer
                        size={14}
                      />

                      Struk

                    </button>

                  </div>

                </article>

              );

            }
          )}

        </div>

      )}

      {!orders.length && (
        <Empty
          title="Belum ada pesanan"
          text="Pesanan pelanggan akan muncul di halaman ini."
          icon={<ReceiptText />}
        />
      )}
    </div>
  );
}

function ManualOrder({
  api,
  show
}) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [method, setMethod] = useState('cash');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/cashier/menu')
      .then((data) => setMenu(data || []))
      .catch((e) => show(e.message, 'error'));
  }, []);

  const add = (item, delta) => {
    setCart((current) => {
      const existing =
        current[item.id] || {
          quantity: 0,
          spiceLevel: 'sedang'
        };

      const quantity = Math.max(
        0,
        Number(existing.quantity || 0) +
          delta
      );

      const next = {
        ...current
      };

      if (!quantity) {
        delete next[item.id];
      } else {
        next[item.id] = {
          ...existing,
          quantity
        };
      }

      return next;
    });
  };

  const updateSpice = (
    id,
    value
  ) => {
    setCart((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {
          quantity: 1
        }),
        spiceLevel: value
      }
    }));
  };

  const entries =
    Object.entries(cart)
      .map(([id, item]) => ({
        m: menu.find(
          (x) => x.id === Number(id)
        ),
        q: Number(
          item?.quantity || 0
        ),
        spiceLevel:
          item?.spiceLevel || 'sedang'
      }))
      .filter(
        (x) => x.m && x.q > 0
      );

  const total = entries.reduce(
    (sum, item) =>
      sum +
      Number(item.m.price) *
        item.q,
    0
  );

  const save = async () => {
    if (!entries.length) {
      show(
        'Tambahkan minimal satu menu.',
        'error'
      );
      return;
    }

    setSaving(true);

    try {
      const result = await api(
        '/cashier/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            customerName:
              name ||
              'Pelanggan Offline',
            customerPhone:
              phone || null,
            orderNotes:
              orderNotes.trim() || null,
            paymentMethod: method,
            paymentStatus: 'paid',
            items: entries.map((item) => {
              const isAyamGeprek =
                item.m.categories?.name ===
                'Ayam Geprek';

              return {
                menuId: item.m.id,
                quantity: item.q,
                spiceLevel:
                  isAyamGeprek
                    ? item.spiceLevel
                    : 'sedang'
              };
            })
          })
        }
      );

      show(
        `Transaksi ${result.order_code} berhasil disimpan.`
      );

      setCart({});
      setName('');
      setPhone('');
      setOrderNotes('');
      setMethod('cash');
    } catch (error) {
      show(
        error.message,
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="OFFLINE TRANSACTION"
        title="Input Manual Kasir"
        description="Input pesanan langsung seperti transaksi kasir offline."
      />

      <div className="manual-grid">
        <section className="surface-card">
          <div className="surface-head">
            <div>
              <span className="eyebrow">
                QUICK MENU
              </span>
              <h3>Pilih Menu</h3>
            </div>
          </div>

          <div className="manual-menu">
            {menu
              .filter((m) => m.is_active)
              .map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className="manual-card"
                  onClick={() =>
                    add(m, 1)
                  }
                >
                  <div>
                    {m.image_url ? (
                      <img
                        src={m.image_url}
                        alt={m.name}
                      />
                    ) : (
                      '🍗'
                    )}
                  </div>
                  <b>{m.name}</b>
                  <span>
                    {money(m.price)}
                  </span>
                </button>
              ))}
          </div>
        </section>

        <section className="surface-card">
          <div className="surface-head">
            <div>
              <span className="eyebrow">
                MANUAL ORDER
              </span>
              <h3>Ringkasan Pesanan</h3>
            </div>
          </div>

          <div className="form-stack">
            <label>
              Nama Pelanggan
              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Pelanggan Offline"
              />
            </label>

            <label>
              Telepon
              <input
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
                placeholder="08xxxxxxxxxx"
              />
            </label>

            <div className="manual-items">
              {entries.map((item) => {
                const isAyamGeprek =
                  item.m.categories?.name ===
                  'Ayam Geprek';

                return (
                  <div
                    className="manual-item"
                    key={item.m.id}
                  >
                    <div className="manual-item-main">
                      <b>{item.m.name}</b>
                      <small>
                        {money(item.m.price)}
                      </small>
                    </div>

                    <div className="manual-options">
                      {isAyamGeprek && (
                        <label>
                          Level
                          <select
                            value={
                              item.spiceLevel
                            }
                            onChange={(e) =>
                              updateSpice(
                                item.m.id,
                                e.target.value
                              )
                            }
                          >
                            <option value="tidak_pedas">
                              Tidak Pedas
                            </option>
                            <option value="sedang">
                              Sedang
                            </option>
                            <option value="pedas">
                              Pedas
                            </option>
                            <option value="extra_pedas">
                              Extra Pedas
                            </option>
                          </select>
                        </label>
                      )}
                    </div>

                    <div className="qty">
                      <button
                        type="button"
                        onClick={() =>
                          add(item.m, -1)
                        }
                      >
                        <Minus size={12} />
                      </button>

                      <b>{item.q}</b>

                      <button
                        type="button"
                        onClick={() =>
                          add(item.m, 1)
                        }
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {!entries.length && (
                <Empty
                  title="Belum ada item"
                  text="Klik menu untuk menambahkan pesanan."
                  icon={<ShoppingBag />}
                />
              )}
            </div>

            <div className="order-note-field">
              <label>Catatan Pesanan</label>
              <textarea
                rows="3"
                value={orderNotes}
                onChange={(e) =>
                  setOrderNotes(
                    e.target.value
                  )
                }
                placeholder="Contoh: sambal dipisah, nasi sedikit, jangan pakai timun..."
                maxLength={300}
              />
              <small>
                Catatan berlaku untuk seluruh pesanan.
              </small>
            </div>

            <div>
              <span className="form-caption">
                Metode Pembayaran
              </span>

              <div className="payment-grid">
                {[
                  'cash',
                  'qris',
                  'transfer'
                ].map((paymentMethod) => (
                  <button
                    type="button"
                    key={paymentMethod}
                    className={
                      method === paymentMethod
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      setMethod(paymentMethod)
                    }
                  >
                    {paymentMethod.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="summary-box">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>

            <button
              type="button"
              className="primary-button full"
              onClick={save}
              disabled={saving}
            >
              {saving
                ? 'Menyimpan...'
                : 'Simpan Transaksi Manual'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function OrderMiniTable({
  orders
}) {
  const calculateOrderTotal = (order) => {
    const storedTotal = Number(order?.total || 0);

    if (storedTotal > 0) {
      return storedTotal;
    }

    return (order?.order_items || []).reduce(
      (sum, item) =>
        sum +
        Number(item?.unit_price || 0) *
        Number(item?.quantity || 0),
      0
    );
  };

  return (
    <div className="table-scroll">
      <table className="finance-table">
        <thead>
          <tr>
            <th>KODE</th>
            <th>PELANGGAN</th>
            <th>STATUS</th>
            <th>TOTAL</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>

              <td>
                <strong>
                  {order.order_code}
                </strong>
              </td>

              <td>
                {order.customer_name || 'Pelanggan'}
              </td>

              <td>
                <Status
                  status={order.status}
                />
              </td>

              <td>
                <strong>
                  {money(
                    calculateOrderTotal(order)
                  )}
                </strong>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({
  title,
  text,
  icon,
  action
}) {
  return (
    <div className="empty">

      <div>
        {icon}
      </div>

      <b>
        {title}
      </b>

      <span>
        {text}
      </span>

      {action}

    </div>
  );
}

/* =========================================================
   CART STORAGE
========================================================= */

function spiceLabel(level) {
  const labels = {
    tidak_pedas: 'Tidak Pedas',
    sedang: 'Sedang',
    pedas: 'Pedas',
    extra_pedas: 'Extra Pedas'
  };

  return labels[level] ||
    'Sedang';
}

function normalizeCart(raw) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const normalized = {};

  Object.entries(raw).forEach(
    ([id,value]) => {

      if (
        typeof value ===
        'number'
      ) {
        normalized[id] = {
          quantity:
            Math.max(
              0,
              Number(value)
            ),

          spiceLevel:
            'sedang',

          notes:
            ''
        };

        return;
      }

      normalized[id] = {
        quantity:
          Math.max(
            0,
            Number(
              value?.quantity ||
              0
            )
          ),

        spiceLevel:
          value?.spiceLevel ||
          'sedang',

        notes:
          value?.notes ||
          ''
      };
    }
  );

  return normalized;
}

function readCart() {
  try {
    return JSON.parse(
      localStorage.getItem(
        'p1_cart'
      ) || '{}'
    );
  } catch {
    return {};
  }
}

function loadCart() {
  return readCart();
}

function saveCart(cart) {
  localStorage.setItem(
    'p1_cart',
    JSON.stringify(
      cart
    )
  );
}

/* =========================================================
   RECEIPT
========================================================= */

function printReceipt(order) {

  const rows =
    (
      order.order_items ||
      []
    )
      .map(
        (i) => `
          <div class="r">
            <span>
              ${esc(
                i.menu?.name ||
                'Menu'
              )}
              x${i.quantity}
            </span>
            <b>
              ${money(
                Number(
                  i.unit_price
                ) *
                  i.quantity
              )}
            </b>
          </div>
        `
      )
      .join('');

  const w =
    window.open(
      '',
      '_blank',
      'width=420,height=700'
    );

  if (!w) {
    alert(
      'Izinkan pop-up browser untuk mencetak struk.'
    );
    return;
  }

  w.document.write(
    `
      <!doctype html>

      <html>

      <head>

        <title>
          ${esc(
            order.order_code ||
            'Struk'
          )}
        </title>

        <style>

          @page {
            size: 80mm auto;
            margin: 0;
          }

          body {
            width: 80mm;
            margin: 0;
            padding: 4mm;
            font: 11px Arial;
            color: #000;
          }

          .c {
            text-align: center;
          }

          .store {
            font-size: 17px;
            font-weight: 800;
          }

          .line {
            border-top:
              1px dashed #000;
            margin: 8px 0;
          }

          .r {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 5px 0;
          }

          .total {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 800;
          }

          .meta {
            font-size: 10px;
            line-height: 1.55;
          }

        </style>

      </head>

      <body>

        <div class="c">

          <div class="store">
            GEPREK DAPOERSARI
          </div>

          <div>
            Ayam Geprek & Order Center
          </div>

        </div>

        <div class="line"></div>

        <div class="meta">

          Kode:
          ${esc(
            order.order_code ||
            ''
          )}

          <br/>

          Pelanggan:
          ${esc(
            order.customer_name ||
            'Umum'
          )}

          <br/>

          Waktu:
          ${esc(
            fmtDate(
              order.ordered_at
            )
          )}

          <br/>

          Pembayaran:
          ${esc(
            (
              order.payment_method ||
              ''
            ).toUpperCase()
          )}

        </div>

        <div class="line"></div>

        ${rows}

        <div class="line"></div>

        <div class="total">

          <span>
            TOTAL
          </span>

          <span>
            ${money(
              order.total
            )}
          </span>

        </div>

        <div class="line"></div>

        <div class="c">
          Terima kasih telah berbelanja.
        </div>

      </body>

      </html>
    `
  );

  w.document.close();
  w.focus();

  setTimeout(
    () => {
      w.print();
      w.close();
    },
    300
  );
}

function esc(x) {
  return String(
    x || ''
  )
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );
}

export default App;