/**
 * Pix EMV QR Code dynamic payload generator.
 * Parses a base EMV BR Code, injects the transaction amount (field 54),
 * and recalculates the CRC16-CCITT checksum (field 63).
 */

interface TLV {
  tag: string;
  value: string;
}

function parseTLV(payload: string): TLV[] {
  const fields: TLV[] = [];
  let i = 0;
  while (i < payload.length) {
    if (i + 4 > payload.length) break;
    const tag = payload.substring(i, i + 2);
    const len = parseInt(payload.substring(i + 2, i + 4), 10);
    if (isNaN(len)) break;
    const value = payload.substring(i + 4, i + 4 + len);
    fields.push({ tag, value });
    i += 4 + len;
  }
  return fields;
}

function encodeTLV(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16CCITT(payload: string): string {
  const bytes = new TextEncoder().encode(payload);
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Takes a base Pix EMV code (without amount) and returns a new code
 * with the transaction amount (field 54) injected and CRC16 recalculated.
 */
export function generatePixCode(baseCode: string, amount: number): string {
  const fields = parseTLV(baseCode);

  // Remove existing field 54 (amount) and field 63 (CRC) if present
  const filtered = fields.filter((f) => f.tag !== "54" && f.tag !== "63");

  // Find insertion point: field 54 goes after field 53 (currency) or before field 58 (country)
  const idx58 = filtered.findIndex((f) => parseInt(f.tag) >= 54);
  const amountStr = amount.toFixed(2);
  const amountField: TLV = { tag: "54", value: amountStr };

  if (idx58 !== -1) {
    filtered.splice(idx58, 0, amountField);
  } else {
    filtered.push(amountField);
  }

  // Rebuild payload without CRC
  let payload = filtered.map((f) => encodeTLV(f.tag, f.value)).join("");

  // Append CRC placeholder (tag 63, length 04)
  payload += "6304";

  // Calculate and append CRC
  const crc = crc16CCITT(payload);
  return payload + crc;
}
