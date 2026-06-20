export type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  captchaToken: string;
};

export type ContactResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://187.77.181.212/api';

export const sendContactMessage = async (
  payload: ContactPayload
): Promise<ContactResponse> => {
  const response = await fetch(`${API_URL}/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || 'Impossible d’envoyer le message pour le moment.'
    );
  }

  return data as ContactResponse;
};