# HNBC Software Solutions Pvt Ltd — Corporate Website

A production-grade corporate website for **HNBC Software Solutions Pvt Ltd**, an enterprise software development and IT services company based in Chennai, India.

---

## 📁 Project Structure

```
hnbc/
├── index.html                  ← Homepage
├── pages/
│   ├── about.html              ← About Us
│   ├── services.html           ← Services (with anchor sections)
│   ├── solutions.html          ← Solutions Portfolio
│   ├── industries.html         ← Industries We Serve
│   ├── case-studies.html       ← Case Studies (3 detailed)
│   ├── careers.html            ← Careers & Job Listings
│   ├── blog.html               ← Blog with category filter
│   └── contact.html            ← Contact Form + Map
├── css/
│   └── style.css               ← All custom styles + design system
├── js/
│   └── main.js                 ← All JavaScript functionality
├── images/
│   ├── hnbc_logo.png           ← Company logo
│   └── favicon.png             ← Browser favicon
├── backend/
│   ├── server.js               ← Node.js/Express API server
│   ├── package.json            ← Backend dependencies
│   └── .env.example            ← Environment variable template
├── sitemap.xml                 ← SEO sitemap
├── robots.txt                  ← Search engine directives
├── netlify.toml                ← Netlify deployment config
├── vercel.json                 ← Vercel deployment config
├── nginx.conf                  ← Nginx server config (Linux VPS)
└── README.md                   ← This file
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| HTML5 | Latest | Semantic markup |
| Tailwind CSS | 3.x (CDN) | Utility-first CSS framework |
| Custom CSS | — | Design system, animations, dark mode |
| Vanilla JavaScript | ES2022 | Interactivity, animations, form handling |
| Google Fonts | — | Poppins (headings) + Inter (body) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | ≥18.0 | Runtime |
| Express.js | 4.x | API framework |
| Nodemailer | 6.x | Email sending (SMTP) |
| express-validator | 7.x | Input validation |
| helmet | 7.x | Security headers |
| express-rate-limit | 7.x | Rate limiting |
| xss | 1.x | Input sanitisation |
| axios | 1.x | reCAPTCHA verification |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js ≥ 18.0
- npm ≥ 9.0
- A domain name pointing to your hosting
- SMTP credentials (Gmail App Password, Zoho, or SendGrid)
- Google reCAPTCHA v3 keys

### 1. Frontend Setup (Static Files)

The frontend is 100% static HTML/CSS/JS — no build step required.

```bash
# Clone or download the project
git clone https://github.com/your-org/hnbc-website.git
cd hnbc-website

# That's it for the frontend — open index.html in a browser to preview
```

**To configure reCAPTCHA on the frontend:**

Open `pages/contact.html` and replace `YOUR_RECAPTCHA_SITE_KEY_HERE`:
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_ACTUAL_SITE_KEY"></script>
```
Also update the `siteKey` variable in the form JS at the bottom of `contact.html`.

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Required .env values:**
```env
NODE_ENV=production
PORT=3000
ALLOWED_ORIGIN=https://www.hnbcsoftware.com
RECAPTCHA_SECRET_KEY=your_google_recaptcha_v3_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=your_gmail_app_password
NOTIFY_EMAIL=hello@hnbcsoftware.com
```

**Gmail App Password setup:**
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate an app password for "Mail"
4. Use that 16-character password as `SMTP_PASS`

```bash
# Start in development
npm run dev

# Start in production
npm start
```

---

## 🚀 Deployment Guide

### Option A: GoDaddy Shared Hosting (cPanel)

1. **Upload frontend files** via cPanel File Manager or FTP:
   - Upload contents of the `hnbc/` folder (excluding `backend/`) to `public_html/`
   
2. **Backend on GoDaddy:**
   - GoDaddy shared hosting doesn't support Node.js natively
   - Use a **serverless contact form** alternative:
     - [Formspree](https://formspree.io) — free tier, just point form action to their endpoint
     - [EmailJS](https://emailjs.com) — client-side email sending
   - Or upgrade to GoDaddy VPS/Dedicated hosting for Node.js support

3. **Domain & SSL:**
   - Point your domain to GoDaddy nameservers
   - Enable SSL via cPanel → SSL/TLS → Let's Encrypt

4. **Contact form with Formspree (simplest for shared hosting):**
   ```html
   <!-- Replace the form action in contact.html -->
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

### Option B: Netlify (Recommended — Free Tier Available)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy from project root
cd /path/to/hnbc
netlify deploy --dir=. --prod

# Or connect GitHub repo for auto-deployments
# 1. Push to GitHub
# 2. Connect repo at app.netlify.com
# 3. Set publish directory to "."
# 4. Deploy!
```

**Netlify Environment Variables** (for backend functions):
- Go to Site Settings → Environment Variables
- Add all variables from `.env.example`

### Option C: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# From project root
cd /path/to/hnbc
vercel

# Follow prompts — Vercel auto-detects the config from vercel.json
# Set environment variables at vercel.com/dashboard
```

### Option D: Linux VPS with Nginx (Production)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Nginx
sudo apt install nginx -y

# 4. Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# 5. Upload files
sudo mkdir -p /var/www/hnbcsoftware.com
sudo chown -R $USER:$USER /var/www/hnbcsoftware.com
# Upload frontend files (everything except backend/) to /var/www/hnbcsoftware.com/

# 6. Setup backend
sudo mkdir -p /opt/hnbc-backend
sudo chown -R $USER:$USER /opt/hnbc-backend
# Upload backend/ folder to /opt/hnbc-backend/
cd /opt/hnbc-backend
npm install --production
cp .env.example .env
nano .env  # Fill in your values

# 7. Install PM2 (process manager)
sudo npm install -g pm2
pm2 start server.js --name "hnbc-api"
pm2 startup  # Follow the command it outputs
pm2 save

# 8. Configure Nginx
sudo cp /path/to/nginx.conf /etc/nginx/sites-available/hnbcsoftware.com
# Edit the file to update paths and domain
sudo nginx -t  # Test config
sudo ln -s /etc/nginx/sites-available/hnbcsoftware.com /etc/nginx/sites-enabled/
sudo systemctl reload nginx

# 9. Get SSL certificate
sudo certbot --nginx -d hnbcsoftware.com -d www.hnbcsoftware.com
# Follow prompts — certbot auto-configures Nginx for HTTPS

# 10. Auto-renew SSL
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔐 Security Checklist

- [x] Google reCAPTCHA v3 on contact form
- [x] Input validation (server-side with express-validator)
- [x] Input sanitisation (XSS protection with `xss` library)
- [x] Rate limiting (5 submissions per IP per 15 minutes)
- [x] Security HTTP headers (Helmet.js + Nginx headers)
- [x] CORS configured to allowed origin only
- [x] CSRF token generation endpoint
- [x] Email/phone obfuscation in HTML
- [x] `.env` file excluded from version control
- [ ] Set `ALLOWED_ORIGIN` in `.env` to your actual domain
- [ ] Replace reCAPTCHA placeholder keys with real keys
- [ ] Enable HTTPS (SSL certificate via Let's Encrypt)
- [ ] Set strong SMTP credentials

---

## 📊 SEO Checklist

- [x] Unique `<title>` and `<meta description>` on every page
- [x] `<link rel="canonical">` on all pages
- [x] Open Graph tags (og:title, og:description, og:image, og:url)
- [x] Twitter Card meta tags
- [x] JSON-LD Organization schema markup on homepage
- [x] JSON-LD ItemList schema on case studies page
- [x] `sitemap.xml` with all pages and priorities
- [x] `robots.txt` with sitemap reference
- [x] Semantic HTML5 (nav, section, article, footer)
- [x] Descriptive `alt` attributes on all images
- [x] Lazy loading (`loading="lazy"`) on below-fold images
- [x] Mobile-responsive design
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Set up Google Analytics / GTM
- [ ] Add hreflang tags if adding multi-language support

---

## 🎨 Design System

### Colours
| Name | Hex | Usage |
|---|---|---|
| Primary | `#0B3D91` | Main brand, dark backgrounds, headings |
| Secondary | `#1F6FEB` | Buttons, links, interactive elements |
| Accent | `#00C2FF` | Highlights, gradients, badges |
| Background Light | `#F5F7FA` | Page backgrounds |
| Background White | `#FFFFFF` | Cards, sections |
| Text Dark | `#0D1117` | Headings |
| Text Body | `#374151` | Body copy |
| Text Muted | `#6B7280` | Secondary text, captions |

### Typography
- **Headings:** Poppins (weights: 600, 700, 800, 900)
- **Body / UI:** Inter (weights: 300, 400, 500, 600)

### Breakpoints
| Breakpoint | Width | Description |
|---|---|---|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Wide desktop |

---

## 🔧 Configuration Notes

### Replacing reCAPTCHA Keys
1. Go to [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)
2. Create a new site with reCAPTCHA v3
3. Add your domain(s)
4. Copy **Site Key** → paste into `contact.html` (frontend script src + JS variable)
5. Copy **Secret Key** → paste into `backend/.env` as `RECAPTCHA_SECRET_KEY`

### Updating Company Information
All company contact details are in the footer of each HTML page. Search for `hnbcsoftware.com` across all files to find and update contact information.

### Adding New Blog Posts
Edit `pages/blog.html` and add new `<article class="blog-card">` elements inside `#blogPosts`. The JavaScript filter will automatically include them in category filtering.

### Adding New Job Listings
Edit `pages/careers.html` and add new job card elements matching the existing pattern with the appropriate `data-category` attribute.

---

## 📞 Support

**HNBC Software Solutions Pvt Ltd**  
Plot No 90, Thirumalai Nagar Annexe  
3rd Cross Street, Perungudi  
Chennai – 600096, India  

📧 hello@hnbcsoftware.com  
📞 +91 44 1111 0000  
🌐 www.hnbcsoftware.com  

---

© 2025 HNBC Software Solutions Pvt Ltd. All rights reserved.
