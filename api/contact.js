
// /api/contact.js — Send email using Nodemailer. Configure SMTP_* env vars in Vercel.
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
    const { nombre, email, mensaje } = req.body || {};
    if (!process.env.SMTP_HOST) return res.status(500).json({error:'Missing SMTP config'});
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.MAIL_TO || process.env.SMTP_USER,
      subject: `Consulta Web — ${nombre || 'Sin nombre'}`,
      text: `Nombre: ${nombre}\nEmail: ${email}\n\nMensaje:\n${mensaje}`
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
