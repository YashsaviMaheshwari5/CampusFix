export function isValidFeedback(rating, message) {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 && typeof message === 'string' && message.trim().length >= 3 && message.trim().length <= 2000;
}
