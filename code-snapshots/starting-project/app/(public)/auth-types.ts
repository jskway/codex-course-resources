export type AuthActionState = {
  email: string;
  error: string | null;
  name: string;
};

export const initialAuthState: AuthActionState = {
  email: "",
  error: null,
  name: "",
};
