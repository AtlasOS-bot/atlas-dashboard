const EMAIL_TO_PERSON = {
  "normaycr@gmail.com": "N",
  "manuelxgardens@gmail.com": "M",
};

export function getPersonForEmail(email) {
  if (!email) return null;
  return EMAIL_TO_PERSON[email.toLowerCase()] || null;
}
