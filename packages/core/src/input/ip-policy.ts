import { isIP } from "node:net";

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function inRange(ip: string, cidr: string): boolean {
  const [range, bitsRaw] = cidr.split("/");
  const bits = Number(bitsRaw);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range) & mask);
}

const deniedV4 = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "224.0.0.0/4",
  "100.64.0.0/10"
];

export function isDeniedIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    return deniedV4.some((range) => inRange(address, range));
  }
  if (version === 6) {
    const normalized = address.toLowerCase();
    const dottedMapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (dottedMapped) {
      return isDeniedIp(dottedMapped[1]);
    }
    const hexMapped = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hexMapped) {
      const high = Number.parseInt(hexMapped[1], 16);
      const low = Number.parseInt(hexMapped[2], 16);
      const mapped = [
        (high >> 8) & 255,
        high & 255,
        (low >> 8) & 255,
        low & 255
      ].join(".");
      return isDeniedIp(mapped);
    }
    return normalized === "::"
      || normalized === "::1"
      || normalized.startsWith("fe80:")
      || normalized.startsWith("fc")
      || normalized.startsWith("fd")
      || normalized.startsWith("ff");
  }
  return false;
}
