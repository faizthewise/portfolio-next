import Link from "next/link";
import { ReactNode } from "react";
import Meta from "./meta";

export default function Layout({
  meta,
  children,
}: {
  meta?: {
    title?: string;
    description?: string;
    image?: string;
  };
  children: ReactNode;
}) {
  return (
    <>
      <Meta {...meta} />
      <div className="fixed h-screen w-full overflow-auto bg-background">
        <div className="fixed top-0 w-full bg-white/0 z-30 transition-all">
          <div className="mx-5 flex h-16 max-w-screen-xl items-center justify-between xl:mx-auto px-6 py-12">
            <Link href="/" className="flex items-center text-2xl font-bold">
              <p className="text-primary">Faiz Hasnul</p>
            </Link>
          </div>
        </div>

        <main className="flex w-full flex-col items-center justify-center py-32 px-6">
          {children}
        </main>
        <div className="w-full bg-footer py-5 text-center">
          <p className="text-white">itsfaizhasnul · 2023</p>
        </div>
      </div>
    </>
  );
}
