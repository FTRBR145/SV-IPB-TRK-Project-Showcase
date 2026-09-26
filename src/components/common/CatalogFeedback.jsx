import React from 'react';
import useApp from '../../hooks/useApp';

export default function CatalogFeedback() {
  const { catalogStatus, refreshCatalog } = useApp();
  if (catalogStatus === 'ready') return null;
  return (
    <div className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
      <p role="status" aria-live="polite">
        {catalogStatus === 'loading'
          ? 'Memuat katalog projek...'
          : 'Katalog projek belum dapat dimuat. Periksa koneksi Anda, lalu coba lagi.'}
      </p>
      <button type="button" onClick={refreshCatalog} disabled={catalogStatus === 'loading'}
        className="mt-3 min-h-11 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-wait disabled:opacity-60">
        {catalogStatus === 'loading' ? 'Sedang memuat...' : 'Coba lagi'}
      </button>
    </div>
  );
}
