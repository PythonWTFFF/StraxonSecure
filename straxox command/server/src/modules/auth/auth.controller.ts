import { Request, Response } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret_do_not_use_in_prod";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_do_not_use_in_prod";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const domainCheck = email.toLowerCase();
    if (!domainCheck.endsWith("@straxon.com") && !domainCheck.endsWith("@straxonlabs.com")) {
      return res.status(403).json({ error: "Access restricted to Straxon personnel only." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { token: refreshToken },
      });
    }
    res.clearCookie("refreshToken");
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req: any, res: Response) => {
  res.json({ user: req.user });
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: "No refresh token" });
    }

    // Validate token exists in DB and hasn't expired
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      res.clearCookie("refreshToken");
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    // Verify JWT signature
    let payload: any;
    try {
      payload = jwt.verify(token, REFRESH_SECRET);
    } catch {
      await prisma.session.delete({ where: { id: session.id } });
      res.clearCookie("refreshToken");
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
      },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken, user: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
