import { useState } from "react";
import { Gift } from "lucide-react";

import { RegistryProduct } from "@/lib/wedding/registry";
import styles from "@/styles/WeddingRegistry.module.css";

export default function RegistryProductImage({
  product,
}: {
  product: RegistryProduct;
}) {
  const [failedImage, setFailedImage] = useState<string>();

  if (product.image && failedImage !== product.image) {
    return (
      // Product images may come from Shopee; native loading also supports local copies.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={styles["product-image"]}
        src={product.image}
        alt={product.fullName || product.name}
        loading="lazy"
        decoding="async"
        onError={() => setFailedImage(product.image)}
      />
    );
  }

  return (
    <div className={styles["image-fallback"]}>
      <Gift aria-hidden="true" />
      <span>Gambar di Shopee</span>
    </div>
  );
}
