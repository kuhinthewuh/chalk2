export type TutorErrorCode =
  | "invalid_request"
  | "invalid_image"
  | "image_too_large"
  | "server_misconfigured"
  | "model_unavailable";

export interface TutorErrorResponse {
  error: TutorErrorCode;
  message: string;
}
