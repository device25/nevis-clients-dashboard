import { z } from 'zod';

const Count = z.int().nonnegative();

// One count per month, Feb 2024 to Jan 2025. A tuple, so a short or long array
// fails validation and `values[11]` is typed as present.
const Values = z.tuple([
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
  Count,
]);

export const ClientNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  values: Values,
  get branches() {
    return z.array(ClientNodeSchema).optional();
  },
  get employees() {
    return z.array(ClientNodeSchema).optional();
  },
  get channels() {
    return z.array(ClientNodeSchema).optional();
  },
});

export type RawClientNode = z.infer<typeof ClientNodeSchema>;
