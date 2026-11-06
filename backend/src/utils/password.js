// bcrypt password ko one-way hash karta hai; original password database me save nahi hota.
// hash register ke waqt, compare login ke waqt stored hash ke saath password verify karta hai.
import bcrypt from 'bcryptjs';

export const hashPassword = (password) => bcrypt.hash(password, 12);
export const verifyPassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);
