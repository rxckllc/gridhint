import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact GridHint.com — Get in Touch",
  description:
    "Have a question, suggestion, or issue with a GridHint tool? Reach us at info@gridhint.com. We read every message.",
  alternates: {
    canonical: "https://gridhint.com/contact",
  },
  openGraph: {
    title: "Contact GridHint.com",
    description: "Reach the GridHint team at info@gridhint.com.",
    url: "https://gridhint.com/contact",
    siteName: "GridHint",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-12 pb-16 space-y-12">
      <section className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Contact Us
        </h1>
        <p className="text-xl text-slate-700 font-medium leading-relaxed">
          We&apos;d love to hear from you — whether it&apos;s a bug report, a tool suggestion, or a general question about GridHint.com.
        </p>
      </section>

      <section className="bg-white border-2 border-slate-300 rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-blue-700" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Email</p>
            <a
              href="mailto:info@gridhint.com"
              className="text-2xl font-bold text-blue-700 hover:text-blue-900 underline underline-offset-4 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-2 rounded"
            >
              info@gridhint.com
            </a>
          </div>
        </div>
        <p className="text-lg text-slate-700 leading-relaxed">
          We read every message and typically respond within a few business days.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-900">What to include</h2>
        <ul className="space-y-3 text-lg text-slate-700">
          <li className="flex gap-3">
            <span className="font-bold text-blue-700 shrink-0">Bug reports:</span>
            <span>The tool name, what you expected to happen, and what happened instead.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-700 shrink-0">Suggestions:</span>
            <span>A brief description of the puzzle or feature you&apos;d like us to support.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-700 shrink-0">Other:</span>
            <span>Anything else — we&apos;re happy to hear it.</span>
          </li>
        </ul>
      </section>

      <p className="text-base text-slate-600">
        Looking for legal info?{" "}
        <Link
          href="/disclaimer"
          className="text-blue-700 font-semibold underline underline-offset-4 hover:text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700 focus:ring-offset-2 rounded"
        >
          Read our disclaimer
        </Link>
        .
      </p>
    </div>
  );
}
