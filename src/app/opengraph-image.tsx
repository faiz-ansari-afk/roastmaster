import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RoastMaster AI — The Unfiltered AI Code Reviewer & Standup Dev Comedy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          backgroundColor: "#12030C",
          backgroundImage:
            "radial-gradient(circle at 50% 25%, #4C0F32 0%, #200516 55%, #0B0207 100%)",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Glow overlay */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            width: "600px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(244, 114, 182, 0.22)",
            filter: "blur(90px)",
          }}
        />

        {/* Top Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 24px",
            borderRadius: "999px",
            background: "rgba(244, 114, 182, 0.15)",
            border: "1px solid rgba(244, 114, 182, 0.4)",
            color: "#FDA4AF",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "32px",
          }}
        >
          <span>🎙️</span>
          <span>LIVE DEV STANDUP • CLI &amp; WEB STAGE</span>
        </div>

        {/* Big Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 900,
            letterSpacing: "-2px",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span>YOUR CODE SUCKS.</span>
          <span
            style={{
              color: "#F472B6",
              textShadow: "0 0 35px rgba(244, 114, 182, 0.6)",
            }}
          >
            LET&apos;S ROAST IT LIVE.
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "22px",
            color: "#FCE7F3",
            opacity: 0.85,
            maxWidth: "800px",
            textAlign: "center",
            lineHeight: 1.5,
            marginBottom: "40px",
          }}
        >
          Unfiltered AI code reviews, Standup comedy routines &amp; Backstage Senior-Staff constructive fixes.
        </div>

        {/* CLI Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 30px",
            borderRadius: "16px",
            background: "rgba(30, 6, 22, 0.85)",
            border: "1px solid rgba(244, 114, 182, 0.35)",
            color: "#FBCFE8",
            fontSize: "20px",
            fontFamily: "monospace",
            fontWeight: 700,
          }}
        >
          <span style={{ color: "#F472B6" }}>$</span>
          <span>npx roastmaster-ai --roast-repo</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
