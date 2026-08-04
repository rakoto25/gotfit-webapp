import {
  getApiUrl,
} from "@/lib/api-config";

import type {
  Role,
  User,
} from "@/types/auth";

/* =========================================================
   CONSTANTES
========================================================= */

const TOKEN_KEY =
  "gotfit_token";

const USER_KEY =
  "gotfit_user";

const AUTH_EVENT_NAME =
  "gotfit:auth";

/* =========================================================
   TYPES D’AUTHENTIFICATION LOCALE
========================================================= */

export type AuthEventAction =
  | "login"
  | "update"
  | "logout";

export type AuthEventDetail = {
  action: AuthEventAction;
  user: User | null;
};

type UserWithAlternativeRoles =
  User & {
    role?: string | Role | null;
    role_name?: string | null;
  };

/* =========================================================
   TYPES MOT DE PASSE OUBLIÉ
========================================================= */

export type PasswordActionResponse = {
  message: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

type ApiErrorPayload = {
  message?: unknown;
  errors?: Record<
    string,
    unknown
  >;
};

/* =========================================================
   OUTILS GÉNÉRAUX
========================================================= */

function isBrowser(): boolean {
  return (
    typeof window !== "undefined"
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function normalizeText(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function normalizeEmail(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}

function isValidEmail(
  value: string,
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

/* =========================================================
   RÔLES
========================================================= */

function normalizeRoleName(
  value: string,
): string {
  const normalizedRole =
    normalizeText(value)
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      );

  if (
    normalizedRole === "coach" ||
    normalizedRole === "coachs" ||
    normalizedRole ===
      "intervenant" ||
    normalizedRole ===
      "intervenants"
  ) {
    return "intervenant";
  }

  if (
    normalizedRole === "coache" ||
    normalizedRole === "coachee" ||
    normalizedRole === "client" ||
    normalizedRole === "clients" ||
    normalizedRole === "user" ||
    normalizedRole ===
      "utilisateur" ||
    normalizedRole ===
      "utilisateurs"
  ) {
    return "client";
  }

  if (
    normalizedRole ===
      "administrator" ||
    normalizedRole ===
      "administrateur" ||
    normalizedRole ===
      "administrateurs" ||
    normalizedRole ===
      "super-admin" ||
    normalizedRole ===
      "super_admin"
  ) {
    return "admin";
  }

  return normalizedRole;
}

function addRoleValue(
  roles: string[],
  value: unknown,
): void {
  if (
    typeof value === "string" &&
    value.trim()
  ) {
    roles.push(value);

    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const name =
    value.name;

  const slug =
    value.slug;

  if (
    typeof name === "string" &&
    name.trim()
  ) {
    roles.push(name);
  }

  if (
    typeof slug === "string" &&
    slug.trim()
  ) {
    roles.push(slug);
  }
}

function getAlternativeRoles(
  user: UserWithAlternativeRoles,
): string[] {
  const roleNames: string[] = [];

  if (
    Array.isArray(user.roles)
  ) {
    user.roles.forEach(
      (role) => {
        addRoleValue(
          roleNames,
          role,
        );
      },
    );
  }

  addRoleValue(
    roleNames,
    user.role,
  );

  addRoleValue(
    roleNames,
    user.role_name,
  );

  return [
    ...new Set(roleNames),
  ];
}

/* =========================================================
   VALIDATION UTILISATEUR
========================================================= */

function isValidUser(
  value: unknown,
): value is User {
  if (!isRecord(value)) {
    return false;
  }

  const id =
    value.id;

  const name =
    value.name;

  const email =
    value.email;

  const validId =
    typeof id === "number" &&
    Number.isFinite(id) &&
    id > 0;

  const validName =
    typeof name === "string" &&
    name.trim().length > 0;

  const validEmail =
    typeof email === "string" &&
    email.trim().length > 0;

  return (
    validId &&
    validName &&
    validEmail
  );
}

/* =========================================================
   TOKEN
========================================================= */

function sanitizeToken(
  token: string,
): string {
  return token
    .trim()
    .replace(
      /^Bearer\s+/i,
      "",
    );
}

/* =========================================================
   ÉVÉNEMENTS D’AUTHENTIFICATION
========================================================= */

function dispatchAuthEvent(
  action: AuthEventAction,
  user: User | null,
): void {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<AuthEventDetail>(
      AUTH_EVENT_NAME,
      {
        detail: {
          action,
          user,
        },
      },
    ),
  );
}

/* =========================================================
   STOCKAGE LOCAL
========================================================= */

function getStorageItem(
  key: string,
): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(
      key,
    );
  } catch {
    return null;
  }
}

function setStorageItem(
  key: string,
  value: string,
): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.setItem(
      key,
      value,
    );

    return true;
  } catch {
    return false;
  }
}

function removeStorageItem(
  key: string,
): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(
      key,
    );
  } catch {
    // Le stockage peut être bloqué.
  }
}

function removeStoredAuth(): void {
  removeStorageItem(
    TOKEN_KEY,
  );

  removeStorageItem(
    USER_KEY,
  );
}

/* =========================================================
   GESTION DES ERREURS API
========================================================= */

function getValidationError(
  errors?: Record<
    string,
    unknown
  >,
): string {
  if (!errors) {
    return "";
  }

  for (
    const errorValue
    of Object.values(errors)
  ) {
    if (
      typeof errorValue ===
        "string" &&
      errorValue.trim()
    ) {
      return errorValue;
    }

    if (
      Array.isArray(errorValue)
    ) {
      const firstMessage =
        errorValue.find(
          (
            message,
          ): message is string =>
            typeof message ===
              "string" &&
            message.trim().length >
              0,
        );

      if (firstMessage) {
        return firstMessage;
      }
    }
  }

  return "";
}

function getApiErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  if (!isRecord(payload)) {
    return fallback;
  }

  const errorPayload =
    payload as ApiErrorPayload;

  const validationError =
    getValidationError(
      errorPayload.errors,
    );

  if (validationError) {
    return validationError;
  }

  if (
    typeof errorPayload.message ===
      "string" &&
    errorPayload.message.trim()
  ) {
    return errorPayload.message;
  }

  return fallback;
}

/* =========================================================
   REQUÊTES PUBLIQUES D’AUTHENTIFICATION
========================================================= */

async function publicAuthRequest<T>(
  endpoint: string,
  payload: Record<
    string,
    unknown
  >,
): Promise<T> {
  const headers =
    new Headers();

  headers.set(
    "Accept",
    "application/json",
  );

  headers.set(
    "Content-Type",
    "application/json",
  );

  let response: Response;

  try {
    response = await fetch(
      getApiUrl(endpoint),
      {
        method: "POST",
        headers,
        body: JSON.stringify(
          payload,
        ),
        cache: "no-store",
      },
    );
  } catch {
    throw new Error(
      "Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.",
    );
  }

  const result =
    (await response
      .json()
      .catch(
        () => null,
      )) as unknown;

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        result,
        "La requête n’a pas pu être exécutée.",
      ),
    );
  }

  if (result === null) {
    return {
      message:
        "Opération effectuée avec succès.",
    } as T;
  }

  return result as T;
}

/* =========================================================
   MOT DE PASSE OUBLIÉ
========================================================= */

export async function requestPasswordReset(
  email: string,
): Promise<PasswordActionResponse> {
  const normalizedEmail =
    normalizeEmail(email);

  if (
    !isValidEmail(
      normalizedEmail,
    )
  ) {
    throw new Error(
      "Veuillez indiquer une adresse email valide.",
    );
  }

  return publicAuthRequest<PasswordActionResponse>(
    "auth/forgot-password",
    {
      email: normalizedEmail,
    },
  );
}

/* =========================================================
   RÉINITIALISATION DU MOT DE PASSE
========================================================= */

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<PasswordActionResponse> {
  const email =
    normalizeEmail(
      payload.email,
    );

  const token =
    payload.token.trim();

  const password =
    payload.password;

  const passwordConfirmation =
    payload.password_confirmation;

  if (!isValidEmail(email)) {
    throw new Error(
      "L’adresse email du lien de réinitialisation est invalide.",
    );
  }

  if (!token) {
    throw new Error(
      "Le lien de réinitialisation est invalide ou incomplet.",
    );
  }

  if (
    password.length < 8
  ) {
    throw new Error(
      "Le mot de passe doit contenir au moins 8 caractères.",
    );
  }

  if (
    !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(
      password,
    )
  ) {
    throw new Error(
      "Le mot de passe doit contenir au moins une lettre.",
    );
  }

  if (!/\d/.test(password)) {
    throw new Error(
      "Le mot de passe doit contenir au moins un chiffre.",
    );
  }

  if (
    password !==
    passwordConfirmation
  ) {
    throw new Error(
      "La confirmation du mot de passe ne correspond pas.",
    );
  }

  return publicAuthRequest<PasswordActionResponse>(
    "auth/reset-password",
    {
      email,
      token,
      password,
      password_confirmation:
        passwordConfirmation,
    },
  );
}

/* =========================================================
   ENREGISTREMENT DE LA SESSION
========================================================= */

export function saveAuth(
  token: string,
  user: User,
): boolean {
  if (!isBrowser()) {
    return false;
  }

  const sanitizedToken =
    sanitizeToken(token);

  if (!sanitizedToken) {
    return false;
  }

  if (!isValidUser(user)) {
    return false;
  }

  const tokenSaved =
    setStorageItem(
      TOKEN_KEY,
      sanitizedToken,
    );

  const userSaved =
    setStorageItem(
      USER_KEY,
      JSON.stringify(user),
    );

  if (
    !tokenSaved ||
    !userSaved
  ) {
    removeStoredAuth();

    return false;
  }

  dispatchAuthEvent(
    "login",
    user,
  );

  return true;
}

/* =========================================================
   LECTURE DU TOKEN
========================================================= */

export function getToken():
  | string
  | null {
  const token =
    getStorageItem(
      TOKEN_KEY,
    );

  if (!token) {
    return null;
  }

  const sanitizedToken =
    sanitizeToken(token);

  if (!sanitizedToken) {
    removeStoredAuth();

    return null;
  }

  return sanitizedToken;
}

/* =========================================================
   EN-TÊTE D’AUTORISATION
========================================================= */

export function getAuthorizationHeader():
  Record<string, string> {
  const token =
    getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization:
      `Bearer ${token}`,
  };
}

/* =========================================================
   UTILISATEUR COURANT
========================================================= */

export function getCurrentUser():
  | User
  | null {
  const rawUser =
    getStorageItem(
      USER_KEY,
    );

  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser =
      JSON.parse(
        rawUser,
      ) as unknown;

    if (
      !isValidUser(
        parsedUser,
      )
    ) {
      removeStoredAuth();

      return null;
    }

    return parsedUser;
  } catch {
    removeStoredAuth();

    return null;
  }
}

/* =========================================================
   MISE À JOUR DE L’UTILISATEUR
========================================================= */

export function updateCurrentUser(
  user: User,
): boolean {
  if (!isValidUser(user)) {
    return false;
  }

  const userSaved =
    setStorageItem(
      USER_KEY,
      JSON.stringify(user),
    );

  if (!userSaved) {
    return false;
  }

  dispatchAuthEvent(
    "update",
    user,
  );

  return true;
}

export function patchCurrentUser(
  updates: Partial<User>,
): User | null {
  const currentUser =
    getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const updatedUser: User = {
    ...currentUser,
    ...updates,

    /*
     * L'identifiant de l'utilisateur
     * ne peut pas être modifié
     * par un patch local.
     */
    id: currentUser.id,
  };

  if (
    !updateCurrentUser(
      updatedUser,
    )
  ) {
    return null;
  }

  return updatedUser;
}

/* =========================================================
   DÉCONNEXION
========================================================= */

export function clearAuth(): void {
  removeStoredAuth();

  dispatchAuthEvent(
    "logout",
    null,
  );
}

/* =========================================================
   ÉTAT D’AUTHENTIFICATION
========================================================= */

export function isAuthenticated():
  boolean {
  return Boolean(
    getToken() &&
      getCurrentUser(),
  );
}

/* =========================================================
   AUTORISATIONS
========================================================= */

export function hasRole(
  user: User | null,
  searchedRole: string,
): boolean {
  if (!user) {
    return false;
  }

  const normalizedSearchedRole =
    normalizeRoleName(
      searchedRole,
    );

  if (
    !normalizedSearchedRole
  ) {
    return false;
  }

  const availableRoles =
    getAlternativeRoles(
      user as UserWithAlternativeRoles,
    );

  return availableRoles.some(
    (role) =>
      normalizeRoleName(
        role,
      ) ===
      normalizedSearchedRole,
  );
}

export function hasAnyRole(
  user: User | null,
  roles: string[],
): boolean {
  if (
    !user ||
    roles.length === 0
  ) {
    return false;
  }

  return roles.some(
    (role) =>
      hasRole(
        user,
        role,
      ),
  );
}

export function isAdmin(
  user: User | null,
): boolean {
  return hasRole(
    user,
    "admin",
  );
}

export function isCoach(
  user: User | null,
): boolean {
  return hasRole(
    user,
    "intervenant",
  );
}

export function isClient(
  user: User | null,
): boolean {
  return hasRole(
    user,
    "client",
  );
}

/* =========================================================
   REDIRECTION APRÈS CONNEXION
========================================================= */

export function getPostAuthRoute(
  user: User,
): string {
  if (isAdmin(user)) {
    return "/admin/dashboard";
  }

  if (isCoach(user)) {
    return "/intervenant/dashboard";
  }

  if (isClient(user)) {
    return "/client/dashboard";
  }

  return "/profile";
}

/* =========================================================
   SESSION COMPLÈTE
========================================================= */

export function getStoredAuth(): {
  token: string;
  user: User;
} | null {
  const token =
    getToken();

  const user =
    getCurrentUser();

  if (
    !token ||
    !user
  ) {
    return null;
  }

  return {
    token,
    user,
  };
}

/* =========================================================
   ABONNEMENT AUX CHANGEMENTS
========================================================= */

export function subscribeToAuthChanges(
  listener: (
    event: CustomEvent<AuthEventDetail>,
  ) => void,
): () => void {
  if (!isBrowser()) {
    return () => undefined;
  }

  const eventListener = (
    event: Event,
  ): void => {
    listener(
      event as CustomEvent<AuthEventDetail>,
    );
  };

  window.addEventListener(
    AUTH_EVENT_NAME,
    eventListener,
  );

  return () => {
    window.removeEventListener(
      AUTH_EVENT_NAME,
      eventListener,
    );
  };
}

/* =========================================================
   EXPORTS DES CONSTANTES
========================================================= */

export {
  AUTH_EVENT_NAME,
  TOKEN_KEY,
  USER_KEY,
};