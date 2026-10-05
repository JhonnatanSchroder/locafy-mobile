export type User = {
    id: number;
    name: string;
    email: string;
};

export type LoginResponse = {
    token: string;
    token_type: string;
    user?: User;
};

export type LoginApiResponse =
    | LoginResponse
    | {
          data: LoginResponse;
      }
    | {
          data: {
              token?: string;
              access_token?: string;
              plain_text_token?: string;
              plainTextToken?: string;
              accessToken?: string;
              token_type?: string;
              user?: User;
          };
          token?: string;
          access_token?: string;
          plain_text_token?: string;
          plainTextToken?: string;
          accessToken?: string;
          token_type?: string;
          user?: User;
      };

export type MeApiResponse =
    | User
    | {
          data: User;
      };
