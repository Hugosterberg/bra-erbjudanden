"use server";

import { createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminSessionCookie = "braerbjudanden_admin_session";

function getExpectedSessionToken() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    return null;
  }

  return createHash("sha256").update(`admin-session:${password}`).digest("hex");
}

function valuesMatch(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}

export async function getCurrentAdmin() {
  const expectedToken = getExpectedSessionToken();

  if (!expectedToken) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(adminSessionCookie)?.value;

  if (!sessionToken || !valuesMatch(sessionToken, expectedToken)) {
    return null;
  }

  return { role: "admin" as const };
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function signInAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    redirect("/admin/login?error=missing-password");
  }

  if (!valuesMatch(password, expectedPassword)) {
    redirect("/admin/login?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookie, getExpectedSessionToken() ?? "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin");
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookie);

  redirect("/admin/login");
}
