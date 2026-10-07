// pb.js
// Creates the ONE PocketBase client that every page shares.
// Other scripts get it with:  import pb from './pb.js';

// Our local copy of the official PocketBase JS SDK (v0.28.1, unmodified).
import PocketBase from './vendor/pocketbase.es.mjs';

// The address printed by `./pocketbase serve` when it starts.
const pb = new PocketBase('http://127.0.0.1:8090');

export default pb;
