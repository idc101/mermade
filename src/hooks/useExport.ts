import { useCallback } from 'react';
import { toPng } from 'html-to-image';

export function useExport() {
  const exportSvg = useCallback(() => {
    const svg = document.querySelector('.react-flow__renderer svg') as SVGElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = 'diagram.svg';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }, []);

  const exportPng = useCallback(() => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (viewport) {
      toPng(viewport, {
        backgroundColor: '#ffffff',
      }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'diagram.png';
        link.href = dataUrl;
        link.click();
      });
    }
  }, []);

  return { exportSvg, exportPng };
}
