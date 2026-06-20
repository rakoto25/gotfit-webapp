export type Role = {
  id: number;
  name: string;
  slug?: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  cover_photo_url?: string | null;
  account_status?: string | null;
  roles?: Role[];
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation?: string;
  phone?: string;
  address?: string;
  role?: "client" | "intervenant";
};

export type LoginPayload = {
  email: string;
  password: string;
};