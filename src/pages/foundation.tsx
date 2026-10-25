import { ArrowUpRight, Construction, Layers3 } from "lucide-react";
import { Link } from "react-router";

export function FoundationPage() {
  return (
    <section>
      <p className="eyebrow">Nirwana Management System</p>
      <h1 className="max-w-2xl">
        Fondasi baru.
        <br />
        Langkah berikutnya, terarah.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
        Ruang kerja layanan Nirwana sedang disiapkan. Fondasi aplikasi tersedia
        untuk pengembangan fitur berikutnya.
      </p>
      <div className="mt-10 flex max-w-2xl items-start gap-4 rounded-xl border border-line bg-white p-6">
        <Construction className="shrink-0 text-brand" aria-hidden size={24} />
        <div>
          <h2 className="font-semibold">Dalam pengembangan</h2>
          <p className="mt-2 leading-7 text-muted">
            Belum tersedia layanan pelanggan atau pengiriman tiket. Data
            operasional dan akun pelanggan belum digunakan.
          </p>
        </div>
      </div>
      <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-7">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Layers3 aria-hidden size={18} />
          Satu fondasi, dikembangkan bertahap.
        </p>
        <Link
          to="/tentang"
          className="inline-flex items-center gap-2 font-medium text-brand"
        >
          Tentang aplikasi
          <ArrowUpRight aria-hidden size={18} />
        </Link>
      </div>
    </section>
  );
}
