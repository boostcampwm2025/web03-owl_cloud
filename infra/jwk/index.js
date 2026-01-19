import { generateKeyPair, exportJWK } from "jose";
import { randomUUID } from "crypto";

const kid = `tool-ticket-${randomUUID()}`;
const { publicKey, privateKey } = await generateKeyPair("RS256", { modulusLength: 2048, extractable: true, });

const privateJwk = await exportJWK(privateKey);
privateJwk.kid = kid;
privateJwk.use = "sig";
privateJwk.alg = "RS256";

const publicJwk = await exportJWK(publicKey);
publicJwk.kid = kid;
publicJwk.use = "sig";
publicJwk.alg = "RS256";

const jwks = { keys: [publicJwk] };

console.log("KID=", kid);
console.log("PRIVATE_JWK=", JSON.stringify(privateJwk));
console.log("PUBLIC_JWKS=", JSON.stringify(jwks));
