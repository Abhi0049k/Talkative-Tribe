import z from "zod";

export interface UserI {
    id: string;
    name: string;
    email: string;
    password: string;
    image?: string
}

export const LoginInput = z.object({
    email: z.string().email(),
    password: z.string()
})

export type LoginInputType = z.infer<typeof LoginInput>

export const RegisterInput = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string()
})

export type RegisterInputType = z.infer<typeof RegisterInput>
