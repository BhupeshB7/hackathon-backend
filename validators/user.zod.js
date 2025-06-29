import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  email: z.email(),
  password: z.string().min(4).max(50),
});

export default userSchema;
