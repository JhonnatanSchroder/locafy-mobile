export type User = {
    id: number;
    name: string;
    email: string;
};

export type LoginResponse = {
    token: string;
    token_type: string;
    user: User;
};

export type LoginApiResponse =
    | LoginResponse
    | {
          data: LoginResponse;
      };
