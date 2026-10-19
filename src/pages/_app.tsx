import type { AppProps } from "next/app";
import WeddingMusicProvider from "@/components/wedding/WeddingMusicProvider";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WeddingMusicProvider>
      <Component {...pageProps} />
    </WeddingMusicProvider>
  );
}
