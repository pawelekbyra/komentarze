export interface AuthorProfile {
    id: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
    role: string;
    bio?: string | null;
}
