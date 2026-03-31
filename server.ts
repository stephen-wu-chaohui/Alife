import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import cookieParser from "cookie-parser";
import { z } from "zod";
import Stripe from "stripe";
import dotenv from "dotenv";
import cron from "node-cron";
import { google } from "googleapis";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // ===============================================================
  // Auth Middleware
  // ===============================================================
  const authenticate = async (req: any, res: any, next: any) => {
    const sessionCookie = req.cookies.session || "";
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      req.user = decodedClaims;
      next();
    } catch (error) {
      req.user = null; // Guest
      next();
    }
  };

  app.use(authenticate);

  // ===============================================================
  // Auth Routes
  // ===============================================================
  app.post("/api/auth/session", async (req, res) => {
    const idToken = req.body.idToken;
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    try {
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
      const options = { maxAge: expiresIn, httpOnly: true, secure: true, sameSite: "none" as const };
      res.cookie("session", sessionCookie, options);
      res.json({ status: "success" });
    } catch (error) {
      res.status(401).send("UNAUTHORIZED REQUEST!");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("session");
    res.json({ status: "success" });
  });

  // ===============================================================
  // Stripe Webhook
  // ===============================================================
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const registrationId = session.metadata?.registrationId;

      if (registrationId) {
        await db.collection("registrations").doc(registrationId).update({
          paymentStatus: "paid",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    res.json({ received: true });
  });

  // ===============================================================
  // Member Registration (DTO + Transaction)
  // ===============================================================
  const RegisterMemberSchema = z.object({
    realName: z.string().min(2),
    phoneNumber: z.string().regex(/^\+\d{10,15}$/),
  });

  app.post("/api/members/register", async (req: any, res) => {
    if (!req.user) return res.status(401).send("UNAUTHORIZED");
    
    try {
      const data = RegisterMemberSchema.parse(req.body);
      const uid = req.user.uid;

      await db.runTransaction(async (t) => {
        const memberRef = db.collection("members").doc(uid);
        const memberDoc = await t.get(memberRef);
        
        if (memberDoc.exists) throw new Error("Member already exists");

        // Check if this is the hardcoded admin
        const isAdmin = data.phoneNumber === "+6402102591292";
        
        // Initial membership (Abundant Life Church)
        const rootGroupId = "abundant-life-church";
        const memberships = {
          [rootGroupId]: {
            role: isAdmin ? "leader" : "member",
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          }
        };

        t.set(memberRef, {
          ...data,
          memberships,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // If admin, ensure root group exists or update it
        if (isAdmin) {
          const groupRef = db.collection("groups").doc(rootGroupId);
          t.set(groupRef, {
            name: "Abundant Life Church",
            parentId: null,
            ancestors: [],
            leaderIds: admin.firestore.FieldValue.arrayUnion(uid),
            joinPolicy: "AUTO_APPROVE",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      });

      res.json({ status: "success" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===============================================================
  // Group Management (DTO + Transaction)
  // ===============================================================
  const CreateGroupSchema = z.object({
    name: z.string().min(2),
    parentId: z.string().nullable(),
  });

  app.post("/api/groups/create", async (req: any, res) => {
    if (!req.user) return res.status(401).send("UNAUTHORIZED");
    
    try {
      const data = CreateGroupSchema.parse(req.body);
      const uid = req.user.uid;

      await db.runTransaction(async (t) => {
        // Check if user is leader of parent group (if parentId exists)
        if (data.parentId) {
          const parentRef = db.collection("groups").doc(data.parentId);
          const parentDoc = await t.get(parentRef);
          if (!parentDoc.exists) throw new Error("Parent group not found");
          if (!parentDoc.data()?.leaderIds.includes(uid)) throw new Error("NOT_A_LEADER");
        }

        const groupRef = db.collection("groups").doc();
        const groupId = groupRef.id;

        // Ancestors logic
        let ancestors: string[] = [];
        if (data.parentId) {
          const parentDoc = await t.get(db.collection("groups").doc(data.parentId));
          ancestors = [...(parentDoc.data()?.ancestors || []), data.parentId];
        }

        t.set(groupRef, {
          ...data,
          ancestors,
          leaderIds: [uid],
          joinPolicy: "AUTO_APPROVE",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update member's memberships
        const memberRef = db.collection("members").doc(uid);
        t.update(memberRef, {
          [`memberships.${groupId}`]: {
            role: "leader",
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          }
        });
      });

      res.json({ status: "success" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===============================================================
  // Event Registration (DTO + Transaction)
  // ===============================================================
  const RegisterEventSchema = z.object({
    eventId: z.string(),
    responses: z.record(z.string(), z.any()),
  });

  app.post("/api/events/register", async (req: any, res) => {
    if (!req.user) return res.status(401).send("UNAUTHORIZED");
    
    try {
      const data = RegisterEventSchema.parse(req.body);
      const uid = req.user.uid;
      const registrationId = `${data.eventId}_${uid}`;

      const result = await db.runTransaction(async (t) => {
        const eventRef = db.collection("events").doc(data.eventId);
        const eventDoc = await t.get(eventRef);
        if (!eventDoc.exists) throw new Error("Event not found");

        const eventData = eventDoc.data();
        const registrationRef = db.collection("registrations").doc(registrationId);
        
        const paymentStatus = eventData?.isPaid ? "pending" : "free";

        t.set(registrationRef, {
          ...data,
          uid,
          paymentStatus,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        if (eventData?.isPaid) {
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
              price_data: {
                currency: "nzd",
                product_data: { name: eventData.title },
                unit_amount: Math.round(eventData.priceNzd * 100),
              },
              quantity: 1,
            }],
            mode: "payment",
            success_url: `${process.env.APP_URL}/events?success=true`,
            cancel_url: `${process.env.APP_URL}/events?canceled=true`,
            metadata: { registrationId },
          });
          return { sessionId: session.id, url: session.url };
        }
        return { status: "success" };
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===============================================================
  // Cron Job for YouTube Sermons
  // ===============================================================
  const fetchYouTubeSermons = async () => {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const channelId = process.env.YOUTUBE_CHANNEL_ID;
      
      if (!apiKey || !channelId) {
        console.log("Missing YouTube API credentials in .env");
        return;
      }

      console.log("Fetching latest YouTube sermons...");
      const youtube = google.youtube({ version: "v3", auth: apiKey });
      const response = await youtube.search.list({
        channelId,
        part: ["snippet"],
        order: "date",
        maxResults: 10,
        type: ["video"],
      });

      const videos = response.data.items || [];
      const batch = db.batch();

      for (const video of videos) {
        const videoId = video.id?.videoId;
        if (!videoId) continue;
        
        const sermonRef = db.collection("sermons").doc(videoId);
        batch.set(sermonRef, {
          title: video.snippet?.title,
          youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
          publishedAt: video.snippet?.publishedAt ? admin.firestore.Timestamp.fromDate(new Date(video.snippet.publishedAt)) : admin.firestore.FieldValue.serverTimestamp(),
          description: video.snippet?.description || "",
        }, { merge: true });
      }

      await batch.commit();
      console.log(`YouTube sermons synced successfully. Updated ${videos.length} videos.`);
    } catch (error) {
      console.error("Failed to sync YouTube sermons:", error);
    }
  };

  // Run immediately on boot to ensure initial sync
  fetchYouTubeSermons();

  // Schedule to run every 12 hours
  cron.schedule("0 */12 * * *", fetchYouTubeSermons);

  // ===============================================================
  // Vite Middleware
  // ===============================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
