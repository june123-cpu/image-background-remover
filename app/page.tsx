"use client";

import { useState, useRef } from "react";
import Image from "next/image";

type Status = "idle" | "processing" | "success" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("请使用 JPG、PNG 或 WebP 格式");
      setStatus("error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("图片大小不能超过 10MB");
      setStatus("error");
      return;
    }

    const originalUrl = URL.createObjectURL(file);
    setOriginalImage(originalUrl);
    setStatus("processing");
    setError("");

    try {
      const formData = new FormData();
      formData.append("image_file", file);

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "处理失败");
      }

      const blob = await res.blob();
      const resultUrl = URL.createObjectURL(blob);
      setResultImage(resultUrl);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
      setStatus("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      handleFileChange({ target: { files: dt.files } } as any);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const reset = () => {
    setStatus("idle");
    setOriginalImage(null);
    setResultImage(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const download = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = "removed-bg.png";
    a.click();
  };

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            🖼️ Remove Background
          </h1>
          <p style={{ color: "#666", fontSize: "1.1rem" }}>AI 智能抠图 · 免费使用</p>
        </div>

        {/* Upload Zone */}
        {status === "idle" && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "3px dashed #ccc",
              borderRadius: "1rem",
              padding: "4rem 2rem",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "#fafafa",
              transition: "all 0.2s",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📁</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 500, marginBottom: "0.5rem" }}>
              拖拽图片到此处
            </div>
            <div style={{ color: "#888" }}>或点击选择图片</div>
            <div style={{ color: "#aaa", fontSize: "0.875rem", marginTop: "1rem" }}>
              支持 JPG、PNG、WebP · 最大 10MB
            </div>
          </div>
        )}

        {/* Processing */}
        {status === "processing" && (
          <div style={{
            borderRadius: "1rem",
            padding: "4rem 2rem",
            textAlign: "center",
            backgroundColor: "white",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              border: "4px solid #e0e0e0",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }} />
            <div style={{ fontSize: "1.25rem", fontWeight: 500 }}>AI 正在抠图中...</div>
            <div style={{ color: "#888", marginTop: "0.5rem" }}>预计需要 3-10 秒</div>
            {originalImage && (
              <div style={{ marginTop: "2rem" }}>
                <p style={{ color: "#888", marginBottom: "0.5rem" }}>原图预览</p>
                <div style={{ position: "relative", width: "200px", height: "200px", margin: "0 auto", borderRadius: "0.5rem", overflow: "hidden" }}>
                  <Image src={originalImage} alt="Original" fill style={{ objectFit: "contain" }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div style={{
            borderRadius: "1rem",
            padding: "3rem 2rem",
            textAlign: "center",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😔</div>
            <div style={{ color: "#dc2626", fontWeight: 500, marginBottom: "1rem" }}>{error}</div>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              重新尝试
            </button>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}>
              <div style={{ textAlign: "center", color: "#666", marginBottom: "0.5rem", fontSize: "0.875rem" }}>原图</div>
              <div style={{ position: "relative", aspectRatio: "1", borderRadius: "0.5rem", overflow: "hidden", backgroundColor: "#f3f4f6" }}>
                {originalImage && <Image src={originalImage} alt="Original" fill style={{ objectFit: "contain" }} />}
              </div>
            </div>
            <div style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "1rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}>
              <div style={{ textAlign: "center", color: "#666", marginBottom: "0.5rem", fontSize: "0.875rem" }}>结果</div>
              <div style={{ position: "relative", aspectRatio: "1", borderRadius: "0.5rem", overflow: "hidden", backgroundColor: "#f3f4f6", backgroundImage: "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px" }}>
                {resultImage && <Image src={resultImage} alt="Result" fill style={{ objectFit: "contain" }} />}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  onClick={download}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  ⬇️ 下载
                </button>
                <button
                  onClick={reset}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  🔄 换一张
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "2rem", color: "#9ca3af", fontSize: "0.875rem" }}>
          Powered by Remove.bg API
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
