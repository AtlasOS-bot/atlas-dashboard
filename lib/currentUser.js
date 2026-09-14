const EMAIL_TO_PERSON = {
  "normaycr@gmail.com": "N",
  "manuelxgardens@gmail.com": "M",
};

export function getPersonForEmail(email) {
  if (!email) return null;
  return EMAIL_TO_PERSON[email.toLowerCase()] || null;
}

export function getEmailForPerson(person) {
  const match = Object.entries(EMAIL_TO_PERSON).find(([, p]) => p === person);
  return match ? match[0] : null;
}
