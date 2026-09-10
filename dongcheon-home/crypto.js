export const iterations = 600000;
export const toBase64 = bytes => {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192) value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
};
export const fromBase64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
export async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations, hash:'SHA-256'}, material, {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
}
export async function encryptText(text, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, new TextEncoder().encode(text));
  return {iv:toBase64(iv), data:toBase64(new Uint8Array(encrypted))};
}
export async function decryptText(envelope, key) {
  if (typeof envelope.iv !== 'string' || typeof envelope.data !== 'string') throw new Error('Invalid encrypted data');
  const iv = fromBase64(envelope.iv);
  if (iv.length !== 12) throw new Error('Invalid nonce');
  const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv}, key, fromBase64(envelope.data));
  return new TextDecoder('utf-8', {fatal:true}).decode(plain);
}
