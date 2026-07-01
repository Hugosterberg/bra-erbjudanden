import { ImageResponse } from "next/og";

import { siteConfig } from "@/shared/config/site";

export const runtime = "edge";
export const alt = siteConfig.tagline;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#22c55e",
              fontSize: 40,
            }}
          >
            🏷️
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>
            braerbjudanden
            <span style={{ color: "#86efac" }}>.se</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#dcfce7",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Bra erbjudanden, rabattkoder och kampanjer i Sverige
        </div>
        <div
          style={{
            display: "flex",
            gap: 28,
            marginTop: 48,
            fontSize: 22,
            color: "#bbf7d0",
          }}
        >
          <span>Handplockat urval</span>
          <span>·</span>
          <span>Bara aktiva erbjudanden</span>
          <span>·</span>
          <span>Alltid gratis</span>
        </div>
      </div>
    ),
    size,
  );
}
