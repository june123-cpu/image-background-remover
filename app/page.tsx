"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

type Status = "idle" | "processing" | "success" | "error";

interface HistoryItem {
  id: string;
  originalUrl: string;
  resultUrl: string;
  timestamp: number;
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bg-remover-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveToHistory = useCallback((original: string, result: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      originalUrl: original,
      resultUrl: result,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("bg-remover-history", JSON.stringify(updated));
  }, [history]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
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
      saveToHistory(originalUrl, resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
      setStatus("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
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

  const handleHistoryClick = (item: HistoryItem) => {
    setOriginalImage(item.originalUrl);
    setResultImage(item.resultUrl);
    setStatus("success");
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("bg-remover-history");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            🖼️ Remove Background
          </h1>
          <p className="text-gray-600 text-lg">AI 智能抠图 · 免费使用</p>
        </header>

        {/* Upload Zone */}
        {status === "idle" && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-3 border-dashed border-gray-300 rounded-2xl p-8 md:p-12 text-center cursor-pointer bg-white hover:bg-gray-50 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-6xl mb-4">📁</div>
            <div className="text-xl font-medium text-gray-700 mb-2">
              拖拽图片到此处
            </div>
            <div className="text-gray-500">或点击选择图片</div>
            <div className="text-gray-400 text-sm mt-2">
              支持 JPG、PNG、WebP · 最大 10MB
            </div>
          </div>
        )}

        {/* Processing */}
        {status === "processing" && (
          <div className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-lg">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <div className="text-xl font-medium text-gray-700">AI 正在抠图中...</div>
            <div className="text-gray-500 mt-2">预计需要 3-10 秒</div>
            {originalImage && (
              <div className="mt-6">
                <p className="text-gray-500 mb-2">原图预览</p>
                <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gray-100">
                  <Image src={originalImage} alt="Original" fill className="object-contain" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="bg-red-50 rounded-2xl p-8 text-center border border-red-200">
            <div className="text-5xl mb-4">😔</div>
            <div className="text-red-600 font-medium mb-4">{error}</div>
            <button
              onClick={reset}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              重新尝试
            </button>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="text-center text-gray-500 mb-2 text-sm">原图</div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {originalImage && <Image src={originalImage} alt="Original" fill className="object-contain" />}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="text-center text-gray-500 mb-2 text-sm">结果</div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')]">
                  {resultImage && <Image src={resultImage} alt="Result" fill className="object-contain" />}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={download}
                    className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                  >
                    ⬇️ 下载
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                  >
                    🔄 换一张
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Button */}
        {history.length > 0 && status !== "processing" && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-500 hover:underline"
            >
              📜 历史记录 ({history.length})
            </button>
          </div>
        )}

        {/* History Panel */}
        {showHistory && history.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">历史记录</h3>
              <button onClick={clearHistory} className="text-red-500 text-sm hover:underline">
                清空
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className="cursor-pointer hover:opacity-80"
                >
                  <div className="relative aspect-square rounded overflow-hidden bg-gray-100">
                    <Image src={item.resultUrl} alt="History" fill className="object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8 text-gray-400 text-sm">
          Powered by Remove.bg API
        </div>
      </div>
    </div>
  );
}
