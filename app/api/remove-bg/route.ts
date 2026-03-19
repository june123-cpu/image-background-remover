import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image_file") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "请上传图片文件" }, { status: 400 });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "服务器未配置 API Key" }, { status: 500 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const removeBgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: (() => {
        const form = new FormData();
        form.append("image_file", new Blob([buffer]), imageFile.name);
        form.append("size", "auto");
        form.append("format", "png");
        return form;
      })(),
    });

    if (!removeBgRes.ok) {
      const errorText = await removeBgRes.text();
      console.error("Remove.bg API error:", errorText);
      return NextResponse.json({ error: "AI 抠图失败，请稍后重试" }, { status: 500 });
    }

    const resultBuffer = await removeBgRes.arrayBuffer();
    return new NextResponse(resultBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="removed-bg.png"',
      },
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "处理失败" }, { status: 500 });
  }
}
