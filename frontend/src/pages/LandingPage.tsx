import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  Clock3,
  MapPin,
  MessageSquare,
  Moon,
  Phone,
  Sparkles,
  Star,
  Sun,
  Utensils,
  Award,
  Users,
  Quote,
  Mail,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';

/* ----------------------------- Restaurant data ---------------------------- */

const RESTAURANT = {
  name: 'Annalakshmi Fine Dining',
  tagline: 'Authentic South Indian Cuisine Since 1998',
  address: '45, Race Course Road, Coimbatore, Tamil Nadu 641029',
  phone: '+91 98765 43210',
  whatsapp: '919876543210',
  email: 'reservations@annalakshmi.in',
  hoursWeek: 'Mon–Fri 7AM–11PM',
  hoursWeekend: 'Sat–Sun 6:30AM–11:30PM',
  rating: 4.8,
  reviews: 2847,
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=45+Race+Course+Road+Coimbatore+Tamil+Nadu+641029',
};

const HERO_BG = 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=1920&q=80';

const floatingCards = [
  { name: 'Masala Dosa', price: '₹100', img: 'https://aroundtheyum.com/wp-content/uploads/2025/06/masala-dosa-recipe-.jpg', delay: 0 },
  { name: 'Chicken Biryani', price: '₹310', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', delay: 0.6 },
  { name: 'Filter Coffee', price: '₹60', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', delay: 1.2 },
];

const guestActions = [
  { icon: Utensils, title: 'Menu answers', desc: 'South Indian specials, dietary notes, spice levels, and prices.' },
  { icon: CalendarCheck, title: 'Reservations', desc: 'Collect date, time, party size, and contact details.' },
  { icon: MapPin, title: 'Visit planning', desc: 'Hours, directions, parking, and phone details in one reply.' },
];

type MenuItem = { name: string; price: string; tag?: string; spice?: string };
type MenuCategory = { id: string; label: string; time?: string; items: MenuItem[] };

const MENU: MenuCategory[] = [
  {
    id: 'breakfast',
    label: 'Breakfast',
    time: '7AM–11AM',
    items: [
      { name: 'Plain Dosa', price: '₹80' },
      { name: 'Masala Dosa', price: '₹100', tag: 'Popular' },
      { name: 'Ghee Roast Dosa', price: '₹130' },
      { name: 'Idli (3 pcs)', price: '₹70' },
      { name: 'Mini Idli Sambar (12 pcs)', price: '₹120' },
      { name: 'Medu Vada (2 pcs)', price: '₹80' },
      { name: 'Pongal', price: '₹90', tag: 'Popular' },
      { name: 'Onion Uttapam', price: '₹110' },
    ],
  },
  {
    id: 'veg-starters',
    label: 'Veg Starters',
    items: [
      { name: 'Gobi 65', price: '₹180', spice: 'Hot' },
      { name: 'Paneer 65', price: '₹220', spice: 'Hot' },
      { name: 'Banana Chips', price: '₹120' },
      { name: 'Masala Papad', price: '₹80' },
    ],
  },
  {
    id: 'nonveg-starters',
    label: 'Non-Veg Starters',
    items: [
      { name: 'Chicken 65', price: '₹260', spice: 'Hot', tag: 'Popular' },
      { name: 'Chettinad Pepper Chicken', price: '₹290', spice: 'Very Hot', tag: 'Popular' },
      { name: 'Fish Fry (Vanjaram)', price: '₹340', tag: 'Popular' },
      { name: 'Prawn Masala Fry', price: '₹380' },
      { name: 'Tandoori Chicken Half', price: '₹380' },
    ],
  },
  {
    id: 'rice-meals',
    label: 'Rice & Meals',
    items: [
      { name: 'Full South Indian Meals (Veg)', price: '₹220', tag: 'Bestseller' },
      { name: 'Mini Meals (Veg)', price: '₹160' },
      { name: 'Sambar Rice', price: '₹130' },
      { name: 'Curd Rice', price: '₹100' },
      { name: 'Lemon Rice', price: '₹120' },
      { name: 'Tamarind Rice', price: '₹130' },
      { name: 'Chicken Meals', price: '₹280' },
      { name: 'Mutton Meals', price: '₹320' },
      { name: 'Fish Meals', price: '₹300' },
    ],
  },
  {
    id: 'biryani',
    label: 'Biryani',
    items: [
      { name: 'Vegetable Biryani', price: '₹200' },
      { name: 'Paneer Biryani', price: '₹250' },
      { name: 'Chicken Biryani (Dindigul Style)', price: '₹310', tag: 'Bestseller' },
      { name: 'Mutton Biryani', price: '₹380' },
      { name: 'Prawn Biryani', price: '₹420' },
      { name: 'Egg Biryani', price: '₹240' },
    ],
  },
  {
    id: 'curries',
    label: 'Curries',
    items: [
      { name: 'Dal Tadka', price: '₹160' },
      { name: 'Sambar', price: '₹140' },
      { name: 'Chettinad Kuzhambu', price: '₹180' },
      { name: 'Paneer Butter Masala', price: '₹260' },
      { name: 'Chicken Chettinad Curry', price: '₹320', tag: 'Bestseller' },
      { name: 'Chicken Salna', price: '₹280' },
      { name: 'Fish Curry (Meen Kuzhambu)', price: '₹300' },
    ],
  },
  {
    id: 'breads',
    label: 'Breads',
    items: [
      { name: 'Parotta (2 pcs)', price: '₹60' },
      { name: 'Chapati (2 pcs)', price: '₹50' },
      { name: 'Butter Naan', price: '₹80' },
      { name: 'Garlic Naan', price: '₹90' },
      { name: 'Appam (2 pcs)', price: '₹80' },
      { name: 'Idiappam (3 pcs)', price: '₹80' },
    ],
  },
  {
    id: 'desserts',
    label: 'Desserts',
    items: [
      { name: 'Payasam', price: '₹120' },
      { name: 'Mysore Pak', price: '₹100' },
      { name: 'Kesari', price: '₹100' },
      { name: 'Ice Cream (2 scoops)', price: '₹150' },
      { name: 'Filter Coffee', price: '₹60', tag: 'Popular' },
    ],
  },
  {
    id: 'beverages',
    label: 'Beverages',
    items: [
      { name: 'Tender Coconut Water', price: '₹80' },
      { name: 'Sweet Lassi', price: '₹100' },
      { name: 'Salted Buttermilk', price: '₹60' },
      { name: 'Mango Lassi', price: '₹130' },
      { name: 'Filter Coffee', price: '₹60' },
      { name: 'Masala Chai', price: '₹50' },
      { name: 'Fresh Lime Soda', price: '₹70' },
    ],
  },
];

const stats = [
  { icon: Award, value: '25+', label: 'Years' },
  { icon: Star, value: '4.8★', label: 'Rating' },
  { icon: Users, value: '2847', label: 'Reviews' },
  { icon: Utensils, value: '120', label: 'Seats' },
];

const gallery = [
  { src: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', label: 'Masala Dosa' },
  { src: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', label: 'Dindigul Biryani' },
  { src: 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=800&q=80', label: 'Chettinad Curry' },
  { src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', label: 'Filter Coffee' },
  { src: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80', label: 'Mysore Pak' },
  { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80', label: 'Dining Hall' },
  { src: 'https://images.unsplash.com/photo-1596040033229-a9821eec3879?w=800&q=80', label: 'Whole Spices' },
  { src: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80', label: 'South Indian Thali' },
];

const testimonials = [
  {
    name: 'Karthik Raman',
    text: 'The Chettinad Chicken Biryani is the best in Coimbatore! Authentic flavours and the filter coffee is pure bliss. A 25-year legacy you can taste.',
    rating: 5,
  },
  {
    name: 'Divya Suresh',
    text: 'Loved the Mini Meals and Pongal. The staff are warm and the place is spotless. Priya the chat assistant made booking a table so easy!',
    rating: 5,
  },
  {
    name: 'Arjun Nair',
    text: 'Fish Fry and Meen Kuzhambu took me right back to my grandmother\'s kitchen. Truly authentic South Indian fine dining. Highly recommend.',
    rating: 4,
  },
];

/* ------------------------------- 3D tilt card ------------------------------ */

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(800px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg) scale(1.03)`);
  };

  const reset = () => setTransform('perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)');

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ transform, transition: 'transform 0.2s ease-out', transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </div>
  );
}

/* --------------------------------- Page ---------------------------------- */

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState(MENU[0].id);

  const openChat = () => {
    document
      .querySelector('[aria-label="Open chat assistant"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeMenu = MENU.find(c => c.id === activeCategory)!;

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* ----------------------------- Navbar ----------------------------- */}
      <nav className="fixed inset-x-0 top-0 z-40 glass border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2">
            <span className="text-2xl">🍛</span>
            <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">Annalakshmi</span>
          </button>
          <div className="hidden items-center gap-6 md:flex">
            <button onClick={() => scrollTo('menu')} className="text-sm font-medium hover:text-primary transition-colors">Menu</button>
            <button onClick={() => scrollTo('about')} className="text-sm font-medium hover:text-primary transition-colors">About</button>
            <button onClick={() => scrollTo('reserve')} className="text-sm font-medium hover:text-primary transition-colors">Reserve</button>
            <button onClick={() => scrollTo('contact')} className="text-sm font-medium hover:text-primary transition-colors">Contact</button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <a href={`https://wa.me/${RESTAURANT.whatsapp}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <MessageSquare className="h-4 w-4" /> WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ------------------------------ Hero ------------------------------ */}
      <section id="hero" className="relative min-h-screen flex items-center px-4 pt-24 pb-16 sm:px-6">
        <div
          className="hero-parallax absolute inset-0"
          style={{ backgroundImage: `linear-gradient(rgba(26,10,0,0.78), rgba(26,10,0,0.85)), url(${HERO_BG})` }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.85fr] w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              🍛 Authentic South Indian · Coimbatore, Tamil Nadu
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              A dining room concierge that never misses a guest.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/80 sm:text-lg lg:mx-0">
              {RESTAURANT.tagline}. Let guests explore our South Indian menu, reserve a table, and find directions through Priya, your warm AI dining assistant.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button size="lg" className="w-full rounded-xl sm:w-auto" onClick={openChat}>
                <MessageSquare className="h-5 w-5" />
                Chat with Priya
              </Button>
              <Button variant="outline" size="lg" className="w-full rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-auto" onClick={() => scrollTo('reserve')}>
                Reserve a Table
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-white/80 lg:justify-start">
              <Star className="h-5 w-5 fill-gold text-gold" />
              <span className="font-semibold">{RESTAURANT.rating}</span>
              <span className="text-sm">· {RESTAURANT.reviews} Google reviews</span>
            </div>
          </motion.div>

          {/* Floating food cards */}
          <div className="relative hidden h-[460px] lg:block">
            {floatingCards.map((card, i) => (
              <motion.div
                key={card.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.6 }}
                className="absolute"
                style={{ left: `${i * 30}%`, top: `${i * 28}%` }}
              >
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
                  className="glass-card w-56 overflow-hidden rounded-2xl bg-white/90 dark:bg-[hsl(24_100%_9%/0.9)]"
                >
                  <img src={card.img} alt={card.name} className="h-32 w-full object-cover" loading="lazy" />
                  <div className="p-3">
                    <p className="font-semibold text-sm">{card.name}</p>
                    <p className="text-gold font-bold">{card.price}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- Features ---------------------------- */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-3">
          {guestActions.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <item.icon className="mb-3 h-6 w-6 text-primary" />
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ------------------------------ Menu ------------------------------ */}
      <section id="menu" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Utensils className="h-4 w-4" /> Our Menu
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Authentic South Indian Fare</h2>
            <p className="mt-3 text-muted-foreground">All prices in ₹. Spice levels marked where applicable.</p>
          </motion.div>

          {/* Category tabs */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {MENU.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 hover:bg-muted text-muted-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Menu grid with 3D tilt */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeMenu.items.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <TiltCard className="glass-card h-full rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.tag && (
                          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold">
                            {item.tag === 'Popular' ? '⭐ Popular' : `⭐ ${item.tag}`}
                          </span>
                        )}
                      </div>
                      {item.spice && (
                        <p className="mt-1 text-xs text-accent">
                          {item.spice === 'Very Hot' ? '🌶️🌶️ Very Hot' : '🌶️ Hot'}
                        </p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-primary">{item.price}</span>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
          {activeMenu.time && (
            <p className="mt-6 text-center text-sm text-muted-foreground">⏰ Served {activeMenu.time}</p>
          )}
        </div>
      </section>

      {/* ------------------------------ About ----------------------------- */}
      <section id="about" className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-8"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold">
              <Award className="h-4 w-4" /> Since 1998
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">25 years of authentic South Indian cooking in Coimbatore</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Annalakshmi Fine Dining began as a small family kitchen on Race Course Road in 1998, serving traditional Tamil Nadu recipes
              passed down through generations. Today we seat 120 guests across our dining hall, yet every dosa is still hand-spread on
              cast-iron tawas and every batch of sambar is slow-cooked with freshly ground spices.
            </p>
            <p className="mt-3 leading-7 text-muted-foreground">
              From Chettinad pepper chicken to Dindigul-style biryani and frothy filter coffee, our menu celebrates the bold, layered
              flavours of South India. Semma food, semma service — every single time.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80"
              alt="Annalakshmi dining interior"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      {/* ------------------------------ Stats ----------------------------- */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <stat.icon className="mx-auto mb-3 h-7 w-7 text-primary" />
              <p className="font-display text-3xl font-bold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ----------------------------- Gallery ---------------------------- */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center font-display text-3xl font-bold sm:text-4xl"
          >
            A Taste of Annalakshmi
          </motion.h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {gallery.map((img, index) => (
              <motion.div
                key={img.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <TiltCard className="group overflow-hidden rounded-2xl">
                  <div className="relative">
                    <img src={img.src} alt={img.label} className="h-48 w-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <p className="absolute bottom-3 left-3 text-sm font-medium text-white">{img.label}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------- Testimonials -------------------------- */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center font-display text-3xl font-bold sm:text-4xl"
          >
            What Our Guests Say
          </motion.h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <Quote className="mb-3 h-6 w-6 text-gold" />
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-gold text-gold' : 'text-muted-foreground/40'}`} />
                  ))}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{t.text}</p>
                <p className="mt-4 font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">Google Review</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------- Reservation --------------------------- */}
      <section id="reserve" className="px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          <div className="glass-card rounded-2xl p-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <CalendarCheck className="h-4 w-4" /> Reservations
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Reserve Your Table</h2>
            <p className="mt-3 text-muted-foreground">
              Book ahead to skip the wait. A small pre-booking fee secures your table.
            </p>

            <div className="mt-6 rounded-xl border border-gold/30 bg-gold/10 p-4 text-left">
              <p className="flex items-center gap-2 font-semibold text-gold">
                <Sparkles className="h-4 w-4" /> ₹100 Pre-Booking Fee
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                ₹100 reservation fee is fully adjustable against your final bill.
              </p>
            </div>

            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Required details</p>
                <p className="mt-1 text-sm font-medium">Name, Phone, Email, Date, Time, Guests, Special requests</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Prefer to talk?</p>
                <p className="mt-1 text-sm font-medium">📞 {RESTAURANT.phone}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="w-full rounded-xl sm:w-auto" onClick={openChat}>
                <MessageSquare className="h-5 w-5" /> Book via Priya (Chat)
              </Button>
              <a href={`https://wa.me/${RESTAURANT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full rounded-xl sm:w-auto">
                  <MessageSquare className="h-5 w-5" /> WhatsApp Booking
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---------------------------- Location ---------------------------- */}
      <section id="contact" className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold">Visit Annalakshmi</h2>
            </div>
            <p className="mt-4 leading-7 text-muted-foreground">{RESTAURANT.address}</p>
            <a href={RESTAURANT.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
              <Button variant="outline">
                <Navigation className="h-4 w-4" /> Open in Google Maps
              </Button>
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-6"
          >
            <Clock3 className="mb-3 h-6 w-6 text-primary" />
            <p className="font-semibold">Opening Hours</p>
            <p className="mt-2 text-sm text-muted-foreground">{RESTAURANT.hoursWeek}</p>
            <p className="text-sm text-muted-foreground">{RESTAURANT.hoursWeekend}</p>
            <div className="mt-4 space-y-2 text-sm">
              <a href={`tel:${RESTAURANT.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-primary">
                <Phone className="h-4 w-4" /> {RESTAURANT.phone}
              </a>
              <a href={`mailto:${RESTAURANT.email}`} className="flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4" /> {RESTAURANT.email}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ----------------------------- Footer ----------------------------- */}
      <footer className="border-t border-border/50 bg-muted/30 px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍛</span>
              <span className="font-display text-xl font-bold">Annalakshmi Fine Dining</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{RESTAURANT.tagline}</p>
            <div className="mt-3 flex items-center gap-1">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="text-sm font-medium">{RESTAURANT.rating}</span>
              <span className="text-sm text-muted-foreground">· {RESTAURANT.reviews} reviews</span>
            </div>
          </div>
          <div>
            <p className="font-semibold">Quick Links</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <button onClick={() => scrollTo('menu')} className="text-left hover:text-primary">Menu</button>
              <button onClick={() => scrollTo('about')} className="text-left hover:text-primary">About</button>
              <button onClick={() => scrollTo('reserve')} className="text-left hover:text-primary">Reserve</button>
              <button onClick={() => scrollTo('contact')} className="text-left hover:text-primary">Contact</button>
            </div>
          </div>
          <div>
            <p className="font-semibold">Contact</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {RESTAURANT.address}</p>
              <a href={`tel:${RESTAURANT.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" /> {RESTAURANT.phone}</a>
              <a href={`mailto:${RESTAURANT.email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" /> {RESTAURANT.email}</a>
              <a href={`https://wa.me/${RESTAURANT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary"><MessageSquare className="h-4 w-4" /> WhatsApp</a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          © 2024 Annalakshmi Fine Dining. All rights reserved.
        </div>
      </footer>
    </div>
  );
}