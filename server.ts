
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // Initialize Resend (lazy)
  let resend: Resend | null = null;
  const getResend = () => {
    if (!resend) {
      const key = process.env.RESEND_API_KEY;
      if (!key) {
        console.warn("RESEND_API_KEY is not set. Email sending will be disabled.");
        return null;
      }
      resend = new Resend(key);
    }
    return resend;
  };

  // API Route for sending invites
  app.post("/api/send-invite", async (req, res) => {
    const { email, name, role } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }

    const resendClient = getResend();
    if (!resendClient) {
      return res.status(500).json({ error: "Email service not configured" });
    }

    try {
      const appUrl = process.env.APP_URL || "https://ais-dev-cclmntp3kn4fffenjh3vl2-177078761396.us-east1.run.app";
      
      const { data, error } = await resendClient.emails.send({
        from: "Omega Core <onboarding@resend.dev>", // Default Resend domain for testing
        to: [email],
        subject: "Bem-vindo à Central de Comando Ômega",
        html: `
          <div style="font-family: sans-serif; background-color: #0a0a0a; color: #fff; padding: 40px; border-radius: 20px;">
            <h1 style="color: #14b8a6; font-style: italic; text-transform: uppercase;">Acesso Liberado Ω</h1>
            <p>Olá, <strong>${name}</strong>!</p>
            <p>Você foi admitido na Central de Comando Ômega como <strong>${role.replace('_', ' ')}</strong>.</p>
            <p>Para acessar o sistema e configurar sua senha, clique no botão abaixo:</p>
            <a href="${appUrl}" style="display: inline-block; background-color: #14b8a6; color: #000; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; text-transform: uppercase; margin-top: 20px;">Acessar Sistema</a>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">Se você não esperava este convite, por favor ignore este email.</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (err) {
      console.error("Server error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
