import PocketBase from 'pocketbase';
import 'cross-fetch/polyfill'; // To ensure fetch works in all Node versions

const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
export const pb = new PocketBase(pbUrl);

// Disable auto cancellation for backend usage where we might fire multiple requests
pb.autoCancellation(false);

export default pb;
