// EventEmitter internal events publish/listen karne deta hai; publisher aur notification listener loosely coupled rehte hain.
// Callback listener event aane par baad me chalta hai; yeh HTTP route ya external message broker nahi hai.
import { EventEmitter } from 'node:events';
export const appEvents = new EventEmitter();
appEvents.setMaxListeners(20);
