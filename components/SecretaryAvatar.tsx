import Image from "next/image";

export function SecretaryAvatar({ size = 56 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-neutral-gray"
      style={{ width: size, height: size }}
    >
      <Image src="/images/secretary_misaki.png" alt="藤堂 美咲" fill className="object-cover" />
    </div>
  );
}
