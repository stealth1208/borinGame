"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function RoomQr({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(url, {
      width: 640,
      margin: 1,
      color: { dark: "#12071f", light: "#fff7ed" },
      errorCorrectionLevel: "M",
    }).then((data) => {
      if (!cancelled) {
        setSrc(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!src) {
    return (
      <div className="mx-auto aspect-square w-full max-w-[280px] animate-pulse rounded-3xl bg-white/10" />
    );
  }

  return (
    // QR is a generated data URL; next/image is not useful here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Mã QR vào phòng"
      className="mx-auto w-full max-w-[280px] rounded-3xl border-8 border-white bg-white"
    />
  );
}
