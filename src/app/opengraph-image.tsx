import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Landscape Gallery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1c1c2e 60%, #16213e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Top rule */}
        <div
          style={{
            width: 64,
            height: 1,
            background: "rgba(255,255,255,0.4)",
            marginBottom: 40,
          }}
        />

        <div
          style={{
            fontSize: 80,
            fontWeight: 300,
            color: "#ffffff",
            letterSpacing: 20,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Landscape
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 20,
            textTransform: "uppercase",
            marginTop: -8,
            display: "flex",
          }}
        >
          Gallery
        </div>

        {/* Bottom rule */}
        <div
          style={{
            width: 64,
            height: 1,
            background: "rgba(255,255,255,0.4)",
            marginTop: 40,
          }}
        />

        <div
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.45)",
            marginTop: 32,
            letterSpacing: 6,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Nature · Mountains · Wilderness
        </div>
      </div>
    ),
    { ...size }
  );
}
