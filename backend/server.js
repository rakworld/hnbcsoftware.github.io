/**
 * HNBC Software Solutions - Contact Form Backend
 * Node.js + Express API server
 * 
 * Install: npm install
 * Run dev: npm run dev
 * Run prod: npm start
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const xss = require('xss');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security Middleware ──────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Managed at reverse proxy level
}));

// CORS - only allow your domain
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'https://www.hnbcsoftware.com',
  methods: ['POST', 'GET'],
  credentials: false,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Rate Limiting ────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 contact form submissions per IP per 15 min
  message: { error: 'Too many submissions from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(globalLimiter);

// ── CSRF Token Generation ────────────────────────────
const csrfTokens = new Map(); // In production use Redis

app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (30 * 60 * 1000); // 30 min expiry
  csrfTokens.set(token, expires);
  
  // Cleanup old tokens
  for (const [t, exp] of csrfTokens) {
    if (Date.now() > exp) csrfTokens.delete(t);
  }
  
  res.json({ token });
});

// ── reCAPTCHA v3 Verification ────────────────────────
async function verifyRecaptcha(token) {
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn('⚠️  RECAPTCHA_SECRET_KEY not set — skipping verification in dev');
    return true;
  }
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        },
        timeout: 5000,
      }
    );
    const { success, score, action } = response.data;
    console.log(`reCAPTCHA: success=${success}, score=${score}, action=${action}`);
    return success && score >= 0.5;
  } catch (err) {
    console.error('reCAPTCHA verification error:', err.message);
    return false;
  }
}

// ── Email Transporter ────────────────────────────────
function createTransporter() {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── Input Sanitization Helper ────────────────────────
function sanitize(str) {
  if (!str) return '';
  return xss(String(str).trim().slice(0, 2000));
}

// ── Validation Rules ─────────────────────────────────
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s\u00C0-\u024F'-]+$/)
    .withMessage('Name contains invalid characters'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 }),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[+]?[\d\s\-().]{7,20}$/)
    .withMessage('Please enter a valid phone number'),

  body('company')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),

  body('service')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body('budget')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be 10-2000 characters'),

  body('recaptchaToken')
    .notEmpty()
    .withMessage('reCAPTCHA token is required'),
];

// ── POST /api/contact ─────────────────────────────────
app.post('/api/contact', contactLimiter, contactValidation, async (req, res) => {
  // Validate
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }

  // CSRF check
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  if (csrfToken && csrfTokens.has(csrfToken)) {
    const exp = csrfTokens.get(csrfToken);
    if (Date.now() > exp) {
      csrfTokens.delete(csrfToken);
      return res.status(403).json({ success: false, error: 'CSRF token expired.' });
    }
    csrfTokens.delete(csrfToken); // One-time use
  }

  // reCAPTCHA
  const captchaOk = await verifyRecaptcha(req.body.recaptchaToken);
  if (!captchaOk) {
    return res.status(400).json({ success: false, error: 'reCAPTCHA verification failed. Please try again.' });
  }

  // Sanitize inputs
  const data = {
    name:    sanitize(req.body.name),
    email:   sanitize(req.body.email),
    phone:   sanitize(req.body.phone),
    company: sanitize(req.body.company),
    service: sanitize(req.body.service),
    budget:  sanitize(req.body.budget),
    message: sanitize(req.body.message),
    submittedAt: new Date().toISOString(),
    ip: req.ip,
  };

  // Send notification email
  try {
    const transporter = createTransporter();
    
    // To: HNBC team
    const mailToHNBC = {
      from: `"HNBC Website" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_EMAIL || 'hello@hnbcsoftware.com',
      replyTo: data.email,
      subject: `New Contact Enquiry from ${data.name} — ${data.service || 'General Enquiry'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,#0B3D91,#1F6FEB);padding:28px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:22px;">New Website Enquiry</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">HNBC Software Solutions — Contact Form</p>
            </div>
            <div style="padding:32px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;width:140px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;color:#222;">${data.name}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee;"><a href="mailto:${data.email}" style="color:#1F6FEB;">${data.email}</a></td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #eee;color:#222;">${data.phone || '—'}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Company</td><td style="padding:10px 0;border-bottom:1px solid #eee;color:#222;">${data.company || '—'}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Service</td><td style="padding:10px 0;border-bottom:1px solid #eee;color:#222;">${data.service || '—'}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Budget</td><td style="padding:10px 0;border-bottom:1px solid #eee;color:#222;">${data.budget || '—'}</td></tr>
                <tr><td style="padding:10px 0;font-weight:600;color:#555;vertical-align:top;">Message</td><td style="padding:10px 0;color:#222;line-height:1.6;">${data.message.replace(/\n/g, '<br>')}</td></tr>
              </table>
              <div style="margin-top:24px;padding:16px;background:#f0f7ff;border-radius:8px;font-size:13px;color:#555;">
                <strong>Submitted:</strong> ${data.submittedAt} | <strong>IP:</strong> ${data.ip}
              </div>
              <div style="margin-top:24px;text-align:center;">
                <a href="mailto:${data.email}" style="background:linear-gradient(135deg,#0B3D91,#1F6FEB);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Reply to ${data.name}</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Auto-reply to enquirer
    const mailToUser = {
      from: `"HNBC Software Solutions" <${process.env.SMTP_USER}>`,
      to: data.email,
      subject: 'We received your enquiry — HNBC Software Solutions',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,#0B3D91,#1F6FEB);padding:28px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:22px;">Thank you, ${data.name}!</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">We've received your enquiry</p>
            </div>
            <div style="padding:32px;">
              <p style="color:#333;line-height:1.7;font-size:15px;">Thank you for reaching out to HNBC Software Solutions. We've received your message and our team will review it shortly.</p>
              <p style="color:#333;line-height:1.7;font-size:15px;">We typically respond within <strong>1-2 business hours</strong> during working hours (Mon–Fri, 9AM–6PM IST).</p>
              <div style="margin:28px 0;padding:20px;background:#f0f7ff;border-radius:12px;border-left:4px solid #1F6FEB;">
                <p style="margin:0 0 8px;font-weight:600;color:#0B3D91;">Your Enquiry Summary:</p>
                <p style="margin:4px 0;color:#555;font-size:14px;"><strong>Service of interest:</strong> ${data.service || 'General Enquiry'}</p>
                <p style="margin:4px 0;color:#555;font-size:14px;"><strong>Your message:</strong> ${data.message.slice(0, 200)}${data.message.length > 200 ? '...' : ''}</p>
              </div>
              <p style="color:#333;line-height:1.7;font-size:14px;">While you wait, feel free to explore our <a href="https://www.hnbcsoftware.com/pages/case-studies.html" style="color:#1F6FEB;">case studies</a> or read our latest <a href="https://www.hnbcsoftware.com/pages/blog.html" style="color:#1F6FEB;">blog posts</a>.</p>
              <div style="margin-top:28px;padding-top:20px;border-top:1px solid #eee;text-align:center;">
                <p style="color:#888;font-size:13px;">HNBC Software Solutions Pvt Ltd<br>Plot No 90, Thirumalai Nagar Annexe, 3rd Cross Street,<br>Perungudi, Chennai – 600096, India<br><a href="tel:+914411110000" style="color:#1F6FEB;">+91 44 1111 0000</a> | <a href="mailto:hello@hnbcsoftware.com" style="color:#1F6FEB;">hello@hnbcsoftware.com</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailToHNBC);
    await transporter.sendMail(mailToUser);

    console.log(`✅ Contact form submission from: ${data.email} at ${data.submittedAt}`);

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your message has been received. We will get back to you within 1-2 business hours.',
    });

  } catch (err) {
    console.error('Email send error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to send your message due to a server error. Please email us directly at hello@hnbcsoftware.com',
    });
  }
});

// ── POST /api/newsletter ─────────────────────────────
app.post('/api/newsletter', rateLimit({ windowMs: 60000, max: 3 }), [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const email = sanitize(req.body.email);
  console.log(`📧 Newsletter signup: ${email}`);

  // TODO: Integrate with Mailchimp/ConvertKit/SendGrid using their API
  // Example Mailchimp integration:
  // await mailchimp.lists.addListMember(process.env.MAILCHIMP_LIST_ID, { email_address: email, status: 'subscribed' });

  return res.json({ success: true, message: 'Successfully subscribed to our newsletter!' });
});

// ── Health Check ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 HNBC Backend Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
