import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type ExportFormat = "png" | "pdf";

async function loadHtml2Canvas() {
  const mod = await import("html2canvas");
  return mod.default;
}
async function loadJsPdf() {
  const mod = await import("jspdf");
  return mod.jsPDF;
}

/**
 * Exporta um nó DOM (gráficos/dashboards) como PNG ou PDF.
 * Faz upload opcional para Storage `relatorios-bi/` e retorna URL assinada (7d).
 */
export function useExportBI() {
  const [exporting, setExporting] = useState(false);

  const exportElement = useCallback(
    async (
      el: HTMLElement,
      opts: {
        format: ExportFormat;
        filename?: string;
        title?: string;
        upload?: boolean;
      }
    ) => {
      if (!el) return null;
      setExporting(true);
      try {
        const html2canvas = await loadHtml2Canvas();
        const canvas = await html2canvas(el, {
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--background")
            ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--background")})`
            : "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const filename = opts.filename || `bi-export-${Date.now()}`;
        let blob: Blob;
        let mime: string;
        let ext: string;

        if (opts.format === "png") {
          blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
          mime = "image/png";
          ext = "png";
        } else {
          const jsPDF = await loadJsPdf();
          const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
          const pageW = pdf.internal.pageSize.getWidth();
          const pageH = pdf.internal.pageSize.getHeight();

          // Capa
          pdf.setFontSize(18);
          pdf.text(opts.title || "Relatório BI", 40, 60);
          pdf.setFontSize(10);
          pdf.setTextColor(120);
          pdf.text(new Date().toLocaleString("pt-BR"), 40, 80);
          pdf.setTextColor(0);

          const imgData = canvas.toDataURL("image/png");
          const imgW = pageW - 80;
          const imgH = (canvas.height * imgW) / canvas.width;

          if (imgH < pageH - 120) {
            pdf.addImage(imgData, "PNG", 40, 110, imgW, imgH);
          } else {
            // Multi-page: divide imagem
            const pageHeightPx = (canvas.width * (pageH - 80)) / imgW;
            let y = 0;
            let pageNum = 0;
            while (y < canvas.height) {
              if (pageNum > 0) pdf.addPage();
              const slice = document.createElement("canvas");
              slice.width = canvas.width;
              slice.height = Math.min(pageHeightPx, canvas.height - y);
              const ctx = slice.getContext("2d")!;
              ctx.drawImage(canvas, 0, y, slice.width, slice.height, 0, 0, slice.width, slice.height);
              const sliceData = slice.toDataURL("image/png");
              const sliceH = (slice.height * imgW) / slice.width;
              pdf.addImage(sliceData, "PNG", 40, pageNum === 0 ? 110 : 40, imgW, sliceH);
              y += pageHeightPx;
              pageNum++;
            }
          }

          blob = pdf.output("blob");
          mime = "application/pdf";
          ext = "pdf";
        }

        // Download local
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);

        // Upload opcional
        if (opts.upload) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const path = `${user.id}/${filename}.${ext}`;
            const { error: upErr } = await supabase.storage
              .from("relatorios-bi")
              .upload(path, blob, { contentType: mime, upsert: true });
            if (upErr) {
              if (upErr.message.includes("Bucket not found")) {
                toast.warning("Bucket 'relatorios-bi' não existe. Arquivo baixado localmente.");
              } else {
                toast.error(`Upload falhou: ${upErr.message}`);
              }
            } else {
              const { data: signed } = await supabase.storage
                .from("relatorios-bi")
                .createSignedUrl(path, 60 * 60 * 24 * 7);
              if (signed?.signedUrl) {
                toast.success("Exportado e salvo na nuvem", {
                  action: { label: "Abrir", onClick: () => window.open(signed.signedUrl, "_blank") },
                });
                return signed.signedUrl;
              }
            }
          }
        }

        toast.success(`${opts.format.toUpperCase()} exportado`);
        return null;
      } catch (e: any) {
        toast.error(`Falha ao exportar: ${e.message}`);
        return null;
      } finally {
        setExporting(false);
      }
    },
    []
  );

  return { exportElement, exporting };
}
